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

// =====================================================
// RENDER
// =====================================================

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.status(200).send("🐍 VIPER AP está online!");
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "online",
        discord: client && client.isReady()
            ? "online"
            : "connecting"
    });
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

const CANAL_PAINEL_ID =
    process.env.CANAL_PAINEL_ID;

const MEDIADOR_ROLE_ID =
    process.env.MEDIADOR_ROLE_ID;

const BANNER_URL =
    process.env.BANNER_URL || "";

// =====================================================
// CANAIS DAS FILAS
// =====================================================

const FILAS_ID = {
    "1x1": process.env.FILA_1X1_ID,
    "2x2": process.env.FILA_2X2_ID,
    "3x3": process.env.FILA_3X3_ID,
    "4x4": process.env.FILA_4X4_ID
};

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
// SEMPRE 2 REPRESENTANTES
// =====================================================

const LIMITE_FILA = 2;

// =====================================================
// VALORES
// =====================================================

const VALORES = [
    "100.00",
    "50.00",
    "20.00",
    "10.00",
    "5.00",
    "4.00",
    "3.00",
    "2.00",
    "1.00"
];

// =====================================================
// CLIENT DISCORD
// =====================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

// =====================================================
// FILAS
// =====================================================

const filas = {};

for (const valor of VALORES) {

    filas[valor] = {};

    for (const modalidade of MODALIDADES) {

        filas[valor][modalidade] = new Map();

    }
}

// =====================================================
// CONTROLE DE PARTIDAS
// =====================================================

const criandoPartida = new Set();

// =====================================================
// COMANDO /PAINEL
// =====================================================

const commands = [

    new SlashCommandBuilder()

        .setName("painel")

        .setDescription(
            "Cria os painéis de uma modalidade."
        )

        .addStringOption(option =>
            option
                .setName("modalidade")
                .setDescription(
                    "Escolha a modalidade."
                )
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
                filas[valor][modalidade]
                    .has(userId)
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
            Math.random() * 999999
        ) + 1;

    return `🐍-${modalidade}-${nome}-${numero}`;

}

