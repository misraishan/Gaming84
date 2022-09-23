import { Game, UserGame } from "@prisma/client";
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
  const gameInfo = interaction.options.getString("game") as string;

  const gameList = await db.userGame.findMany({
    include: { game: true },
    where: { userId: userId },
  });

  gameList.forEach((val) => {
    if (val.game.name === gameInfo) {
      return interaction.reply(
        `<@${userId}> has ${convertToReadableTime(val.time)} in ${
          val.game.name
        }`
      );
    }
  });

  return interaction.reply(
    `Could not find <@${userId}>'s playtime for ${gameInfo} in our database.\nCheck your spelling and try again?`
  );
}
