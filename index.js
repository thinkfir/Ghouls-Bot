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

const PANELS = {
  prestige: {
    type: "select",
    title: "Prestige",
    description: "Choose the offer that you want below",
    image: "https://media.discordapp.net/attachments/1483334076919316541/1483978475433099431/content.png?ex=69bc8e27&is=69bb3ca7&hm=71db2a9d75beabd60ef20c465f4d3d1c84b6096187394a02d9e68312eb3c17af&=&format=webp&quality=lossless&width=1322&height=881",
    footer: "BS Ghouls © 2025 - All rights reserved.",
    customId: "prestige_menu",
    options: [
      {
        label: "💎 Custom Order",
        description: "Open a custom prestige ticket",
        value: "prestige_custom",
        orderTitle: "Prestige Custom Order",
        details: "• Prestige Custom Order"
      },
      {
        label: "💎 Prestige 1 → 2 - 10€",
        description: "Boost from Prestige 1 to Prestige 2",
        value: "prestige_1_2",
        orderTitle: "Prestige 1-2 Boost",
        details: "• Prestige 1 → 2 Boost: 10€"
      },
      {
        label: "💎 Prestige 2 → 3 - 35€",
        description: "Boost from Prestige 2 to Prestige 3",
        value: "prestige_2_3",
        orderTitle: "Prestige 2-3 Boost",
        details: "• Prestige 2 → 3 Boost: 35€"
      }
    ]
  },

  winstreaks: {
    type: "select",
    title: "Winstreaks",
    description: "Choose the offers that you want below",
    image: "https://cdn.discordapp.com/attachments/1402630936872357921/1402946792517013567/Untitled170_20250807095718.jpg?ex=69bc6ac4&is=69bb1944&hm=50d920ed96f2f0ee9c4fd1fa6a4223a5d746aa49b12f050576f374821801922d",
    footer: "BS Ghouls © 2025 - All rights reserved.",
    customId: "winstreaks_menu",
    options: [
      {
        label: "🔥 25 Winstreak - 10€",
        description: "Get Boosted To 25 Winstreak",
        value: "ws_25",
        orderTitle: "25 Winstreak Boost",
        details: "• 25 Winstreak Boost"
      },
      {
        label: "🔥 50 Winstreak - 22€",
        description: "Get Boosted To 50 Winstreak",
        value: "ws_50",
        orderTitle: "50 Winstreak Boost",
        details: "• 50 Winstreak Boost"
      },
      {
        label: "🔥 69 Winstreak - 32€",
        description: "Get Boosted To 69 Winstreak",
        value: "ws_69",
        orderTitle: "69 Winstreak Boost",
        details: "• 69 Winstreak Boost"
      },
      {
        label: "🔥 100 Winstreak - 45€",
        description: "Get Boosted To 100 Winstreak",
        value: "ws_100",
        orderTitle: "100 Winstreak Boost",
        details: "• 100 Winstreak Boost"
      },
      {
        label: "🔥 200 Winstreak - 90€",
        description: "Get Boosted To 200 Winstreak",
        value: "ws_200",
        orderTitle: "200 Winstreak Boost",
        details: "• 200 Winstreak Boost"
      }
    ]
  },

  trophies: {
    type: "select",
    title: "Boost Your Total Trophies",
    description: "Choose the offer that you want below",
    image: "https://cdn.discordapp.com/attachments/1483334076919316541/1484258307043623022/content.png?ex=69bd92c4&is=69bc4144&hm=167bba1cc124215c5132134a7ae88c7ee0cdef168e8dec7ffb5adb679c07be84&",
    footer: "BS Ghouls © 2025 - All rights reserved.",
    customId: "trophies_menu",
    options: [
      {
        label: "🏆 Custom Order",
        description: "Enter your current and target total trophies",
        value: "trophies_custom",
        modal: true
      }
    ]
  },

  ranked: {
    type: "select",
    title: "Ranked",
    description: "Choose the offers that you want below - (50% off From Menu)",
    image: "https://media.discordapp.net/attachments/1402630936872357921/1402975130640187513/Untitled175_20250807132024.png?ex=69bc8529&is=69bb33a9&hm=7a7c53c1d8528622d4c9f4999078782050d0a6992a6d682b3d1c29dfa64a9fd6&=&format=webp&quality=lossless&width=1566&height=881",
    footer: "BS Ghouls © 2025 - All rights reserved.",
    customId: "ranked_menu",
    options: [
      {
        label: "🚀 Custom Order",
        description: "Tell Us The Ranked Boost You Want",
        value: "ranked_custom",
        modal: true
      },
      {
        label: "🚀 Ranked Over Masters 1",
        description: "Depending On Your Powerlevels We Also Boost Above Master 1",
        value: "ranked_masters1",
        orderTitle: "Ranked Over Masters 1",
        details: "• Ranked Over Masters 1"
      },
      {
        label: "🚀 Questions About Boost",
        description: "Ask Us a Question About How The Ranked Boost Will Work",
        value: "ranked_question",
        orderTitle: "Question About Ranked Boost",
        details: "• Question About Ranked Boost"
      }
    ]
  },

  questions: {
    type: "select",
    title: "Questions",
    description: "Choose the offer that you want below",
    image: "https://media.discordapp.net/attachments/1402630936872357921/1402976794617053194/Untitled175_20250807132355.png?ex=69bd2f75&is=69bbddf5&hm=b3b529b154fc3f11a73906412bb2a11433799632b8c8a361e35e98d82bd35217&=&format=webp&quality=lossless&width=1566&height=881",
    footer: "BS Ghouls © 2025 - All rights reserved.",
    customId: "questions_menu",
    options: [
      {
        label: "❓ Question",
        description: "Feel Free To Ask Any Questions Before Making a Purchase",
        value: "question_general",
        orderTitle: "Question",
        details: "• Question Before Purchase"
      },
      {
        label: "🤝 Work With Us",
        description: "For Being A Booster, Sell Your Account Or Doing A Partnership",
        value: "question_workwithus",
        orderTitle: "Work With Us",
        details: "• Work With Us"
      }
    ]
  }
};

