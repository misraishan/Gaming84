// Discord bot url https://discord.com/api/oauth2/authorize?client_id=1017643869908774963&permissions=139586750528&redirect_uri=http%3A%2F%2Flocalhost%3A3000&scope=bot%20applications.commands
import { PrismaClient } from "@prisma/client";
import { Client, GatewayIntentBits } from "discord.js";
import { config } from "dotenv";
import { optIn } from "./commands/optin";
import { optout } from "./commands/optout";
import { statsHandler } from "./commands/stats";

config({ path: "../.env" });

const token = process.env.TOKEN;
export const client = new Client({intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences
]});

export const db = new PrismaClient();

client.once("ready", () => {
    console.log("Ready!");
});

client.login(token);

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.commandName;

    // Ping command
    if (command === "ping") {
        await interaction.reply("Pong!");
    }

    // Stats command 
    if (command === "stats") statsHandler(interaction);

    // Opt in/opt out manager
    if (command === "optout") optout(interaction);
    if (command === "optin") optIn(interaction);
})
