import {
  ChatInputCommandInteraction,
  CacheType,
  EmbedBuilder,
  AttachmentBuilder,
  codeBlock,
} from "discord.js";
import { client, db } from "../..";
import { generateDonut } from "../../charts/userCharts";
import { convertToReadableTime } from "./convertTime";

export async function statsHandler(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  const userId =
    interaction.options
      .getMentionable("user")
      ?.toString()
      .replace(/[<@>]/g, "") || interaction.user.id;

  if (userId) {
    const { image, gameList, error } = await generateDonut(userId).catch(
      async (err) => {
        await interaction.reply(`Could not find <@${userId}> in our database.`);
        return { image: null, gameList: null, error: err };
      }
    );
    if (error != null || image == null) return;

    const file = new AttachmentBuilder(image, { name: `image.png` });

    const interactionUser = await client.users.fetch(userId);
    const user = await db.user.findFirst({ where: { id: interactionUser.id } });
    if (!user) {
      await interaction.reply(`Could not find <@${userId}> in our database.`);
    }

    const embed = new EmbedBuilder()
      .setColor("Purple")
      .setThumbnail(interactionUser.displayAvatarURL())
      .setTitle(`Playtime breakdown`)
      .setDescription(
        `for <@${
          interactionUser.id
        }>, since ${user?.updatedAt.getFullYear()}-${user?.updatedAt.getMonth()! + 1}-01`
      );

    embed.addFields(
      {
        name: `**Recently played ${user?.lastPlayedGame}**`,
        value: `for ${convertToReadableTime(user?.lastPlayedTime || 0)}`,
      },
    );

    embed.addFields(
      gameList.map((val) => {
        return {
          name: val.game.name,
          value: convertToReadableTime(val.time),
          inline: true,
        };
      })
    );

    await interaction.reply({
      embeds: [
        embed,
        new EmbedBuilder()
          .setImage(`attachment://image.png`)
          .setColor("Purple"),
      ],
      files: [file],
    });
  }

  return;
}
