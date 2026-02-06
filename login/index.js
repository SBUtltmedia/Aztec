import fs from 'fs'
import webstack from '../Webstack.js'
import '../tweeGaze.js'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const configObj = require('../config.json');

const { port, twinePath } = configObj.serverconf;

const PORT = process.env.PORT || port
const TWINE_PATH = process.env.twinePath || twinePath;
const appID = process.env.appID || 1

const serverConf = {
	port: PORT,
	appIndex: appID,
	...configObj.serverconf
};

const webstackInstance = new webstack(serverConf);
const { app } = webstackInstance.get();
const htmlTemplate = 'login/index.html';

// Listen for requests to the homepage
app.get('/', async ({ query }, response) => {
	const userData = query;

	if (userData.nick) {
		const authData = {
			id: userData.id || Date.now().toString(),
			username: userData.nick,
			discriminator: '0000',
			avatar: null,
			roles: [],
			nick: userData.nick 
		};
		
		const gameState = webstackInstance.serverStore.getState();

		return returnTwine({ gameState, authData }, response);
	}

	else {
		let htmlContents = fs.readFileSync(htmlTemplate, 'utf8')
		response.send(htmlContents);
	}
});

function returnTwine(userData, response) {
	if(userData.gameState && userData.gameState.theyrPrivateVars){
		Object.keys(userData.gameState.theyrPrivateVars).forEach((id)=>{
			if(userData.authData && id != userData.authData.id){
				delete userData.gameState.theyrPrivateVars[id];
			}
		})
	}

	if(userData.gameState && !userData.gameState.theyrPrivateVars){
		userData.gameState.theyrPrivateVars = {};
	}

	let userDataScript=`
		<script>
		sessionStorage.clear();
		let userData=${JSON.stringify(userData)}
		</script>
	`
	
	try {
		let fileContents = fs.readFileSync(TWINE_PATH);
		return response.send(`${fileContents} ${userDataScript}`);
	} catch (err) {
		console.error("[ERROR] Failed to read Twine file:", TWINE_PATH);
		return response.status(500).send(`Failed to load story: ${TWINE_PATH}. Make sure the file exists and is compiled.`);
	}
}