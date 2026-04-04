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

/* =========================
   YOUR PANELS (UNCHANGED)
========================= */

const PANELS = { /* KEEP YOUR EXISTING PANELS EXACTLY SAME */ };

// keep your OFFER_LOOKUP logic
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

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with pong"),

  new SlashCommandBuilder()
    .setName("prestige")
    .setDescription("Post the prestige panel"),

  new SlashCommandBuilder()
    .setName("winstreaks")
    .setDescription("Post the winstreaks panel"),

  new SlashCommandBuilder()
    .setName("trophies")
    .setDescription("Post the trophies panel"),

  new SlashCommandBuilder()
    .setName("ranked")
    .setDescription("Post the ranked panel"),

  new SlashCommandBuilder()
    .setName("questions")
    .setDescription("Post the questions panel"),

  // ✅ NEW ORDER SYSTEM (FIXED)
  new SlashCommandBuilder()
    .setName("order")
    .setDescription("Create a custom order embed")
    .addStringOption(option =>
      option.setName("order_type")
        .setDescription("Order type")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("image")
        .setDescription("Image URL")
        .setRequired(true)
    )
    .addChannelOption(option =>
      option.setName("channel")
        .setDescription("Channel button links to")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    )

].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

/* =========================
   PANEL BUILDERS (UNCHANGED)
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

function getPanelByCommand(commandName) {
  return PANELS[commandName] || null;
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
        await interaction.reply("pong");
        return;
      }

      // ✅ ORDER COMMAND → SHOW MODAL
      if (interaction.commandName === "order") {

        const orderType = interaction.options.getString("order_type");
        const image = interaction.options.getString("image");
        const channel = interaction.options.getChannel("channel");

        const modal = new ModalBuilder()
          .setCustomId(`order_${channel.id}_${encodeURIComponent(orderType)}_${encodeURIComponent(image)}`)
          .setTitle("Create Order");

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("buyer")
              .setLabel("Buyer")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("amount")
              .setLabel("Amount (€)")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("details")
              .setLabel("Order Details")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("button_text")
              .setLabel("Button Text")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );

        await interaction.showModal(modal);
        return;
      }

      const panel = getPanelByCommand(interaction.commandName);
      if (panel) {
        await interaction.reply(buildPanel(panel));
        return;
      }
    }

    /* ===== MODALS ===== */
    if (interaction.isModalSubmit()) {

      // ✅ ORDER MODAL SUBMIT
      if (interaction.customId.startsWith("order_")) {

        const parts = interaction.customId.split("_");

        const channelId = parts[1];
        const orderType = decodeURIComponent(parts[2]);
        const imageUrl = decodeURIComponent(parts[3]);

        const channel = interaction.guild.channels.cache.get(channelId);

        if (!channel) {
          await interaction.reply({
            content: "Invalid channel.",
            ephemeral: true
          });
          return;
        }

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
            { name: "Order Type 🚀", value: `↳ \`${orderType}\`` },
            { name: "Order Details ℹ️", value: `↳ \`${details}\`` }
          )
          .setImage(imageUrl)
          .setFooter({
            text: `Powered by ${interaction.guild.name}`
          });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel(`👉 ${buttonText}`)
            .setStyle(ButtonStyle.Link)
            .setURL(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`)
        );

        await channel.send({
          embeds: [embed],
          components: [row]
        });

        await interaction.reply({
          content: "✅ Order sent!",
          ephemeral: true
        });

        return;
      }
    }

  } catch (error) {
    console.error("ERROR:", error);

    if (!interaction.replied) {
      await interaction.reply({
        content: "Something went wrong.",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

client.login(TOKEN);
