// Discord bot url https://discord.com/api/oauth2/authorize?client_id=1017643869908774963&permissions=139586750528&redirect_uri=http%3A%2F%2Flocalhost%3A3000&scope=bot%20applications.commands
import { PrismaClient } from "@prisma/client";
import { Activity, ApplicationCommandOptionType, Client, GatewayIntentBits, time } from "discord.js";
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
    if (interaction.commandName === "ping") {
        await interaction.reply("Pong!");
    }
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
});

client.on("presenceUpdate", async (oldPresence, newPresence) => {
    if (newPresence == null) return;
    const newActivites = newPresence?.activities;
    const activities = oldPresence?.activities;

    if (!activities) return;

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
