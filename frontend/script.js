
const API_URL = "http://127.0.0.1:8001";

// Dados da aplicação
let todasTransacoes = [];
let graficoFinanceiro = null;
let graficoCategorias = null;

// Categorias
const categorias = [
    "Outros",
    "Alimentação",
    "Moradia",
    "Transporte",
    "Saúde",
    "Educação",
    "Lazer",
    "Salário",
    "Investimentos"
];

// ====================================
// 1. FORMATAÇÃO
// ====================================

function formatarDinheiro(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function dataHoje() {
    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function formatarData(data) {
    if (!data) return "Sem data";

    const partes = data.split("-");

    if (partes.length !== 3) return data;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function dataValida(data) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return false;
    }

    const [ano, mes, dia] = data.split("-").map(Number);

    const verificacao = new Date(ano, mes - 1, dia);

    return verificacao.getFullYear() === ano &&
        verificacao.getMonth() === mes - 1 &&
        verificacao.getDate() === dia;
}

// ====================================
// 2. COMUNICAÇÃO COM FASTAPI
// ====================================

async function buscarDados(caminho) {
    const resposta = await fetch(`${API_URL}${caminho}`);

    if (!resposta.ok) {
        throw new Error(`Erro na API: ${resposta.status}`);
    }

    return await resposta.json();
}

async function enviarTransacao(caminho, metodo, dados) {
    const resposta = await fetch(`${API_URL}${caminho}`, {
        method: metodo,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dados)
    });

    if (!resposta.ok) {
        throw new Error(`Erro na API: ${resposta.status}`);
    }

    return await resposta.json();
}

// ====================================
// 3. FILTRAR POR INTERVALO DE DATAS
// ====================================

function obterTransacoesDoPeriodo() {
    const inicio = document.getElementById("data-inicial").value;
    const fim = document.getElementById("data-final").value;

    const mensagem = document.getElementById("mensagem-periodo");

    if (!dataValida(inicio) || !dataValida(fim)) {
        mensagem.textContent = "Selecione duas datas válidas.";
        return null;
    }

    if (inicio > fim) {
        mensagem.textContent =
            "A data inicial não pode ser posterior à data final.";
        return null;
    }

    mensagem.textContent =
        `Analisando de ${formatarData(inicio)} até ${formatarData(fim)}.`;

    // Datas em AAAA-MM-DD podem ser comparadas como texto.
    // O início e o fim também entram no resultado.
    return todasTransacoes.filter(transacao => {
        const data = transacao.data;

        return data &&
            data >= inicio &&
            data <= fim;
    });
}

// ====================================
// 4. CALCULAR RESUMO DO PERÍODO
// ====================================

function calcularResumo(transacoes) {
    let receitas = 0;
    let despesas = 0;

    for (const transacao of transacoes) {
        const valor = Number(transacao.valor);

        if (transacao.tipo === "receita") {
            receitas += valor;
        } else if (transacao.tipo === "despesa") {
            despesas += valor;
        }
    }

    return {
        receitas,
        despesas,
        saldo: receitas - despesas
    };
}

function mostrarResumo(resumo) {
    document.getElementById("receitas").textContent =
        formatarDinheiro(resumo.receitas);

    document.getElementById("despesas").textContent =
        formatarDinheiro(resumo.despesas);

    document.getElementById("saldo").textContent =
        formatarDinheiro(resumo.saldo);
}

// ====================================
// 5. GRÁFICO RECEITAS X DESPESAS
// ====================================

