import { Routes, SlashCommandBuilder } from "discord.js";
import { REST } from "@discordjs/rest"
import { config } from "dotenv";
import path from "path";

const commands = [
    new SlashCommandBuilder()
        .setName("activity")
        .setDescription("Shows your game activity since the 1st of the month."),
    new SlashCommandBuilder()
        .setName("serveractivity")
        .setDescription("Shows the activity of the server since the 1st of the month."),
    new SlashCommandBuilder()
        .setName("gameactivity")
        .setDescription("Shows monthly activity for a specific game.")
        .addStringOption(option => option
            .setName("game")
            .setDescription("The game to show activity for.")
            .setRequired(true)),
]

config({ path: "./.env" });
const token : string = process.env.TOKEN as string;
const rest = new REST({ version: "10" }).setToken(token);
(async() => {
    try {
        console.log("Started refreshing application (/) commands.");
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID as string),
            { body: commands },
        );
        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }
})();