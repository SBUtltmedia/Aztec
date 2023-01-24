import { execSync } from 'child_process';
import { exit } from 'process';

const app = process.argv[2];
if (!app) {
    console.log(`Name argument required. Usage: node ${process.argv[1]} name`);
    exit(0);
}
let herokuInstances = 1;

let commands = [
    `git add .`,
    `git commit -m "Automated update to Heroku/Github"`
]

for (let i = 1; i <= herokuInstances; i++) {
    commands.push(`git push -f https://git.heroku.com/${app}-${i}.git HEAD:master`);

    for (let command of commands) {
        try {
            execSync(command, console.log);
        } catch(err) {}
        // console.log(commands);
    }
    commands = [];
}