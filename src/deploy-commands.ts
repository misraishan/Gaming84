import {
  Routes,
  SlashCommandBuilder
} from "discord.js";
import { REST } from "@discordjs/rest";
import { config } from "dotenv";

const commands = [
  new SlashCommandBuilder()
    .setName("stats")
    .setDescription(
      "Gives you options for viewing statistics in various scenarios.")
    .addMentionableOption((opt) => {
      return opt
        .setName("user")
        .setDescription("Mention a user.")
        .setRequired(false);
    })
    .addStringOption((opt) => {
      return opt
        .setName("game")
        .setDescription("Write the name of a game.")
        .setRequired(false)
        .setAutocomplete(true);
    }),
  new SlashCommandBuilder()
    .setName("optout")
    .setDescription("Gives users the option to opt out of bot tracking."),
  new SlashCommandBuilder()
    .setName("optin")
    .setDescription(
      "Gives users the ability to opt in if previously opted out."),
  new SlashCommandBuilder()
    .setName("reset")
    .setDescription("Allows you to reset your entire game history.")
    .addStringOption((opt) => {
      return opt
        .setName("game")
        .setDescription("Reset history of a specific game.")
        .setRequired(false)
        .setAutocomplete(true);
    }),
      
];

config({ path: "./.env" });
const token: string = process.env.TOKEN as string;
const rest = new REST({ version: "10" }).setToken(token);
(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID as string),
      { body: [] }
    );

    try {
      console.log("Started refreshing application (/) commands.");
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID as string),
        { body: commands }
      );
      console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
      console.error(error);
    }
  } catch {
    throw Error("Could not delete commands.");
  }
})();
