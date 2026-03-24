PLIK 7: ready.js
Otwórz Notatnik
Skopiuj to:
const { Events, ActivityType } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log('========================================');
        console.log('     FizBi Legit Check Bot');
        console.log('========================================');
        console.log(`Zalogowano jako: ${client.user.tag}`);
        console.log(`Serwery: ${client.guilds.cache.size}`);
        console.log('========================================');

        client.user.setActivity('FizBi Store | /legit', {
            type: ActivityType.Watching
        });

        console.log('Bot jest gotowy do dzialania!');
    }
};