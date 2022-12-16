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
        await db.userGame.deleteMany({where: {userId: user?.id}})
        return await interaction.reply({ephemeral: true, content: "All game history has been deleted!"})
    }
}