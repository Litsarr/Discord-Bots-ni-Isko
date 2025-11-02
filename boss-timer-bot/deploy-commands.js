import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const commands = [
  new SlashCommandBuilder()
    .setName("killed")
    .setDescription("Mark a boss as killed and set a respawn timer")
    .addStringOption((option) =>
      option
        .setName("boss")
        .setDescription("Name of the boss")
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option.setName("hours").setDescription("Respawn time in hours")
    )
    .addNumberOption((option) =>
      option.setName("minutes").setDescription("Respawn time in minutes")
    )
    .addNumberOption((option) =>
      option.setName("seconds").setDescription("Respawn time in seconds")
    ),

  new SlashCommandBuilder()
    .setName("timeleft")
    .setDescription("Show remaining timers for all bosses"),

  new SlashCommandBuilder()
    .setName("removetimer")
    .setDescription("Remove a boss timer manually")
    .addStringOption((option) =>
      option
        .setName("boss")
        .setDescription("Name of the boss to remove")
        .setRequired(true)
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("⏳ Refreshing slash commands...");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log("✅ Slash commands registered successfully.");
  } catch (error) {
    console.error(error);
  }
})();
