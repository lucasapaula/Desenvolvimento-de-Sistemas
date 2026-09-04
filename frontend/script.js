const API_URL = "http://127.0.0.1:8000";
let restauranteAberto = null;
let termoBusca = "";
let timeoutBusca = null;

function inicial(nome) {
    return nome ? nome.trim().charAt(0).toUpperCase() : "?";
}

function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mostrarToast(mensagem, erro = false) {
    const toast = document.getElementById("toast");
    toast.textContent = mensagem;
    toast.className = "toast show" + (erro ? " erro" : "");
    setTimeout(() => toast.classList.remove("show"), 2500);
}

function limparFormulario() {
    document.getElementById("nome").value = "";
    document.getElementById("categoria").value = "";
    document.getElementById("descricao").value = "";
    document.getElementById("endereco").value = "";
    document.getElementById("telefone").value = "";
}

async function carregarRestaurantes() {
    const lista = document.getElementById("lista");
    const contador = document.getElementById("contador");

    try {
        let url = `${API_URL}/restaurantes`;
        if (termoBusca) {
            url += `?nome=${encodeURIComponent(termoBusca)}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const data = await res.json();

        contador.textContent = data.length || 0;
        lista.innerHTML = "";

        if (!data || data.length === 0) {
            lista.innerHTML = `
                <div class="state">
                    <div class="state-title">${termoBusca ? "Nenhum restaurante encontrado" : "Nenhum restaurante cadastrado"}</div>
                    <div class="state-desc">${termoBusca ? "Tente outro termo de busca" : "Use o formulário ao lado para adicionar o primeiro"}</div>
                </div>
            `;
            return;
        }

        data.forEach(r => {
            const card = document.createElement("div");
            card.className = "card";
            card.id = `rest-${r.id}`;
            const aberto = restauranteAberto === r.id;
            const qtd = r.cardapio ? r.cardapio.length : 0;
            const categoria = r.categoria ? `<span class="tag">${r.categoria}</span>` : "";

            card.innerHTML = `
                <div class="card-main">
                    <div class="avatar">${inicial(r.nome)}</div>
                    <div class="card-body">
                        <h3>${r.nome}</h3>
                        <div class="card-meta">
                            ${categoria}
                            <span>ID ${r.id} · ${qtd} itens</span>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-accent" onclick="toggleCardapio(${r.id})">Cardápio</button>
                        <button class="btn" onclick="verDetalhes(${r.id})">Detalhes</button>
                        <button class="btn" onclick="editarRestaurante(${r.id})">Editar</button>
                        <button class="btn btn-danger" onclick="deletarRestaurante(${r.id})">Excluir</button>
                    </div>
                </div>
                <div class="cardapio-panel ${aberto ? "open" : ""}" id="cardapio-${r.id}">
                    <div class="cardapio-form">
                        <input type="text" id="comida-nome-${r.id}" placeholder="Nome da comida">
                        <input type="number" id="comida-preco-${r.id}" placeholder="Preço" step="0.01" min="0">
                        <button onclick="adicionarComida(${r.id})">Adicionar</button>
                    </div>
                    <div id="comidas-${r.id}"></div>
                </div>
            `;
            lista.appendChild(card);

            if (aberto) {
                renderizarComidas(r.id, r.cardapio || []);
            }
        });
    } catch (e) {
        lista.innerHTML = `
            <div class="state">
                <div class="state-title">Erro de conexão</div>
                <div class="state-desc">Verifique se a API está rodando</div>
            </div>
        `;
        contador.textContent = "—";
    }
}

function renderizarComidas(restauranteId, comidas) {
    const container = document.getElementById(`comidas-${restauranteId}`);
    if (!container) return;

    if (!comidas || comidas.length === 0) {
        container.innerHTML = `<div class="cardapio-vazio">Nenhuma comida no cardápio</div>`;
        return;
    }

    container.innerHTML = comidas.map(c => `
        <div class="comida-item">
            <div class="comida-info">
                <strong>${c.nome}</strong>
                <span>${formatarPreco(c.preco)}</span>
            </div>
            <div class="comida-actions">
                <button class="btn" onclick="editarComida(${restauranteId}, ${c.id}, \`${String(c.nome).replace(/`/g, "\\`")}\`, ${c.preco})">Editar</button>
                <button class="btn btn-danger" onclick="deletarComida(${restauranteId}, ${c.id})">Excluir</button>
            </div>
        </div>
    `).join("");
}

async function toggleCardapio(id) {
    if (restauranteAberto === id) {
        restauranteAberto = null;
        carregarRestaurantes();
        return;
    }
    restauranteAberto = id;
    await carregarRestaurantes();
}

async function adicionarComida(restauranteId) {
    const nomeInput = document.getElementById(`comida-nome-${restauranteId}`);
    const precoInput = document.getElementById(`comida-preco-${restauranteId}`);
    const nome = nomeInput.value.trim();
    const preco = parseFloat(precoInput.value);

    if (!nome || isNaN(preco) || preco <= 0) {
        mostrarToast("Preencha nome e um preço válido", true);
        return;
    }

    try {
        const res = await fetch(`${API_URL}/restaurantes/${restauranteId}/cardapio`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, preco })
        });

        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            mostrarToast(erro.detail || "Erro ao adicionar", true);
            return;
        }

        nomeInput.value = "";
        precoInput.value = "";
        restauranteAberto = restauranteId;
        await carregarRestaurantes();
        mostrarToast("Comida adicionada");
    } catch (e) {
        mostrarToast("Erro de conexão", true);
    }
}

