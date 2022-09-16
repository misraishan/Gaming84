import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { isNumberObject } from "util/types";
import { db } from "../..";
import { convertToReadableTime } from "./convertTime";

export async function userGameStats(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  const userId =
    interaction.options
      .getMentionable("user")
      ?.toString()
      .replace(/[<@>]/g, "") || interaction.user.id;
  const gameInfo = interaction.options.getString("name") as string;
  const game = isNaN(parseInt(gameInfo)) ? gameInfo : parseInt(gameInfo);

  const gameList = await db.userGame.findMany({
    include: { game: true },
    where: { userId: userId },
  });

  if (isNumberObject(game)) {
    gameList.forEach((val) => {
      if (val.gameId === game) {
        return interaction.reply(
          `<@${userId}> has ${convertToReadableTime(val.time)} in ${
            val.game.name
          }`
        );
      }
    });
  } else {
    gameList.forEach((val) => {
      if (val.game.name === game) {
        return interaction.reply(
          `<@${userId}> has ${convertToReadableTime(val.time)} in ${
            val.game.name
          }`
        );
      }
    });
  }

  return interaction.reply(
    `Could not find <@${userId}>'s playtime for ${game} in our database.\nCheck your spelling and try again?`
  );
}