const OFFER_LOOKUP = {};
for (const panelKey of Object.keys(PANELS)) {
  const panel = PANELS[panelKey];
  if (panel.options) {
    for (const option of panel.options) {
      OFFER_LOOKUP[option.value] = option;
    }
  }
}

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
    .setDescription("Post the questions panel")
].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

function buildPanel(panel) {
  const embed = new EmbedBuilder()
    .setTitle(panel.title)
    .setDescription(panel.description)
    .setColor(0x2b2d31)
    .setFooter({ text: panel.footer });

  if (panel.image) {
    embed.setImage(panel.image);
  }

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

function getPanelByCustomId(customId) {
  return Object.values(PANELS).find(panel => panel.customId === customId) || null;
}

function sanitizeName(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function findExistingTicket(guild, userId) {
  return guild.channels.cache.find(
    channel =>
      channel.parentId === TICKET_CATEGORY_ID &&
      channel.topic === `ticket-owner:${userId}`
  );
}

async function resetPanelMessage(message, panel) {
  try {
    await message.edit(buildPanel(panel));
  } catch (error) {
    console.error("Failed to reset panel message:", error);
  }
}

async function createTicket(guild, user, orderTitle, detailsText) {
  const existingChannel = findExistingTicket(guild, user.id);
  if (existingChannel) {
    return { exists: true, channel: existingChannel };
  }

  const botMember = guild.members.me;

  const channel = await guild.channels.create({
    name: `ticket-${sanitizeName(user.username)}`.slice(0, 90),
    type: ChannelType.GuildText,
    parent: TICKET_CATEGORY_ID,
    topic: `ticket-owner:${user.id}`,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory
        ]
      },
      {
        id: STAFF_ROLE_ID,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory
        ]
      },
      {
        id: botMember.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.ManageChannels
        ]
      }
    ]
  });

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setDescription(
`🎟️ **Your ticket has been created!**

**Details:**
${detailsText}

A staff member will assist you shortly.`
    );

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("Close Ticket")
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: `${user} <@&${STAFF_ROLE_ID}>`,
    allowedMentions: {
      users: [user.id],
      roles: [STAFF_ROLE_ID]
    },
    embeds: [embed],
    components: [closeRow]
  });

  return { exists: false, channel };
}

client.once("clientReady", async () => {
  try {
    console.log(`Logged in as ${client.user.tag}`);
    console.log("Registering slash commands...");

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("Slash commands registered.");
  } catch (error) {
    console.error("Error registering commands:", error);
  }
});

