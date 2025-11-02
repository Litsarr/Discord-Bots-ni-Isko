import { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const timers = new Map(); // store boss timers

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Logged in as ${readyClient.user.tag}`);
});

// Handle commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'killed') {
    const boss = interaction.options.getString('boss');
    const hours = interaction.options.getNumber('hours');

    const now = Date.now();
    const respawnTime = now + hours * 60 * 60 * 1000;

    timers.set(boss, { respawnTime, userId: interaction.user.id, channelId: interaction.channelId });

    await interaction.reply(`🪓 **${boss}** killed! Respawning in ${hours} hours — I’ll ping you when it’s back.`);
  }
});

// Check for respawns every minute
setInterval(() => {
  const now = Date.now();
  for (const [boss, data] of timers.entries()) {
    if (now >= data.respawnTime) {
      const channel = client.channels.cache.get(data.channelId);
      if (channel) channel.send(`<@${data.userId}> ⚔️ **${boss}** has respawned!`);
      timers.delete(boss);
    }
  }
}, 60 * 1000);

client.login(process.env.DISCORD_TOKEN);
