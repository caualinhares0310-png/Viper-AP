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
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

// ===============================
// RENDER
// ===============================

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.status(200).send("🐍 VIPER AP está online!");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "online",
    discord: client.isReady() ? "online" : "connecting"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Render ativo na porta ${PORT}`);
});

// ===============================
// CONFIGURAÇÕES
// ===============================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const CANAL_PAINEL_ID = process.env.CANAL_PAINEL_ID;
const MEDIADOR_ROLE_ID = process.env.MEDIADOR_ROLE_ID;

const BANNER_URL = process.env.BANNER_URL || "";

// ===============================
// CANAIS DAS FILAS
// ===============================

const FILAS_ID = {
  "1x1": process.env.FILA_1X1_ID,
  "2x2": process.env.FILA_2X2_ID,
  "3x3": process.env.FILA_3X3_ID,
  "4x4": process.env.FILA_4X4_ID
};

// ===============================
// CLIENT DISCORD
// ===============================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ===============================
// VALORES
// ===============================

const VALORES = [
  "1.00",
  "2.00",
  "3.00",
  "4.00",
  "5.00",
  "10.00",
  "20.00",
  "50.00",
  "100.00"
];

// ===============================
// MODALIDADES
// ===============================

const MODALIDADES = [
  "1x1",
  "2x2",
  "3x3",
  "4x4"
];

// ===============================
// FILAS
// ===============================

const filas = {};

for (const valor of VALORES) {
  filas[valor] = {};

  for (const modalidade of MODALIDADES) {
    filas[valor][modalidade] = new Map();
  }
}

// Evita duas partidas sendo criadas ao mesmo tempo
const partidasCriando = new Set();

// ===============================
// COMANDO /PAINEL
// ===============================

const commands = [
  new SlashCommandBuilder()
    .setName("painel")
    .setDescription("Cria os painéis de uma modalidade.")
    .addStringOption(option =>
      option
        .setName("modalidade")
        .setDescription("Escolha a modalidade.")
        .setRequired(true)
        .addChoices(
          { name: "1v1", value: "1x1" },
          { name: "2v2", value: "2x2" },
          { name: "3v3", value: "3x3" },
          { name: "4v4", value: "4x4" }
        )
    )
    .toJSON()
];

// ===============================
// REGISTRAR COMANDO
// ===============================

async function registrarComandos() {
  if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
    console.error("❌ Variáveis necessárias para /painel estão faltando.");
    return;
  }

  try {
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

    console.log("✅ /painel registrado!");
  } catch (error) {
    console.error("❌ Erro ao registrar /painel:", error);
  }
}

// ===============================
// FORMATAR VALOR
// ===============================

function valorFormatado(valor) {
  return `R$ ${valor.replace(".", ",")}`;
}

// ===============================
// PROCURAR JOGADOR
// ===============================

function procurarJogador(userId) {
  for (const valor of VALORES) {
    for (const modalidade of MODALIDADES) {
      if (filas[valor][modalidade].has(userId)) {
        return {
          valor,
          modalidade
        };
      }
    }
  }

  return null;
}

// ===============================
// NOME DA PARTIDA
// ===============================

function gerarNomePartida(modalidade) {
  const nomes = [
    "arena",
    "duelo",
    "batalha",
    "confronto",
    "clash",
    "elite",
    "combate",
    "match"
  ];

  const nome =
    nomes[Math.floor(Math.random() * nomes.length)];

  const numero =
    Math.floor(Math.random() * 99999) + 1;

  return `🐍-${modalidade}-${nome}-${numero}`;
}

// ===============================
// CRIAR PAINEL
// ===============================

function criarPainel(valor, modalidade) {
  const quantidade =
    filas[valor][modalidade].size;

  const embed = new EmbedBuilder()
    .setTitle(
      `🐍 VIPER AP • ${modalidade.toUpperCase()}`
    )
    .setDescription(
      `🎮 **${modalidade.toUpperCase()} Mobile**\n\n` +
      `💰 **Valor:** ${valorFormatado(valor)}\n\n` +
      `👥 **Jogadores na fila:** ${quantidade}/2`
    )
    .setColor(0x111111);

  if (BANNER_URL) {
    embed.setImage(BANNER_URL);
  }

  const entrar = new ButtonBuilder()
    .setCustomId(
      `entrar_${valor}_${modalidade}`
    )
    .setLabel("Entrar na Fila")
    .setEmoji("✅")
    .setStyle(ButtonStyle.Success);

  const sair = new ButtonBuilder()
    .setCustomId(
      `sair_${valor}_${modalidade}`
    )
    .setLabel("Sair da Fila")
    .setEmoji("❌")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder()
    .addComponents(
      entrar,
      sair
    );

  return {
    embeds: [embed],
    components: [row]
  };
}

// ===============================
// ATUALIZAR PAINEL
// ===============================

async function atualizarPainel(
  interaction,
  valor,
  modalidade
) {
  try {
    if (!interaction.message) return;

    await interaction.message.edit(
      criarPainel(
        valor,
        modalidade
      )
    );
  } catch (error) {
    console.log(
      "⚠️ Não consegui atualizar painel:",
      error.message
    );
  }
}

// ===============================
// ESCOLHER MEDIADOR
// ===============================

async function escolherMediador(guild) {
  if (!MEDIADOR_ROLE_ID) {
    console.error(
      "❌ MEDIADOR_ROLE_ID não configurado."
    );

    return null;
  }

  try {
    const role =
      await guild.roles.fetch(
        MEDIADOR_ROLE_ID
      );

    if (!role) {
      console.error(
        "❌ Cargo de mediador não encontrado."
      );

      return null;
    }

    const membros =
      [...role.members.values()]
        .filter(
          membro => !membro.user.bot
        );

    if (membros.length === 0) {
      console.error(
        "❌ Nenhum mediador disponível."
      );

      return null;
    }

    return membros[
      Math.floor(
        Math.random() * membros.length
      )
    ];
  } catch (error) {
    console.error(
      "❌ Erro procurando mediador:",
      error
    );

    return null;
  }
}

// ===============================
// OBTER CANAL DA FILA
// ===============================

async function obterCanalFila(
  guild,
  modalidade
) {
  const canalId =
    FILAS_ID[modalidade];

  if (!canalId) {
    console.error(
      `❌ FILA_${modalidade}_ID não configurado.`
    );

    return null;
  }

  try {
    const canal =
      await guild.channels.fetch(
        canalId
      );

    if (!canal) {
      console.error(
        `❌ Canal ${modalidade} não encontrado.`
      );

      return null;
    }

    return canal;
  } catch (error) {
    console.error(
      `❌ Erro buscando canal ${modalidade}:`,
      error.message
    );

    return null;
  }
}

// ===============================
// CRIAR PARTIDA
// ===============================

async function criarPartida(
  guild,
  valor,
  modalidade
) {
  const chave =
    `${valor}_${modalidade}`;

  if (partidasCriando.has(chave)) {
    return;
  }

  partidasCriando.add(chave);

  try {
    const fila =
      filas[valor]?.[modalidade];

    if (!fila) {
      console.error(
        "❌ Fila não encontrada."
      );

      return;
    }

    if (fila.size < 2) {
      return;
    }

    const jogadores =
      [...fila.values()].slice(0, 2);

    // ===========================
    // MEDIADOR
    // ===========================

    const mediador =
      await escolherMediador(guild);

    if (!mediador) {
      console.error(
        "❌ Partida cancelada: mediador indisponível."
      );

      return;
    }

    // ===========================
    // CANAL
    // ===========================

    const canalFila =
      await obterCanalFila(
        guild,
        modalidade
      );

    if (!canalFila) {
      return;
    }

    // ===========================
    // BUSCAR JOGADORES
    // ===========================

    const membros = [];

    for (const jogador of jogadores) {
      const membro =
        await guild.members
          .fetch(jogador.id)
          .catch(() => null);

      if (membro) {
        membros.push(membro);
      }
    }

    if (membros.length !== 2) {
      console.error(
        "❌ Um dos jogadores não foi encontrado."
      );

      return;
    }

    // ===========================
    // VERIFICAR PERMISSÕES
    // ===========================

    const botMember =
      guild.members.me;

    if (!botMember) {
      console.error(
        "❌ Bot não encontrado no servidor."
      );

      return;
    }

    const permissoes =
      canalFila.permissionsFor(
        botMember
      );

    if (!permissoes) {
      console.error(
        "❌ Não foi possível verificar permissões."
      );

      return;
    }

    const necessarias = [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.CreatePrivateThreads,
      PermissionsBitField.Flags.SendMessagesInThreads
    ];

    for (const permissao of necessarias) {
      if (!permissoes.has(permissao)) {
        console.error(
          "❌ O bot não possui todas as permissões necessárias no canal da fila."
        );

        return;
      }
    }

    // ===========================
    // CRIAR THREAD
    // ===========================

    let thread;

    try {
      thread =
        await canalFila.threads.create({
          name:
            gerarNomePartida(
              modalidade
            ),

          type:
            ChannelType.PrivateThread,

          invitable: false,

          autoArchiveDuration: 10080,

          reason:
            `VIPER AP | ${modalidade} | ${valorFormatado(valor)}`
        });
    } catch (error) {
      console.error(
        "❌ ERRO CRIANDO THREAD:",
        error
      );

      return;
    }

    // ===========================
    // ADICIONAR JOGADORES
    // ===========================

    for (const membro of membros) {
      try {
        await thread.members.add(
          membro.id
        );
      } catch (error) {
        console.error(
          `⚠️ Erro adicionando ${membro.user.tag}:`,
          error.message
        );
      }
    }

    // ===========================
    // ADICIONAR MEDIADOR
    // ===========================

    try {
      await thread.members.add(
        mediador.id
      );
    } catch (error) {
      console.error(
        "⚠️ Erro adicionando mediador:",
        error.message
      );
    }

    // ===========================
    // REMOVER DA FILA
    // ===========================

    for (const jogador of jogadores) {
      fila.delete(jogador.id);
    }

    // ===========================
    // EMBED
    // ===========================

    const listaJogadores =
      membros
        .map(
          (membro, index) =>
            `👤 **Jogador ${index + 1}:** ${membro}`
        )
        .join("\n");

    const embed =
      new EmbedBuilder()
        .setTitle(
          "🐍 VIPER AP • PARTIDA"
        )
        .setDescription(
          `🎮 **Modalidade:** ${modalidade.toUpperCase()}\n\n` +
          `💰 **Valor:** ${valorFormatado(valor)}\n\n` +
          `${listaJogadores}\n\n` +
          `🛡️ **Mediador:** ${mediador}`
        )
        .setColor(0x111111);

    if (BANNER_URL) {
      embed.setImage(
        BANNER_URL
      );
    }

    // ===========================
    // FINALIZAR
    // ===========================

    const finalizar =
      new ButtonBuilder()
        .setCustomId(
          `finalizar_${thread.id}`
        )
        .setLabel(
          "Finalizar Partida"
        )
        .setEmoji("🗑️")
        .setStyle(
          ButtonStyle.Danger
        );

    const row =
      new ActionRowBuilder()
        .addComponents(
          finalizar
        );

    // ===========================
    // ENVIAR
    // ===========================

    try {
      await thread.send({
        content:
          `${membros.join(" ")} ${mediador}`,

        embeds: [
          embed
        ],

        components: [
          row
        ]
      });
    } catch (error) {
      console.error(
        "❌ Erro enviando partida:",
        error
      );

      await thread.delete(
        "Limpeza após erro"
      ).catch(() => {});

      return;
    }

    console.log(
      `✅ PARTIDA CRIADA: ${modalidade} ${valorFormatado(valor)}`
    );

  } catch (error) {
    console.error(
      "❌ ERRO CRÍTICO CRIANDO PARTIDA:",
      error
    );
  } finally {
    partidasCriando.delete(chave);
  }
}

// ===============================
// BOT READY
// ===============================

client.once(
  "ready",
  async () => {
    console.log("");
    console.log(
      "━━━━━━━━━━━━━━━━━━━━"
    );
    console.log(
      "🐍 VIPER AP ONLINE!"
    );
    console.log(
      `🤖 ${client.user.tag}`
    );
    console.log(
      `🆔 ${client.user.id}`
    );
    console.log(
      `🌐 Servidores: ${client.guilds.cache.size}`
    );
    console.log(
      "━━━━━━━━━━━━━━━━━━━━"
    );
    console.log("");

    await registrarComandos();
  }
);

// ===============================
// ERROS DO DISCORD
// ===============================

client.on(
  "error",
  error => {
    console.error(
      "❌ ERRO DO DISCORD:",
      error
    );
  }
);

client.on(
  "warn",
  warning => {
    console.warn(
      "⚠️ AVISO DO DISCORD:",
      warning
    );
  }
);

// ===============================
// INTERAÇÕES
// ===============================

client.on(
  "interactionCreate",
  async interaction => {

    try {

      // =========================
      // /PAINEL
      // =========================

      if (
        interaction.isChatInputCommand()
      ) {

        if (
          interaction.commandName !== "painel"
        ) {
          return;
        }

        const modalidade =
          interaction.options.getString(
            "modalidade"
          );

        if (
          !MODALIDADES.includes(
            modalidade
          )
        ) {
          return interaction.reply({
            content:
              "❌ Modalidade inválida.",
            ephemeral: true
          });
        }

        let canal;

        if (CANAL_PAINEL_ID) {
          canal =
            await client.channels
              .fetch(
                CANAL_PAINEL_ID
              )
              .catch(() => null);
        } else {
          canal =
            interaction.channel;
        }

        if (!canal) {
          return interaction.reply({
            content:
              "❌ Canal do painel não encontrado.",
            ephemeral: true
          });
        }

        await interaction.reply({
          content:
            `🐍 Criando os painéis de **${modalidade.toUpperCase()}**...`,
          ephemeral: true
        });

        for (const valor of VALORES) {
          try {
            await canal.send(
              criarPainel(
                valor,
                modalidade
              )
            );
          } catch (error) {
            console.error(
              `❌ Erro criando painel ${valor}:`,
              error.message
            );
          }
        }

        console.log(
          `✅ Painéis ${modalidade} criados.`
        );

        return;
      }

      // =========================
      // BOTÕES
      // =========================

      if (!interaction.isButton()) {
        return;
      }

      const customId =
        interaction.customId;

      // =========================
      // FINALIZAR
      // =========================

      if (
        customId.startsWith(
          "finalizar_"
        )
      ) {

        if (
          !MEDIADOR_ROLE_ID ||
          !interaction.member?.roles?.cache?.has(
            MEDIADOR_ROLE_ID
          )
        ) {
          return interaction.reply({
            content:
              "❌ Apenas mediadores podem finalizar a partida.",
            ephemeral: true
          });
        }

        await interaction.reply({
          content:
            "🗑️ Partida finalizada! Excluindo tópico...",
          ephemeral: true
        });

        const threadId =
          customId.replace(
            "finalizar_",
            ""
          );

        setTimeout(
          async () => {
            try {
              const thread =
                await client.channels
                  .fetch(threadId)
                  .catch(() => null);

              if (!thread) {
                return;
              }

              await thread.delete(
                "Partida VIPER AP finalizada"
              );

              console.log(
                "🗑️ Partida excluída."
              );

            } catch (error) {
              console.error(
                "❌ Erro excluindo partida:",
                error.message
              );
            }
          },
          1500
        );

        return;
      }

      // =========================
      // ENTRAR
      // =========================

      if (
        customId.startsWith(
          "entrar_"
        )
      ) {

        const partes =
          customId.split("_");

        const valor =
          partes[1];

        const modalidade =
          partes[2];

        if (
          !filas[valor] ||
          !filas[valor][modalidade]
        ) {
          return interaction.reply({
            content:
              "❌ Essa fila não existe.",
            ephemeral: true
          });
        }

        // Verifica se já está em alguma fila

        const atual =
          procurarJogador(
            interaction.user.id
          );

        if (atual) {
          return interaction.reply({
            content:
              `⚠️ Você já está na fila de **${valorFormatado(atual.valor)} • ${atual.modalidade}**.`,
            ephemeral: true
          });
        }

        // Limite

        if (
          filas[valor][modalidade].size >= 2
        ) {
          return interaction.reply({
            content:
              "⏳ Essa fila já está completa.",
            ephemeral: true
          });
        }

        // Adicionar

        filas[valor][modalidade].set(
          interaction.user.id,
          {
            id:
              interaction.user.id,

            username:
              interaction.user.username
          }
        );

        await interaction.reply({
          content:
            `✅ Você entrou na fila **${modalidade.toUpperCase()} • ${valorFormatado(valor)}**!`,
          ephemeral: true
        });

        await atualizarPainel(
          interaction,
          valor,
          modalidade
        );

        // Criar quando tiver 2

        if (
          filas[valor][modalidade].size >= 2
        ) {

          await criarPartida(
            interaction.guild,
            valor,
            modalidade
          );

          await atualizarPainel(
            interaction,
            valor,
            modalidade
          );
        }

        return;
      }

      // =========================
      // SAIR
      // =========================

      if (
        customId.startsWith(
          "sair_"
        )
      ) {

        const partes =
          customId.split("_");

        const valor =
          partes[1];

        const modalidade =
          partes[2];

        if (
          !filas[valor] ||
          !filas[valor][modalidade]
        ) {
          return interaction.reply({
            content:
              "❌ Essa fila não existe.",
            ephemeral: true
          });
        }

        const fila =
          filas[valor][modalidade];

        if (
          !fila.has(
            interaction.user.id
          )
        ) {
          return interaction.reply({
            content:
              "❌ Você não está nessa fila.",
            ephemeral: true
          });
        }

        fila.delete(
          interaction.user.id
        );

        await interaction.reply({
          content:
            `❌ Você saiu da fila **${modalidade.toUpperCase()} • ${valorFormatado(valor)}**.`,
          ephemeral: true
        });

        await atualizarPainel(
          interaction,
          valor,
          modalidade
        );

        return;
      }

    } catch (error) {

      console.error(
        "❌ ERRO NA INTERAÇÃO:",
        error
      );

      try {

        if (
          !interaction.replied &&
          !interaction.deferred
        ) {

          await interaction.reply({
            content:
              "❌ Ocorreu um erro. Tente novamente.",
            ephemeral: true
          });

        }

      } catch (_) {}

    }
  }
);

// ===============================
// VERIFICAÇÕES
// ===============================

console.log(
  "🔎 Verificando configurações..."
);

if (!TOKEN) {
  console.error(
    "❌ DISCORD_TOKEN não configurado!"
  );
}

if (!CLIENT_ID) {
  console.error(
    "❌ CLIENT_ID não configurado!"
  );
}

if (!GUILD_ID) {
  console.error(
    "❌ GUILD_ID não configurado!"
  );
}

if (!CANAL_PAINEL_ID) {
  console.warn(
    "⚠️ CANAL_PAINEL_ID não configurado."
  );
}

if (!MEDIADOR_ROLE_ID) {
  console.warn(
    "⚠️ MEDIADOR_ROLE_ID não configurado!"
  );
}

for (const modalidade of MODALIDADES) {
  if (!FILAS_ID[modalidade]) {
    console.warn(
      `⚠️ FILA_${modalidade}_ID não configurado!`
    );
  }
}

// ===============================
// LOGIN
// ===============================

if (TOKEN) {

  console.log(
    "🔄 Conectando ao Discord..."
  );

  client.login(TOKEN)
    .then(() => {
      console.log(
        "✅ Login enviado ao Discord."
      );
    })
    .catch(error => {
      console.error(
        "❌ ERRO NO LOGIN DO DISCORD:",
        error
      );
    });

} else {

  console.error(
    "❌ Bot não iniciado porque DISCORD_TOKEN está vazio."
  );
}

// ===============================
// ERROS GLOBAIS
// ===============================

process.on(
  "unhandledRejection",
  error => {
    console.error(
      "❌ UNHANDLED REJECTION:",
      error
    );
  }
);

process.on(
  "uncaughtException",
  error => {
    console.error(
      "❌ UNCAUGHT EXCEPTION:",
      error
    );
  }
);
