import { Routes, SlashCommandBuilder, SlashCommandMentionableOption, SlashCommandStringOption, SlashCommandSubcommandBuilder } from "discord.js";
import { REST } from "@discordjs/rest"
import { config } from "dotenv";
import path from "path";

const commands = [
    new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Gives you options for viewing statistics in various scenarios.")
        .addMentionableOption((opt) => {
            return opt.setName("user").setDescription("Mention a user.").setRequired(false);
        })
        .addStringOption((opt) => {
            return opt.setName("name").setDescription("Write the name of a game.").setRequired(false);
        })
        /*
        .addSubcommandGroup((group) => {
            return group
                .setName("options")
                .setDescription("Options for different sub commands.")
                .addSubcommand(
                    (subCommand) => {
                        return subCommand
                            .setName("user")
                            .setDescription("Views the statistics of a specific user.")
                            .addMentionableOption((opt) => {
                                return opt.setName("user").setDescription("Mention a user.").setRequired(false);
                            });
                    }
                )
                .addSubcommand(
                    (subCommand) => {
                        return subCommand
                            .setName("game")
                            .setDescription("Views the statistics of a specific game based on ID/name")
                            .addStringOption((opt) => {
                                return opt.setName("name").setDescription("Write the name of a game.").setRequired(true);
                            });
                    }
                );
                
        }),
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
            */
]

config({ path: "./.env" });
const token : string = process.env.TOKEN as string;
const rest = new REST({ version: "10" }).setToken(token);
(async() => {
    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID as string),
            {body: []}
        );

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
    } catch {
        throw Error("Could not delete commands.")
    }
})();