//quick node program to change .test to .test or vice versa. Use for testing process.env
//run by typing: 'node toggleTest.js' in terminal

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';

const test = `./loginDiscord/testVars.json` 
const testBack = `./loginDiscord/testVars_back.json` 

if(fs.existsSync(test)){
    fs.renameSync(test, testBack)
}else if(fs.existsSync(testBack)){
    fs.renameSync(testBack, test)
}else{
    console.log("\nWARNING .test EITHER DOESN'T EXISTS OR IS NAMED WRONG\n");
}

