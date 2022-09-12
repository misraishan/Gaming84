import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { db } from "../..";
import { convertToReadableTime } from "./convertTime";

export async function statsHandler(interaction: ChatInputCommandInteraction<CacheType>) {
  const user = interaction.options
    .getMentionable("user")
    ?.toString()
    .replace(/[<@>]/g, "") || interaction.user.id;

  if (user) {
    try {
      const usr = await db.user.findFirstOrThrow({
        where: {
          id: user.toString(),
        },
        include: {
          UserGame: true,
        },
      });

      interaction.reply(
        "game id: " +
          usr.UserGame[0].gameId +
          " time spent: " +
          convertToReadableTime(usr.UserGame[0].time) + "."
      );
    } catch (error) {
      interaction.reply(`Could not find <@${user}> in our database.`);
    }
  }
}


