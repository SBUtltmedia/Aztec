import { createRequire } from "module";

const require = createRequire(import.meta.url);

var axios = require('axios');
var fs = require('fs');
var testFile = "login/testVars.json"
var base64 = require('js-base64');

/**
 * Allows the sending an retrieving of git files based on .env file intended for backing up state after 
a shutdown
 */
class gitApiIO{

    /** 
    *   Constructs gitApiIO object, use methods on constructed object
    *   @param {object} serverConf: serverConf from config or .env file, contains: port, twinePath, githubtoken,
    *   githubuser, githubrepo, and localappindex
    *   
    **/
    constructor(serverConf, isTest=false) {
        this.serverConf = serverConf
        this.serverConf.fileName = `${this.serverConf.fileName}-${this.serverConf.appIndex}.json`
        this.test = isTest;
	}

    /** 
    * Uploads file to github repo described in serverConf. Used to backup game state
    *  since Heroku is ephemeral
    * @param {object} content: The last saved Sugarcube.State.variables taken from serverstore
    **/
    async uploadFileApi(content, isTest = this.test) {
        if (isTest) {
            fs.writeFileSync(testFile, base64.decode(content))
            return;
        }

        try {
            let serverConf = this.serverConf;
            var configGetFile = {
                method: 'get',
                url: `https://api.github.com/repos/${serverConf.githubUser}/${serverConf.githubRepo}/contents/${serverConf.fileName}`,
                headers: {
                    'Authorization': `Bearer ${serverConf.githubToken}`,
                    'Content-Type': 'application/json'
                }
            };

            const response = await axios(configGetFile);
            const sha = response.data.sha;
            
            var data = JSON.stringify({
                "message": "txt file",
                "content": `${content}`,
                "sha": sha,
            });
            
            var configPutFile = {
                method: 'put',
                url: `https://api.github.com/repos/${serverConf.githubUser}/${serverConf.githubRepo}/contents/${serverConf.fileName}`,
                headers: {
                    'Authorization': `Bearer ${serverConf.githubToken}`,
                    'Content-Type': 'application/json',
                },
                message: "Commit message",
                data: data,
            };

            await axios(configPutFile);
        } catch (error) {
            throw error;
        }
    }

    /**Retrieves file specified by serverConf on github via REST api
     * 
     * @returns {object} response containing last saved game state in the form of a JSON. To be loaded
     * into SugarCubeState.variables
     */
    async retrieveFileAPI() {
        if (this.test) {
            if (!fs.existsSync(testFile)) {
                fs.writeFileSync(testFile, fs.readFileSync("./initVars.json"))
            }
            return fs.readFileSync(testFile);
        }

        try {
            //to update a file, it's sha must be retrieved first
            var configGetFile = {
                method: 'get',
                url: `https://api.github.com/repos/${this.serverConf.githubUser}/${this.serverConf.githubRepo}/contents/${this.serverConf.fileName}`,
                headers: {
                    'Authorization': `Bearer ${this.serverConf.githubToken}`,
                    'Content-Type': 'application/json'
                }
            };
            
            const response = await axios(configGetFile);
            return base64.decode(response.data.content);
        } catch (error) {
            throw error;
        }
    }

    //for creating new json files
    async setupFileAPI(content){
        if(this.test){
            fs.writeFileSync(testFile, base64.decode(content))
            return;
        }

        try {
            let serverConf = this.serverConf
            // console.log(response.data.sha);
            var data = JSON.stringify({
                "message": "txt file",
                "content": `${content}`,
            });
            var configPutFile = {
                method: 'put',
                url: `https://api.github.com/repos/${serverConf.githubUser}/${serverConf.githubRepo}/contents/${serverConf.fileName}`,
                headers: {
                    'Authorization': `Bearer ${serverConf.githubToken}`,
                    'Content-Type': 'application/json',

                },
                message: "Commit message",
                data: data,
            };
            
            await axios(configPutFile);
        } catch (error) {
            throw error;
        }
    }
}

export default gitApiIO