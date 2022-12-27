import { ChatInputCommandInteraction, CacheType } from "discord.js";
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
  const gameInfo = interaction.options.getString("game") as string;

  const gameList = await db.userGame.findMany({
    include: { game: true },
    where: { userId: userId },
  });

  let validGame = false;
  gameList.forEach((val) => {
    if (val.game.name === gameInfo) {
      validGame = true;
      return interaction.reply(
        `<@${userId}> has ${convertToReadableTime(val.time)} in ${
          val.game.name
        }`
      );
    }
  });

  if (validGame) return;

  return interaction.reply(
    `Could not find <@${userId}>'s playtime for ${gameInfo} in our database.\nCheck your spelling and try again?`
  );
}
