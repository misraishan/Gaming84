// Discord bot url https://discord.com/api/oauth2/authorize?client_id=1017643869908774963&permissions=139586750528
// &redirect_uri=http%3A%2F%2Flocalhost%3A3000&scope=bot%20applications.commands
import { PrismaClient } from "@prisma/client";
import { Activity, Client, GatewayIntentBits } from "discord.js";
import { config } from "dotenv";
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
});

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
    interaction.options.getString("name") &&
    interaction.options.getMentionable("user")
  )
    userGameStats(interaction);
  else if (command === "stats" && interaction.options.getString("name"))
    gameStats(interaction);
  else if (command === "stats") statsHandler(interaction);

  // Opt in/opt out manager
  if (command === "optout") optout(interaction);
  if (command === "optin") optIn(interaction);
});

// Presence listener, can't be in seperate file just bc??? :(
client.on("presenceUpdate", async (oldPresence, newPresence) => {
  if (oldPresence?.user?.bot) return;
  if (newPresence == null) return;
  const newActivites = newPresence?.activities;
  const activities = oldPresence?.activities;

  if (!activities) return;

  const user = await db.user.findFirst({ where: { id: oldPresence.userId } });
  if (!user?.isOptedIn) return;

  for (const activity of activities) {
    if (activity.type === 0) {
      if (newActivites.includes(activity)) continue;

      let game;

      if (activity.applicationId != null) {
        game = await db.game.findFirst({
          where: { appId: activity.applicationId },
        });
        if (!game) {
          game = await db.game.create({
            data: {
              name: activity.name,
              appId: activity.applicationId,
            },
          });
        }
      } else {
        // TODO: Migrate game if another of the same name has an id.
        game = await db.game.findFirst({ where: { name: activity.name } });
        if (!game) {
          game = await db.game.create({
            data: {
              name: activity.name,
            },
          });
        }
      }

      if (!game) return;

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
          id: userGame?.id || -1,
        },
        create: {
          gameId: game.id,
          time: time,
          userId: newPresence.userId,
        },
        update: {
          time: time,
        },
      });
    }
  }
});

function getTime(oldTime: string | undefined | number, activity: Activity) {
  if (activity.createdTimestamp) {
    if (oldTime == undefined) {
      oldTime = 0;
    } else {
      oldTime = parseInt(oldTime as string);
    }
    return (oldTime + (Date.now() - activity.createdAt.getTime())).toString();
  }
}
