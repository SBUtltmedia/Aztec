import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import webstack from '../Webstack.js';
import '../tweeGaze.js';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import DiscordBot from '../discordBot.js';
const require = createRequire(import.meta.url);
const bodyParser = require('body-parser');
const hex = require('string-hex')

var urlencodedParser = bodyParser.urlencoded({ extended: false })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
let config_path = '../config.json'
const htmlTemplate = './loginDiscord/index.html'
// Destructure config.json variables (Check if directory exists b/c it won't be available on Heroku (will use ENV variables instead))
if (fs.existsSync(__dirname + "/" + config_path)) {
	const confObj = require('./' + config_path);
	var { clientId, clientSecret, guildId } = confObj.channelconf[0];	// Indexed at 0 b/c when running locally we'll just use the first element as our test
	var { twinePath, port } = confObj.serverconf;
	var spanishChannel = confObj.channelconf[0].spanishChannel;
	var aztecChannel = confObj.channelconf[0].aztecChannel;
	var tlaxChannel = confObj.channelconf[0].tlaxChannel;
	var aztecTlax = confObj.channelconf[0].aztecTlax;
	var aztecSpan = confObj.channelconf[0].aztecSpan;
	var spanTlax = confObj.channelconf[0].spanTlax;
	var general = confObj.channelconf[0].general;
	var omen = confObj.channelconf[0].omen;
}

const SPANISH_CHANNEL = process.env.spanishChannel || spanishChannel;
const AZTEC_CHANNEL = process.env.aztecChannel || aztecChannel;
const TLAX_CHANNEL = process.env.tlaxChannel || tlaxChannel;
const AZTEC_TLAX = process.env.aztecTlax || aztecTlax;
const AZTEC_SPAN = process.env.aztecSpan || aztecSpan;
const SPAN_TLAX = process.env.spanTlax || spanTlax;
const GENERAL = process.env.general || general;
const OMEN = process.env.omen || omen;

let discordBot = new DiscordBot(SPANISH_CHANNEL, AZTEC_CHANNEL, TLAX_CHANNEL, AZTEC_TLAX, AZTEC_SPAN, SPAN_TLAX, GENERAL, OMEN);

