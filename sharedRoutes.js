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

            // Only update and broadcast if the value is different
            if (!_.isEqual(currentValue, parsedValue)) {
                // Create a diff object with the updated value
                const diff = {};
                _.set(diff, path, parsedValue);

                // Update the server state
                webstackInstance.serverStore.setState(diff);

                // Broadcast the diff to all clients using existing 'difference' event
                webstackInstance.io.emit('difference', diff);
            }

            res.send({ status: 'ok' });
        } finally {
            release();
        }
    });

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
export function returnTwine(userData, response, twinePath) {
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

    let fileContents = fs.readFileSync(twinePath);
    return response.send(`${fileContents} ${userDataScriptTag}`);
}
