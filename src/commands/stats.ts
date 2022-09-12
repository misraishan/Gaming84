import { ChatInputCommandInteraction, CacheType } from "discord.js";
import formatDuration from "format-duration";
import { db } from "..";

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
          convertToReadableTime(usr.UserGame[0].time)
      );
    } catch (error) {
      interaction.reply(`Could not find <@${user}> in our database.`);
    }
  }
}

function convertToReadableTime(time : string) {
    const ms = parseInt(time);
    const formattedTime = formatDuration(ms);

    switch (formattedTime.split(":").length) {
        case 2:
            return formattedTime + " min."
        case 3:
            return formattedTime + " hrs."
        case 4:
            return formattedTime + " days."
        default:
            break;
    }

    return formattedTime;
}