// Gets environment variables from Heroku. Otherwise, get them locally from the config file.
const CLIENT_ID = process.env.clientId || clientId;
const CLIENT_SECRET = process.env.clientSecret || clientSecret;
const TWINE_PATH = process.env.twinePath || twinePath;
const PORT = process.env.PORT || port;
const HEROKU_URL = process.env.herokuURL || `http://localhost:${PORT}`;
const GUILD_ID = process.env.guildId || guildId;
const REDIRECTURL = process.env.redirectURL || `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(HEROKU_URL)}&response_type=code&scope=identify%20guilds.members.read%20guilds`;
let refreshTokens = {};
const appID = process.env.appID || 1
const webstackInstance = new webstack(PORT, appID);
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
	webstackInstance.update();
	// If using http://localhost:53134/?test=true use userDataJSON from this file
	if (test) {

		userDataJSON =  {jsonfsState: webstackInstance.state }

		return makeUserDataJSON(userDataJSON, response);
	}

	// Redirects through Discord API
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
				// console.log({oauthData});
				// response.send(JSON.stringify(oauthData));
				return loadHome(response);
			}

			const userResult = await fetch('https://discord.com/api/users/@me', {
				headers: {
					authorization: `${oauthData.token_type} ${oauthData.access_token}`,
				},
			});

			const userResultJson = await userResult.json();
			let userData = JSON.stringify(userResultJson);

			const guildResult = await fetch(`https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`, {
				headers: {
					authorization: `${oauthData.token_type} ${oauthData.access_token}`,
				},
			});
			const guildResultJson = await guildResult.json();

			return makeUserDataJSON( { jsonfsState: webstackInstance.state, ...guildResultJson, ...userResultJson },response);


			//return returnTwine(userDataJSON, response);

		} catch (error) {
			// NOTE: An unauthorized token will not throw an error;
			// it will return a 401 Unauthorized response in the try block above
			console.error(error);
		}
	}
	loadHome(response);
});
function makeUserDataJSON(jsonFS_Object,response){
	const initVars = {
		"currentPassage": 0,
		"Tlaxcalans_currentMap": 0,
		"Aztecs_currentMap": 0,
		"Start_ctr": 0,
		"Start_sum": 0,
		"Xicotencatl_Elder_currentPassage": 0,
		"Tlax_Leader": "Xicotencatl_Elder",
		"Quest_Leader_T": "Xicotencatl_Younger",
		"T_Q_Heart": "no",
		"Cuauhtemoc_currentPassage": 0,
		"Maxixcatl_currentPassage": 0,
		"Moctezuma_currentPassage": 0,
		"Pochteca_currentPassage": 0,
		"Tlacaelel_currentPassage": 0,
		"Alvarado_currentPassage": 0,
		"Aztec_Leader": "Moctezuma",
		"Quest_Leader_A": "Pochteca",
		"A_Q_Heart": "no",
		"Span_Leader": "Cortes",
		"Cuba_Voted_ctr": 0,
		"Cuba_Voted_sum": 0,
		"Xochimilco_Ans_A": 0,
		"Malinalco_Ans_A": 0,
		"Azcapotzalco_Ans_A": 0,
		"Tlatelolco_Ans_A": 0,
		"Cuauhnahuac_Ans_A": 0,
		"Chapultepec_Ans_A": 0,
		"Quest_Points_A_ctr": 0,
		"Quest_Points_A_sum": 0,
		"Mal_Story": 0,
		"Xochimilco_Ans_T": 0,
		"Quest_Points_T_ctr": 0,
		"Quest_Points_T_sum": 0,
		"Malinalco_Ans_T": 0,
		"Chapultepec_Ans_T": 0,
		"Cuauhnahuac_Ans_T": 0,
		"Tlatelolco_Ans_T": 0,
		"Azcapotzalco_Ans_T": 0,
		"Cac_Statement": 0,
		"Cuauh_Statement": 0,
		"Tlac_Statement": 0,
		"Moc_Proc": 0,
		"Poch_Statement": 0,
		"AzPr_Statement": 0,
		"MocMut_Moc_ctr": 0,
		"MocMut_Moc_sum": 0,
		"Moc_Mut_Vote_ctr": 0,
		"Moc_Mut_Vote_sum": 0,
		"Moc_Mut_Tla_ctr": 0,
		"Moc_Mut_AzP_sum": 0,
		"MocMut_Cua_ctr": 0,
		"MocMut_Cua_sum": 0,
		"MocMut_Tla_ctr": 0,
		"MocMut_Tla_sum": 0,
		"Cholula_Attack": 0,
		"XY_Statement": 0,
		"XE_Statement": 0,
		"Max_Statement": 0,
		"TL_St_Voted_ctr": 0,
		"TL_St_Voted_sum": 0,
		"Tl_Attacks_Pu": 0,
		"Mal_Boy": 0,
		"Mal_Share": 0,
		"Letter": 0,
		"Mal_Span": 0,
		"Gifts": 0,
		"L_Received": 0,
		"Mutiny_ctr": 0,
		"Mutiny_sum": 0,
		"Mutiny_Voted_ctr": 0,
		"Mutiny_Voted_sum": 0,
		"Tlaloc_currentPassage": 0,
		"Spaniards_currentMap": 0,
		"Tl_Omens": 0,
		"TL_Attacks": 0,
		"Olid_Let_Hm": 0,
		"Cortes_Let_Hm": 0,
		"Alvarado_Let_Hm": 0,
		"Garrido_Let_Hm": 0,
		"Causeway_ctr": 0,
		"Causeway_sum": 0,
		"Marina_Let_Hm": 0,
		"Aguilar_Let_Hm": 0,
		"Omens": 0,
		"Tlax_Cause": 0,
		"Tl_IG": 0,
		"Feast_ctr": 0,
		"Feast_sum": 0,
		"Al_TG": 0,
		"Ga_TG": 0,
		"Co_TG": 0,
		"Ol_TG": 0,
		"Ma_TG": 0,
		"Ag_TG": 0,
		"Tlc_Rec": 0,
		"Cu_Rec": 0,
		"Ca_Rec": 0,
		"AP_Rec": 0,
		"Moc_Rec": 0,
		"Az_Ld_Tla_ctr": 0,
		"Az_Ld_Tla_sum": 0,
		"Az_Ld_Vote_ctr": 0,
		"Az_Ld_Vote_sum": 0,
		"Az_Ld_Cua_ctr": 0,
		"Az_Ld_Cua_sum": 0,
		"Az_Ld_Moc_ctr": 0,
		"Az_Ld_Moc_sum": 0,
		"Az_Ld_Cac_ctr": 0,
		"Az_Ld_Cac_sum": 0,
		"Moctezuma_Loyalty_ctr": 0,
		"Moctezuma_Loyalty_sum": 0,
		"Moctezuma_Wisdom_ctr": 0,
		"Moctezuma_Wisdom_sum": 0,
		"Aztec_Mut": 0,
		"Span_Cho_Att": 0,
		"Sp_Ld_Agu_ctr": 0,
		"Sp_Ld_Agu_sum": 0,
		"Sp_Ld_Vote_ctr": 0,
		"Sp_Ld_Vote_sum": 0,
		"Sp_Ld_Cor_ctr": 0,
		"Sp_Ld_Cor_sum": 0,
		"Sp_Ld_Alv_Teno_ctr": 0,
		"Sp_Ld_Alv_Teno_sum": 0,
		"Sp_Ld_Mar_Teno_sum": 0,
		"Sp_Ld_Agu_Teno_sum": 0,
		"Sp_Ld_Gar_Teno_sum": 0,
		"Sp_Ld_Oli_Teno_sum": 0,
		"Sp_Ld_Vote_Teno_ctr": 0,
		"Sp_Ld_Vote_Teno_sum": 0,
		"Tlax_Alliance": 0,
		"Cortes_Dead": 0,
		"Riot_ctr": 0,
		"Riot_sum": 0,
		"Riot_Vote_ctr": 0,
		"Riot_Vote_sum": 0,
		"Az_Ld_Dead": 0,
		"Hostage": 0,
		"Moc_Riot_Vote_ctr": 0,
		"Moc_Riot_Vote_sum": 0,
		"MocRiot_Moc_ctr": 0,
		"MocRiot_Moc_sum": 0,
		"MocRiot_Poc_ctr": 0,
		"MocRiot_Poc_sum": 0,
		"MocRiot_Tla_ctr": 0,
		"MocRiot_Tla_sum": 0,
		"MocRiot_Cac_ctr": 0,
		"MocRiot_Cac_sum": 0,
		"MocRiot_Cua_sum": 0,
		"MocRiot_AzP_sum": 0,
		"MocRiot_AzP": 0,
		"MocRiot_Cua": 0,
		"New_Aztec_Leader": 0,
		"Hostage_Exch": 0,
		"Final_Aztec_Players": 0,
		"Final_Aztec_Points": 0,
		"Final_Spanish_Players": 0,
		"Final_Spanish_Points": 0,
		"Final_Tlaxcalan_Players": 0,
		"Final_Tlaxcalan_Points": 0,
		"Final_Span_Tlax_Points": 0,
		"Aguilar_Free": 0,
		"Marina_Free": 0,
		"Aguilar_1": 0,
		"Malinche_Free": 0,
		"Aguilar_2": 0,
		"Aguilar_3": 0,
		"Malinche_1": 0,
		"Malinche_2": 0,
		"Malinche_3": 0,
		"Mut_Cor_ctr": 0,
		"Mut_Cor_sum": 0,
		"Mut_Olid_ctr": 0,
		"Mut_Olid_sum": 0,
		"Sp_Ld_Oli_Teno_ctr": 0,
		"Sp_Ld_Mar_Teno_ctr": 0,
		"MocRiot_Cua_ctr": 0,
		"MocRiot_AzP_ctr": 0,
		"NT_Fight": 0,
		"Sp_Ld_Alv_ctr": 0,
		"Sp_Ld_Olid_sum": 0,
		"Sp_Ld_Gar_sum": 0,
		"Sp_Ld_Alv_sum": 0,
		"cause": 0,
		"Sp_Ld_Agu_Teno_ctr": 0,
		"Sp_Ld_Gar_Teno_ctr": 0,
		"Noche": 0,
		"Tlax_Bat": 0,
		"Tlax_Final_Dec": 0,
		"Sp_Peace": 0,
		"Az_Peace": 0,
		"Tl_Peace": 0,
		"Tlax_Az_Peace": 0
	}
    jsonFS_Object.jsonfsState= Object.assign({}, initVars,jsonFS_Object.jsonfsState)
	return returnTwine(jsonFS_Object,response )

}

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

function loadHome(response) {
	let htmlContents = fs.readFileSync(htmlTemplate, 'utf8')
	let indexHtml = htmlContents.replace("%redirectURL%", REDIRECTURL)

	response.send(indexHtml);
}

// Generates a random ID
function generateId() {
	let id = "";
	for (let i = 0; i < 18; i++) {
		id += Math.floor(Math.random() * 10);
	}
	return id;
}

