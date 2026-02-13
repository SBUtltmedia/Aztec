import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import webstack from '../Webstack.js';
import '../tweeGaze.js';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import DiscordBot from '../discordBot.js';
import { channel } from 'diagnostics_channel';
// import { RichPresenceAssets } from 'discord.js';
const require = createRequire(import.meta.url);
const bodyParser = require('body-parser');
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
console.log(process.env.PORT)
if (process.env.PORT) {
	console.log("PROCESS ENV", process.env)
	HEROKU_URL = `https://${FILENAME}-${appID}.herokuapp.com`
	// HEROKU_URL = `https://aztec-${process.env.appIndex}.herokuapp.com`
}
else {
	console.log("Running local")
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

//for reading input from twee 
app.post('/discordbot', urlencodedParser, function (req, res) {
	res.send({});
	console.log(req.body.channel)
	discordBot.sendNotif(req.body.channel, req.body.message)
})

app.post('/updateGit', async ({ query }, res) => {
	res.send({});
	webstackInstance.updateGit(false);
})

app.get('/dump', async ({ query }, res) => {
	res.send(webstackInstance.serverStore.getState());
})
// Listen for requests to the homepage
app.get('/', async ({ query }, response) => {
	const { code, state, test, nick } = query;

	if (code) {
		let payload = {
			client_id: CLIENT_ID,
			client_secret: CLIENT_SECRET,
			code,
			grant_type: 'authorization_code',
			redirect_uri: HEROKU_URL,
			scope: scope,
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
			console.log(oauthData)
			if (oauthData.refresh_token) {
				refreshTokens[state] = oauthData;

			}

			if (oauthData.error) {
				console.log({ oauthData });
				return loadHome(response, test);
			}

			const userResult = await fetch('https://discord.com/api/users/@me', {
				headers: {
					authorization: `${oauthData.token_type} ${oauthData.access_token}`,
				},
			});

			const userResultJson = await userResult.json();
			console.log(`Fetching member data for Guild ID: ${GUILD_ID}`);
			const guildResult = await fetch(`https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`, {
				headers: {
					authorization: `${oauthData.token_type} ${oauthData.access_token}`,
				},
			});
			const guildResultJson = await guildResult.json();
			
			console.log("USER DATA FROM DISCORD", userResultJson);
			if (guildResultJson.code) {
				console.error(`GUILD MEMBER FETCH ERROR [${guildResultJson.code}]: ${guildResultJson.message}`);
				
				// Try to list user's guilds to see if they are even in the expected one
				try {
					const userGuildsResult = await fetch('https://discord.com/api/users/@me/guilds', {
						headers: {
							authorization: `${oauthData.token_type} ${oauthData.access_token}`,
						},
					});
					const userGuilds = await userGuildsResult.json();
					if (Array.isArray(userGuilds)) {
						console.log("User is in these guilds:", userGuilds.map(g => `${g.name} (${g.id})`).join(', '));
						const isInExpectedGuild = userGuilds.some(g => g.id === GUILD_ID);
						console.log(`Is user in expected guild (${GUILD_ID})? ${isInExpectedGuild}`);
					} else {
						console.log("Could not fetch user's guilds list:", userGuilds);
					}
				} catch (e) {
					console.error("Error fetching user's guilds list:", e);
				}
			} else {
				console.log("GUILD MEMBER DATA FROM DISCORD", guildResultJson);
			}

			return returnTwine({ gameState: webstackInstance.serverStore.getState(), authData: { ...guildResultJson, ...userResultJson } }, response);

		} catch (error) {
			// NOTE: An unauthorized token will not throw an error;
			// it will return a 401 Unauthorized response in the try block above
			console.error(error);
		}
	}
	else {
		loadHome(response, test);
	}
});

/**
 * Loads the actual twine game
 * 
 * @param {*} userData: initial data loaded from github
 * @param {*} response 
 * @returns the twine game html
 */
function returnTwine(userData, response) {
	//removes private vars
	if(userData.gameState.theyrPrivateVars){
		Object.keys(userData.gameState.theyrPrivateVars).forEach((id)=>{
			if(userData.authData && id != userData.authData.id){
				delete userData.gameState.theyrPrivateVars[id];
			}
		})
	}

	if(!userData.gameState.theyrPrivateVars){
		userData.gameState.theyrPrivateVars = {};
	}

	let userDataScriptTag = `
	<script>
	sessionStorage.clear(); 
	let userData=${JSON.stringify(userData)} </script>
	`
	let file = TWINE_PATH
	let fileContents = fs.readFileSync(file)
	return response.send(`${fileContents} ${userDataScriptTag}`);
}

/**
 * Loads the discord Auth page
 * 
 * @param {*} response 
 * @param {boolean} isTest: true if testing page is being used, 
 * @returns discord auth page or if isTest is true: the twine page
 */
function loadHome(response, isTest) {
	let htmlContents = fs.readFileSync(htmlTemplate, 'utf8')
	let indexHtml = htmlContents.replace("%redirectURL%", REDIRECTURL)


	if (isTest) {
		return returnTwine({ gameState: webstackInstance.serverStore.getState() }, response);
	}
	else {
		response.send(indexHtml);
	}

}