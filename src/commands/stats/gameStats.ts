import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { client, db } from "../..";
import { convertToReadableTime } from "./convertTime";

export async function gameStats(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  const gameInfo = interaction.options.getString("game") as string;
  const game = await db.game.findFirst({ where: { name: gameInfo } });

  if (!game) return interaction.reply("Not a valid game in our database.");

  const gameDb = await db.userGame.aggregate({
    where: { gameId: game.id },
    _sum: { time: true },
  });

  return interaction.reply(
    `Total time played on ${game.name} is ${convertToReadableTime(
      gameDb._sum.time || 0
    )}`
  );
}
