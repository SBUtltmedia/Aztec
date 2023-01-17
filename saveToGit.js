import { createRequire } from "module";

const require = createRequire(import.meta.url);

var axios = require('axios');
var fs = require('fs');
var base64 = require('base-64');
let config = {
    token : "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",
    fileName : "abc.txt",
    user : "SBUtltmedia",
    content: base64.encode("hi there"),
    repoName: "Aztec"
}

class saveToGit{
    constructor(config) {
        this.config = config
	}

    uploadFileApi(config) {
        var config1 = {
            method: 'get',
            url: `https://api.github.com/repos/${config.user}/${config.repoName}/contents/${config.fileName}`,
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Content-Type': 'application/json'
            }
        };

        let sha = ""
        axios(config1)
            .then(function (response) {
                console.log(response.data.sha);
                sha = response.data.sha
                var data = JSON.stringify({
                    "message": "txt file",
                    "content": `${config.content}`,
                    "sha": sha,
                });
                var config2 = {
                    method: 'put',
                    url: `https://api.github.com/repos/${config.user}/${config.repoName}/contents/${config.fileName}`,
                    headers: {
                        'Authorization': `Bearer ${config.token}`,
                        'Content-Type': 'application/json',

                    },
                    message: "Commit message",
                    data: data,
                };
                axios(config2)
                    .then(function (response) {
                        console.log(JSON.stringify(response.data));
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