import gaze from 'gaze'
import fs from 'fs'
import { exec } from 'child_process';

let tweegoBinaries = {"win32":"binaries/tweego-2.1.1-windows-x64", "linux":"binaries/tweego-2.1.1-macos-x64", "darwin":"binaries/tweego-2.1.1-macos-x64"};
let tweeBinary = tweegoBinaries[process.platform] || tweegoBinaries["linux"];

let coolDown = 0;

// Watch all files in Twine recursively
gaze('Twine/**/*.*', function (err, watcher) {
    this.on('changed', function (filepath) {
        const mtime = fs.statSync(filepath).mtime;
        if (mtime - coolDown > 1000) {
            coolDown = mtime

            let [suffix, ...prefixParts] = filepath.split(".").reverse();
            let prefix = prefixParts.reverse().join(".");
            
            let command;
            if (suffix == "html") {
                command = `${tweeBinary}/tweego -f sugarcube-2 -d -o "${prefix}.twee" "${prefix}.html"`;
            } 
            else if (suffix == "twee" || suffix == "tw" || suffix == "js" || suffix == "css") {
                let targetTwee = `${prefix}.${suffix}`;
                let outputHtml = `${prefix}.html`;

                // Default to UnityDemo if a module or css changed
                if (suffix === 'js' || suffix === 'css') {
                    targetTwee = 'Twine/UnityDemo.twee';
                    outputHtml = 'Twine/UnityDemo.html';
                }

                command = `${tweeBinary}/tweego -f sugarcube-2 "${targetTwee}" Twine/modules/ Twine/demo_style.css -o "${outputHtml}"`;
            } 
            else {
                return;
            }

            console.log(`[BUILD] Rebuilding: ${command}`);
            exec(command, (err, stdout, stderr) => { 
                if (err) console.error(err);
                else console.log(`${filepath} was processed successfully`);
            });
        }
    });
});