function carregarGraficoFinanceiro(resumo) {
    const canvas = document.getElementById("graficoFinanceiro");

    if (!canvas || typeof Chart === "undefined") {
        console.error("Chart.js não está disponível.");
        return;
    }

    if (graficoFinanceiro) {
        graficoFinanceiro.destroy();
    }

    graficoFinanceiro = new Chart(canvas, {
        type: "bar",
        data: {
            labels: ["Receitas", "Despesas"],
            datasets: [{
                label: "Valor (R$)",
                data: [resumo.receitas, resumo.despesas],
                backgroundColor: ["#16a34a", "#ef4444"],
                borderRadius: 8,
                maxBarThickness: 90
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: contexto =>
                            formatarDinheiro(contexto.parsed.y)
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// ====================================
// 6. GRÁFICO DE GASTOS POR CATEGORIA
// ====================================

function carregarGraficoCategorias(transacoes) {
    const canvas = document.getElementById("graficoCategorias");
    const mensagem = document.getElementById("sem-despesas");

    if (!canvas || typeof Chart === "undefined") {
        console.error("Chart.js não está disponível.");
        return;
    }

    const totais = {};

    for (const transacao of transacoes) {
        if (transacao.tipo === "despesa") {
            const categoria = transacao.categoria || "Outros";

            totais[categoria] =
                (totais[categoria] || 0) + Number(transacao.valor);
        }
    }

    if (graficoCategorias) {
        graficoCategorias.destroy();
        graficoCategorias = null;
    }

    const nomes = Object.keys(totais);
    const valores = Object.values(totais);

    if (nomes.length === 0) {
        canvas.style.display = "none";
        mensagem.hidden = false;
        return;
    }

    canvas.style.display = "block";
    mensagem.hidden = true;

    graficoCategorias = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: nomes,
            datasets: [{
                data: valores,
                backgroundColor: [
                    "#2563eb",
                    "#16a34a",
                    "#f59e0b",
                    "#8b5cf6",
                    "#ef4444",
                    "#06b6d4",
                    "#ec4899",
                    "#64748b"
                ],
                borderWidth: 2,
                borderColor: "#ffffff"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "65%",
            plugins: {
                legend: {
                    position: "bottom"
                },
                tooltip: {
                    callbacks: {
                        label: contexto =>
                            contexto.label + ": " +
                            formatarDinheiro(contexto.parsed)
                    }
                }
            }
        }
    });
}

// ====================================
// 7. ATUALIZAR RESUMO E GRÁFICOS
// ====================================

function atualizarAnalisePeriodo() {
    const transacoes = obterTransacoesDoPeriodo();

    // Se o intervalo estiver inválido, não mostrar
    // resultados que poderiam ser interpretados errado.
    if (transacoes === null) {
        document.getElementById("receitas").textContent = "—";
        document.getElementById("despesas").textContent = "—";
        document.getElementById("saldo").textContent = "—";

        carregarGraficoFinanceiro({
            receitas: 0,
            despesas: 0
        });

        carregarGraficoCategorias([]);
        return;
    }

    const resumo = calcularResumo(transacoes);

    mostrarResumo(resumo);
    carregarGraficoFinanceiro(resumo);
    carregarGraficoCategorias(transacoes);
}

// ====================================
// 8. CARREGAR TODAS AS TRANSAÇÕES
// ====================================

async function carregarTransacoes() {
    todasTransacoes = await buscarDados("/transacoes");

    filtrarTransacoes();

    return todasTransacoes;
}

// ====================================
// 9. FILTROS DA TABELA
// ====================================

function filtrarTransacoes() {
    const pesquisa = document
        .getElementById("pesquisar-transacao")
        .value.toLowerCase().trim();

    const tipo = document.getElementById("filtrar-tipo").value;
    const categoria = document.getElementById("filtrar-categoria").value;

    const filtradas = todasTransacoes.filter(transacao => {
        const correspondePesquisa = transacao.descricao
            .toLowerCase().includes(pesquisa);

        const correspondeTipo =
            tipo === "todos" || transacao.tipo === tipo;

        const correspondeCategoria =
            categoria === "todas" ||
            (transacao.categoria || "Outros") === categoria;

        return correspondePesquisa &&
            correspondeTipo &&
            correspondeCategoria;
    });

    renderizarTabela(filtradas);
}

// ====================================
// 10. DESENHAR TABELA
// ====================================

function renderizarTabela(transacoes) {
    const tabela = document.getElementById("lista-transacoes");
    tabela.innerHTML = "";

    if (transacoes.length === 0) {
        const linha = document.createElement("tr");
        const celula = document.createElement("td");

        celula.colSpan = 6;
        celula.textContent = "Nenhuma transação encontrada.";
        celula.style.textAlign = "center";

        linha.appendChild(celula);
        tabela.appendChild(linha);
        return;
    }

    for (const transacao of transacoes) {
        const linha = document.createElement("tr");

        const descricao = document.createElement("td");
        descricao.textContent = transacao.descricao;

        const categoria = document.createElement("td");
        categoria.textContent = transacao.categoria || "Outros";

        const data = document.createElement("td");
        data.textContent = formatarData(transacao.data);

        const tipo = document.createElement("td");
        tipo.textContent = transacao.tipo === "receita"
            ? "Receita"
            : "Despesa";

        const valor = document.createElement("td");
        valor.textContent =
            (transacao.tipo === "receita" ? "+ " : "- ") +
            formatarDinheiro(transacao.valor);

        valor.className = transacao.tipo === "receita"
            ? "valor-receita"
            : "valor-despesa";

        const acoes = document.createElement("td");
        const grupo = document.createElement("div");
        grupo.className = "acoes-transacao";

        const editar = document.createElement("button");
        editar.textContent = "Editar";
        editar.className = "botao-editar";
        editar.addEventListener("click", () => {
            editarTransacao(transacao);
        });

        const excluir = document.createElement("button");
        excluir.textContent = "Excluir";
        excluir.className = "botao-excluir";
        excluir.addEventListener("click", () => {
            excluirTransacao(transacao.id);
        });

        grupo.appendChild(editar);
        grupo.appendChild(excluir);
        acoes.appendChild(grupo);

        linha.appendChild(descricao);
        linha.appendChild(categoria);
        linha.appendChild(data);
        linha.appendChild(tipo);
        linha.appendChild(valor);
        linha.appendChild(acoes);

        tabela.appendChild(linha);
    }
}

// ====================================
// 11. ATUALIZAR DASHBOARD COMPLETO
// ====================================


async function atualizarDashboard() {
    try {
        await carregarTransacoes();

        // Atualizar cartões e gráficos do período
        atualizarAnalisePeriodo();

        // Atualizar evolução usando todo o histórico
        carregarGraficoEvolucao(todasTransacoes);

    } catch (erro) {
        console.error("Erro ao atualizar dashboard:", erro);
        alert("Não foi possível atualizar o dashboard.");
    }
}

// ====================================
// 12. ADICIONAR TRANSAÇÃO
// ====================================

async function adicionarTransacao(evento) {
    evento.preventDefault();

    const formulario = document.getElementById("form-transacao");
    const descricao = document.getElementById("descricao").value.trim();
    const valor = Number(document.getElementById("valor").value);
    const tipo = document.getElementById("tipo").value;
    const categoria = document.getElementById("categoria").value;
    const data = document.getElementById("data").value;

    if (!descricao || !Number.isFinite(valor) ||
        valor <= 0 || !dataValida(data)) {
        alert("Preencha todos os campos corretamente.");
        return;
    }

    try {
        await enviarTransacao("/transacoes", "POST", {
            descricao,
            valor,
            tipo,
            categoria,
            data
        });

        formulario.reset();
        document.getElementById("data").value = dataHoje();

        await atualizarDashboard();

        alert("Transação adicionada com sucesso!");

    } catch (erro) {
        console.error("Erro ao adicionar:", erro);
        alert("Não foi possível adicionar a transação.");
    }
}

// ====================================
// 13. EDITAR TRANSAÇÃO
// ====================================


// ====================================
// EDITAR TRANSAÇÃO COM JANELA
// ====================================


// ====================================
// EDITAR TRANSAÇÃO COM JANELA
// ====================================

function editarTransacao(transacao) {
    // Preencher os campos com os dados existentes
    document.getElementById("editar-id").value =
        transacao.id;

    document.getElementById("editar-descricao").value =
        transacao.descricao;

    document.getElementById("editar-valor").value =
        transacao.valor;

    document.getElementById("editar-tipo").value =
        transacao.tipo;

    document.getElementById("editar-categoria").value =
        transacao.categoria || "Outros";

    document.getElementById("editar-data").value =
        transacao.data || dataHoje();

    // Mostrar a janela
    document.getElementById("modal-edicao").hidden = false;

    // Colocar o cursor na descrição
    document.getElementById("editar-descricao").focus();
}


// ====================================
// 14. EXCLUIR TRANSAÇÃO
// ====================================

async function excluirTransacao(id) {
    if (!confirm("Deseja excluir esta transação?")) {
        return;
    }

    try {
        const resposta = await fetch(
            `${API_URL}/transacoes/${id}`,
            { method: "DELETE" }
        );

        if (!resposta.ok) {
            throw new Error("Erro ao excluir transação");
        }

        await atualizarDashboard();
        alert("Transação excluída com sucesso!");

    } catch (erro) {
        console.error("Erro ao excluir:", erro);
        alert("Não foi possível excluir a transação.");
    }
}

// ====================================
// 15. INICIAR O FINCONTROL
// ====================================

document.addEventListener("DOMContentLoaded", () => {
    // Data atual no formulário de cadastro
    document.getElementById("data").value = dataHoje();

    // Formulário
    document.getElementById("form-transacao")
        .addEventListener("submit", adicionarTransacao);

    // Filtros independentes da tabela
    document.getElementById("pesquisar-transacao")
        .addEventListener("input", filtrarTransacoes);

    document.getElementById("filtrar-tipo")
        .addEventListener("change", filtrarTransacoes);

    document.getElementById("filtrar-categoria")
        .addEventListener("change", filtrarTransacoes);

    // Filtro personalizado de período
    document.getElementById("data-inicial")
        .addEventListener("change", atualizarAnalisePeriodo);

    document.getElementById("data-final")
        .addEventListener("change", atualizarAnalisePeriodo);

    // Carregar transações e gráficos
    atualizarDashboard();
});


// ====================================
// 16. ATALHOS DE PERÍODOS
// ====================================

// Converter uma data para AAAA-MM-DD
function converterData(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

// Destacar o botão selecionado
function ativarBotaoPeriodo(id) {
    const botoes = document.querySelectorAll(
        ".atalhos-periodo button"
    );

    botoes.forEach(botao => {
        botao.classList.remove("ativo");
    });

    document.getElementById(id).classList.add("ativo");
}

// Alterar o período e atualizar os gráficos
function selecionarPeriodo(tipo) {
    const hoje = new Date();
    let inicio = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate()
    );

    if (tipo === "mes") {
        inicio = new Date(
            hoje.getFullYear(),
            hoje.getMonth(),
            1
        );
    }

    if (tipo === "30dias") {
        inicio.setDate(inicio.getDate() - 29);
    }

    if (tipo === "ano") {
        inicio = new Date(hoje.getFullYear(), 0, 1);
    }

    if (tipo === "personalizado") {
        ativarBotaoPeriodo("btn-personalizado");
        document.getElementById("data-inicial").focus();
        return;
    }

    document.getElementById("data-inicial").value =
        converterData(inicio);

    document.getElementById("data-final").value =
        converterData(hoje);

    const ids = {
        mes: "btn-mes-atual",
        "30dias": "btn-ultimos-30",
        ano: "btn-ano-atual"
    };

    ativarBotaoPeriodo(ids[tipo]);

    atualizarAnalisePeriodo();
}

// Conectar botões
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-mes-atual")
        .addEventListener("click", () => selecionarPeriodo("mes"));

    document.getElementById("btn-ultimos-30")
        .addEventListener("click", () => selecionarPeriodo("30dias"));

    document.getElementById("btn-ano-atual")
        .addEventListener("click", () => selecionarPeriodo("ano"));

    document.getElementById("btn-personalizado")
        .addEventListener("click", () => selecionarPeriodo("personalizado"));

    // Marcar personalizado como opção inicial
    ativarBotaoPeriodo("btn-personalizado");

    // Se alterar uma data manualmente, marcar Personalizado
    ["data-inicial", "data-final"].forEach(id => {
        document.getElementById(id)
            .addEventListener("change", () => {
                ativarBotaoPeriodo("btn-personalizado");
            });
    });
});



// ====================================
// 17. GRÁFICO DE EVOLUÇÃO FINANCEIRA
// ====================================

// Guarda o gráfico para permitir atualizações
let graficoEvolucao = null;

function carregarGraficoEvolucao(transacoes) {
    const canvas = document.getElementById("graficoEvolucao");

    if (!canvas || typeof Chart === "undefined") {
        console.error("Gráfico de evolução indisponível.");
        return;
    }

    // Agrupar valores por mês
    const meses = {};

    for (const transacao of transacoes) {
        // Ignorar transações sem data
        if (!transacao.data) {
            continue;
        }

        // Exemplo: 2026-10-30 vira 2026-10
        const mes = transacao.data.slice(0, 7);

        if (!meses[mes]) {
            meses[mes] = {
                receitas: 0,
                despesas: 0
            };
        }

        if (transacao.tipo === "receita") {
            meses[mes].receitas += Number(transacao.valor);
        } else if (transacao.tipo === "despesa") {
            meses[mes].despesas += Number(transacao.valor);
        }
    }

    // Ordenar os meses
    const mesesOrdenados = Object.keys(meses).sort();

    // Criar os dados do gráfico
    const receitas = mesesOrdenados.map(
        mes => meses[mes].receitas
    );

    const despesas = mesesOrdenados.map(
        mes => meses[mes].despesas
    );

    // Converter AAAA-MM para MM/AAAA
    const nomesMeses = mesesOrdenados.map(mes => {
        const [ano, numeroMes] = mes.split("-");
        return `${numeroMes}/${ano}`;
    });

    // Destruir gráfico antigo antes de atualizar
    if (graficoEvolucao) {
        graficoEvolucao.destroy();
    }

    // Criar gráfico de linhas
    graficoEvolucao = new Chart(canvas, {
        type: "line",

        data: {
            labels: nomesMeses,

            datasets: [
                {
                    label: "Receitas",
                    data: receitas,
                    borderColor: "#16a34a",
                    backgroundColor: "#16a34a",
                    tension: 0.3,
                    fill: false
                },
                {
                    label: "Despesas",
                    data: despesas,
                    borderColor: "#ef4444",
                    backgroundColor: "#ef4444",
                    tension: 0.3,
                    fill: false
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "top"
                },
                tooltip: {
                    callbacks: {
                        label: contexto =>
                            contexto.dataset.label + ": " +
                            formatarDinheiro(contexto.parsed.y)
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


// ====================================
// 18. EXPORTAR TRANSAÇÕES PARA CSV
// ====================================

// Guardar texto de forma segura no arquivo CSV
function prepararCampoCSV(valor) {
    const texto = String(valor ?? "");

    return '"' + texto.replace(/"/g, '""') + '"';
}

// Buscar as transações que correspondem aos filtros
function obterTransacoesFiltradas() {
    const pesquisa = document
        .getElementById("pesquisar-transacao")
        .value.toLowerCase().trim();

    const tipo = document
        .getElementById("filtrar-tipo")
        .value;

    const categoria = document
        .getElementById("filtrar-categoria")
        .value;

    return todasTransacoes.filter(transacao => {
        const correspondePesquisa = transacao.descricao
            .toLowerCase().includes(pesquisa);

        const correspondeTipo =
            tipo === "todos" || transacao.tipo === tipo;

        const correspondeCategoria =
            categoria === "todas" ||
            (transacao.categoria || "Outros") === categoria;

        return (
            correspondePesquisa &&
            correspondeTipo &&
            correspondeCategoria
        );
    });
}

// Gerar e baixar arquivo CSV
function exportarCSV() {
    const transacoes = obterTransacoesFiltradas();

    if (transacoes.length === 0) {
        alert("Não existem transações para exportar.");
        return;
    }

    // Cabeçalho do arquivo
    const linhas = [
        [
            "Data",
            "Descrição",
            "Categoria",
            "Tipo",
            "Valor (R$)"
        ]
    ];

    // Adicionar as transações
    for (const transacao of transacoes) {
        linhas.push([
            formatarData(transacao.data),
            transacao.descricao,
            transacao.categoria || "Outros",
            transacao.tipo === "receita" ? "Receita" : "Despesa",
            Number(transacao.valor).toFixed(2).replace(".", ",")
        ]);
    }

    // Separar as colunas usando ponto e vírgula
    const conteudoCSV = linhas
        .map(linha =>
            linha.map(prepararCampoCSV).join(";")
        )
        .join("\r\n");

    // BOM ajuda o Excel a reconhecer acentos
    const arquivo = new Blob(
        ["\uFEFF" + conteudoCSV],
        { type: "text/csv;charset=utf-8;" }
    );

    // Criar link temporário de download
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");

    link.href = url;
    link.download = `fincontrol_transacoes_${dataHoje()}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    // Liberar o endereço temporário
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Ativar o botão de exportação
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-exportar-csv")
        .addEventListener("click", exportarCSV);
});


// ====================================
// 19. SALVAR E FECHAR JANELA DE EDIÇÃO
// ====================================

// Fechar a janela
function fecharModalEdicao() {
    document.getElementById("modal-edicao").hidden = true;
}

// Salvar os dados editados
async function salvarEdicao(evento) {
    evento.preventDefault();

    const id = document.getElementById("editar-id").value;

    const descricao = document
        .getElementById("editar-descricao")
        .value.trim();

    const valor = Number(
        document.getElementById("editar-valor").value
    );

    const tipo = document.getElementById("editar-tipo").value;

    const categoria = document
        .getElementById("editar-categoria")
        .value;

    const data = document.getElementById("editar-data").value;

    // Validar informações
    if (!id || !descricao || !Number.isFinite(valor) ||
        valor <= 0 || !dataValida(data) ||
        !["receita", "despesa"].includes(tipo)) {
        alert("Preencha todos os campos corretamente.");
        return;
    }

    const botaoSalvar = document.querySelector(
        "#form-edicao button[type='submit']"
    );

    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";

    try {
        // Enviar os novos dados ao FastAPI
        await enviarTransacao(
            `/transacoes/${id}`,
            "PUT",
            {
                descricao,
                valor,
                tipo,
                categoria,
                data
            }
        );

        // Fechar a janela
        fecharModalEdicao();

        // Atualizar tabela e gráficos
        await atualizarDashboard();

        alert("Transação atualizada com sucesso!");

    } catch (erro) {
        console.error("Erro ao editar transação:", erro);
        alert("Não foi possível salvar as alterações.");

    } finally {
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = "Salvar alterações";
    }
}

// Ativar os controles da janela
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("modal-edicao");

    // Botão X
    document.getElementById("fechar-modal")
        .addEventListener("click", fecharModalEdicao);

    // Botão Cancelar
    document.getElementById("cancelar-edicao")
        .addEventListener("click", fecharModalEdicao);

    // Salvar formulário
    document.getElementById("form-edicao")
        .addEventListener("submit", salvarEdicao);

    // Fechar ao clicar fora da janela
    modal.addEventListener("click", (evento) => {
        if (evento.target === modal) {
            fecharModalEdicao();
        }
    });

    // Fechar usando a tecla Esc
    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape" && !modal.hidden) {
            fecharModalEdicao();
        }
    });
});

