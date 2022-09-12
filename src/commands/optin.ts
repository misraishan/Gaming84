import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CacheType, ChatInputCommandInteraction, ComponentType } from "discord.js";
import { db } from "..";

export async function optIn(interaction: ChatInputCommandInteraction<CacheType>) {
    const user = await db.user.findFirst({where: {id: interaction.user.id}});

        if (user?.isOptedIn) {
            await interaction.reply({ephemeral: true, content: "Already opted in! Try getting some stats instead 😄"})
            return;
        }

        const btns = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder().setCustomId("optin").setLabel("Opt in").setStyle(ButtonStyle.Success)
            )
            .addComponents(new ButtonBuilder().setCustomId("cancel").setLabel("Cancel").setStyle(ButtonStyle.Danger));

        await interaction.reply({ephemeral: true, content: "Ready to opt back in?", components: [btns]}).then(async (msg) => {
            const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15000 });

            collector.on("collect", async i => {
                if (i.component.label === "Opt in") {
                    await db.user.upsert({
                        where: {id: i.user.id},
                        create: {
                            id: i.user.id,
                            isOptedIn: true,
                        },
                        update: {isOptedIn: true}
                    });
                    await i.reply({ephemeral: true, components: [], content: "You've successfully opted in! Welcome back 😄"})
                } else {
                    await i.reply({ephemeral: true, components: [], content: "Nothing changed! Still opted out 🙂"});
                }  
            });
        }
    )
}

