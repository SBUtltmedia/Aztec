import { createRequire } from "module";

const require = createRequire(import.meta.url);

var axios = require('axios');
var fs = require('fs');
var base64 = require('base-64');

class getFromGit{
    constructor(config) {
        this.config = {
            token : "//",
            fileName : "aztec-2.json",
            user : "SBUtltmedia",
            repoName: "Aztec"
        }
	}

    retrieveFileAPI(config) {
        var config1 = {
            method: 'get',
            url: `https://api.github.com/repos/${this.config.user}/${this.config.repoName}/contents/${this.config.fileName}`,
            headers: {
                'Authorization': `Bearer ${this.config.token}`,
                'Content-Type': 'application/json'
            }
        };
        axios(config1)
            .then(function (response) {
                console.log(base64.decode(response.data.content))
            })
            .catch(function (error) {
                console.log(error);
            });

    }
}
let temp = new getFromGit()
temp.retrieveFileAPI()
export default getFromGit