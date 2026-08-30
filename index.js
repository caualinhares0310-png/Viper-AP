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

// =====================================================
// BANNER DO PAINEL
// =====================================================
//
// Coloque no Render uma variável:
//
// BANNER_URL = link da imagem da VIPER
//
// Não precisa de Nitro.
// Pode ser um link de imagem hospedado no Discord.
//
// =====================================================

const BANNER_URL = process.env.BANNER_URL;

// =====================================================
// ID DO LOCAL DE CADA MODALIDADE
// =====================================================
//
// Você já colocou esses IDs no Render.
//
// 1x1 -> FILA_1X1_ID
// 2x2 -> FILA_2X2_ID
// 3x3 -> FILA_3X3_ID
// 4x4 -> FILA_4X4_ID
//
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
// CADA FILA
// =====================================================
//
// IMPORTANTE:
//
// Só precisamos de 2 pessoas.
//
// Exemplo:
//
// 4x4
//
// Jogador 1 = Líder do Time 1
// Jogador 2 = Líder do Time 2
//
// Cada líder representa seu time inteiro.
//
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
        .setDescription("Cria os painéis das filas VIPER AP.")
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
            "❌ Erro ao registrar /painel:",
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
        "combate",
        "elite",
        "clash",
        "match",
        "vitoria",
        "imperio"
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
// =====================================================

function criarPainel(valor) {

    const f1 =
        filas[valor]["1x1"].size;

    const f2 =
        filas[valor]["2x2"].size;

    const f3 =
        filas[valor]["3x3"].size;

    const f4 =
        filas[valor]["4x4"].size;

    const embed = new EmbedBuilder()

        .setTitle("VIPER AP • VIPER SYSTEM")

        .setDescription(

            `🎮 **${"1v1 Mobile"}**\n\n` +

            `💰 **Valor:** ${valorFormatado(valor)}\n\n` +

            `👥 **Jogadores:**\n` +

            `🥊 1x1 — **${f1}/2**\n` +
            `👥 2x2 — **${f2}/2**\n` +
            `👥 3x3 — **${f3}/2**\n` +
            `👥 4x4 — **${f4}/2**\n\n` +

            `━━━━━━━━━━━━━━━━━━━━\n\n` +

            `👑 **Cada jogador representa seu time.**\n` +
            `⚡ **Somente 2 líderes são necessários para iniciar.**`

        )

        .setColor(0x111111)

        .setFooter({
            text: "VIPER • FOCO • DISCIPLINA • VITÓRIA"
        });

    // =================================================
    // COLOCAR A IMAGEM NO PAINEL
    // =================================================

    if (BANNER_URL) {

        embed.setImage(BANNER_URL);

    }

    // =================================================
    // BOTÕES
    // =================================================

    const botao1 =
        new ButtonBuilder()

            .setCustomId(
                `entrar_${valor}_1x1`
            )

            .setLabel("1x1")

            .setEmoji("🥊")

            .setStyle(
                ButtonStyle.Secondary
            );


    const botao2 =
        new ButtonBuilder()

            .setCustomId(
                `entrar_${valor}_2x2`
            )

            .setLabel("2x2")

            .setEmoji("👥")

            .setStyle(
                ButtonStyle.Secondary
            );


    const botao3 =
        new ButtonBuilder()

            .setCustomId(
                `entrar_${valor}_3x3`
            )

            .setLabel("3x3")

            .setEmoji("👥")

            .setStyle(
                ButtonStyle.Secondary
            );


    const botao4 =
        new ButtonBuilder()

            .setCustomId(
                `entrar_${valor}_4x4`
            )

            .setLabel("4x4")

            .setEmoji("👥")

            .setStyle(
                ButtonStyle.Secondary
            );


    const sair =
        new ButtonBuilder()

            .setCustomId(
                `sair_${valor}`
            )

            .setLabel("Sair da Fila")

            .setEmoji("❌")

            .setStyle(
                ButtonStyle.Danger
            );


    const linha1 =
        new ActionRowBuilder()
            .addComponents(
                botao1,
                botao2,
                botao3,
                botao4
            );


    const linha2 =
        new ActionRowBuilder()
            .addComponents(
                sair
            );


    return {

        embeds: [
            embed
        ],

        components: [
            linha1,
            linha2
        ]

    };

}

