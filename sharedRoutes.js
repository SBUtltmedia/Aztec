import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bodyParser = require('body-parser');
const _ = require('lodash');

/**
 * Registers shared routes that are common between login and loginDiscord servers
 * @param {Express.Application} app - Express app instance
 * @param {Object} webstackInstance - Webstack instance with serverStore and io
 * @param {Object} options - Optional configuration
 * @param {DiscordBot} options.discordBot - Discord bot instance (optional, only for loginDiscord)
 */
/**
 * Validates that a state path is safe and doesn't attempt prototype pollution
 * @param {string} path - The state path to validate
 * @returns {boolean} True if path is safe
 */
function isValidStatePath(path) {
    // Prevent prototype pollution attacks
    const dangerousTerms = ['__proto__', 'constructor', 'prototype'];
    const pathParts = path.split(/[.\[\]]/);
    return !pathParts.some(part => dangerousTerms.includes(part));
}

/**
 * Authentication middleware for state-modifying endpoints
 * Checks if user has a valid session (for loginDiscord) or allows test mode
 */
function requireAuthOrTest(req, res, next) {
    // Allow requests with valid session (loginDiscord mode)
    if (req.session && req.session.userData) {
        return next();
    }

    // Allow test mode (login mode with ?test=true)
    if (req.query.test === 'true') {
        return next();
    }

    // For compatibility: if no session middleware is present, allow the request
    // This maintains backward compatibility with the login/ version
    if (!req.session) {
        return next();
    }

    return res.status(401).json({ error: 'Unauthorized' });
}

