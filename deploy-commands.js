require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command) {
        commands.push(command.data.toJSON());
        console.log(`Przygotowano komende: ${command.data.name}`);
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Rozpoczynam rejestracje ${commands.length} komend...`);

        const appInfo = await rest.get(Routes.oauth2CurrentApplication());
        const clientId = appInfo.id;

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`Pomyslnie zarejestrowano ${data.length} komend globalnie!`);
    } catch (error) {
        console.error('Blad podczas rejestracji komend:', error);
    }
})();