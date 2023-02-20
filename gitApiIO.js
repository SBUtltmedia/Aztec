import { createRequire } from "module";

const require = createRequire(import.meta.url);

var axios = require('axios');
var fs = require('fs');
var testFile = "loginDiscord/testVars.json"
var base64 = require('base-64');

class gitApiIO{
    constructor(config) {
        this.config = config
        this.test = fs.existsSync(testFile)
        console.log("config is:", config)
	}

    async uploadFileApi() {
        return new Promise((res,rej)=> {
            if(this.test){
                fs.writeFileSync(testFile, base64.decode(this.config.content))
                res()
            }else{
            let config = this.config
            var configGetFile = {
                method: 'get',
                url: `https://api.github.com/repos/${config.githubUser}/${config.githubRepo}/contents/${config.fileName}`,
                headers: {
                    'Authorization': `Bearer ${config.githubToken}`,
                    'Content-Type': 'application/json'
                }
            };

            let sha = ""
            axios(configGetFile)
                .then(function (response) {
                    // console.log(response.data.sha);
                    sha = response.data.sha
                    var data = JSON.stringify({
                        "message": "txt file",
                        "content": `${config.content}`,
                        "sha": sha,
                    });
                    var configPutFile = {
                        method: 'put',
                        url: `https://api.github.com/repos/${config.githubUser}/${config.githubRepo}/contents/${config.fileName}`,
                        headers: {
                            'Authorization': `Bearer ${config.githubToken}`,
                            'Content-Type': 'application/json',

                        },
                        message: "Commit message",
                        data: data,
                    };
                    axios(configPutFile)
                        .then(function (response) {
                            res()
                        })
                        .catch(function (error) {
                            rej(error)
                        });
                    })
                .catch(function (error) {
                    rej(error)
                });
            }})
    }
    async retrieveFileAPI() {
        return new Promise((res,rej)=> {
        if(this.test){
            let data = fs.readFileSync(testFile)
            res(data)
        }else{
        var configGetFile = {
            method: 'get',
            url: `https://api.github.com/repos/${this.config.githubUser}/${this.config.githubRepo}/contents/${this.config.fileName}`,
            headers: {
                'Authorization': `Bearer ${this.config.githubToken}`,
                'Content-Type': 'application/json'
            }
        };
        axios(configGetFile)
            .then(function (response) {
                res(base64.decode(response.data.content))

                // return base64.decode(response.data.content)
            })
            .catch(function (error) {
                rej(error);
            });
        }})
    }
}

export default gitApiIO