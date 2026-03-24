
PLIK 6: stats.js
Otwórz Notatnik
Skopiuj to:
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Wyswietl statystyki legit checkow')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const stats = client.stats;
        const monthKey = new Date().toISOString().slice(0, 7);
        const monthlyStats = stats.monthly[monthKey] || { total: 0, legit: 0, fake: 0 };

        const legitPercent = stats.total > 0 ? ((stats.legit / stats.total) * 100).toFixed(1) : 0;
        const fakePercent = stats.total > 0 ? ((stats.fake / stats.total) * 100).toFixed(1) : 0;

        const embed = new EmbedBuilder()
            .setTitle('Statystyki Legit Check')
            .setColor(0x9b59b6)
            .addFields(
                { name: 'Wszystkie', value: '\u200B', inline: false },
                { name: 'Lacznie', value: `**${stats.total}**`, inline: true },
                { name: 'Legit', value: `**${stats.legit}** (${legitPercent}%)`, inline: true },
                { name: 'Fake', value: `**${stats.fake}** (${fakePercent}%)`, inline: true },
                { name: '\u200B', value: '\u200B', inline: false },
                { name: 'Ten miesiac', value: '\u200B', inline: false },
                { name: 'Lacznie', value: `**${monthlyStats.total}**`, inline: true },
                { name: 'Legit', value: `**${monthlyStats.legit}**`, inline: true },
                { name: 'Fake', value: `**${monthlyStats.fake}**`, inline: true }
            )
            .setFooter({ text: 'FizBi Store', iconURL: process.env.LOGO_URL })
            .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};