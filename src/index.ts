// Discord bot url https://discord.com/api/oauth2/authorize?client_id=1017643869908774963&permissions=139586750528&redirect_uri=http%3A%2F%2Flocalhost%3A3000&scope=bot%20applications.commands
import { PrismaClient } from "@prisma/client";
import { ActionRowBuilder, Activity, ApplicationCommandOptionType, ButtonBuilder, ButtonComponent, ButtonInteraction, ButtonStyle, Client, ComponentType, GatewayIntentBits, time } from "discord.js";
import { config } from "dotenv";
import formatDuration from "format-duration";

config({ path: "../.env" });

const token = process.env.TOKEN;
const client = new Client({intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences
]});

const db = new PrismaClient();

client.once("ready", () => {
    console.log("Ready!");
});

client.login(token);

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Ping command
    if (interaction.commandName === "ping") {
        await interaction.reply("Pong!");
    }

    // Stats command 
    if (interaction.commandName === "stats") {
        const user = interaction.options.getMentionable("user")?.toString().replace(/[<@>]/g, "")
       
        if (user) {
            try {
                const usr = await db.user.findFirstOrThrow({
                    where: {
                        id: user.toString()
                    },
                    include: {
                        UserGame: true,
                    },
                })

                interaction.reply("game id: " + usr.UserGame[0].gameId + " time spent: " + convertToReadableTime(usr.UserGame[0].time))
            } catch (error) {
                interaction.reply(`Could not find <@${user}> in our database.`)
            }
        }
    }

    // Opt in/opt out manager
    if (interaction.commandName === "optout") {
        const user = await db.user.findFirst({where: {id: interaction.user.id}})
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
        }).then(async (msg) => {

            const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15000 })

            collector.on("collect", async i => {
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

    if (interaction.commandName === "optin") {
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
    }
})


client.on("presenceUpdate", async (oldPresence, newPresence) => {
    if (oldPresence?.user?.bot) return;
    if (newPresence == null) return;
    const newActivites = newPresence?.activities;
    const activities = oldPresence?.activities;

    if (!activities) return;

    const user = await db.user.findFirst({where: {id: oldPresence.userId}});
    if (!user?.isOptedIn) return;

    for (const activity of activities) {
        if (activity.type === 0) {

            if (newActivites.includes(activity)) continue;

            let game;

            if (activity.applicationId != null) {
                game = await db.game.findFirst({ where: { appId: activity.applicationId } })
                if (!game) {
                    game = await db.game.create({
                        data: {
                            name: activity.name,
                            appId: activity.applicationId
                        }
                    });
                }

            } else {
                // TODO: Migrate game if another of the same name has an id.
                game = await db.game.findFirst({where: { name: activity.name }})
                if (!game) {
                    game = await db.game.create({
                        data: {
                            name: activity.name,
                        }
                    });
                }
            }

            if (!game) return;

            await db.user.upsert({
                where: {
                    id: newPresence.userId
                },
                create: {
                    id: newPresence.userId,
                },
                update: {}
            })

            const userGame = await db.userGame.findFirst({where: {
                userId: newPresence.userId,
                AND: {
                    gameId: game?.id
                }
            }})

            const time = getTime(userGame?.time, activity);

            await db.userGame.upsert({
                where: {
                    id: userGame?.id || -1
                },
                create: {
                    gameId: game.id,
                    time: time,
                    userId: newPresence.userId,
                },
                update: {
                    time: time
                }
            })
        }
    }
});

function getTime(oldTime : string | undefined | number , activity : Activity) {
    if (activity.createdTimestamp) {
        if (oldTime == undefined) {
            oldTime = 0
        } else {
            oldTime = parseInt(oldTime as string);
        }
        return (oldTime + (Date.now() - activity.createdAt.getTime())).toString()
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
