import { createRequire } from 'module';
const require = createRequire(import.meta.url);
var XMLHttpRequest = require('xhr2');

class DiscordBot {
    constructor(spanishChannel, aztecChannel) {
        this.spanishChannel = spanishChannel;
        this.aztecChannel = aztecChannel;
    }

    // Sends notification to a specific channel 
    sendNotif(channel, message) {
        const content = message;
        let username, avatar_url, channelURL;

        if (channel === "aztecs") {
            username = 'Aztec Messenger';
            avatar_url = "https://images.fineartamerica.com/images-medium-large/2-hernando-cortez-spanish-conquistador-photo-researchers.jpg";
            channelURL = this.aztecChannel;
        }
        if (channel === "spanish") {
            username = 'Spanish Messenger';
            avatar_url = "https://images.fineartamerica.com/images-medium-large/2-hernando-cortez-spanish-conquistador-photo-researchers.jpg";
            channelURL = this.spanishChannel;
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