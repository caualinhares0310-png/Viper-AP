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
    ChannelType
} = require("discord.js");

// =====================================================
// RENDER
// =====================================================

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("🐍 VIPER AP está online!");
});

app.listen(PORT, () => {
    console.log(`🌐 Servidor ativo na porta ${PORT}`);
});

// =====================================================
// CONFIGURAÇÕES
// =====================================================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const CANAL_PAINEL_ID = process.env.CANAL_PAINEL_ID;

const MEDIADOR_ROLE_ID = process.env.MEDIADOR_ROLE_ID;

// Banner do painel
const BANNER_URL = process.env.BANNER_URL || "";

// =====================================================
// CANAIS SEPARADOS POR MODALIDADE
// =====================================================

const FILAS_ID = {
    "1x1": process.env.FILA_1X1_ID,
    "2x2": process.env.FILA_2X2_ID,
    "3x3": process.env.FILA_3X3_ID,
    "4x4": process.env.FILA_4X4_ID
};

// =====================================================
// CLIENT DISCORD
// =====================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

// =====================================================
// VALORES
// =====================================================

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

// =====================================================
// MODALIDADES
// =====================================================

const MODALIDADES = [
    "1x1",
    "2x2",
    "3x3",
    "4x4"
];

// =====================================================
// FILAS
//
// IMPORTANTE:
// Cada modalidade possui sua própria fila.
//
// 1x1 -> somente jogadores do 1x1
// 2x2 -> somente jogadores do 2x2
// 3x3 -> somente jogadores do 3x3
// 4x4 -> somente jogadores do 4x4
//
// Sempre são necessários somente 2 líderes.
// =====================================================

const filas = {};

for (const valor of VALORES) {

    filas[valor] = {};

    for (const modalidade of MODALIDADES) {

        filas[valor][modalidade] = new Map();

    }
}

// =====================================================
// COMANDO /PAINEL
// =====================================================

const commands = [

    new SlashCommandBuilder()
        .setName("painel")
        .setDescription("Cria o painel de uma modalidade.")

        .addStringOption(option =>
            option
                .setName("modalidade")
                .setDescription("Escolha a modalidade do painel.")
                .setRequired(true)

                .addChoices(
                    {
                        name: "1v1",
                        value: "1x1"
                    },
                    {
                        name: "2v2",
                        value: "2x2"
                    },
                    {
                        name: "3v3",
                        value: "3x3"
                    },
                    {
                        name: "4v4",
                        value: "4x4"
                    }
                )
        )

        .toJSON()

];

// =====================================================
// REGISTRAR COMANDO
// =====================================================

async function registrarComandos() {

    try {

        const rest = new REST({
            version: "10"
        }).setToken(TOKEN);

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

        console.error(
            "❌ Erro ao registrar comando:",
            error
        );

    }
}

// =====================================================
// FORMATAR VALOR
// =====================================================

function valorFormatado(valor) {

    return `R$ ${valor.replace(".", ",")}`;

}

// =====================================================
// PROCURAR JOGADOR
// =====================================================

function procurarJogador(userId) {

    for (const valor of VALORES) {

        for (const modalidade of MODALIDADES) {

            if (
                filas[valor][modalidade].has(userId)
            ) {

                return {
                    valor,
                    modalidade
                };

            }

        }

    }

    return null;

}

// =====================================================
// NOME DA PARTIDA
// =====================================================

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
        nomes[
            Math.floor(
                Math.random() * nomes.length
            )
        ];

    const numero =
        Math.floor(
            Math.random() * 99999
        ) + 1;

    return `🐍-${modalidade}-${nome}-${numero}`;

}

// =====================================================
// CRIAR PAINEL
//
// Cada /painel cria somente UMA modalidade.
//
// Exemplo:
//
// /painel modalidade:1v1
//
// Cria painéis somente de 1v1.
//
// /painel modalidade:2v2
//
// Cria painéis somente de 2v2.
// =====================================================

