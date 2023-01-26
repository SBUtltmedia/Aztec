import { createRequire } from "module";

const require = createRequire(import.meta.url);

var axios = require('axios');
var fs = require('fs');
var base64 = require('base-64');

class getFromGit{
    constructor(config) {
        this.config = config
        console.log("Getting from git. Config is", config)
	}

    retrieveFileAPI() {
        var configGetFile = {
            method: 'get',
            url: `https://api.github.com/repos/${this.config.githubUser}/${this.config.githubRepo}/contents/${this.config.fileName}`,
            headers: {
                'Authorization': `Bearer ${this.config.token}`,
                'Content-Type': 'application/json'
            }
        };
        axios(configGetFile)
            .then(function (response) {
                console.log(base64.decode(response.data.content))
            })
            .catch(function (error) {
                console.log(error);
            });

    }
}

export default getFromGit