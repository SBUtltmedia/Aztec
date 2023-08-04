import { execSync } from 'child_process';
import { exit } from 'process';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const configObj = require('./config.json')

const app =configObj.serverconf.fileName;
if (!app) {
    console.log("Name argument required. Usage: node .\\createHerokuInstances.js startingAppId endingAppId");
    exit(0);
}

let startingAppId = process.argv[2] || 4;
let endingAppId = process.argv[3] || 4;
let herokuInstances = 1;
let commands = [
    `git add .`,
    `git commit -m "Automated update to Heroku/Github"`
]

for (let i = startingAppId; i <= endingAppId ; i++) {
    let clientId = configObj.channelconf[i-1].clientId;
    let configVars = {...configObj.channelconf[i-1], ...configObj.serverconf};  // Combine channelconf and serverconf
    commands.push(`git push -f https://git.heroku.com/${app}-${i}.git HEAD:master`);
    commands.push(`heroku config:set -a ${app}-${i} PROCFILE=Procfile`) 
    
    // Add custom config variables
    let redirectURL = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(`https://${app}-${i}.herokuapp.com`)}&response_type=code&scope=identify%20guilds.members.read%20guilds`.replace(/&/g, '"&"');
    console.log({redirectURL});
    configVars['redirectURL'] = redirectURL;
    configVars['herokuURL'] = `https://${app}-${i}.herokuapp.com`;
    configVars['appIndex'] = i;
    configVars['discordChannelNames'] = Object.keys(configVars['discordChannels']).reduce(
        (accumulator, currentValue) => `${accumulator},${currentValue}`,
        '')

    // converts discordChannel nested object into .env format
    for (const [key, value] of Object.entries(configVars["discordChannels"])) {
        configVars[key] = value
    }
    delete configVars['discordChannels']

    for (let key of Object.keys(configVars)) {
        let command = `heroku config:set -a ${app}-${i} ${key}=${configVars[key]}`;
        commands.push(command);
       console.log(`${key}=${configVars[key]}`);
    }

    for (let command of commands) {
        try {
            execSync(command, console.log);
        } catch(err) {}
        // console.log(commands);
    }
    commands = [];
}