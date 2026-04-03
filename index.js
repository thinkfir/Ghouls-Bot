require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

const commands = [
  new SlashCommandBuilder()
    .setName("order")
    .setDescription("Create an order embed")
    .addChannelOption(option =>
      option.setName("channel")
        .setDescription("Where to send the order")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log("Commands registered");
});

client.on("interactionCreate", async interaction => {

  // STEP 1 → command triggers modal (hidden)
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "order") {

      const modal = new ModalBuilder()
        .setCustomId(`order_modal_${interaction.options.getChannel("channel").id}`)
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
            .setCustomId("type")
            .setLabel("Order Type")
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
            .setCustomId("image")
            .setLabel("Image URL")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      await interaction.showModal(modal);
    }
  }

  // STEP 2 → modal submit → send public embed
  if (interaction.isModalSubmit()) {

    if (interaction.customId.startsWith("order_modal_")) {

      const channelId = interaction.customId.split("_")[2];
      const channel = interaction.guild.channels.cache.get(channelId);

      const buyer = interaction.fields.getTextInputValue("buyer");
      const amount = interaction.fields.getTextInputValue("amount");
      const type = interaction.fields.getTextInputValue("type");
      const details = interaction.fields.getTextInputValue("details");
      const image = interaction.fields.getTextInputValue("image");

      const embed = new EmbedBuilder()
        .setColor(0x8b2cff)
        .setAuthor({ name: "RANKED ORDER 🚀" })
        .addFields(
          { name: "Buyer 🧑‍💻", value: `↳ \`${buyer}\`` },
          { name: "Order Amount (€) 💶", value: `↳ \`€${amount}\`` },
          { name: "Order Type 🚀", value: `↳ \`${type}\`` },
          { name: ":info: Order Details", value: `↳ \`${details}\`` }
        )
        .setImage(image)
        .setFooter({ text: `Powered by ${interaction.guild.name}` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("👉 Open Ticket")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`)
      );

      await channel.send({
        embeds: [embed],
        components: [row]
      });

      // reply ONLY to user (hidden)
      await interaction.reply({
        content: "✅ Order sent!",
        ephemeral: true
      });
    }
  }
});

client.login(TOKEN);
