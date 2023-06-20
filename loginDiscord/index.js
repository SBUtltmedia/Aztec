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
// import gitApiIO from '../gitApiIO.js';
const require = createRequire(import.meta.url);
const bodyParser = require('body-parser');
const hex = require('string-hex')
let localAppIndex
if (!process.env?.port) {
	const __filename = fileURLToPath(import.meta.url)
	const __dirname = path.dirname(__filename)
	let config_path = '../config.json';

	if (fs.existsSync(__dirname + "/" + config_path)) {
		let confObj = require('./' + config_path);
		localAppIndex = confObj.serverconf["localAppIndex"] || 4
		if (confObj.channelconf.length) {
			let arrayIndex = localAppIndex - 1
			var fileName = `${confObj.fileName}-${localAppIndex}.json`;
			var discordChannels = confObj.channelconf[arrayIndex].discordChannels;
			var channelNames = confObj.channelconf[arrayIndex].discordChannelNames
			var { clientId, clientSecret, guildId } = confObj.channelconf[arrayIndex];	// Indexed at 0 b/c when running locally we'll just use the first element as our test
		}
		var { twinePath, port, githubToken, githubUser, githubRepo } = confObj.serverconf;
	}


}
var urlencodedParser = bodyParser.urlencoded({ extended: false })



const htmlTemplate = './loginDiscord/index.html'
// Destructure config.json variables (Check if directory exists b/c it won't be available on Heroku (will use ENV variables instead))

const CHANNELNAMES = (process.env.discordChannelNamess || channelNames).split(',');
let DISCORDCHANNELS = discordChannels;
if(!DISCORDCHANNELS){
	channelNames.forEach((channel)=>{
		DISCORDCHANNELS[channel] = process.env[channel];
	})
}

let discordBot = new DiscordBot(DISCORDCHANNELS);

// Gets environment variables from Heroku. Otherwise, get them locally from the config file.
const CLIENT_ID = process.env.clientId || clientId;
const CLIENT_SECRET = process.env.clientSecret || clientSecret;
const TWINE_PATH = process.env.twinePath || twinePath;
const PORT = process.env.PORT || port;
let HEROKU_URL;
console.log(process.env.PORT)
if (process.env.PORT) {
	console.log("PROCESS ENV", process.env)
	HEROKU_URL = `https://aztec-${process.env.appIndex}.herokuapp.com`
}
else {
	console.log("Running local")
	HEROKU_URL = `http://localhost:${PORT}`;
}
const GUILD_ID = process.env.guildId || guildId;
const scope = "identify guilds.members.read guilds"
//const scope = "identify"
const REDIRECTURL = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(HEROKU_URL)}&response_type=code&scope=${encodeURIComponent(scope)}`;
const GITHUBTOKEN = process.env.githubToken || githubToken
const GITHUBUSER = process.env.githubUser || githubUser
const GITHUBREPO = process.env.githubRepo || githubRepo
const FILENAME = process.env.fileName || fileName
const appID = process.env.appIndex || localAppIndex;
const CONFIG = { "port": PORT, "twinePath": TWINE_PATH, "githubToken": GITHUBTOKEN, "githubUser": GITHUBUSER, "githubRepo": GITHUBREPO, "fileName": FILENAME }

let refreshTokens = {};
const webstackInstance = new webstack(PORT, appID, CONFIG);
const { app } = webstackInstance.get();


app.post('/discordbot', urlencodedParser, function (req, res) {
	res.send({});
	discordBot.sendNotif(req.body.channel, req.body.message)
})


// Listen for requests to the homepage
app.get('/', async ({ query }, response) => {
	// console.log({query});
	const { code, state, test, nick } = query;
	let userDataJSON;
	//webstackInstance.update();

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
			console.log(oauthData)
			if (oauthData.refresh_token) {
				refreshTokens[state] = oauthData;

			}

			if (oauthData.error) {
				console.log({ oauthData });
				// response.send(JSON.stringify(oauthData));
				return loadHome(response, test);
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

			let store = (({ theyrPrivateVars, ...o }) => o)(webstackInstance.serverStore.getState());
			return returnTwine({ gameState: store, authData: { ...guildResultJson, ...userResultJson } }, response);


			//return returnTwine(userDataJSON, response);

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

function returnTwine(userData, response) {
	let userDataScriptTag = `
	<script>
	sessionStorage.clear(); 
	let userData=${JSON.stringify(userData)} </script>
	`
	let file = TWINE_PATH
	let fileContents = fs.readFileSync(file)
	return response.send(`${fileContents} ${userDataScriptTag}`);
}

function loadHome(response, isTest) {
	let htmlContents = fs.readFileSync(htmlTemplate, 'utf8')
	let indexHtml = htmlContents.replace("%redirectURL%", REDIRECTURL)


	if (isTest) {
		let store = (({ theyrPrivateVars, ...o }) => o)(webstackInstance.serverStore.getState());
		return returnTwine({ gameState: store }, response);
	}
	else {
		response.send(indexHtml);
	}

}

// Generates a random ID
function generateId() {
	let id = "";
	for (let i = 0; i < 18; i++) {
		id += Math.floor(Math.random() * 10);
	}
	return id;
}

