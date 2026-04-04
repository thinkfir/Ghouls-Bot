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
    .setDescription("Create order")
    .addChannelOption(option =>
      option.setName("channel")
        .setDescription("Where to send")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("image")
        .setDescription("Image URL")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("order_type")
        .setDescription("Order type")
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
  try {

    // STEP 1 → COMMAND
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "order") {

        const channelId = interaction.options.getChannel("channel").id;
        const image = interaction.options.getString("image");
        const type = interaction.options.getString("order_type");

        // 👇 embed ALL data safely into modal ID
        const modal = new ModalBuilder()
          .setCustomId(`order_${channelId}_${encodeURIComponent(image)}_${encodeURIComponent(type)}`)
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
      }
    }

    // STEP 2 → MODAL SUBMIT
    if (interaction.isModalSubmit()) {

      if (interaction.customId.startsWith("order_")) {

        const parts = interaction.customId.split("_");

        const channelId = parts[1];
        const image = decodeURIComponent(parts[2]);
        const type = decodeURIComponent(parts[3]);

        const channel = interaction.guild.channels.cache.get(channelId);

        if (!channel) {
          return await interaction.reply({
            content: "❌ Invalid channel.",
            flags: 64
          });
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
            { name: "Order Type 🚀", value: `↳ \`${type}\`` },
            { name: "Order Details ℹ️", value: `↳ \`${details}\`` }
          )
          .setImage(image)
          .setFooter({ text: `Powered by ${interaction.guild.name}` });

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
          flags: 64
        });
      }
    }

  } catch (err) {
    console.error("ERROR:", err);

    if (!interaction.replied) {
      await interaction.reply({
        content: "Something went wrong.",
        flags: 64
      }).catch(() => {});
    }
  }
});

client.login(TOKEN);