// =====================================================
// CRIAR PAINEL
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

                `👥 **Representantes na fila:** ${quantidade}/2\n\n` +

                `📌 Cada representante representa um time inteiro.\n\n` +

                `🟢 Clique em **Entrar na Fila** para participar.\n` +

                `🔴 Clique em **Sair da Fila** para sair.`

            )

            .setColor(0x111111)

            .setFooter({
                text:
                    "🐍 VIPER AP • Sistema de Filas"
            });

    if (BANNER_URL) {

        embed.setImage(BANNER_URL);

    }

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
        embeds: [embed],
        components: [linha]
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

        if (!interaction.message) {
            return;
        }

        await interaction.message.edit(
            criarPainel(
                valor,
                modalidade
            )
        );

    } catch (error) {

        console.log(
            `⚠️ Erro atualizando painel: ${error.message}`
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
// OBTER CANAL DA FILA
// =====================================================

async function obterCanalFila(
    guild,
    modalidade
) {

    const filaId =
        FILAS_ID[modalidade];

    if (!filaId) {

        console.log(
            `❌ Canal da fila ${modalidade} não configurado.`
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

    const chave =
        `${valor}_${modalidade}`;

    // Evita criar duas partidas ao mesmo tempo
    if (criandoPartida.has(chave)) {
        return;
    }

    const fila =
        filas[valor][modalidade];

    // Sempre são necessários 2 REPRESENTANTES
    if (fila.size < LIMITE_FILA) {
        return;
    }

    criandoPartida.add(chave);

    try {

        // =================================================
        // PEGAR OS 2 REPRESENTANTES
        // =================================================

        const jogadores =
            [...fila.values()].slice(0, 2);

        if (jogadores.length !== 2) {
            return;
        }

        // =================================================
        // BUSCAR OS MEMBROS
        // =================================================

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

            console.log(
                "❌ Não consegui encontrar os 2 representantes."
            );

            return;
        }

        // =================================================
        // ESCOLHER MEDIADOR
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
        // =================================================

        const canalFila =
            await obterCanalFila(
                guild,
                modalidade
            );

        if (!canalFila) {
            return;
        }

        // =================================================
        // VERIFICAR PERMISSÃO DO BOT
        // =================================================

        const botMember =
            guild.members.me;

        if (botMember) {

            const permissoes =
                canalFila.permissionsFor(
                    botMember
                );

            if (
                permissoes &&
                !permissoes.has(
                    PermissionsBitField.Flags.CreatePrivateThreads
                )
            ) {

                console.log(
                    `❌ Sem permissão para criar tópicos privados em ${modalidade}.`
                );

                return;
            }
        }

        // =================================================
        // CRIAR TÓPICO PRIVADO
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
                "❌ Erro criando tópico:",
                error
            );

            return;
        }

        // =================================================
        // REMOVER OS 2 REPRESENTANTES DA FILA
        // =================================================

        for (const jogador of jogadores) {

            fila.delete(
                jogador.id
            );

        }

        // =================================================
        // CADA REPRESENTANTE = UM TIME INTEIRO
        // =================================================

        const time1 =
            membros[0];

        const time2 =
            membros[1];

        // =================================================
        // ADICIONAR REPRESENTANTE DO TIME 1
        // =================================================

        await thread.members
            .add(time1.id)
            .catch(error => {

                console.log(
                    "⚠️ Erro adicionando Time 1:",
                    error.message
                );

            });

        // =================================================
        // ADICIONAR REPRESENTANTE DO TIME 2
        // =================================================

        await thread.members
            .add(time2.id)
            .catch(error => {

                console.log(
                    "⚠️ Erro adicionando Time 2:",
                    error.message
                );

            });

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
        // EMBED DA PARTIDA
        // =================================================

        const embed =
            new EmbedBuilder()

                .setTitle(
                    "🐍 VIPER AP • PARTIDA"
                )

                .setDescription(

                    `🎮 **Modalidade:** ${modalidade.toUpperCase()}\n\n` +

                    `💰 **Valor:** ${valorFormatado(valor)}\n\n` +

                    `🔵 **TIME 1**\n` +
                    `👤 Representante: ${time1}\n\n` +

                    `🔴 **TIME 2**\n` +
                    `👤 Representante: ${time2}\n\n` +

                    `🛡️ **MEDIADOR**\n` +
                    `${mediador}\n\n` +

                    `📌 Cada representante é responsável pelo seu time inteiro.`

                )

                .setColor(0x111111)

                .setFooter({
                    text:
                        "🐍 VIPER AP • Boa partida!"
                });

        if (BANNER_URL) {

            embed.setImage(
                BANNER_URL
            );

        }

        // =================================================
        // BOTÃO FINALIZAR
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
                `🔵 **TIME 1:** <@${time1.id}>\n` +
                `🔴 **TIME 2:** <@${time2.id}>\n` +
                `🛡️ **MEDIADOR:** <@${mediador.id}>`,

            embeds: [
                embed
            ],

            components: [
                linha
            ]

        });

        console.log(
            `🎮 PARTIDA CRIADA | ${modalidade} | ${valorFormatado(valor)}`
        );

    } catch (error) {

        console.error(
            "❌ ERRO AO CRIAR PARTIDA:",
            error
        );

    } finally {

        criandoPartida.delete(
            chave
        );

    }

}

// =====================================================
// REGISTRAR COMANDOS
// =====================================================

async function registrarComandos() {

    if (
        !TOKEN ||
        !CLIENT_ID ||
        !GUILD_ID
    ) {

        console.log(
            "⚠️ Configuração incompleta para registrar comandos."
        );

        return;
    }

    try {

        const rest =
            new REST({
                version: "10"
            }).setToken(
                TOKEN
            );

        await rest.put(

            Routes.applicationGuildCommands(
                CLIENT_ID,
                GUILD_ID
            ),

            {
                body: commands
            }

        );

        console.log(
            "✅ /painel registrado!"
        );

    } catch (error) {

        console.error(
            "❌ Erro registrando /painel:",
            error
        );

    }

}

// =====================================================
// BOT ONLINE
// =====================================================

