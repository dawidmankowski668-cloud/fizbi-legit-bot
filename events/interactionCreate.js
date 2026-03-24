PLIK 8: interactionCreate.js
Otwórz Notatnik
Skopiuj to:
const { Events, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                const msg = 'Wystapil blad podczas wykonywania tej komendy!';
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: msg, ephemeral: true });
                } else {
                    await interaction.reply({ content: msg, ephemeral: true });
                }
            }
            return;
        }

        if (interaction.isButton()) {
            if (interaction.customId.startsWith('legit_confirm_') || interaction.customId.startsWith('legit_fake_')) {
                await handleLegitButton(interaction, client);
            }
        }
    }
};

async function handleLegitButton(interaction, client) {
    const customId = interaction.customId;
    const isLegit = customId.startsWith('legit_confirm_');
    const ticketChannelId = customId.split('_').pop();

    const sellerId = process.env.SELLER_ID;
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    const isSeller = interaction.user.id === sellerId;

    if (!isAdmin && !isSeller) {
        return interaction.reply({
            content: '**Brak uprawnien!** Tylko sprzedawca lub administrator moze weryfikowac transakcje.',
            ephemeral: true
        });
    }

    const legitData = client.ticketLegitChecks.get(ticketChannelId);
    if (!legitData) {
        return interaction.reply({
            content: '**Blad!** Nie znaleziono danych tego legit checku.',
            ephemeral: true
        });
    }

    const originalEmbed = interaction.message.embeds[0];
    if (!originalEmbed) {
        return interaction.reply({
            content: '**Blad!** Nie znaleziono embeda.',
            ephemeral: true
        });
    }

    const newEmbed = EmbedBuilder.from(originalEmbed)
        .setColor(isLegit ? 0x2ecc71 : 0xe74c3c)
        .addFields(
            {
                name: 'Weryfikacja',
                value: isLegit ? '**Legit** ✅' : '**Fake** ❌',
                inline: true
            },
            {
                name: 'Sprawdzone przez',
                value: `<@${interaction.user.id}>`,
                inline: true
            }
        );

    const disabledButtons = interaction.message.components[0].components.map(button => {
        return {
            type: button.type,
            style: button.style,
            label: button.label,
            emoji: button.emoji,
            custom_id: button.customId,
            disabled: true
        };
    });

    await interaction.update({
        embeds: [newEmbed],
        components: [{ type: 1, components: disabledButtons }]
    });

    const monthKey = new Date().toISOString().slice(0, 7);
    if (isLegit) {
        client.stats.legit++;
        if (client.stats.monthly[monthKey]) client.stats.monthly[monthKey].legit++;
    } else {
        client.stats.fake++;
        if (client.stats.monthly[monthKey]) client.stats.monthly[monthKey].fake++;
    }
    client.saveStats();

    try {
        const buyer = await interaction.client.users.fetch(legitData.buyerId);
        if (buyer && !buyer.bot) {
            const dmEmbed = new EmbedBuilder()
                .setTitle(isLegit ? 'Transakcja Zweryfikowana!' : 'Transakcja Odrzucona!')
                .setColor(isLegit ? 0x2ecc71 : 0xe74c3c)
                .setDescription(
                    isLegit
                        ? 'Twoja transakcja zostala pomyslnie zweryfikowana jako **LEGIT**!'
                        : 'Niestety, Twoja transakcja zostala oznaczona jako **FAKE**.'
                )
                .addFields(
                    { name: 'Produkt', value: legitData.product, inline: true },
                    { name: 'Ilosc', value: legitData.quantity, inline: true },
                    { name: 'Sprzedawca', value: `<@${legitData.sellerId}>`, inline: true }
                )
                .setFooter({ text: 'FizBi Store', iconURL: process.env.LOGO_URL })
                .setTimestamp();

            await buyer.send({ embeds: [dmEmbed] });
        }
    } catch (error) {
        console.log('Nie udalo sie wyslac DM do kupujacego.');
    }

    const logsChannel = interaction.guild.channels.cache.find(
        ch => ch.name === process.env.LOGS_CHANNEL || ch.name === 'legit-logs'
    );

    if (logsChannel) {
        const logEmbed = new EmbedBuilder()
            .setTitle(isLegit ? 'Legit Check - LEGIT' : 'Legit Check - FAKE')
            .setColor(isLegit ? 0x2ecc71 : 0xe74c3c)
            .addFields(
                { name: 'Kupujacy', value: `<@${legitData.buyerId}>`, inline: true },
                { name: 'Sprzedawca', value: `<@${legitData.sellerId}>`, inline: true },
                { name: 'Sprawdzone przez', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Produkt', value: legitData.product, inline: true },
                { name: 'Ilosc', value: legitData.quantity, inline: true },
                { name: 'Status', value: isLegit ? '**LEGIT**' : '**FAKE**', inline: true }
            )
            .setFooter({ text: 'FizBi Store', iconURL: process.env.LOGO_URL })
            .setTimestamp();

        await logsChannel.send({ embeds: [logEmbed] });
    }
}