import { createRequire } from 'module';
const require = createRequire(import.meta.url);
var XMLHttpRequest = require('xhr2');

class DiscordBot {
    //Webhook URLs need to be defined in env vars (config vars in heroku). get them at discord dev browser 
    constructor(spanishChannel, aztecChannel, tlaxChannel, aztecTlax, aztecSpan, spanTlax) {
        this.spanishChannel = spanishChannel;  
        this.aztecChannel = aztecChannel;   
        this.tlaxChannel = tlaxChannel;   
        this.aztecTlax = aztecTlax;
        this.aztecSpan = aztecSpan;
        this.spanTlax = spanTlax;
    }

    // Sends notification to a specific channel 
    sendNotif(channel, message) {
        const content = message;
        let username, avatar_url, channelURL;

        switch(channel){
            case "aztecs":
                username = 'Aztec Messenger';
                avatar_url = "https://images.fineartamerica.com/images-medium-large/2-hernando-cortez-spanish-conquistador-photo-researchers.jpg";
                channelURL = this.aztecChannel;
                break;

            case "spanish":
                username = 'Spanish Messenger';
                avatar_url = "https://images.fineartamerica.com/images-medium-large/2-hernando-cortez-spanish-conquistador-photo-researchers.jpg";
                channelURL = this.spanishChannel;
                break;

            case "tlaxcalans":
                username = 'Tlaxcalan Messenger';
                avatar_url = "https://images.fineartamerica.com/images-medium-large/2-hernando-cortez-spanish-conquistador-photo-researchers.jpg";
                channelURL = this.tlaxChannel;
                break;

            case "aztecspanish":
                username = 'Tlaxcalan Messenger';
                avatar_url = "https://images.fineartamerica.com/images-medium-large/2-hernando-cortez-spanish-conquistador-photo-researchers.jpg";
                channelURL = this.aztecSpan;
                break;

            case "aztectlaxcalans":
                username = 'Tlaxcalan Messenger';
                avatar_url = "https://images.fineartamerica.com/images-medium-large/2-hernando-cortez-spanish-conquistador-photo-researchers.jpg";
                channelURL = this.aztecTlax;
                break;

            case "spanishtlaxcalans":
                username = 'Tlaxcalan Messenger';
                avatar_url = "https://images.fineartamerica.com/images-medium-large/2-hernando-cortez-spanish-conquistador-photo-researchers.jpg";
                channelURL = this.spanTlax;
                break;
        
        }
        const request = new XMLHttpRequest();
        request.open("POST", channelURL);
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