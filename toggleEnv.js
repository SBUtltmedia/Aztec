import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';

const env = `./.env` 
const envBack = `./.env_back` 

if(fs.existsSync(env)){
    fs.renameSync(env, envBack)
}else if(fs.existsSync(envBack)){
    fs.renameSync(envBack, env)
}else{
    console.log("\nWARNING .ENV EITHER DOESN'T EXISTS OR IS NAMED WRONG\n");
}

