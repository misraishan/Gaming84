import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { client, db } from "../..";
import { convertToReadableTime } from "./convertTime";

export async function gameStats(interaction : ChatInputCommandInteraction<CacheType>) {
    const gameInfo = interaction.options.getString("name") as string;
    let gameDb;

    if (isNaN(parseInt(gameInfo))) {
        gameDb = await db.game.findFirst({
            where: {name: gameInfo},
            include: {UserGame: true}
        });
    } else {
        gameDb = await db.game.findFirst({
            where: {appId: gameInfo},
            include: {UserGame: true}
        });
    }

    if (!gameDb) return interaction.reply("Not a valid game in our database.");

    let timePlayed = 0;
    gameDb.UserGame.forEach((value) => {
        timePlayed += parseInt(value.time);
    })

    return interaction.reply(`Total time played on ${gameDb.name} is ${convertToReadableTime(timePlayed.toString())}`)
}