function criarPainel(valor, modalidade) {

    const quantidade =
        filas[valor][modalidade].size;

    const embed =
        new EmbedBuilder()

            .setTitle(
                `🐍 VIPER AP • ${modalidade.toUpperCase()}`
            )

            .setDescription(

                `🎮 **${modalidade.toUpperCase()} Mobile**\n\n` +

                `💰 **Valor:** ${valorFormatado(valor)}\n\n` +

                `👥 **Jogadores na fila:** ${quantidade}/2\n\n` +

                (
                    quantidade === 0
                        ? "Nenhum jogador na fila."
                        : `👑 ${quantidade} líder(es) aguardando partida.`
                ) +

                `\n\n` +

                `━━━━━━━━━━━━━━━━━━━━\n\n` +

                `👑 **Cada jogador representa seu time.**\n\n` +

                `⚡ **Somente 2 líderes são necessários para iniciar.**`

            )

            .setColor(0x111111)

            .setFooter({
                text:
                    "VIPER • FOCO • DISCIPLINA • VITÓRIA"
            });

    if (BANNER_URL) {

        embed.setImage(BANNER_URL);

    }

    // =================================================
    // ENTRAR
    // =================================================

    const entrar =
        new ButtonBuilder()

            .setCustomId(
                `entrar_${valor}_${modalidade}`
            )

            .setLabel(
                "Entrar na Fila"
            )

            .setEmoji("✅")

            .setStyle(
                ButtonStyle.Success
            );

    // =================================================
    // SAIR
    // =================================================

    const sair =
        new ButtonBuilder()

            .setCustomId(
                `sair_${valor}_${modalidade}`
            )

            .setLabel(
                "Sair da Fila"
            )

            .setEmoji("❌")

            .setStyle(
                ButtonStyle.Danger
            );

    const linha =
        new ActionRowBuilder()
            .addComponents(
                entrar,
                sair
            );

    return {

        embeds: [
            embed
        ],

        components: [
            linha
        ]

    };

}

// =====================================================
// ATUALIZAR PAINEL
// =====================================================

async function atualizarPainel(
    interaction,
    valor,
    modalidade
) {

    try {

        await interaction.message.edit(
            criarPainel(
                valor,
                modalidade
            )
        );

    } catch (error) {

        console.log(
            "⚠️ Não consegui atualizar o painel:",
            error.message
        );

    }

}

// =====================================================
// ESCOLHER MEDIADOR
// =====================================================

async function escolherMediador(guild) {

    if (!MEDIADOR_ROLE_ID) {

        console.log(
            "❌ MEDIADOR_ROLE_ID não configurado."
        );

        return null;

    }

    const role =
        await guild.roles
            .fetch(MEDIADOR_ROLE_ID)
            .catch(() => null);

    if (!role) {

        console.log(
            "❌ Cargo de mediador não encontrado."
        );

        return null;

    }

    const lista =
        [...role.members.values()]
            .filter(
                membro =>
                    !membro.user.bot
            );

    if (lista.length === 0) {

        console.log(
            "❌ Nenhum mediador disponível."
        );

        return null;

    }

    return lista[
        Math.floor(
            Math.random() * lista.length
        )
    ];

}

// =====================================================
// OBTER CANAL DA MODALIDADE
//
// Cada modalidade usa EXATAMENTE seu próprio ID.
//
// 1x1 -> FILA_1X1_ID
// 2x2 -> FILA_2X2_ID
// 3x3 -> FILA_3X3_ID
// 4x4 -> FILA_4X4_ID
// =====================================================

async function obterCanalFila(
    guild,
    modalidade
) {

    const filaId =
        FILAS_ID[modalidade];

    if (!filaId) {

        console.log(
            `❌ ID da fila ${modalidade} não configurado.`
        );

        return null;

    }

    const canal =
        await guild.channels
            .fetch(filaId)
            .catch(() => null);

    if (!canal) {

        console.log(
            `❌ Canal da fila ${modalidade} não encontrado.`
        );

        return null;

    }

    return canal;

}

// =====================================================
// CRIAR PARTIDA
// =====================================================

