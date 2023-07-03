import { createRequire } from 'module';
const require = createRequire(import.meta.url);
var XMLHttpRequest = require('xhr2');

class DiscordBot {
    //Webhook URLs need to be defined in env vars (config vars in heroku). get them at discord dev browser 
    constructor(channels) {
        this.channels = channels;
    }

    // Sends notification to a specific channel 
    sendNotif(channel, message) {
        const content = message;
        let username = `${channel} messenger`
        let avatar_url =  "https://images.fineartamerica.com/images-medium-large/2-hernando-cortez-spanish-conquistador-photo-researchers.jpg" 
        let channelURL = this.channels[channel];
        try{
            const request = new XMLHttpRequest();
            request.open("POST", channelURL);
        }catch(e){
            throw "Invalid Discord URL"
        }
        request.onload = function(e) {
        
              //console.log(e);
           //
          };
        request.setRequestHeader('Content-type', 'application/json');
        const params = {
            username,
            avatar_url,
            content
        }

        // Send message
        request.send(JSON.stringify(params));
    }
}

export default DiscordBot;