async function editarComida(restauranteId, comidaId, nomeAtual, precoAtual) {
    const novoNome = prompt("Novo nome:", nomeAtual);
    if (novoNome === null) return;

    const novoPrecoStr = prompt("Novo preço:", precoAtual);
    if (novoPrecoStr === null) return;

    const novoPreco = parseFloat(novoPrecoStr);
    if (!novoNome.trim() || isNaN(novoPreco) || novoPreco <= 0) {
        mostrarToast("Dados inválidos", true);
        return;
    }

    try {
        const res = await fetch(
            `${API_URL}/restaurantes/${restauranteId}/cardapio/${comidaId}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome: novoNome.trim(), preco: novoPreco })
            }
        );

        if (!res.ok) {
            mostrarToast("Erro ao editar", true);
            return;
        }

        restauranteAberto = restauranteId;
        await carregarRestaurantes();
        mostrarToast("Comida atualizada");
    } catch (e) {
        mostrarToast("Erro de conexão", true);
    }
}

async function deletarComida(restauranteId, comidaId) {
    if (!confirm("Excluir esta comida?")) return;

    try {
        const res = await fetch(`${API_URL}/restaurantes/${restauranteId}/cardapio/${comidaId}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            mostrarToast("Erro ao excluir", true);
            return;
        }

        restauranteAberto = restauranteId;
        await carregarRestaurantes();
        mostrarToast("Comida excluída");
    } catch (e) {
        mostrarToast("Erro de conexão", true);
    }
}

