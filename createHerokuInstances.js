// NOTE: This file only pushes files to Heroku that have already been committed. Uncommitted changes won't be pushed to Heroku.

import { execSync } from 'child_process';
import { createRequire } from "module";
import { exit } from 'process';
const require = createRequire(import.meta.url);
const configObj = require('./config.json')

// Checks command line arguments for app name
const app = process.argv[2];
if (!app) {
    console.log("Name argument required. Usage: node .\\createHerokuInstances.js name startingAppId endingAppId");
    exit(0);
}

let startingAppId = process.argv[3] || 1;
let endingAppId = process.argv[4] || 1;
// let herokuInstances = configObj.channelconf.length;


// Loop through instances given in config JSON file and push them all to Heroku
for (let i = startingAppId ; i <=  endingAppId; i++) {
    let clientId = configObj.channelconf[i-1].clientId;
    let configVars = {...configObj.channelconf[i-1], ...configObj.serverconf};  // Combine channelconf and serverconf

    // Commands: Destroy current app -> Create new app -> Set buildpack to node -> Set Procfile -> Push to Heroku
    let commands = [
        `heroku apps:destroy -a ${app}-${i} --confirm ${app}-${i}`,
        `heroku create -a ${app}-${i} --buildpack heroku/nodejs`, 
        `heroku buildpacks:add -a ${app}-${i} heroku-community/multi-procfile`,
        `heroku config:set -a ${app}-${i} PROCFILE=Procfile`, 
        `git add .`,
        `git commit -m "Automated update to Heroku/Github"`,
        `git push https://git.heroku.com/${app}-${i}.git HEAD:master`
    ]
    
    // Add custom config variables
    let redirectURL = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(`https://${app}-${i}.herokuapp.com`)}&response_type=code&scope=identify%20guilds.members.read%20guilds`.replace(/&/g, '"&"');
    console.log({redirectURL});
    configVars['redirectURL'] = redirectURL;
    configVars['herokuURL'] = `https://${app}-${i}.herokuapp.com`;
    configVars['appIndex'] = i;

    // Set config variables on Heroku
    for (let key of Object.keys(configVars)) {
        let command = `heroku config:set -a ${app}-${i} ${key}=${configVars[key]}`;
        commands.push(command);
       // console.log `${key}=${configVars[key]}`;
    }
console.log(configVars)

    // Execute commands
    for (let command of commands) {
        try {
            //console.log(command);
           execSync(command, console.log);
        } catch(err) {}
    }
}