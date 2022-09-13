import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CacheType, ChatInputCommandInteraction, ComponentType } from "discord.js";
import { db } from "..";

export async function optout(interaction: ChatInputCommandInteraction<CacheType>) {
    const user = await db.user.findFirst({where: {id: interaction.user.id}})

    if (user == null) {
        await db.user.create({
            data: {
                id: interaction.user.id,
                isOptedIn: false,
            }
        });

        await interaction.reply({ephemeral: true, content: "You've successfully opted out!"})

    }
    if (!user?.isOptedIn) {
        await interaction.reply({ephemeral: true, content: "Already opted out! Consider opting back in with `/optin`?"})
        return;
    }
    const btns = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder().setCustomId("optout").setLabel("Opt out").setStyle(ButtonStyle.Danger)
        )
        .addComponents(new ButtonBuilder().setCustomId("cancel").setLabel("Cancel").setStyle(ButtonStyle.Success))
    await interaction.reply({
        content: "We only store the games you play and the time spent on it, no other data (such as statuses, streaming, music, etc) is stores." 
        + "\n\nStill want to continue (all data will be erased)?",
        components: [btns],
        ephemeral: true,
    }).then(async (msg : any) => {

        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15000 })

        collector.on("collect", async (i : any)=> {
            if (i.component.label === "Opt out") {
                await db.user.upsert({
                    where: {id: i.user.id,},
                    create: {
                        id: i.user.id,
                        isOptedIn: false,
                    },
                    update: {
                        isOptedIn: false,
                        UserGame: {
                            deleteMany: {
                                userId: i.user.id
                            }
                        }
                    }
                });
                await i.reply({ephemeral: true, components: [], content: "You've successfully opted out & deleted previous data!"})
            } else {
                await db.user.upsert({
                    where: {id: i.user.id},
                    create: {id: i.user.id},
                    update: {isOptedIn: true}
                });
                await i.reply({ephemeral: true, components: [], content: "Thanks for sticking with us!"})
            }
        })
    })
}