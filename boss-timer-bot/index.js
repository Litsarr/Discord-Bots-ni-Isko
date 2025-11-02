import { Client, GatewayIntentBits, Events } from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import express from "express"; // <-- import express for uptime

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const TIMERS_FILE = "./timers.json";

let timers = new Map();
if (fs.existsSync(TIMERS_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(TIMERS_FILE, "utf8"));
    timers = new Map(Object.entries(data));
    console.log(`💾 Loaded ${timers.size} timers from file.`);
  } catch (err) {
    console.error("⚠️ Failed to load timers:", err);
  }
}

function saveTimers() {
  const obj = Object.fromEntries(timers);
  fs.writeFileSync(TIMERS_FILE, JSON.stringify(obj, null, 2));
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const now = Date.now();

  // ----------------- /killed -----------------
  if (interaction.commandName === "killed") {
    const boss = interaction.options.getString("boss");
    const hours = interaction.options.getNumber("hours") || 0;
    const minutes = interaction.options.getNumber("minutes") || 0;
    const seconds = interaction.options.getNumber("seconds") || 0;

    const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
    const respawnTime = now + totalMs;

    timers.set(boss, {
      respawnTime,
      userId: interaction.user.id,
      channelId: interaction.channelId,
    });
    saveTimers();

    const timeString = [
      hours ? `${hours}h` : "",
      minutes ? `${minutes}m` : "",
      seconds ? `${seconds}s` : "",
    ]
      .filter(Boolean)
      .join(" ");

    await interaction.reply(
      `🪓 **${boss}** killed! Respawning in ${timeString || "0s"}.`
    );
  }

  // ----------------- /timeleft -----------------
  if (interaction.commandName === "timeleft") {
    if (timers.size === 0) {
      await interaction.reply("✅ No active boss timers.");
      return;
    }

    // Remove expired timers immediately
    for (const [boss, data] of timers.entries()) {
      if (data.respawnTime <= now) {
        timers.delete(boss);
      }
    }
    saveTimers();

    // Prepare sorted timers
    const sortedTimers = Array.from(timers.entries())
      .map(([boss, data]) => {
        const remainingMs = data.respawnTime - now;
        return { boss, remainingMs };
      })
      .filter((timer) => timer.remainingMs > 0)
      .sort((a, b) => a.remainingMs - b.remainingMs);

    if (sortedTimers.length === 0) {
      await interaction.reply("✅ No active boss timers.");
      return;
    }

    // Compute max boss name length for padding
    const maxBossLength = Math.max(...sortedTimers.map((t) => t.boss.length));

    // Build table-like string
    let reply = "⏳ **Active Boss Timers:**\n";
    reply += "```"; // code block for monospaced text
    for (const timer of sortedTimers) {
      const hours = Math.floor(timer.remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor(
        (timer.remainingMs % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((timer.remainingMs % (1000 * 60)) / 1000);

      const timeString = [
        hours ? `${hours}h` : "0h",
        minutes ? `${minutes}m` : "0m",
        seconds ? `${seconds}s` : "0s",
      ].join(" ");

      const paddedBoss = timer.boss.padEnd(maxBossLength, " ");
      reply += `${paddedBoss}  ->  ${timeString}\n`;
    }
    reply += "```";

    await interaction.reply(reply);
  }

  // ----------------- /removetimer -----------------
  if (interaction.commandName === "removetimer") {
    const boss = interaction.options.getString("boss");
    if (!timers.has(boss)) {
      await interaction.reply(`⚠️ **${boss}** timer does not exist.`);
      return;
    }

    timers.delete(boss);
    saveTimers();
    await interaction.reply(`🗑️ **${boss}** timer has been removed.`);
  }
});

// ----------------- Respawn Checker -----------------
setInterval(() => {
  const now = Date.now();
  for (const [boss, data] of timers.entries()) {
    if (now >= data.respawnTime) {
      const channel = client.channels.cache.get(data.channelId);
      if (channel)
        channel.send(`<@${data.userId}> ⚔️ **${boss}** has respawned!`);
      timers.delete(boss);
      saveTimers();
    }
  }
}, 10 * 1000);

client.login(process.env.DISCORD_TOKEN);

// ----------------- EXPRESS SERVER FOR UPTIMEROBOT -----------------
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("🤖 Boss timer bot is alive!"));

app.listen(PORT, () =>
  console.log(`🌐 Web server running on port ${PORT} for uptime pings.`)
);