client.once(
    "ready",
    async () => {

        console.log(
            "━━━━━━━━━━━━━━━━━━━━━━━━"
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
            "━━━━━━━━━━━━━━━━━━━━━━━━"
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
                    interaction.commandName !==
                    "painel"
                ) {

                    return;
                }

                const modalidade =
                    interaction.options
                        .getString(
                            "modalidade"
                        );

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

                // =================================================
                // CRIAR OS 9 PAINÉIS DA MODALIDADE
                // =================================================

                for (
                    const valor of VALORES
                ) {

                    try {

                        await canal.send(
                            criarPainel(
                                valor,
                                modalidade
                            )
                        );

                    } catch (error) {

                        console.log(
                            `⚠️ Erro enviando painel ${valor}:`,
                            error.message
                        );

                    }

                }

                return;
            }

            // =================================================
            // IGNORAR OUTRAS INTERAÇÕES
            // =================================================

            if (
                !interaction.isButton()
            ) {

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

                if (!interaction.guild) {

                    return interaction.reply({

                        content:
                            "❌ Essa ação só pode ser usada no servidor.",

                        ephemeral: true

                    });
                }

                const membro =
                    await interaction.guild.members
                        .fetch(
                            interaction.user.id
                        )
                        .catch(
                            () => null
                        );

                const ehMediador =
                    membro &&
                    MEDIADOR_ROLE_ID &&
                    membro.roles.cache.has(
                        MEDIADOR_ROLE_ID
                    );

                if (!ehMediador) {

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
                            );

                            console.log(
                                `🗑️ Partida ${threadId} excluída.`
                            );

                        } catch (error) {

                            console.log(
                                "❌ Erro excluindo partida:",
                                error.message
                            );

                        }

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

                // =================================================
                // VERIFICAR SE JÁ ESTÁ EM OUTRA FILA
                // =================================================

                const atual =
                    procurarJogador(
                        interaction.user.id
                    );

                if (atual) {

                    return interaction.reply({

                        content:
                            `⚠️ Você já está na fila de **${valorFormatado(atual.valor)} • ${atual.modalidade.toUpperCase()}**.`,

                        ephemeral: true

                    });
                }

                // =================================================
                // VERIFICAR LIMITE
                // =================================================

                if (
                    filas[valor][modalidade].size >=
                    LIMITE_FILA
                ) {

                    return interaction.reply({

                        content:
                            "⏳ Essa fila já está completa.",

                        ephemeral: true

                    });
                }

                // =================================================
                // ADICIONAR REPRESENTANTE
                // =================================================

                filas[valor][modalidade].set(

                    interaction.user.id,

                    {
                        id:
                            interaction.user.id,

                        username:
                            interaction.user.username
                    }

                );

                const quantidade =
                    filas[valor][modalidade].size;

                await interaction.reply({

                    content:
                        `✅ Você entrou na fila **${modalidade.toUpperCase()} • ${valorFormatado(valor)}**!\n\n` +
                        `👥 Representantes: **${quantidade}/2**`,

                    ephemeral: true

                });

                // =================================================
                // ATUALIZAR PAINEL
                // =================================================

                await atualizarPainel(

                    interaction,

                    valor,

                    modalidade

                );

                // =================================================
                // 2 REPRESENTANTES = CRIAR PARTIDA
                // =================================================

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
                "━━━━━━━━━━━━━━━━━━━━━━━━"
            );

            console.error(
                "❌ ERRO NA INTERAÇÃO:"
            );

            console.error(
                error
            );

            console.error(
                "━━━━━━━━━━━━━━━━━━━━━━━━"
            );

            try {

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

            } catch (replyError) {

                console.log(
                    "⚠️ Não foi possível responder:",
                    replyError.message
                );

            }

        }

    }
);
// =====================================================
// TRATAMENTO DE ERROS DO CLIENT
// =====================================================

client.on("error", error => {
    console.error("❌ Erro do Discord Client:", error);
});

client.on("warn", aviso => {
    console.warn("⚠️ Discord:", aviso);
});

process.on("unhandledRejection", error => {
    console.error(
        "❌ Unhandled Rejection:",
        error
    );
});

process.on("uncaughtException", error => {
    console.error(
        "❌ Uncaught Exception:",
        error
    );
});

// =====================================================
// VERIFICAÇÕES DE CONFIGURAÇÃO
// =====================================================

console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━"
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
        "⚠️ MEDIADOR_ROLE_ID não configurado."
    );
}

for (const modalidade of MODALIDADES) {

    if (!FILAS_ID[modalidade]) {

        console.warn(
            `⚠️ FILA_${modalidade.replace("x", "X")}_ID não configurado!`
        );

    } else {

        console.log(
            `✅ Canal ${modalidade}: configurado`
        );

    }
}

console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━"
);

// =====================================================
// LOGIN DO BOT
// =====================================================

async function iniciarBot() {

    if (!TOKEN) {

        console.error(
            "❌ Bot não iniciado porque DISCORD_TOKEN está faltando."
        );

        return;

    }

    try {

        console.log(
            "🔄 Conectando ao Discord..."
        );

        await client.login(
            TOKEN
        );

    } catch (error) {

        console.error(
            "❌ Não foi possível conectar ao Discord:"
        );

        console.error(
            error
        );

        // Não derruba o servidor HTTP do Render
        // O Render continua conseguindo acessar /health

    }

}

// =====================================================
// INICIAR
// =====================================================

iniciarBot();
