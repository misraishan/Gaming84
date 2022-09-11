// Discord bot url https://discord.com/api/oauth2/authorize?client_id=1017643869908774963&permissions=139586750528&redirect_uri=http%3A%2F%2Flocalhost%3A3000&scope=bot%20applications.commands
import { Client, GatewayIntentBits } from "discord.js";
import { config } from "dotenv";

config({ path: "../.env" });

const token = process.env.TOKEN;
const client = new Client({intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences
]});

client.once("ready", () => {
    console.log("Ready!");
});

client.login(token);

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === "ping") {
        await interaction.reply("Pong!");
    }
    if (interaction.commandName === "activity") {
        await interaction.reply("Activity!");
    }
});

client.on("presenceUpdate", async (oldPresence, newPresence) => {
    if (oldPresence == null) return;
    const activities = oldPresence?.activities;

    if (!activities) return;

    for (const activity of activities) {
        if (activity.type === 0) {
            if (activity.applicationId != null) {
                //console.log(`${oldPresence?.user?.username} is playing ${activity.name} since ${activity.timestamps?.start} till ${activity.timestamps?.end}`);
            }
        }
    }
});