async function criarRestaurante() {
    const nome = document.getElementById("nome").value.trim();
    const categoria = document.getElementById("categoria").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const endereco = document.getElementById("endereco").value.trim();
    const telefone = document.getElementById("telefone").value.trim();

    if (!nome) {
        document.getElementById("nome").focus();
        mostrarToast("Nome é obrigatório", true);
        return;
    }

    try {
        const res = await fetch(`${API_URL}/restaurantes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome,
                categoria: categoria || null,
                descricao: descricao || null,
                endereco: endereco || null,
                telefone: telefone || null
            })
        });

        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            mostrarToast(erro.detail || "Erro ao cadastrar", true);
            return;
        }

        limparFormulario();
        termoBusca = "";
        document.getElementById("busca").value = "";
        await carregarRestaurantes();
        mostrarToast("Restaurante cadastrado");
    } catch (e) {
        mostrarToast("Erro de conexão", true);
    }
}

async function editarRestaurante(id) {
    try {
        const res = await fetch(`${API_URL}/restaurantes/${id}`);
        if (!res.ok) throw new Error();
        const r = await res.json();

        const novoNome = prompt("Nome:", r.nome);
        if (novoNome === null) return;

        const novaCategoria = prompt("Categoria:", r.categoria || "");
        if (novaCategoria === null) return;

        const novaDescricao = prompt("Descrição:", r.descricao || "");
        if (novaDescricao === null) return;

        const novoEndereco = prompt("Endereço:", r.endereco || "");
        if (novoEndereco === null) return;

        const novoTelefone = prompt("Telefone:", r.telefone || "");
        if (novoTelefone === null) return;

        if (!novoNome.trim()) {
            mostrarToast("Nome é obrigatório", true);
            return;
        }

        const updateRes = await fetch(`${API_URL}/restaurantes/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome: novoNome.trim(),
                categoria: novaCategoria.trim() || null,
                descricao: novaDescricao.trim() || null,
                endereco: novoEndereco.trim() || null,
                telefone: novoTelefone.trim() || null
            })
        });

        if (!updateRes.ok) {
            mostrarToast("Erro ao editar", true);
            return;
        }

        await carregarRestaurantes();
        mostrarToast("Restaurante atualizado");
    } catch (e) {
        mostrarToast("Erro de conexão", true);
    }
}

async function deletarRestaurante(id) {
    if (!confirm("Deseja excluir este restaurante?")) return;

    try {
        const res = await fetch(`${API_URL}/restaurantes/${id}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            mostrarToast("Erro ao excluir", true);
            return;
        }

        if (restauranteAberto === id) restauranteAberto = null;
        await carregarRestaurantes();
        mostrarToast("Restaurante excluído");
    } catch (e) {
        mostrarToast("Erro de conexão", true);
    }
}

async function verDetalhes(id) {
    try {
        const res = await fetch(`${API_URL}/restaurantes/${id}`);
        if (!res.ok) throw new Error();
        const r = await res.json();

        const modal = document.getElementById("modal-detalhes");
        const titulo = document.getElementById("modal-titulo");
        const conteudo = document.getElementById("modal-conteudo");

        titulo.textContent = r.nome;

        const itens = (r.cardapio || []).map(c => `
            <div class="detalhe-item">
                <span>${c.nome}</span>
                <strong>${formatarPreco(c.preco)}</strong>
            </div>
        `).join("") || `<p class="vazio">Nenhum item no cardápio</p>`;

        conteudo.innerHTML = `
            <div class="detalhe-grid">
                <div class="detalhe-campo">
                    <label>Categoria</label>
                    <p>${r.categoria || "—"}</p>
                </div>
                <div class="detalhe-campo">
                    <label>Telefone</label>
                    <p>${r.telefone || "—"}</p>
                </div>
                <div class="detalhe-campo full">
                    <label>Endereço</label>
                    <p>${r.endereco || "—"}</p>
                </div>
                <div class="detalhe-campo full">
                    <label>Descrição</label>
                    <p>${r.descricao || "—"}</p>
                </div>
            </div>
            <div class="detalhe-cardapio">
                <h4>Cardápio (${r.cardapio ? r.cardapio.length : 0})</h4>
                ${itens}
            </div>
        `;

        modal.classList.add("open");
    } catch (e) {
        mostrarToast("Erro ao carregar detalhes", true);
    }
}

function fecharModal() {
    document.getElementById("modal-detalhes").classList.remove("open");
}

document.getElementById("modal-detalhes").addEventListener("click", e => {
    if (e.target.id === "modal-detalhes") fecharModal();
});

document.getElementById("nome").addEventListener("keydown", e => {
    if (e.key === "Enter") criarRestaurante();
});

document.getElementById("busca").addEventListener("input", e => {
    clearTimeout(timeoutBusca);
    timeoutBusca = setTimeout(() => {
        termoBusca = e.target.value.trim();
        restauranteAberto = null;
        carregarRestaurantes();
    }, 300);
});

carregarRestaurantes();