import { createRequire } from "module";

const require = createRequire(import.meta.url);

var axios = require('axios');
var fs = require('fs');
var base64 = require('base-64');

class gitApiIO{
    constructor(serverConf) {
        this.serverConf = serverConf
        console.log("config is:", serverConf)
	}

    async uploadFileApi() {
        return new Promise((res,rej)=> {
            let serverConf = this.serverConf
            var configGetFile = {
                method: 'get',
                url: `https://api.github.com/repos/${serverConf.githubUser}/${serverConf.githubRepo}/contents/${serverConf.fileName}`,
                headers: {
                    'Authorization': `Bearer ${serverConf.githubToken}`,
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
                        "content": `${serverConf.content}`,
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
            })
    }
    async retrieveFileAPI() {
        return new Promise((res,rej)=> {
        var configGetFile = {
            method: 'get',
            url: `https://api.github.com/repos/${this.serverConf.githubUser}/${this.serverConf.githubRepo}/contents/${this.serverConf.fileName}`,
            headers: {
                'Authorization': `Bearer ${this.serverConf.githubToken}`,
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
        })
    }
}

export default gitApiIO