export function registerSharedRoutes(app, webstackInstance, options = {}) {
    const urlencodedParser = bodyParser.urlencoded({ extended: false });

    // Track recent updates to prevent rapid duplicates (Fix #5: Smarter Deduplication)
    const recentUpdates = new Map(); // path -> { value, timestamp }
    const DEDUP_WINDOW = 500; // 500ms window

    // Server-authoritative action endpoint
    // Handles state updates from client macros (<<th-set>>, <<sendAction>>)
    app.post('/action', requireAuthOrTest, urlencodedParser, async (req, res) => {
        const release = await webstackInstance.writeMutex.acquire();
        try {
            const { variable, value } = req.body;

            // Validate input
            if (!variable || typeof variable !== 'string') {
                return res.status(400).json({ error: 'Invalid variable parameter' });
            }

            if (value === undefined) {
                return res.status(400).json({ error: 'Missing value parameter' });
            }

            // Remove the '$' prefix from variable path
            const path = variable.substring(1);

            // Validate path to prevent prototype pollution
            if (!isValidStatePath(path)) {
                console.warn('Blocked potentially dangerous state path:', path);
                return res.status(400).json({ error: 'Invalid variable path' });
            }

            // Parse the value from URL-encoded string to its proper type
            // URL-encoded POST data converts everything to strings, so we need to parse it
            let parsedValue;
            try {
                // Try to parse as JSON first (handles numbers, booleans, objects, arrays, strings)
                parsedValue = JSON.parse(value);
            } catch (e) {
                // If JSON parsing fails, use the raw string value
                parsedValue = value;
            }

            // Special handling for chat messages: add server-side timestamp
            if (path.startsWith('chatlog.') && Array.isArray(parsedValue)) {
                parsedValue = parsedValue.map(msg => {
                    // If message has client timestamp, replace with server timestamp
                    if (msg && typeof msg === 'object' && 'timestamp' in msg) {
                        return {
                            ...msg,
                            timestamp: Date.now()  // Server-authoritative timestamp
                        };
                    }
                    return msg;
                });
            }

            // Check if the value actually changed before broadcasting
            const currentState = webstackInstance.serverStore.getState();
            const currentValue = _.get(currentState, path);

            // Smart deduplication: check both value AND time window (Fix #5)
            let shouldBroadcast = !_.isEqual(currentValue, parsedValue);

            if (shouldBroadcast) {
                // Value is different, always broadcast
            } else {
                // Value is same - check if this is a rapid duplicate
                const recentUpdate = recentUpdates.get(path);
                const now = Date.now();

                if (recentUpdate && (now - recentUpdate.timestamp) < DEDUP_WINDOW) {
                    // Same value within dedup window - skip broadcast
                    console.log(`Deduplicating: ${path} (within ${DEDUP_WINDOW}ms)`);
                    shouldBroadcast = false;
                } else {
                    // Same value but outside window - might be intentional re-set
                    // Allow broadcast to ensure all clients are synced
                    console.log(`Re-broadcasting unchanged value for sync: ${path}`);
                    shouldBroadcast = true;
                }
            }

            if (shouldBroadcast) {
                const diff = {};
                _.set(diff, path, parsedValue);

                // Update state with sequence tracking (Fix #4)
                const serverSeq = webstackInstance.serverStore.setState(diff, req.body.seq);
                recentUpdates.set(path, { value: parsedValue, timestamp: Date.now() });

                // Broadcast with sequence number (Fix #4)
                webstackInstance.io.emit('difference', {
                    diff: diff,
                    seq: serverSeq,
                    clientSeq: req.body.seq,
                    timestamp: Date.now()
                });
            }

            // Cleanup old entries periodically
            if (recentUpdates.size > 1000) {
                const now = Date.now();
                for (const [path, entry] of recentUpdates.entries()) {
                    if (now - entry.timestamp > DEDUP_WINDOW * 10) {
                        recentUpdates.delete(path);
                    }
                }
            }

            res.send({
                status: 'ok',
                seq: req.body.seq,  // Echo back sequence number (Fix #2)
                serverSeq: webstackInstance.serverStore.getSequenceNumber(),
                broadcast: shouldBroadcast  // Indicate if broadcast occurred
            });
        } finally {
            release();
        }
    });

    // Full state sync endpoint (Fix #3)
    // Returns full server state for periodic reconciliation
    app.get('/state/full', requireAuthOrTest, (req, res) => {
        const fullState = webstackInstance.serverStore.getState();

        // Filter private vars for this user
        const userId = req.user?.userId || req.session?.userId;
        const filteredState = filterPrivateVars(fullState, userId);

        res.json(filteredState);
    });

    /**
     * Filter private vars for a specific user (Fix #3 helper)
     * Removes other users' private data before sending state to client
     */
    function filterPrivateVars(state, userId) {
        // Clone to avoid modifying original
        const filtered = _.cloneDeep(state);

        // Remove other users' private vars
        if (filtered.theyrPrivateVars) {
            Object.keys(filtered.theyrPrivateVars).forEach(uid => {
                if (uid !== userId) {
                    delete filtered.theyrPrivateVars[uid];
                }
            });
        }

        return filtered;
    }

    // Git update endpoint
    app.post('/updateGit', async (req, res) => {
        try {
            await webstackInstance.updateGit(false);
            res.json({ status: 'success' });
        } catch (err) {
            console.error('Git update failed:', err.message);
            res.status(500).json({
                status: 'error',
                message: 'Failed to update Git repository'
            });
        }
    });

    // State dump endpoint (for debugging)
    app.get('/dump', async ({ query }, res) => {
        res.send(webstackInstance.serverStore.getState());
    });

    // Discord bot endpoint (only if discordBot is provided)
    if (options.discordBot) {
        app.post('/discordbot', urlencodedParser, function (req, res) {
            res.send({});
            console.log(req.body.channel);
            options.discordBot.sendNotif(req.body.channel, req.body.message);
        });
    }
}

/**
 * Helper function to return Twine HTML with injected user data
 * @param {Object} userData - User data object containing gameState and authData
 * @param {Object} response - Express response object
 * @param {String} twinePath - Path to the Twine HTML file
 */
export async function returnTwine(userData, response, twinePath) {
    const fs = require('fs');

    // Remove private vars from other users
    if (userData.gameState.theyrPrivateVars) {
        Object.keys(userData.gameState.theyrPrivateVars).forEach((id) => {
            if (userData.authData && id != userData.authData.id) {
                delete userData.gameState.theyrPrivateVars[id];
            }
        });
    }

    if (!userData.gameState.theyrPrivateVars) {
        userData.gameState.theyrPrivateVars = {};
    }

    let userDataScriptTag = `
    <script>
    // Session is now managed by server-side cookies, no need to clear
    let userData=${JSON.stringify(userData)} </script>
    `;

    try {
        let fileContents = await fs.promises.readFile(twinePath, 'utf8');
        return response.send(`${fileContents} ${userDataScriptTag}`);
    } catch (err) {
        console.error('Error reading Twine file:', err);
        return response.status(500).send('Error loading game file');
    }
}
