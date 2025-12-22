import fs from 'fs';
import webstack from '../Webstack.js';
import '../tweeGaze.js';
import { createRequire } from "module";
import { registerSharedRoutes, returnTwine } from '../sharedRoutes.js';

const require = createRequire(import.meta.url);
const configObj = require('../config.json');

const { port, twinePath, githubToken, githubUser, githubRepo, fileName, localAppIndex } = configObj.serverconf;

// Use the same server configuration logic
const PORT = process.env.PORT || port;
const TWINE_PATH = process.env.twinePath || twinePath;
const appID = process.env.appIndex || localAppIndex || 1;
const FILENAME = process.env.fileName || fileName;
const GITHUBTOKEN = process.env.githubToken || githubToken;
const GITHUBUSER = process.env.githubUser || githubUser;
const GITHUBREPO = process.env.githubRepo || githubRepo;

const SERVERCONF = { "port": PORT, "twinePath": TWINE_PATH, "githubToken": GITHUBTOKEN, "githubUser": GITHUBUSER, "githubRepo": GITHUBREPO, "fileName": FILENAME, "appIndex": appID };

// Create a single webstack instance to access the shared state
const webstackInstance = new webstack(SERVERCONF);
const { app } = webstackInstance.get();
const htmlTemplate = 'login/index.html';

// Register shared routes (action, updateGit, dump)
registerSharedRoutes(app, webstackInstance);

// Listen for requests to the homepage
app.get('/', async ({ query }, response) => {
	const { nick, id, username } = query;

	if (nick && id) {
        // Construct a user object matching the Discord structure
        // to ensure compatibility with game logic that expects Discord fields
        const authData = {
            id: id,
            nick: nick,
            username: username || nick,  // Use provided username or fallback to nick
            global_name: nick,           // Discord global name fallback
            discriminator: '0000',       // Default discriminator for dev mode
            user: {
                username: username || nick
            }
        };
		// Pass the full game state to the twine file
		return returnTwine(
			{ gameState: webstackInstance.serverStore.getState(), authData: authData },
			response,
			TWINE_PATH
		);
	}
	else {
		let htmlContents = fs.readFileSync(htmlTemplate, 'utf8');
		response.send(htmlContents);
	}
});