client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "ping") {
        await interaction.reply("pong");
        return;
      }

      const panel = getPanelByCommand(interaction.commandName);
      if (!panel) return;

      await interaction.reply(buildPanel(panel));
      return;
    }

    if (interaction.isStringSelectMenu()) {
      const selectedValue = interaction.values[0];
      const offer = OFFER_LOOKUP[selectedValue];
      const sourcePanel = getPanelByCustomId(interaction.customId);

      if (!offer) {
        await interaction.reply({
          content: "Invalid offer selected.",
          ephemeral: true
        });
        return;
      }

      if (selectedValue === "ranked_custom") {
        const existing = findExistingTicket(interaction.guild, interaction.user.id);
        if (existing) {
          await interaction.reply({
            content: `You already have a ticket: ${existing}`,
            ephemeral: true
          });
          return;
        }

        if (sourcePanel) {
          await resetPanelMessage(interaction.message, sourcePanel);
        }

        const modal = new ModalBuilder()
          .setCustomId(`ranked_custom_${interaction.user.id}`)
          .setTitle("Custom Ranked Boost");

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("current_rank")
              .setLabel("Current rank :")
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("Enter Your Current Rank")
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("desired_rank")
              .setLabel("Desired rank :")
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("Enter The Rank You Want")
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("power_11s")
              .setLabel("How many Power 11s? :")
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("Example : 51")
              .setRequired(true)
          )
        );

        await interaction.showModal(modal);
        return;
      }

      if (selectedValue === "trophies_custom") {
        const existing = findExistingTicket(interaction.guild, interaction.user.id);
        if (existing) {
          await interaction.reply({
            content: `You already have a ticket: ${existing}`,
            ephemeral: true
          });
          return;
        }

        if (sourcePanel) {
          await resetPanelMessage(interaction.message, sourcePanel);
        }

        const modal = new ModalBuilder()
          .setCustomId(`trophies_custom_${interaction.user.id}`)
          .setTitle("Boost Your Total Trophies");

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("current_trophies")
              .setLabel("Current trophies :")
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("Enter your current total trophies")
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("target_trophies")
              .setLabel("How much trophies do you want to get to? :")
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("Enter your target total trophies")
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("power_11s")
              .setLabel("Amount of Power 11's :")
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("Example : 12")
              .setRequired(true)
          )
        );

        await interaction.showModal(modal);
        return;
      }

      const result = await createTicket(
        interaction.guild,
        interaction.user,
        offer.orderTitle,
        offer.details
      );

      if (result.exists) {
        await interaction.reply({
          content: `You already have a ticket: ${result.channel}`,
          ephemeral: true
        });

        if (sourcePanel) {
          setTimeout(() => {
            resetPanelMessage(interaction.message, sourcePanel);
          }, 700);
        }
        return;
      }

      await interaction.reply({
        content: `✅ Your ticket has been created! Please check your new channel. ${result.channel}`,
        ephemeral: true
      });

      if (sourcePanel) {
        setTimeout(() => {
          resetPanelMessage(interaction.message, sourcePanel);
        }, 700);
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith("ranked_custom_")) {
        const currentRank = interaction.fields.getTextInputValue("current_rank");
        const desiredRank = interaction.fields.getTextInputValue("desired_rank");
        const power11s = interaction.fields.getTextInputValue("power_11s");

        const result = await createTicket(
          interaction.guild,
          interaction.user,
          "Custom Ranked Boost",
`• Current Rank: ${currentRank}
• Desired Rank: ${desiredRank}
• Power 11s: ${power11s}`
        );

        if (result.exists) {
          await interaction.reply({
            content: `You already have a ticket: ${result.channel}`,
            ephemeral: true
          });
          return;
        }

        await interaction.reply({
          content: `✅ Your ticket has been created! Please check your new channel. ${result.channel}`,
          ephemeral: true
        });
        return;
      }

      if (interaction.customId.startsWith("trophies_custom_")) {
        const currentTrophies = interaction.fields.getTextInputValue("current_trophies");
        const targetTrophies = interaction.fields.getTextInputValue("target_trophies");
        const power11s = interaction.fields.getTextInputValue("power_11s");

        const result = await createTicket(
          interaction.guild,
          interaction.user,
          "Total Trophies Boost",
`• Current Trophies: ${currentTrophies}
• Target Trophies: ${targetTrophies}
• Amount of Power 11's: ${power11s}`
        );

        if (result.exists) {
          await interaction.reply({
            content: `You already have a ticket: ${result.channel}`,
            ephemeral: true
          });
          return;
        }

        await interaction.reply({
          content: `✅ Your ticket has been created! Please check your new channel. ${result.channel}`,
          ephemeral: true
        });
        return;
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId !== "close_ticket") return;

      await interaction.reply({
        content: "Closing ticket...",
        ephemeral: true
      });

      setTimeout(async () => {
        try {
          await interaction.channel.delete();
        } catch (error) {
          console.error("Error deleting ticket:", error);
        }
      }, 2000);
    }
  } catch (error) {
    console.error("Interaction error:", error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "Something went wrong.",
        ephemeral: true
      }).catch(() => {});
    } else {
      await interaction.reply({
        content: "Something went wrong.",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

client.login(TOKEN);