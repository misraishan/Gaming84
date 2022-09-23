// Discord bot url https://discord.com/api/oauth2/authorize?client_id=1017643869908774963&permissions=139586750528
// &redirect_uri=http%3A%2F%2Flocalhost%3A3000&scope=bot%20applications.commands
import { PrismaClient } from "@prisma/client";
import { Activity, Client, GatewayIntentBits, Presence } from "discord.js";
import { config } from "dotenv";
import { setTimeout } from "timers/promises";
import { optIn } from "./commands/optin";
import { optout } from "./commands/optout";
import { gameStats } from "./commands/stats/gameStats";
import { userGameStats } from "./commands/stats/userGameStats";
import { statsHandler } from "./commands/stats/userStats";

config({ path: "../.env" });

const token = process.env.TOKEN;
export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences],
});

export const db = new PrismaClient();

client.once("ready", () => {
  console.log("Ready!");
  client.user?.setPresence({
    activities: [{name: `Tracking ${client.guilds.cache.size} servers`, type: 0, url: "https://hayhay.dev/"}]
  })
});

client.on("guildCreate", () => {
  client.user?.setPresence({
    activities: [{name: `Tracking ${client.guilds.cache.size} servers`, type: 0, url: "https://hayhay.dev/"}]
  })
})

client.on("guildDelete", () => {
  client.user?.setPresence({
    activities: [{name: `Tracking ${client.guilds.cache.size} servers`, type: 0, url: "https://hayhay.dev/"}]
  })
})

client.login(token);

// Command handler
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName;

  // Ping command
  if (command === "ping") {
    await interaction.reply("Pong!");
  }

  // Stats command
  if (
    command === "stats" &&
    interaction.options.getString("game") &&
    interaction.options.getMentionable("user")
  )
    userGameStats(interaction);
  else if (command === "stats" && interaction.options.getString("game"))
    gameStats(interaction);
  else if (command === "stats") statsHandler(interaction);

  // Opt in/opt out manager
  if (command === "optout") optout(interaction);
  if (command === "optin") optIn(interaction);
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isAutocomplete()) return;

	if (interaction.commandName === 'stats') {
		const focusedValue = interaction.options.getFocused();
		const choices = await db.game.findMany({take: 25});
		const filtered = choices.filter(choice => choice.name.startsWith(focusedValue));
		await interaction.respond(
			filtered.map(choice => ({ name: choice.name, value: choice.name })),
		);
	}
});

const recentUsers : string[] = [];
// Presence listener, can't be in seperate file just bc??? :(
client.on("presenceUpdate", async (oldPresence, newPresence) => {
  if (oldPresence?.user?.bot) return;
  if (newPresence == null) return;
  const newActivites = newPresence?.activities;
  const activities = oldPresence?.activities;

  if (!activities) return;

  const user = await db.user.findFirst({ where: { id: oldPresence.userId } });
  if (user != null && !user?.isOptedIn) return;
  const activityList : string[] = [];

  for (const activity of activities) {
    if (activity.type === 0) {
      let isPresent: Boolean = false;
      for (const newAct of newActivites) {
        if (newAct.equals(activity)) {
          isPresent = true;
          return;
        }
      }

      if (isPresent) continue;

      if (activityList.includes(activity.name)) continue;
      else activityList.push(activity.name);

      if (recentUsers.includes(newPresence.userId)) return;
      recentUsers.push(newPresence.userId)
      setTimeout(5000, () => {
        recentUsers.splice(0,1);
      })

      let game = await db.game.findFirst({ where: { name: activity.name } });
      if (!game) {
        game = await db.game.create({
          data: {
            name: activity.name,
          },
        });
      }

      await db.user.upsert({
        where: {
          id: newPresence.userId,
        },
        create: {
          id: newPresence.userId,
        },
        update: {},
      });

      const userGame = await db.userGame.findFirst({
        where: {
          userId: newPresence.userId,
          AND: {
            gameId: game?.id,
          },
        },
      });

      const time = getTime(userGame?.time, activity);

      await db.userGame.upsert({
        where: {
          id: userGame?.id,
        },
        include: {user: true},
        create: {
          gameId: game.id,
          time: time,
          userId: newPresence.userId,
        },
        update: {
          time: time,
          user: {
            update: {
              lastPlayedGame: game.name,
              lastPlayedTime: getLastPlayedTime(activity.createdTimestamp),
            }
          }
        },
      })
    }
  }
});

function getLastPlayedTime(startTime : number) {
  return (Date.now() - startTime).toString()
}

function getTime(oldTime: string | undefined | number, activity: Activity) {
  if (activity.createdTimestamp) {
    if (oldTime == undefined) {
      oldTime = 0;
    } else {
      oldTime = parseInt(oldTime as string);
    }
    return (oldTime + (Date.now() - activity.createdTimestamp)).toString();
  }
}