// =====================================================
// ATUALIZAR PAINEL
// =====================================================

async function atualizarPainel(
    interaction,
    valor
) {

    try {

        await interaction.message.edit(
            criarPainel(valor)
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
            "❌ Nenhum mediador encontrado."
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
    // SÓ 2 LÍDERES
    // =================================================

    if (fila.size < 2) {

        return;

    }

    // =================================================
    // PEGAR OS 2 LÍDERES
    // =================================================

    const jogadores =
        [...fila.values()]
            .slice(0, 2);

    // =================================================
    // REMOVER DA FILA
    // =================================================

    for (const jogador of jogadores) {

        fila.delete(
            jogador.id
        );

    }

    // =================================================
    // MEDIADOR
    // =================================================

    const mediador =
        await escolherMediador(guild);

    if (!mediador) {

        // Devolve os líderes

        for (const jogador of jogadores) {

            fila.set(
                jogador.id,
                jogador
            );

        }

        return;

    }

    // =================================================
    // ID DO LOCAL DA MODALIDADE
    // =================================================

    const filaId =
        FILAS_ID[modalidade];

    if (!filaId) {

        console.log(
            `❌ ID da fila ${modalidade} não configurado no Render.`
        );

        for (const jogador of jogadores) {

            fila.set(
                jogador.id,
                jogador
            );

        }

        return;

    }

    // =================================================
    // BUSCAR LOCAL
    // =================================================

    const localBase =
        await guild.channels
            .fetch(filaId)
            .catch(() => null);

    if (!localBase) {

        console.log(
            `❌ Não encontrei o local da fila ${modalidade}.`
        );

        for (const jogador of jogadores) {

            fila.set(
                jogador.id,
                jogador
            );

        }

        return;

    }

    // =================================================
    // PEGAR CANAL PAI
    // =================================================

    let canalPai = localBase;

    if (localBase.isThread()) {

        canalPai =
            await guild.channels
                .fetch(
                    localBase.parentId
                )
                .catch(() => null);

    }

    if (!canalPai) {

        console.log(
            `❌ Canal pai da fila ${modalidade} não encontrado.`
        );

        for (const jogador of jogadores) {

            fila.set(
                jogador.id,
                jogador
            );

        }

        return;

    }

    // =================================================
    // BUSCAR OS 2 LÍDERES
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
            "❌ Não consegui encontrar os dois líderes."
        );

        for (const jogador of jogadores) {

            fila.set(
                jogador.id,
                jogador
            );

        }

        return;

    }

    // =================================================
    // CRIAR TÓPICO
    // =================================================

    let thread;

    try {

        thread =
            await canalPai.threads.create({

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
                    `VIPER AP • ${modalidade} • ${valorFormatado(valor)}`

            });

    } catch (error) {

        console.error(
            `❌ Erro criando partida ${modalidade}:`,
            error
        );

        // Devolve os líderes

        for (const jogador of jogadores) {

            fila.set(
                jogador.id,
                jogador
            );

        }

        return;

    }

    console.log(
        `🧵 Partida ${modalidade} criada: ${thread.name}`
    );

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
    // EMBED DA PARTIDA
    // =================================================

    const lista =
        membros
            .map(
                (membro, index) => {

                    return (
                        `👑 **Time ${index + 1}:** ${membro}`
                    );

                }
            )
            .join("\n");


    const embed =
        new EmbedBuilder()

            .setTitle(
                "🐍 VIPER AP • PARTIDA"
            )

            .setDescription(

                `🎮 **Modalidade:** ${modalidade}\n` +

                `💰 **Valor:** ${valorFormatado(valor)}\n\n` +

                `${lista}\n\n` +

                `🛡️ **Mediador:** ${mediador}\n\n` +

                `━━━━━━━━━━━━━━━━━━━━\n\n` +

                `👑 Cada líder representa seu time.\n` +

                `🔥 Boa partida!`

            )

            .setColor(
                0x111111
            );


    // =================================================
    // BANNER NA PARTIDA
    // =================================================

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
            `${membros.join(" ")} ${mediador}`,

        embeds: [
            embed
        ],

        components: [
            linha
        ]

    });


    console.log(
        `🎮 ${modalidade} • ${valorFormatado(valor)} • partida criada com sucesso!`
    );

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
            "━━━━━━━━━━━━━━━━━━━━━━━━"
        );

        // Verificação das configurações

        console.log(
            `1x1: ${FILAS_ID["1x1"] ? "✅" : "❌"}`
        );

        console.log(
            `2x2: ${FILAS_ID["2x2"] ? "✅" : "❌"}`
        );

        console.log(
            `3x3: ${FILAS_ID["3x3"] ? "✅" : "❌"}`
        );

        console.log(
            `4x4: ${FILAS_ID["4x4"] ? "✅" : "❌"}`
        );

        console.log(
            `Banner: ${BANNER_URL ? "✅" : "❌"}`
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
                            "🐍 Painéis VIPER AP criados!",

                        ephemeral: true

                    });


                    // =================================================
                    // CRIAR TODOS OS PAINÉIS
                    // =================================================

                    for (
                        const valor of VALORES
                    ) {

                        await canal.send(
                            criarPainel(valor)
                        );

                    }

                    return;

                }

            }

            // =================================================
            // BOTÕES
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

                // Só mediador

                if (
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
                            `🗑️ Partida ${threadId} excluída.`
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
                            `⚠️ Você já está na fila de **${valorFormatado(atual.valor)} • ${atual.modalidade}**.`,

                        ephemeral: true

                    });

                }


                // =================================================
                // ENTRAR
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


                await interaction.reply({

                    content:

                        `✅ Você entrou na fila **${valorFormatado(valor)} • ${modalidade}**!\n\n` +

                        `👑 Você será o representante do seu time.\n` +

                        `⚡ Aguarde outro líder entrar.`,

                    ephemeral: true

                });


                // =================================================
                // ATUALIZAR PAINEL
                // =================================================

                await atualizarPainel(
                    interaction,
                    valor
                );


                // =================================================
                // 2 LÍDERES = CRIAR PARTIDA
                // =================================================

                if (
                    filas[valor][modalidade]
                        .size >= 2
                ) {

                    await criarPartida(

                        interaction.guild,

                        valor,

                        modalidade

                    );


                    await atualizarPainel(

                        interaction,

                        valor

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

                const valor =
                    customId.replace(
                        "sair_",
                        ""
                    );


                if (!filas[valor]) {

                    return interaction.reply({

                        content:
                            "❌ Essa fila não existe.",

                        ephemeral: true

                    });

                }


                let modalidadeEncontrada =
                    null;


                // Procura em 1x1, 2x2, 3x3 e 4x4

                for (
                    const modalidade of MODALIDADES
                ) {

                    if (
                        filas[valor][modalidade]
                            .has(
                                interaction.user.id
                            )
                    ) {

                        filas[valor][modalidade]
                            .delete(
                                interaction.user.id
                            );


                        modalidadeEncontrada =
                            modalidade;


                        break;

                    }

                }


                if (
                    !modalidadeEncontrada
                ) {

                    return interaction.reply({

                        content:
                            "❌ Você não está em nenhuma fila desse valor.",

                        ephemeral: true

                    });

                }


                await interaction.reply({

                    content:

                        `❌ Você saiu da fila **${valorFormatado(valor)} • ${modalidadeEncontrada}**.`,

                    ephemeral: true

                });


                await atualizarPainel(

                    interaction,

                    valor

                );


                return;

            }

        } catch (error) {

            console.error(
                "❌ Erro na interação:",
                error
            );


            if (
                !interaction.replied &&
                !interaction.deferred
            ) {

                await interaction.reply({

                    content:
                        "❌ Ocorreu um erro no bot.",

                    ephemeral: true

                });

            }

        }

    }
);

// =====================================================
// LOGIN
// =====================================================

if (!TOKEN) {

    console.log(
        "❌ DISCORD_TOKEN não configurado!"
    );

} else {

    client.login(
        TOKEN
    );

}
