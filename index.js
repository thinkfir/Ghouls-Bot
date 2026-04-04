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

let tempData = {};

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

        tempData[interaction.user.id] = {
          channelId: interaction.options.getChannel("channel").id,
          image: interaction.options.getString("image"),
          type: interaction.options.getString("order_type")
        };

        const modal = new ModalBuilder()
          .setCustomId("order_modal")
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
      if (interaction.customId === "order_modal") {

        const data = tempData[interaction.user.id];

        if (!data) {
          return await interaction.reply({
            content: "❌ Session expired. Try again.",
            ephemeral: true
          });
        }

        const channel = interaction.guild.channels.cache.get(data.channelId);

        if (!channel) {
          return await interaction.reply({
            content: "❌ Cannot access that channel.",
            ephemeral: true
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
            { name: "Order Type 🚀", value: `↳ \`${data.type}\`` },
            { name: "Order Details ℹ️", value: `↳ \`${details}\`` }
          )
          .setImage(data.image)
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

        delete tempData[interaction.user.id];

        await interaction.reply({
          content: "✅ Order sent!",
          ephemeral: true
        });
      }
    }

  } catch (err) {
    console.error(err);

    if (!interaction.replied) {
      await interaction.reply({
        content: "Something went wrong.",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

client.login(TOKEN);
