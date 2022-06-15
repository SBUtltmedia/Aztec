import { createRequire } from 'module';
const require = createRequire(import.meta.url);
var XMLHttpRequest = require('xhr2');

class DiscordBot {
    constructor(channels) {
        this.channels = channels;
    }

    // Sends notification to a specific channel 
    sendNotif(channel, message) {
        // Find channel URL for the requested channel name
        for (const ch of this.channels)
            if (ch.name === channel) {
                var channelURL = ch.url;            
                break;
            }
        
        // Don't send message if no channel URL is found
        if (!channelURL)
            return;

        const content = message;
        let username, avatar_url;

        if (channel === "aztecs") {
            username = 'Aztec Messenger';
            avatar_url = "https://images.fineartamerica.com/images-medium-large/2-hernando-cortez-spanish-conquistador-photo-researchers.jpg";
        }
        if (channel === "spanish") {
            username = 'Spanish Messenger';
            avatar_url = "https://images.fineartamerica.com/images-medium-large/2-hernando-cortez-spanish-conquistador-photo-researchers.jpg";
        }

        const request = new XMLHttpRequest();
        request.open("POST", channelURL)
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