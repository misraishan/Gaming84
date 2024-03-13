import {
  ChatInputCommandInteraction,
  CacheType,
  EmbedBuilder,
  AttachmentBuilder,
} from "discord.js";
import { client, db } from "../../../index";
import { generateYearlyDonut } from "./yearDonut";
import { convertToReadableTime } from "../convertTime";

export async function yearlyRecapHandler(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  const userId = interaction.user.id;
  const year =
    interaction.options.getInteger("year") || new Date().getFullYear();

  if (year < 2021 || year > new Date().getFullYear()) {
    await interaction.reply(`Invalid year.`);
    return;
  }

  if (userId) {
    await interaction.deferReply();
    const { image, gameList, error, totalGameTime, uniqueGameCount } =
      await generateYearlyDonut(userId, `${year}`).catch(async (err) => {
        await interaction.editReply(
          `Could not find <@${userId}> in our database.`
        );
        return {
          image: null,
          gameList: null,
          error: err,
          totalGameTime: 0,
          uniqueGameCount: 0,
        };
      });
    if (error != null || image == null) return;

    const file = new AttachmentBuilder(image, { name: `image.png` });

    const interactionUser = await client.users.fetch(userId);
    const user = await db.user.findFirst({ where: { id: interactionUser.id } });
    if (!user) {
      await interaction.editReply(
        `Could not find <@${userId}> in our database.`
      );
    }

    const embed = new EmbedBuilder()
      .setColor("Purple")
      .setThumbnail(interactionUser.displayAvatarURL())
      .setTitle(`Playtime breakdown for ${year}`)
      .setDescription(
        `for <@${interactionUser.id}>, since ${user?.updatedAt.getFullYear()}-${
          user?.updatedAt.getMonth()! + 1
        }-01`
      );

    embed.addFields({
      name: `**Total time in game across ${uniqueGameCount} games**`,
      value: `${convertToReadableTime(totalGameTime)}`,
    });

    embed.addFields(
      gameList.map((val: any) => {
        return {
          name: val.game.name,
          value: convertToReadableTime(val.time),
          inline: true,
        };
      })
    );

    embed.setFooter({
      text: `Thanks for using Gaming84! 💜`,
      iconURL: client.user?.displayAvatarURL(),
    });

    await interaction.editReply({
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
