KROK 6: Utwórz plik index.js
Otwórz Notatnik
Skopiuj to:
require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel, Partials.Message]
});

client.commands = new Collection();
client.ticketLegitChecks = new Map();
client.stats = {
    total: 0,
    legit: 0,
    fake: 0,
    monthly: {}
};

const statsPath = path.join(__dirname, '../data/stats.json');
if (fs.existsSync(statsPath)) {
    try {
        client.stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    } catch (e) {
        console.log('Tworzenie nowych statystyk...');
    }
}

client.saveStats = () => {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(statsPath, JSON.stringify(client.stats, null, 2));
};

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`Zaladowano komende: ${command.data.name}`);
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
    console.log(`Zaladowano event: ${event.name}`);
}

client.login(process.env.DISCORD_TOKEN);