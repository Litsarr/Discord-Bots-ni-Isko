import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const commands = [
  new SlashCommandBuilder()
    .setName("killed")
    .setDescription("Track when a boss was killed")
    .addStringOption((option) =>
      option
        .setName("boss")
        .setDescription("Name of the boss")
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option
        .setName("hours")
        .setDescription("Hours until respawn")
        .setRequired(true)
    )
    .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("⏳ Refreshing slash commands...");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      {
        body: commands,
      }
    );
    console.log("✅ Commands registered successfully.");
  } catch (error) {
    console.error(error);
  }
})();
