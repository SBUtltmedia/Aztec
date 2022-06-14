import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
var XMLHttpRequest = require('xhr2');

class DiscordBot {
    constructor(clientId, guildId, token, channels) {
        this.clientId = clientId;
        this.guildId = guildId;
        this.token = token;
        this.channels = channels;
        this.init();
    }
    
    // Initializes and runs the discord bot
    init() {
        const commands = [{
            name: 'ping',
            description: 'Replies with Pong!'
          }, {
              name: 'pog',
              description: 'Replies with Pog!'
          }]; 

        const rest = new REST({ version: '9' }).setToken(this.token);

        (async () => {
            try {
            console.log('Started refreshing application (/) commands.');
        
            await rest.put(
                Routes.applicationGuildCommands(this.clientId, this.guildId),
                { body: commands },
            );
        
            console.log('Successfully reloaded application (/) commands.');
            } catch (error) {
            console.error(error);
            }
        })();
        
        client.once('ready', () => {
            console.log(`Logged in as ${client.user.tag}`)
        })
    
        client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;
        
            if (interaction.commandName === 'ping') {
            await interaction.reply('Pong!');
            }
    
        });
    
        client.login(this.token);
    }

    // Sends notification to a specific channel 
    sendNotif(channel, message) {
        console.log({channel, message});
        
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