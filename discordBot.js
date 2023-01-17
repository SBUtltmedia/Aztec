import { createRequire } from 'module';
const require = createRequire(import.meta.url);
var XMLHttpRequest = require('xhr2');

class DiscordBot {
    //Webhook URLs need to be defined in env vars (config vars in heroku). get them at discord dev browser 
    constructor(spanishChannel, aztecChannel, tlaxChannel, aztecTlax, aztecSpan, spanTlax, general, omen) {
        this.spanishChannel = spanishChannel;  
        this.aztecChannel = aztecChannel;   
        this.tlaxChannel = tlaxChannel;   
        this.aztecTlax = aztecTlax;
        this.aztecSpan = aztecSpan;
        this.spanTlax = spanTlax;
        this.general = general;
        this.omen = omen;
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

            case "tlax":
                username = 'Tlaxcalan Messenger';
                avatar_url = "https://images.fineartamerica.com/images-medium-large/2-hernando-cortez-spanish-conquistador-photo-researchers.jpg";
                channelURL = this.tlaxChannel;
                break;

            case "aztecSpan":
                username = 'Spanish and Aztec Messenger';
                avatar_url = "https://images.fineartamerica.com/images-medium-large/2-hernando-cortez-spanish-conquistador-photo-researchers.jpg";
                channelURL = this.aztecSpan;
                break;

            case "aztecTlax":
                username = 'Aztec and Tlaxcalan Messenger';
                avatar_url = "https://images.fineartamerica.com/images-medium-large/2-hernando-cortez-spanish-conquistador-photo-researchers.jpg";
                channelURL = this.aztecTlax;
                break;

            case "spanTlax":
                username = 'Spanish and Tlaxcalan Messenger';
                avatar_url = "https://images.fineartamerica.com/images-medium-large/2-hernando-cortez-spanish-conquistador-photo-researchers.jpg";
                channelURL = this.spanTlax;
                break;

            case "general":
                username = 'General Messenger';
                avatar_url = "https://images.fineartamerica.com/images-medium-large/2-hernando-cortez-spanish-conquistador-photo-researchers.jpg";
                channelURL = this.general;
                break;

            case "omen":
                username = 'Omen Messenger';
                avatar_url = "https://images.fineartamerica.com/images-medium-large/2-hernando-cortez-spanish-conquistador-photo-researchers.jpg";
                channelURL = this.omen;
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