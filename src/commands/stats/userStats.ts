import { ChatInputCommandInteraction, CacheType, EmbedBuilder, DataResolver, AttachmentBuilder, Attachment, time, TimestampStyles } from "discord.js";
import { generateDonut } from "../../charts/userCharts";
import { convertToReadableTime } from "./convertTime";

export async function statsHandler(interaction: ChatInputCommandInteraction<CacheType>) {
  const user = interaction.options
    .getMentionable("user")
    ?.toString()
    .replace(/[<@>]/g, "") || interaction.user.id;

  if (user) {
    await generateDonut(user).then(async ({image, gameList}) => {
      
      const file = new AttachmentBuilder(image, {name: `image.png`});

      const embed = new EmbedBuilder()
        .setColor("Purple")
        .setTitle(`Hours played as of ${time(Math.floor(Date.now() / 1000), TimestampStyles.ShortDateTime)}`)
        .setImage(`attachment://image.png`)

      gameList.forEach((val) => {
        embed.addFields({
          name: val.game.name,
          value: convertToReadableTime(val.time)
        })
      })
      
      await interaction.reply({embeds: [embed], files: [file]})
    }).catch((err) => {
      return interaction.reply(`Could not find <@${user}> in our database.`);
    })
  }
}


