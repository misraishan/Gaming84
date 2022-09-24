// Discord bot url https://discord.com/api/oauth2/authorize?client_id=1017643869908774963&permissions=139586750528
// &redirect_uri=http%3A%2F%2Flocalhost%3A3000&scope=bot%20applications.commands
import { PrismaClient } from "@prisma/client";
import { Activity, Client, GatewayIntentBits, Presence } from "discord.js";
import { config } from "dotenv";
import { setTimeout } from "timers";
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
client.login(token);

const botPresence = () => {return {name: `games on ${client.guilds.cache.size} servers`, type: 1, url: "https://hayhay.dev/"}};

client.once("ready", () => {
  console.log("Ready!");
  client.user?.setPresence({
    activities: [botPresence()]
  });
});

client.on("guildCreate", () => {
  client.user?.setPresence({
    activities: [botPresence()]
  });
});

client.on("guildDelete", () => {
  client.user?.setPresence({
    activities: [botPresence()]
  });
});

// Command handler
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName;
  const opts = interaction.options;

  // Ping command
  if (command === "ping") {
    await interaction.reply("Pong!");
  }

  // Stats command
  if (
    command === "stats" &&
    opts.getString("game") &&
    opts.getMentionable("user")
  )
    userGameStats(interaction);
  else if (command === "stats" && opts.getString("game") && !opts.getString("user"))
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
		const choices = await db.game.findMany({where: {name: {startsWith: focusedValue}}, take: 25});
		const filtered = choices.filter(choice => choice.name.startsWith(focusedValue));
		await interaction.respond(
			filtered.map(choice => ({ name: choice.name, value: choice.name })),
		);
	}
});

const recentUsers : Set<string> = new Set();
// Presence listener, can't be in seperate file just bc??? :(
client.on("presenceUpdate", async (oldPresence, newPresence) => {
  if (oldPresence?.user?.bot) return;
  const newActivites = newPresence?.activities;
  const activities = oldPresence?.activities;

  if (!activities) return;

  const user = await db.user.findFirst({ where: { id: oldPresence.userId } });
  if (user != null && !user?.isOptedIn) return;

  for (const activity of activities) {
    if (activity.type === 0) {
      if (recentUsers.has(newPresence.userId)) return;
      recentUsers.add(newPresence.userId)
      setTimeout(() => {
        recentUsers.delete(newPresence.userId);
      }, 5000)

      let game = await db.game.findFirst({ where: { name: activity.name } });
      if (!game) {
        game = await db.game.create({
          data: {
            name: activity.name,
          },
        });
      }

      let user = await db.user.findFirst({where: {id: oldPresence.userId}})
      if (!user) {
        user = await db.user.create({data: {id: oldPresence.userId}})
      }

      const userGame = await db.userGame.findFirst({
        where: {
          userId: oldPresence.userId,
          AND: {
            gameId: game?.id,
          },
        },
      });

      const time = getTime(userGame?.time, activity);

      await db.userGame.upsert({
        where: {
          id: userGame?.id || -1,
        },
        create: {
          gameId: game.id,
          time: time,
          userId: user?.id,
        },
        update: {
          time: time,
        },
      });

      await db.user.update({
        where: {
          id: user.id
        },
        data: {
          lastPlayedGame: game.name,
          lastPlayedTime: getLastPlayedTime(activity.createdTimestamp),
        }
      });
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