async function criarPartida(
    guild,
    valor,
    modalidade
) {

    const fila =
        filas[valor][modalidade];

    // =================================================
    // SOMENTE 2 LÍDERES
    // =================================================

    if (fila.size < 2) {
        return;
    }

    // =================================================
    // PEGAR OS 2 PRIMEIROS LÍDERES
    // =================================================

    const jogadores =
        [...fila.values()]
            .slice(0, 2);

    // =================================================
    // MEDIADOR
    // =================================================

    const mediador =
        await escolherMediador(guild);

    if (!mediador) {

        console.log(
            "❌ Partida não criada: mediador indisponível."
        );

        return;

    }

    // =================================================
    // CANAL DA MODALIDADE
    //
    // AQUI ESTÁ A SEPARAÇÃO:
    //
    // 1x1 NÃO vai para o canal do 2x2.
    // 2x2 NÃO vai para o canal do 3x3.
    // etc.
    // =================================================

    const canalFila =
        await obterCanalFila(
            guild,
            modalidade
        );

    if (!canalFila) {

        console.log(
            `❌ Não foi possível encontrar a fila ${modalidade}.`
        );

        return;

    }

    // =================================================
    // BUSCAR OS DOIS LÍDERES
    // =================================================

    const membros = [];

    for (const jogador of jogadores) {

        const membro =
            await guild.members
                .fetch(jogador.id)
                .catch(() => null);

        if (membro) {

            membros.push(
                membro
            );

        }

    }

    if (membros.length !== 2) {

        console.log(
            "❌ Não consegui encontrar os dois líderes."
        );

        return;

    }

    // =================================================
    // CRIAR TÓPICO
    //
    // O tópico é criado DENTRO DO CANAL
    // DA MODALIDADE CORRESPONDENTE.
    // =================================================

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

                invitable:
                    false,

                autoArchiveDuration:
                    10080,

                reason:
                    `VIPER AP | ${modalidade} | ${valorFormatado(valor)}`

            });

    } catch (error) {

        console.error(
            `❌ Erro criando tópico ${modalidade}:`,
            error
        );

        return;

    }

    console.log(
        `🧵 Tópico ${modalidade} criado: ${thread.name}`
    );

    // =================================================
    // REMOVER OS 2 LÍDERES DA FILA
    // =================================================

    for (const jogador of jogadores) {

        fila.delete(
            jogador.id
        );

    }

    // =================================================
    // ADICIONAR OS 2 LÍDERES
    // =================================================

    for (const membro of membros) {

        await thread.members
            .add(membro.id)
            .catch(error => {

                console.log(
                    `⚠️ Erro adicionando ${membro.user.tag}:`,
                    error.message
                );

            });

    }

    // =================================================
    // ADICIONAR MEDIADOR
    // =================================================

    await thread.members
        .add(mediador.id)
        .catch(error => {

            console.log(
                "⚠️ Erro adicionando mediador:",
                error.message
            );

        });

    // =================================================
    // MENSAGEM DA PARTIDA
    // =================================================

    const listaTimes =

        membros
            .map(
                (membro, index) =>
                    `👑 **Time ${index + 1}:** ${membro}`
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

                `${listaTimes}\n\n` +

                `🛡️ **Mediador:** ${mediador}\n\n` +

                `━━━━━━━━━━━━━━━━━━━━\n\n` +

                `👑 Cada líder representa seu time.\n\n` +

                `🎯 Boa partida!`

            )

            .setColor(0x111111);

    if (BANNER_URL) {

        embed.setImage(
            BANNER_URL
        );

    }

    // =================================================
    // FINALIZAR
    // =================================================

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

    const linha =
        new ActionRowBuilder()
            .addComponents(
                finalizar
            );

    // =================================================
    // ENVIAR PARTIDA
    // =================================================

    await thread.send({

        content:
            `${membros.join(" ")} ${mediador}`,

        embeds: [
            embed
        ],

        components: [
            linha
        ]

    });

    console.log(
        `🎮 Partida ${modalidade} criada com sucesso!`
    );

}

// =====================================================
// BOT ONLINE
// =====================================================

client.once(
    "ready",
    async () => {

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
            "━━━━━━━━━━━━━━━━━━━━"
        );

        await registrarComandos();

    }
);

// =====================================================
// INTERAÇÕES
// =====================================================

