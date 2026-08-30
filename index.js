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
