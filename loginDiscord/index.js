import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import webstack from '../Webstack.js';
import '../tweeGaze.js';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import crypto from 'crypto';
import DiscordBot from '../discordBot.js';
import { registerSharedRoutes, returnTwine } from '../sharedRoutes.js';
const require = createRequire(import.meta.url);
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const hex = require('string-hex')
let localAppIndex

//loads config vars from config.json if .env file doesn't exist
if (!process.env?.port) {
	const __filename = fileURLToPath(import.meta.url)
	const __dirname = path.dirname(__filename)
	let config_path = '../config.json';

	if (fs.existsSync(__dirname + "/" + config_path)) {
		let confObj = require('./' + config_path);
		localAppIndex = confObj.serverconf["localAppIndex"] || 4
		if (confObj.channelconf.length) {
			let arrayIndex = localAppIndex - 1
			var discordChannels = confObj.channelconf[arrayIndex].discordChannels;
			var channelNames = confObj.channelconf[arrayIndex].discordChannelNames
			var { clientId, clientSecret, guildId } = confObj.channelconf[arrayIndex];	// Indexed at 0 b/c when running locally we'll just use the first element as our test
		}
		var { fileName, twinePath, port, githubToken, githubUser, githubRepo } = confObj.serverconf;
	}


}
var urlencodedParser = bodyParser.urlencoded({ extended: false })



const htmlTemplate = './loginDiscord/index.html'

// Destructure config.json variables (Check if directory exists b/c it won't be available on Heroku (will use ENV variables instead))
const CHANNELNAMES = (process.env.discordChannelNames || channelNames).split(',');
let DISCORDCHANNELS = discordChannels;
if(!DISCORDCHANNELS){
	DISCORDCHANNELS = [];
	CHANNELNAMES.forEach((channel)=>{
		DISCORDCHANNELS[channel] = process.env[channel];
	})
}

let discordBot = new DiscordBot(DISCORDCHANNELS);

// Gets environment variables from Heroku. Otherwise, get them locally from the config file.
const CLIENT_ID = process.env.clientId || clientId;
const CLIENT_SECRET = process.env.clientSecret || clientSecret;
const TWINE_PATH = process.env.twinePath || twinePath;
const PORT = process.env.PORT || port;
const appID = process.env.appIndex || localAppIndex;
const FILENAME = process.env.fileName || fileName;
let HEROKU_URL;
if (process.env.PORT) {
	HEROKU_URL = `https://${FILENAME}-${appID}.herokuapp.com`
	// HEROKU_URL = `https://aztec-${process.env.appIndex}.herokuapp.com`
}
else {
	HEROKU_URL = `http://localhost:${PORT}`;
}
const GUILD_ID = process.env.guildId || guildId;
const scope = "identify guilds.members.read guilds"

const REDIRECTURL = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(HEROKU_URL)}&response_type=code&scope=${encodeURIComponent(scope)}`;
const GITHUBTOKEN = process.env.githubToken || githubToken
const GITHUBUSER = process.env.githubUser || githubUser
const GITHUBREPO = process.env.githubRepo || githubRepo
const SERVERCONF = { "port": PORT, "twinePath": TWINE_PATH, "githubToken": GITHUBTOKEN, "githubUser": GITHUBUSER, "githubRepo": GITHUBREPO, "fileName": FILENAME, "appIndex": appID }

let refreshTokens = {};
const webstackInstance = new webstack(SERVERCONF);
const { app } = webstackInstance.get();

/**
 * Get or generate a cryptographically secure session secret
 * @returns {string} Session secret
 */
function getSessionSecret() {
	if (process.env.SESSION_SECRET) {
		return process.env.SESSION_SECRET;
	}

	if (process.env.NODE_ENV === 'production') {
		throw new Error('SESSION_SECRET environment variable must be set in production');
	}

	// Development only: generate secure random secret
	const secret = crypto.randomBytes(32).toString('hex');
	console.warn('⚠️  Using auto-generated session secret in development');
	console.warn('⚠️  Set SESSION_SECRET env var for production deployment');
	return secret;
}

// Configure session middleware
app.use(cookieParser());
app.use(session({
	secret: getSessionSecret(),
	resave: false,
	saveUninitialized: false,
	cookie: {
		secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
		httpOnly: true,
		maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
	}
}));

// Register shared routes (action, updateGit, dump, discordbot)
registerSharedRoutes(app, webstackInstance, { discordBot });
// Listen for requests to the homepage
app.get('/', async (request, response) => {
	const { code, state, test, nick } = request.query;

	// Check if user already has a valid session
	if (request.session && request.session.userData && !code) {
		// User has existing session, return Twine with saved data
		return returnTwine(request.session.userData, response, TWINE_PATH);
	}

	if (code) {
		let payload = {
			client_id: CLIENT_ID,
			client_secret: CLIENT_SECRET,
			code,
			grant_type: 'authorization_code',
			redirect_uri: HEROKU_URL,
			scope: 'identify',
		};
		if (refreshTokens[state]) {
			payload = { ...payload, ...{ grant_type: 'refresh_token', refresh_token: refreshTokens[state].refresh_token } }
			delete payload.code
		}
		try {
			const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
				method: 'POST',
				body: new URLSearchParams(payload),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			});

			const oauthData = await oauthResult.json();
			if (oauthData.refresh_token) {
				refreshTokens[state] = oauthData;

			}

			if (oauthData.error) {
				return loadHome(response, test, nick);
			}

			const userResult = await fetch('https://discord.com/api/users/@me', {
				headers: {
					authorization: `${oauthData.token_type} ${oauthData.access_token}`,
				},
			});

			const userResultJson = await userResult.json();
			const guildResult = await fetch(`https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`, {
				headers: {
					authorization: `${oauthData.token_type} ${oauthData.access_token}`,
				},
			});
			const guildResultJson = await guildResult.json();

			// Store user data in session for persistence across page refreshes
			const userData = {
				gameState: webstackInstance.serverStore.getState(),
				authData: { ...guildResultJson, ...userResultJson }
			};
			request.session.userData = userData;

			return returnTwine(userData, response, TWINE_PATH);

		} catch (error) {
			// NOTE: An unauthorized token will not throw an error;
			// it will return a 401 Unauthorized response in the try block above
		}
	}
	else {
		loadHome(response, test, nick);
	}
});

// Logout endpoint to clear session
app.get('/logout', (request, response) => {
	request.session.destroy((err) => {
		if (err) {
			console.error('Error destroying session:', err);
		}
		response.clearCookie('connect.sid'); // Clear the session cookie
		response.redirect('/');
	});
});

// returnTwine is now imported from sharedRoutes.js

/**
 * Loads the discord Auth page
 *
 * @param {*} response
 * @param {boolean} isTest: true if testing page is being used,
 * @returns discord auth page or if isTest is true: the twine page
 */
function loadHome(response, isTest, nick) {
	let htmlContents = fs.readFileSync(htmlTemplate, 'utf8')
	let indexHtml = htmlContents.replace("%redirectURL%", REDIRECTURL)


	if (isTest) {
		// Create mock user data for testing
		const mockUserData = {
			gameState: webstackInstance.serverStore.getState(),
			authData: {
				id: nick || 'test-user',
				username: nick || 'TestUser',
				discriminator: '0000',
				avatar: null
			}
		};
		return returnTwine(mockUserData, response, TWINE_PATH);
	}
	else {
		response.send(indexHtml);
	}

}