client.on(
    "interactionCreate",
    async interaction => {

        try {

            // =================================================
            // /PAINEL
            // =================================================

            if (
                interaction.isChatInputCommand()
            ) {

                if (
                    interaction.commandName ===
                    "painel"
                ) {

                    const modalidade =
                        interaction.options
                            .getString(
                                "modalidade"
                            );

                    // =============================================
                    // CANAL ONDE O PAINEL SERÁ ENVIADO
                    // =============================================

                    const canal =
                        CANAL_PAINEL_ID
                            ? await client.channels
                                .fetch(
                                    CANAL_PAINEL_ID
                                )
                                .catch(
                                    () => null
                                )
                            : interaction.channel;

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

                    // =============================================
                    // CRIA SOMENTE A MODALIDADE ESCOLHIDA
                    // =============================================

                    for (
                        const valor of VALORES
                    ) {

                        await canal.send(
                            criarPainel(
                                valor,
                                modalidade
                            )
                        );

                    }

                    return;

                }

            }

            // =================================================
            // IGNORAR NÃO-BOTÕES
            // =================================================

            if (!interaction.isButton()) {
                return;
            }

            const customId =
                interaction.customId;

            // =================================================
            // FINALIZAR PARTIDA
            // =================================================

            if (
                customId.startsWith(
                    "finalizar_"
                )
            ) {

                if (
                    !MEDIADOR_ROLE_ID ||
                    !interaction.member.roles.cache.has(
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

                        const thread =
                            await client.channels
                                .fetch(
                                    threadId
                                )
                                .catch(
                                    () => null
                                );

                        if (!thread) {
                            return;
                        }

                        await thread.delete(
                            "Partida VIPER AP finalizada"
                        )
                            .catch(
                                error => {

                                    console.log(
                                        "❌ Erro ao excluir tópico:",
                                        error.message
                                    );

                                }
                            );

                        console.log(
                            `🗑️ Tópico ${threadId} excluído.`
                        );

                    },
                    1500
                );

                return;

            }

            // =================================================
            // ENTRAR NA FILA
            // =================================================

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

                // =============================================
                // VERIFICAR SE JÁ ESTÁ EM OUTRA FILA
                // =============================================

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

                // =============================================
                // VERIFICAR LIMITE
                // =============================================

                if (
                    filas[valor][modalidade].size >= 2
                ) {

                    return interaction.reply({

                        content:
                            "⏳ Essa fila já está completa. Aguarde a próxima partida.",

                        ephemeral: true

                    });

                }

                // =============================================
                // ADICIONAR LÍDER
                // =============================================

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

                        `✅ Você entrou na fila **${modalidade.toUpperCase()} • ${valorFormatado(valor)}**!\n\n` +

                        `👑 Você será o representante do seu time.\n\n` +

                        `⚡ Quando houver 2 líderes, a partida será criada automaticamente.`,

                    ephemeral: true

                });

                // =============================================
                // ATUALIZAR PAINEL
                // =============================================

                await atualizarPainel(
                    interaction,
                    valor,
                    modalidade
                );

                // =============================================
                // 2 LÍDERES = CRIAR PARTIDA
                // =============================================

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

            // =================================================
            // SAIR DA FILA
            // =================================================

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

                if (
                    !filas[valor][modalidade]
                        .has(
                            interaction.user.id
                        )
                ) {

                    return interaction.reply({

                        content:
                            "❌ Você não está nessa fila.",

                        ephemeral: true

                    });

                }

                filas[valor][modalidade]
                    .delete(
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

            if (
                !interaction.replied &&
                !interaction.deferred
            ) {

                await interaction.reply({

                    content:
                        "❌ Ocorreu um erro ao executar essa ação.",

                    ephemeral: true

                });

            }

        }

    }
);

// =====================================================
// VERIFICAÇÕES
// =====================================================

if (!TOKEN) {

    console.log(
        "❌ DISCORD_TOKEN não configurado!"
    );

}

if (!CLIENT_ID) {

    console.log(
        "❌ CLIENT_ID não configurado!"
    );

}

if (!GUILD_ID) {

    console.log(
        "❌ GUILD_ID não configurado!"
    );

}

for (const modalidade of MODALIDADES) {

    if (!FILAS_ID[modalidade]) {

        console.log(
            `⚠️ FILA_${modalidade.replace("x", "X")}_ID não configurada!`
        );

    }

}

// =====================================================
// LOGIN
// =====================================================

if (TOKEN) {

    client.login(
        TOKEN
    );

}
