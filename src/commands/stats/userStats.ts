import {
  ChatInputCommandInteraction,
  CacheType,
  EmbedBuilder,
  AttachmentBuilder,
  time,
  TimestampStyles,
  User,
  CommandInteractionOptionResolver,
} from "discord.js";
import { client } from "../..";
import { generateDonut } from "../../charts/userCharts";
import { convertToReadableTime } from "./convertTime";

export async function statsHandler(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  const user =
    interaction.options
      .getMentionable("user")
      ?.toString()
      .replace(/[<@>]/g, "") || interaction.user.id;

  if (user) {
    const { image, gameList, error } = await generateDonut(user).catch(
      async (err) => {
        await interaction.reply(`Could not find <@${user}> in our database.`);
        return { image: null, gameList: null, error: err };
      }
    );
    if (error != null || image == null) return;

    const file = new AttachmentBuilder(image, { name: `image.png` });

    const interactionUser = await client.users.fetch(user);

    const embed = new EmbedBuilder()
      .setColor("Purple")
      .setThumbnail(interactionUser.displayAvatarURL())
      .setTitle(`Playtime breakdown`)
      .setDescription(
        `for <@${interactionUser.id}>, as of ${time(
          Math.floor(Date.now() / 1000),
          TimestampStyles.ShortDateTime
        )}`
      )
      .setImage(`attachment://image.png`);

    gameList.forEach((val, idx) => {
      if (idx === 23) {
        embed.addFields({name: "And more...", value: "Page 2 coming soon."})
        return;
      }
      embed.addFields({
        name: val.game.name,
        value: convertToReadableTime(val.time),
      });
    });

    await interaction.reply({ embeds: [embed], files: [file] });
  }
}
