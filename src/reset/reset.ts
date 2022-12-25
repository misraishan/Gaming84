import { db } from "..";
import { CacheType, ChatInputCommandInteraction } from "discord.js";

export async function reset(interaction: ChatInputCommandInteraction<CacheType>, game : string | null) {
    const user = await db.user.findFirst({ where: { id: interaction.user.id }, include: {UserGame: true} });

    if (user?.UserGame.length === 0) {
        return await interaction.reply({
            ephemeral: true,
            content: "Your account has no play history!"
        })
    }

    if (game) {
        const gameId = await db.game.findFirst({where: {name: game}})
        if (!gameId) return await interaction.reply({ephemeral: true, content: `Couldn't find ${game} in the database. Check your spelling?`});
        const userGames = await db.userGame.findFirst({where: {userId: user?.id, gameId: gameId?.id}})
        if (!userGames) return await interaction.reply({ephemeral: true, content: `Couldn't find ${game} in your play history. Check your spelling?`});
        await db.userGame.delete({where: {id: userGames?.id}})
        return await interaction.reply({ephemeral: true, content: `Successfully deleted ${game} from your play history.`})
    } else {
        await interaction.reply({ephemeral: true, content: `Are you sure you want to delete all of your play history? This cannot be undone.`})
        // Add a confirmation button here
        const filter = (i: any) => i.user.id === interaction.user.id;
        const collector = interaction.channel?.createMessageComponentCollector({ filter,
            time: 15000
        });
        collector?.on('collect', async (i: any) => {
            if (i.customId === 'confirm') {
                await db.userGame.deleteMany({where: {userId: user?.id}})
                await i.update({content: `Successfully deleted all of your play history.`, components: []})
            } else if (i.customId === 'cancel') {
                await i.update({content: `Cancelled deletion of all of your play history.`, components: []})
            }
        });

        collector?.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await interaction.editReply({content: `Timed out.`, components: []})
            }
        });

        return await interaction.editReply({ content: `Are you sure you want to delete all of your play history? This cannot be undone.`, components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 3,
                        label: 'Confirm',
                        customId: 'confirm'
                    },
                    {
                        type: 2,
                        style: 4,
                        label: 'Cancel',
                        customId: 'cancel'
                    }
                ]
            }
        ]})
    }
}