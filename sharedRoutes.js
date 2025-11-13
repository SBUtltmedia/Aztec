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
export function registerSharedRoutes(app, webstackInstance, options = {}) {
    const urlencodedParser = bodyParser.urlencoded({ extended: false });

    // Server-authoritative action endpoint
    // Handles state updates from client macros (<<th-set>>, <<sendAction>>)
    app.post('/action', urlencodedParser, (req, res) => {
        const { variable, value } = req.body;

        // Remove the '$' prefix from variable path
        const path = variable.substring(1);

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
    });

    // Git update endpoint
    app.post('/updateGit', async ({ query }, res) => {
        res.send({});
        webstackInstance.updateGit(false);
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
