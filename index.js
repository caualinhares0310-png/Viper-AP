require("dotenv").config();

const express = require("express");
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

// =========================
// SERVIDOR WEB
// =========================

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🐍 Viper AP está online!");
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor ativo na porta ${PORT}`);
});

// =========================
// DISCORD
// =========================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// =========================
// FILAS
// =========================

const filas = {
  "1.00": {
    valor: "R$ 1,00",
    jogadores: new Map()
  },

  "2.00": {
    valor: "R$ 2,00",
    jogadores: new Map()
  },

  "3.00": {
    valor: "R$ 3,00",
    jogadores: new Map()
  },

  "4.00": {
    valor: "R$ 4,00",
    jogadores: new Map()
  },

  "5.00": {
    valor: "R$ 5,00",
    jogadores: new Map()
  },

  "10.00": {
    valor: "R$ 10,00",
    jogadores: new Map()
  },

  "20.00": {
    valor: "R$ 20,00",
    jogadores: new Map()
  },

  "50.00": {
    valor: "R$ 50,00",
    jogadores: new Map()
  },

  "100.00": {
    valor: "R$ 100,00",
    jogadores: new Map()
  }
};

// =========================
// CRIAR PAINEL
// =========================

function criarPainel(id) {
  const fila = filas[id];

  let jogadores;

  if (fila.jogadores.size === 0) {
    jogadores = "Nenhum jogador na fila";
  } else {
    jogadores = [...fila.jogadores.values()]
      .map((jogador, index) => {
        return `${index + 1}. <@${jogador.id}> — **${jogador.modo}**`;
      })
      .join("\n");
  }

  const embed = new EmbedBuilder()
    .setTitle("1v1 Mobile")
    .setDescription(
      `**Valor:** ${fila.valor}\n\n` +
      `**Jogadores:**\n${jogadores}\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🐍 **VIPER AP**`
    )
    .setColor(0x111111)
    .setFooter({
      text: "VIPER • FOCO • DISCIPLINA • VITÓRIA"
    });

  // =========================
  // BOTÕES
  // =========================

  const entrar = new ButtonBuilder()
    .setCustomId(`entrar_${id}`)
    .setLabel("Entrar na Fila")
    .setEmoji("✅")
    .setStyle(ButtonStyle.Success);

  const ump = new ButtonBuilder()
    .setCustomId(`modo_ump_${id}`)
    .setLabel("UMP e XM8")
    .setEmoji("🔫")
    .setStyle(ButtonStyle.Secondary);

  const normal = new ButtonBuilder()
    .setCustomId(`modo_normal_${id}`)
    .setLabel("NORMAL")
    .setEmoji("⚪")
    .setStyle(ButtonStyle.Secondary);

  const sair = new ButtonBuilder()
    .setCustomId(`sair_${id}`)
    .setLabel("Sair da Fila")
    .setEmoji("❌")
    .setStyle(ButtonStyle.Danger);

  // Primeira linha
  const linha1 = new ActionRowBuilder().addComponents(
    entrar,
    ump,
    normal
  );

  // Segunda linha
  const linha2 = new ActionRowBuilder().addComponents(
    sair
  );

  return {
    embeds: [embed],
    components: [linha1, linha2]
  };
}

// =========================
// ATUALIZAR PAINEL
// =========================

async function atualizarFila(id, interaction) {
  try {
    await interaction.message.edit(criarPainel(id));
  } catch (erro) {
    console.log("❌ Erro ao atualizar o painel:", erro.message);
  }
}

// =========================
// BOT ONLINE
// =========================

client.once("ready", () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🐍 Viper AP conectado!`);
  console.log(`👤 Bot: ${client.user.tag}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━");
});

// =========================
// INTERAÇÕES
// =========================

client.on("interactionCreate", async (interaction) => {

  // =========================
  // COMANDO /PAINEL
  // =========================

  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "painel") {

      await interaction.reply({
        content: "🐍 **Criando os painéis Viper AP...**",
        ephemeral: true
      });

      const canal = interaction.channel;

      for (const id of Object.keys(filas)) {
        await canal.send(criarPainel(id));
      }

      return;
    }
  }

  // =========================
  // BOTÕES
  // =========================

  if (!interaction.isButton()) return;

  const partes = interaction.customId.split("_");

  const acao = partes[0];

  let modo = null;
  let id = null;

  if (acao === "modo") {
    modo = partes[1];
    id = partes[2];
  } else {
    id = partes[1];
  }

  if (!filas[id]) {
    return interaction.reply({
      content: "❌ Esta fila não existe mais.",
      ephemeral: true
    });
  }

  const fila = filas[id];

  // =========================
  // ENTRAR NA FILA
  // =========================

  if (acao === "entrar") {

    if (fila.jogadores.has(interaction.user.id)) {
      return interaction.reply({
        content: "⚠️ Você já está nessa fila!",
        ephemeral: true
      });
    }

    // Impede o jogador de entrar em outra fila
    for (const outraFila of Object.values(filas)) {

      if (outraFila.jogadores.has(interaction.user.id)) {

        return interaction.reply({
          content: "⚠️ Você já está em outra fila!",
          ephemeral: true
        });

      }
    }

    fila.jogadores.set(interaction.user.id, {
      id: interaction.user.id,
      modo: "NORMAL"
    });

    await interaction.reply({
      content: `✅ Você entrou na fila de **${fila.valor}**!`,
      ephemeral: true
    });

    await atualizarFila(id, interaction);

    return;
  }

  // =========================
  // UMP E XM8
  // =========================

  if (acao === "modo" && modo === "ump") {

    const jogador = fila.jogadores.get(interaction.user.id);

    if (!jogador) {
      return interaction.reply({
        content: "❌ Entre na fila primeiro!",
        ephemeral: true
      });
    }

    jogador.modo = "UMP e XM8";

    await interaction.reply({
      content: "🔫 Seu modo foi alterado para **UMP e XM8**!",
      ephemeral: true
    });

    await atualizarFila(id, interaction);

    return;
  }

  // =========================
  // NORMAL
  // =========================

  if (acao === "modo" && modo === "normal") {

    const jogador = fila.jogadores.get(interaction.user.id);

    if (!jogador) {
      return interaction.reply({
        content: "❌ Entre na fila primeiro!",
        ephemeral: true
      });
    }

    jogador.modo = "NORMAL";

    await interaction.reply({
      content: "⚪ Seu modo foi alterado para **NORMAL**!",
      ephemeral: true
    });

    await atualizarFila(id, interaction);

    return;
  }

  // =========================
  // SAIR DA FILA
  // =========================

  if (acao === "sair") {

    if (!fila.jogadores.has(interaction.user.id)) {
      return interaction.reply({
        content: "❌ Você não está nessa fila!",
        ephemeral: true
      });
    }

    fila.jogadores.delete(interaction.user.id);

    await interaction.reply({
      content: "❌ Você saiu da fila!",
      ephemeral: true
    });

    await atualizarFila(id, interaction);

    return;
  }
});

// =========================
// REGISTRAR /PAINEL
// =========================

async function registrarComandos() {

  const comandos = [
    new SlashCommandBuilder()
      .setName("painel")
      .setDescription("Cria os painéis de filas da Viper AP.")
      .toJSON()
  ];

  const rest = new REST({
    version: "10"
  }).setToken(process.env.DISCORD_TOKEN);

  try {

    console.log("🔄 Registrando /painel...");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      {
        body: comandos
      }
    );

    console.log("✅ /painel registrado com sucesso!");

  } catch (erro) {

    console.error("❌ Erro ao registrar /painel:");
    console.error(erro);

  }
}

// =========================
// INICIAR BOT
// =========================

registrarComandos();

client.login(process.env.DISCORD_TOKEN);
const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ChannelType,
    PermissionFlagsBits
} = require("discord.js");

// ==============================
// CONFIGURAÇÕES
// ==============================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// IDs DOS TÓPICOS DAS FILAS
// Coloque aqui os IDs reais dos seus tópicos.
const FILAS = {
    "1x1": process.env.FILA_1X1_ID,
    "2x2": process.env.FILA_2X2_ID,
    "3x3": process.env.FILA_3X3_ID,
    "4x4": process.env.FILA_4X4_ID
};

// ID da categoria onde as partidas serão criadas
const CATEGORIA_PARTIDAS = process.env.CATEGORIA_PARTIDAS_ID;

// ID do cargo dos mediadores
const MEDIADOR_ROLE_ID = process.env.MEDIADOR_ROLE_ID;


// ==============================
// CLIENT
// ==============================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});


// ==============================
// FILAS
// ==============================

const filas = {
    "1x1": [],
    "2x2": [],
    "3x3": [],
    "4x4": []
};

const TAMANHO_FILA = {
    "1x1": 2,
    "2x2": 4,
    "3x3": 6,
    "4x4": 8
};


// ==============================
// COMANDO /PAINEL
// ==============================

const commands = [
    new SlashCommandBuilder()
        .setName("painel")
        .setDescription("Abre o painel de filas")
        .toJSON()
];


// ==============================
// REGISTRA COMANDO
// ==============================

async function registrarComandos() {

    const rest = new REST({ version: "10" }).setToken(TOKEN);

    await rest.put(
        Routes.applicationGuildCommands(
            CLIENT_ID,
            GUILD_ID
        ),
        {
            body: commands
        }
    );

    console.log("✅ /painel registrado.");
}


// ==============================
// BOT ONLINE
// ==============================

client.once("ready", () => {

    console.log(`🤖 Bot online como ${client.user.tag}`);

    registrarComandos()
        .catch(console.error);
});


// ==============================
// PAINEL
// ==============================

function criarPainel() {

    const embed = new EmbedBuilder()
        .setTitle("🎮 Filas")
        .setDescription(
            "Escolha a fila que deseja entrar.\n\n" +
            "🥊 **1x1** — 2 jogadores\n" +
            "👥 **2x2** — 4 jogadores\n" +
            "👥 **3x3** — 6 jogadores\n" +
            "👥 **4x4** — 8 jogadores\n\n" +
            "A fila é organizada automaticamente pelo menor valor para o maior."
        );

    const row1 = new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setCustomId("fila_1x1")
                .setLabel("1x1")
                .setEmoji("🥊")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("fila_2x2")
                .setLabel("2x2")
                .setEmoji("👥")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("fila_3x3")
                .setLabel("3x3")
                .setEmoji("👥")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("fila_4x4")
                .setLabel("4x4")
                .setEmoji("👥")
                .setStyle(ButtonStyle.Primary)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setCustomId("sair_fila")
                .setLabel("Sair da fila")
                .setEmoji("❌")
                .setStyle(ButtonStyle.Danger)
        );

    return {
        embeds: [embed],
        components: [row1, row2]
    };
}


// ==============================
// INTERAÇÕES
// ==============================

client.on("interactionCreate", async interaction => {

    try {

        // ==========================
        // /PAINEL
        // ==========================

        if (interaction.isChatInputCommand()) {

            if (interaction.commandName === "painel") {

                await interaction.reply({
                    ...criarPainel()
                });

                return;
            }
        }


        // ==========================
        // BOTÕES
        // ==========================

        if (!interaction.isButton()) return;


        // ==========================
        // SAIR DA FILA
        // ==========================

        if (interaction.customId === "sair_fila") {

            let saiu = false;

            for (const nomeFila of Object.keys(filas)) {

                const index = filas[nomeFila]
                    .findIndex(
                        jogador =>
                            jogador.id === interaction.user.id
                    );

                if (index !== -1) {

                    filas[nomeFila].splice(index, 1);

                    saiu = true;

                    await interaction.reply({
                        content:
                            `❌ Você saiu da **Fila ${nomeFila}**.`,
                        ephemeral: true
                    });

                    break;
                }
            }

            if (!saiu) {

                await interaction.reply({
                    content:
                        "❌ Você não está em nenhuma fila.",
                    ephemeral: true
                });
            }

            return;
        }


        // ==========================
        // ENTRAR NA FILA
        // ==========================

        if (interaction.customId.startsWith("fila_")) {

            const nomeFila =
                interaction.customId
                    .replace("fila_", "");

            if (!filas[nomeFila]) {

                await interaction.reply({
                    content: "❌ Essa fila não existe.",
                    ephemeral: true
                });

                return;
            }


            // Verifica se já está em alguma fila

            for (const fila of Object.keys(filas)) {

                const jaEsta =
                    filas[fila]
                        .some(
                            jogador =>
                                jogador.id === interaction.user.id
                        );

                if (jaEsta) {

                    await interaction.reply({
                        content:
                            `❌ Você já está na **Fila ${fila}**.`,
                        ephemeral: true
                    });

                    return;
                }
            }


            // ==========================
            // VALOR
            // ==========================

            // Por enquanto usa 0.
            // Se o seu sistema tiver um valor
            // específico para cada jogador,
            // troque aqui.

            const valor = 0;


            filas[nomeFila].push({

                id: interaction.user.id,

                username:
                    interaction.user.username,

                valor: Number(valor)
            });


            // ==========================
            // ORDENA MENOR → MAIOR
            // ==========================

            filas[nomeFila].sort(
                (a, b) => a.valor - b.valor
            );


            await interaction.reply({

                content:
                    `✅ Você entrou na **Fila ${nomeFila}**!`,

                ephemeral: true
            });


            console.log(
                `👤 ${interaction.user.tag} entrou na fila ${nomeFila}`
            );


            // ==========================
            // VERIFICA SE COMPLETOU
            // ==========================

            if (
                filas[nomeFila].length >=
                TAMANHO_FILA[nomeFila]
            ) {

                await criarPartida(
                    interaction.guild,
                    nomeFila
                );
            }
        }

    } catch (error) {

        console.error("❌ Erro:", error);

        if (!interaction.replied) {

            await interaction.reply({
                content:
                    "❌ Ocorreu um erro ao processar a ação.",
                ephemeral: true
            });
        }
    }
});


// ==============================
// CRIAR PARTIDA
// ==============================

async function criarPartida(guild, nomeFila) {

    const quantidade =
        TAMANHO_FILA[nomeFila];


    // Pega os jogadores da fila

    const jogadores =
        filas[nomeFila]
            .splice(0, quantidade);


    if (jogadores.length < quantidade) {
        return;
    }


    // ==========================
    // BUSCA MEMBROS
    // ==========================

    const membros = [];

    for (const jogador of jogadores) {

        const membro =
            await guild.members
                .fetch(jogador.id);

        membros.push(membro);
    }


    // ==========================
    // ESCOLHE MEDIADOR
    // ==========================

    const mediadores =
        guild.members.cache.filter(
            membro =>
                membro.roles.cache.has(
                    MEDIADOR_ROLE_ID
                ) &&
                !membro.user.bot
        );


    if (mediadores.size === 0) {

        console.log(
            "⚠️ Nenhum mediador encontrado."
        );

        return;
    }


    // Escolhe um mediador

    const mediador =
        mediadores
            .random();


    // ==========================
    // PERMISSÕES
    // ==========================

    const permissionOverwrites = [

        // Ninguém vê o canal
        {
            id: guild.roles.everyone.id,

            deny: [
                PermissionFlagsBits.ViewChannel
            ]
        },

        // Mediador
        {
            id: mediador.id,

            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
            ]
        },

        // Bot
        {
            id: client.user.id,

            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageChannels
            ]
        }
    ];


    // Adiciona os jogadores

    for (const membro of membros) {

        permissionOverwrites.push({

            id: membro.id,

            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
            ]
        });
    }


    // ==========================
    // NOME DO CANAL
    // ==========================

    const nomes = membros
        .slice(0, 4)
        .map(
            membro =>
                membro.user.username
        )
        .join("-");


    const nomeCanal =
        `partida-${nomeFila}-${nomes}`
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, "")
            .slice(0, 90);


    // ==========================
    // CRIA CANAL
    // ==========================

    const canal =
        await guild.channels.create({

            name: nomeCanal,

            type: ChannelType.GuildText,

            parent:
                CATEGORIA_PARTIDAS || null,

            permissionOverwrites
        });


    // ==========================
    // MENSAGEM DA PARTIDA
    // ==========================

    let textoJogadores =
        membros
            .map(
                (membro, index) =>
                    `**${index + 1}.** ${membro}`
            )
            .join("\n");


    const embed =
        new EmbedBuilder()

            .setTitle(
                `🎮 Fila ${nomeFila} — Partida criada!`
            )

            .setDescription(

                `**Jogadores:**\n` +
                `${textoJogadores}\n\n` +

                `🛡️ **Mediador:** ${mediador}\n\n` +

                `O mediador será responsável por conduzir a partida.`
            );


    await canal.send({

        content:
            `${membros.join(" ")} ${mediador}`,

        embeds: [embed]
    });


    console.log(
        `🎮 Partida ${nomeFila} criada: #${canal.name}`
    );
}


// ==============================
// LOGIN
// ==============================

client.login(TOKEN);
