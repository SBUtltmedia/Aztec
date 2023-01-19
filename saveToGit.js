import { createRequire } from "module";

const require = createRequire(import.meta.url);

var axios = require('axios');
var fs = require('fs');
var base64 = require('base-64');

class saveToGit{
    constructor(config) {
        this.config = config
        console.log(config)
	}

    uploadFileApi() {
        let config = this.config
        var configGetFile = {
            method: 'get',
            url: `https://api.github.com/repos/${config.user}/${config.repoName}/contents/${config.fileName}`,
            headers: {
                'Authorization': `Bearer ${config.githubtoken}`,
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
                    url: `https://api.github.com/repos/${config.githubuser}/${config.githubrepo}/contents/${config.fileName}`,
                    headers: {
                        'Authorization': `Bearer ${config.githubtoken}`,
                        'Content-Type': 'application/json',

                    },
                    message: "Commit message",
                    data: data,
                };
                axios(configPutFile)
                    .then(function (response) {
                        // console.log(JSON.stringify(response.data));
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
                })
            .catch(function (error) {
                console.log(error);
            });

    }
}

export default saveToGit