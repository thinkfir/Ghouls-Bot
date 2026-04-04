require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionsBitField,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const {
  TOKEN,
  CLIENT_ID,
  GUILD_ID,
  STAFF_ROLE_ID,
  TICKET_CATEGORY_ID
} = process.env;

// ✅ FIX CACHE (for modal)
const orderCache = new Map();

/* =========================
   PANELS (UNCHANGED)
========================= */
const PANELS = {
  prestige: { /* KEEP SAME */ },
  winstreaks: { /* KEEP SAME */ },
  trophies: { /* KEEP SAME */ },
  ranked: { /* KEEP SAME */ },
  questions: { /* KEEP SAME */ }
};

/* =========================
   OFFER LOOKUP
========================= */
const OFFER_LOOKUP = {};
for (const panelKey of Object.keys(PANELS)) {
  const panel = PANELS[panelKey];
  if (panel.options) {
    for (const option of panel.options) {
      OFFER_LOOKUP[option.value] = option;
    }
  }
}

/* =========================
   COMMANDS
========================= */
const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Replies with pong"),
  new SlashCommandBuilder().setName("prestige").setDescription("Post the prestige panel"),
  new SlashCommandBuilder().setName("winstreaks").setDescription("Post the winstreaks panel"),
  new SlashCommandBuilder().setName("trophies").setDescription("Post the trophies panel"),
  new SlashCommandBuilder().setName("ranked").setDescription("Post the ranked panel"),
  new SlashCommandBuilder().setName("questions").setDescription("Post the questions panel"),

  // ✅ ORDER COMMAND
  new SlashCommandBuilder()
    .setName("order")
    .setDescription("Create a custom order embed")
    .addStringOption(o =>
      o.setName("order_type").setDescription("Order type").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("image").setDescription("Image URL").setRequired(true)
    )
    .addChannelOption(o =>
      o.setName("channel")
        .setDescription("Channel button links to")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )

].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

/* =========================
   HELPERS (UNCHANGED)
========================= */
function buildPanel(panel) {
  const embed = new EmbedBuilder()
    .setTitle(panel.title)
    .setDescription(panel.description)
    .setColor(0x2b2d31)
    .setFooter({ text: panel.footer });

  if (panel.image) embed.setImage(panel.image);

  const menu = new StringSelectMenuBuilder()
    .setCustomId(panel.customId)
    .setPlaceholder("Choose an offer...")
    .addOptions(
      panel.options.map(option => ({
        label: option.label,
        description: option.description,
        value: option.value
      }))
    );

  return {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(menu)]
  };
}

function getPanelByCommand(name) {
  return PANELS[name] || null;
}

function getPanelByCustomId(id) {
  return Object.values(PANELS).find(p => p.customId === id);
}

function sanitizeName(text) {
  return text.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

function findExistingTicket(guild, userId) {
  return guild.channels.cache.find(
    c => c.parentId === TICKET_CATEGORY_ID && c.topic === `ticket-owner:${userId}`
  );
}

async function createTicket(guild, user, title, details) {
  const existing = findExistingTicket(guild, user.id);
  if (existing) return { exists: true, channel: existing };

  const channel = await guild.channels.create({
    name: `ticket-${sanitizeName(user.username)}`,
    type: ChannelType.GuildText,
    parent: TICKET_CATEGORY_ID
  });

  await channel.send({
    content: `${user} <@&${STAFF_ROLE_ID}>`,
    embeds: [new EmbedBuilder().setDescription(details)]
  });

  return { exists: false, channel };
}

/* =========================
   READY
========================= */
client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log("Commands registered");
});

/* =========================
   INTERACTIONS
========================= */
client.on("interactionCreate", async interaction => {
  try {

    /* ===== COMMANDS ===== */
    if (interaction.isChatInputCommand()) {

      if (interaction.commandName === "ping") {
        return interaction.reply("pong");
      }

      // ✅ ORDER → SHOW MODAL
      if (interaction.commandName === "order") {

        const orderType = interaction.options.getString("order_type");
        const image = interaction.options.getString("image");
        const channel = interaction.options.getChannel("channel");

        orderCache.set(interaction.user.id, {
          orderType,
          image,
          channelId: channel.id
        });

        const modal = new ModalBuilder()
          .setCustomId(`order_${interaction.user.id}`)
          .setTitle("Create Order");

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("buyer").setLabel("Buyer").setStyle(TextInputStyle.Short)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("amount").setLabel("Amount (€)").setStyle(TextInputStyle.Short)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("details").setLabel("Order Details").setStyle(TextInputStyle.Paragraph)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("button_text").setLabel("Button Text").setStyle(TextInputStyle.Short)
          )
        );

        return interaction.showModal(modal);
      }

      const panel = getPanelByCommand(interaction.commandName);
      if (panel) return interaction.reply(buildPanel(panel));
    }

    /* ===== SELECT MENUS (UNCHANGED) ===== */
    if (interaction.isStringSelectMenu()) {
      const selected = interaction.values[0];
      const offer = OFFER_LOOKUP[selected];

      if (!offer) return;

      const result = await createTicket(
        interaction.guild,
        interaction.user,
        offer.orderTitle,
        offer.details
      );

      return interaction.reply({
        content: `Ticket: ${result.channel}`,
        ephemeral: true
      });
    }

    /* ===== MODAL ===== */
    if (interaction.isModalSubmit()) {

      // ✅ ORDER MODAL
      if (interaction.customId.startsWith("order_")) {

        const data = orderCache.get(interaction.user.id);
        if (!data) return interaction.reply({ content: "Expired.", ephemeral: true });

        const channel = interaction.guild.channels.cache.get(data.channelId);

        const buyer = interaction.fields.getTextInputValue("buyer");
        const amount = interaction.fields.getTextInputValue("amount");
        const details = interaction.fields.getTextInputValue("details");
        const buttonText = interaction.fields.getTextInputValue("button_text");

        const embed = new EmbedBuilder()
          .setColor(0x8b2cff)
          .setAuthor({ name: "RANKED ORDER 🚀" })
          .addFields(
            { name: "Buyer 🧑‍💻", value: `↳ \`${buyer}\`` },
            { name: "Order Amount (€) 💶", value: `↳ \`€${amount}\`` },
            { name: "Order Type 🚀", value: `↳ \`${data.orderType}\`` },
            { name: ":info: Order Details", value: `↳ \`${details}\`` }
          )
          .setImage(data.image);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel(`👉 ${buttonText}`)
            .setStyle(ButtonStyle.Link)
            .setURL(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`)
        );

        await channel.send({ embeds: [embed], components: [row] });

        orderCache.delete(interaction.user.id);

        return interaction.reply({ content: "✅ Sent!", ephemeral: true });
      }
    }

  } catch (err) {
    console.error(err);
    if (!interaction.replied) {
      interaction.reply({ content: "Error", ephemeral: true }).catch(() => {});
    }
  }
});

client.login(TOKEN);
