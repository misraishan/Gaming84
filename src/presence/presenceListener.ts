import { Activity } from "discord.js";
import { client, db } from "..";

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
