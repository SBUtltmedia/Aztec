import gaze from 'gaze'
import fs, { existsSync } from 'fs'
import { exec, execFile } from 'child_process';
import Extwee, { HTMLWriter, StoryFormat, StoryFormatParser, TweeWriter } from 'extwee'

let tweegoBinaries = {"win32":"binaries/tweego-2.1.1-windows-x64", "linux":"binaries/tweego-2.1.1-macos-x64", "darwin":"binaries/tweego-2.1.1-macos-x64"};
let tweeBinary = tweegoBinaries[process.platform] || tweegoBinaries["linux"];

let coolDown = 0;

// Watch the EngineDemo directory for changes
gaze('Twine/EngineDemo/*.*', function (err, watcher) {

    // Get all watched files
    var watched = this.watched();

    // On file changed
    this.on('changed', function (filepath) {
        // Execute command
        const mtime = fs.statSync(filepath).mtime;
        if (mtime - coolDown > 1000) {
            coolDown = mtime

            let [suffix, ...prefix] = filepath.split(".").reverse();
            prefix = prefix.reverse().join(".");
            let command, args;

            if (suffix == "twee" || suffix == "tw") {
                command = `${tweeBinary}/tweego`

                // Build all twee files in EngineDemo directory into single HTML
                args = ["-f", "sugarcube-2", "Twine/EngineDemo/", "-o", "Twine/EngineDemo.html"];
            }
            else {
                console.log(prefix, suffix)
                return
            }

            // Executes shell command
            execFile(command, args, (err, stdout, stderr) => {
                if (err) {
                    console.error(err)
                } else {
                    console.log('✓ Built Twine/EngineDemo.html');
                }
            });

            console.log(filepath + ' was changed');
        }
    });

    // Initial build
    console.log('Building EngineDemo...');
    execFile(`${tweeBinary}/tweego`, ["-f", "sugarcube-2", "Twine/EngineDemo/", "-o", "Twine/EngineDemo.html"], (err, stdout, stderr) => {
        if (err) {
            console.error('Initial build failed:', err)
        } else {
            console.log('✓ Initial build complete: Twine/EngineDemo.html');
        }
    });

    // Get watched files with relative paths
    var files = this.relative();
});
