const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('legit')
        .setDescription('Utworz legit check dla transakcji')
        .addUserOption(option =>
            option.setName('kupujacy').setDescription('Wybierz kupujacego').setRequired(true)
        )
        .addStringOption(option =>
            option.setName('produkt').setDescription('Nazwa produktu').setRequired(true)
        )
        .addStringOption(option =>
            option.setName('ilosc').setDescription('Ilosc produktu').setRequired(true)
        )
        .addAttachmentOption(option =>
            option.setName('zdjecie').setDescription('Zdjecie produktu (opcjonalne)').setRequired(false)
        ),

    async execute(interaction, client) {
        const channelName = interaction.channel.name.toLowerCase();
        if (!channelName.includes('ticket')) {
            return interaction.reply({
                content: '**Blad!** Ta komenda dziala tylko na kanalach ticket!',
                ephemeral: true
            });
        }

        if (client.ticketLegitChecks.has(interaction.channel.id)) {
            return interaction.reply({
                content: '**Blad!** W tym tickecie zostal juz utworzony legit check!',
                ephemeral: true
            });
        }

        const buyer = interaction.options.getUser('kupujacy');
        const product = interaction.options.getString('produkt');
        const quantity = interaction.options.getString('ilosc');
        const attachment = interaction.options.getAttachment('zdjecie');
        const seller = interaction.user;

        if (buyer.bot) {
            return interaction.reply({
                content: '**Blad!** Nie mozesz wybrac bota jako kupujacego!',
                ephemeral: true
            });
        }

        const legitCheckChannel = interaction.guild.channels.cache.find(
            ch => ch.name === process.env.LEGIT_CHECK_CHANNEL || ch.name === 'legit-check'
        );

        if (!legitCheckChannel) {
            return interaction.reply({
                content: '**Blad!** Nie znaleziono kanalu #legit-check! Utworz go najpierw.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('Legit Check')
            .setColor(0x3498db)
            .addFields(
                { name: 'Kupujacy', value: `<@${buyer.id}>`, inline: true },
                { name: 'Sprzedawca', value: `<@${seller.id}>`, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: 'Produkt', value: product, inline: true },
                { name: 'Ilosc', value: quantity, inline: true }
            )
            .setFooter({
                text: 'FizBi Store',
                iconURL: process.env.LOGO_URL
            })
            .setTimestamp();

        if (attachment && attachment.contentType && attachment.contentType.startsWith('image/')) {
            embed.setImage(attachment.url);
        }

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`legit_confirm_${interaction.channel.id}`)
                    .setLabel('Legit')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅'),
                new ButtonBuilder()
                    .setCustomId(`legit_fake_${interaction.channel.id}`)
                    .setLabel('Fake')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            );

        const legitMessage = await legitCheckChannel.send({
            embeds: [embed],
            components: [buttons]
        });

        client.ticketLegitChecks.set(interaction.channel.id, {
            messageId: legitMessage.id,
            channelId: legitCheckChannel.id,
            buyerId: buyer.id,
            sellerId: seller.id,
            product: product,
            quantity: quantity,
            createdAt: new Date().toISOString()
        });

        client.stats.total++;
        const monthKey = new Date().toISOString().slice(0, 7);
        if (!client.stats.monthly[monthKey]) {
            client.stats.monthly[monthKey] = { total: 0, legit: 0, fake: 0 };
        }
        client.stats.monthly[monthKey].total++;
        client.saveStats();

        const logsChannel = interaction.guild.channels.cache.find(
            ch => ch.name === process.env.LOGS_CHANNEL || ch.name === 'legit-logs'
        );

        if (logsChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('Nowy Legit Check')
                .setColor(0x3498db)
                .addFields(
                    { name: 'Ticket', value: `<#${interaction.channel.id}>`, inline: true },
                    { name: 'Kupujacy', value: `<@${buyer.id}>`, inline: true },
                    { name: 'Sprzedawca', value: `<@${seller.id}>`, inline: true },
                    { name: 'Produkt', value: product, inline: true },
                    { name: 'Ilosc', value: quantity, inline: true }
                )
                .setFooter({ text: 'FizBi Store', iconURL: process.env.LOGO_URL })
                .setTimestamp();

            await logsChannel.send({ embeds: [logEmbed] });
        }

        return interaction.reply({
            content: `**Legit check zostal utworzony!**\nSprawdz: <#${legitCheckChannel.id}>`,
            ephemeral: true
        });
    }
};