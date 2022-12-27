// Discord bot url https://discord.com/api/oauth2/authorize?client_id=1017643869908774963&permissions=139586750528
// &redirect_uri=http%3A%2F%2Flocalhost%3A3000&scope=bot%20applications.commands
import { PrismaClient } from "@prisma/client";
import { ActivityType, Client, GatewayIntentBits } from "discord.js";
import { config } from "dotenv";
import { setTimeout } from "timers";
import { optIn } from "./commands/optin";
import { optout } from "./commands/optout";
import { gameStats } from "./commands/stats/gameStats";
import { userGameStats } from "./commands/stats/userGameStats";
import { statsHandler } from "./commands/stats/userStats";
import { reset } from "./reset/reset";

config({ path: "../.env" });

const token = process.env.TOKEN;
export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences],
});

export const db = new PrismaClient();
client.login(token);

const botPresence = () => {
  return {
    name: `games on ${client.guilds.cache.size} servers`,
    type: 1,
    url: "https://hayhay.dev/",
  };
};

client.once("ready", () => {
  console.log("Ready!");
  client.user?.setPresence({
    activities: [botPresence()],
  });
});

client.on("guildCreate", () => {
  client.user?.setPresence({
    activities: [botPresence()],
  });
});

client.on("guildDelete", () => {
  client.user?.setPresence({
    activities: [botPresence()],
  });
});

// Command handler
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName;
  const opts = interaction.options;

  // Stats command
  if (
    command === "stats" &&
    opts.getString("game") &&
    opts.getMentionable("user")
  )
    userGameStats(interaction);
  else if (
    command === "stats" &&
    opts.getString("game") &&
    !opts.getString("user")
  )
    gameStats(interaction);
  else if (command === "stats") statsHandler(interaction);

  // Reset history
  if (command === "reset") reset(interaction, opts.getString("game"));

  // Opt in/opt out manager
  if (command === "optout") optout(interaction);
  if (command === "optin") optIn(interaction);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isAutocomplete()) return;

  if (
    interaction.commandName === "stats" ||
    interaction.commandName === "reset"
  ) {
    const focusedValue = interaction.options.getFocused();
    const choices = await db.game.findMany({
      where: { name: { startsWith: focusedValue } },
      take: 25,
    });
    const filtered = choices.filter((choice) =>
      choice.name.startsWith(focusedValue)
    );
    await interaction.respond(
      filtered.map((choice) => ({ name: choice.name, value: choice.name }))
    );
  }
});

const recentUsers: Map<
  string,
  {
    name: string;
    time: number;
    id: string | null;
  }
> = new Map();

client.on("presenceUpdate", async (oldPresence, newPresence) => {
  if (oldPresence?.user?.bot) return;
  const newActivites = newPresence?.activities;
  const userId = newPresence.userId;

  let activity = newActivites?.find(
    (activity) => activity.type === ActivityType.Playing
  );

  const user = await db.user.findFirst({ where: { id: userId } });

  if (user == null) await db.user.create({ data: { id: userId } });

  if (!user?.isOptedIn) return;

  if (!activity) {
    if (recentUsers.has(userId)) {
      const userGame = await db.userGame.findFirst({
        where: { userId, game: { name: recentUsers.get(userId)?.name } },
      });

      if (userGame) {
        await updateUserGame(
          userGame.id,
          userGame.time,
          recentUsers.get(userId)!.time
        );
      } else {
        const game = await db.game.findFirst({
          where: { name: recentUsers.get(userId)?.name },
        });

        if (game) {
          createUserGame(userId, game.id, recentUsers.get(userId)!.time);
        } else {
          const newGame = await createGame(recentUsers.get(userId)!.name);
          await createUserGame(
            userId,
            newGame.id,
            recentUsers.get(userId)!.time
          );
        }
      }
    } else return;

    recentUsers.delete(userId);

    return;
  }

  const currentUser = recentUsers.get(userId);
  if (currentUser) {
    if (
      activity.applicationId === currentUser.id ||
      activity.name === currentUser.name
    ) {
      return;
    } else {
      let game = await db.game.findFirst({ where: { name: currentUser.name } });
      if (!game) {
        game = await createGame(currentUser.name);
      }
      const userGame = await db.userGame.findFirst({
        where: { userId: userId, gameId: game?.id },
      });
      if (userGame) {
        await updateUserGame(userGame.id, userGame.time, currentUser.time);
      } else {
        await createUserGame(userId, game.id, currentUser.time);
      }

      recentUsers.set(userId, {
        name: activity.name,
        time: Date.now(),
        id: activity.applicationId,
      });
    }
  } else {
    recentUsers.set(userId, {
      name: activity.name,
      time: Date.now(),
      id: activity.applicationId,
    });
  }
});

async function createGame(name: string) {
  const game = await db.game.create({ data: { name } });
  return game;
}
async function updateUserGame(
  userGameId: number,
  originalTime: string,
  time: number
) {
  const newTime = (parseInt(originalTime) + Date.now() - time).toString();

  const userGame = await db.userGame.update({
    where: { id: userGameId },
    data: { time: newTime },
    include: { user: true, game: true },
  });

  await db.user.update({
    where: { id: userGame.user.id },
    data: {
      lastPlayedTime: (Date.now() - time).toString(),
      lastPlayedGame: userGame.game.name,
    },
  });
}

async function createUserGame(userId: string, gameId: number, time: number) {
  const newTime = (Date.now() - time).toString();

  const userGame = await db.userGame.create({
    data: {
      userId,
      gameId,
      time: newTime,
    },
    include: { user: true, game: true },
  });

  await db.user.update({
    where: { id: userId },
    data: { lastPlayedGame: userGame.game.name, lastPlayedTime: newTime },
  });
  return userGame;
}
