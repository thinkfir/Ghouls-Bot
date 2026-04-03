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

const commands = [
  new SlashCommandBuilder()
    .setName("order")
    .setDescription("Create a custom order embed")
    .addStringOption(o => o.setName("buyer").setDescription("Buyer").setRequired(true))
    .addStringOption(o => o.setName("amount").setDescription("Amount").setRequired(true))
    .addStringOption(o => o.setName("order_type").setDescription("Order Type").setRequired(true))
    .addStringOption(o => o.setName("order_details").setDescription("Details").setRequired(true))
    .addStringOption(o => o.setName("image_url").setDescription("Image URL").setRequired(true))
    .addChannelOption(o =>
      o.setName("channel")
        .setDescription("Channel to link")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption(o => o.setName("button_text").setDescription("Button text").setRequired(true))
].map(c => c.toJSON());

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
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "order") {
    const buyer = interaction.options.getString("buyer");
    const amount = interaction.options.getString("amount");
    const orderType = interaction.options.getString("order_type");
    const orderDetails = interaction.options.getString("order_details");
    const imageUrl = interaction.options.getString("image_url");
    const channel = interaction.options.getChannel("channel");
    const buttonText = interaction.options.getString("button_text");

    const channelUrl = `https://discord.com/channels/${interaction.guild.id}/${channel.id}`;

    const embed = new EmbedBuilder()
      .setColor(0x8b2cff)
      .setAuthor({ name: "RANKED ORDER 🚀" })
      .addFields(
        {
          name: "Buyer 🧑‍💻",
          value: `↳ \`${buyer}\``
        },
        {
          name: "Order Amount (€) 💶",
          value: `↳ \`€${amount}\``
        },
        {
          name: "Order Type 🚀",
          value: `↳ \`${orderType}\``
        },
        {
          name: "<:information_Orange:1349967200093601884> Order Details",
          value: `↳ \`${orderDetails}\``
        }
      )
      .setImage(imageUrl)
      .setFooter({
        text: `Powered by ${interaction.guild.name}`
      });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel(`👉 ${buttonText}`)
        .setStyle(ButtonStyle.Link)
        .setURL(channelUrl)
    );

    // 👇 THIS is the key change
    await interaction.deferReply();
    await interaction.editReply({
      embeds: [embed],
      components: [row]
    });
  }
});

client.login(TOKEN);
