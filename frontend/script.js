const API_URL = "http://127.0.0.1:8000";
let restauranteAberto = null;

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

async function carregarRestaurantes() {
    const lista = document.getElementById("lista");
    const contador = document.getElementById("contador");

    try {
        const res = await fetch(`${API_URL}/restaurantes`);
        const data = await res.json();

        contador.textContent = data.length || 0;
        lista.innerHTML = "";

        if (!data || data.length === 0) {
            lista.innerHTML = `
                <div class="state">
                    <div class="state-title">Nenhum restaurante cadastrado</div>
                    <div class="state-desc">Use o formulário ao lado para adicionar o primeiro</div>
                </div>
            `;
            return;
        }

        data.forEach(r => {
            const card = document.createElement("div");
            card.className = "card";
            card.id = `rest-${r.id}`;
            const aberto = restauranteAberto === r.id;

            card.innerHTML = `
                <div class="card-main">
                    <div class="avatar">${inicial(r.nome)}</div>
                    <div class="card-body">
                        <h3>${r.nome}</h3>
                        <span>ID ${r.id} · ${r.cardapio ? r.cardapio.length : 0} itens</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-accent" onclick="toggleCardapio(${r.id})">Cardápio</button>
                        <button class="btn" onclick="editarRestaurante(${r.id}, \`${String(r.nome).replace(/`/g, "\\`")}\`)">Editar</button>
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

    try {
        const res = await fetch(`${API_URL}/restaurantes/${id}/cardapio`);
        const comidas = await res.json();
        if (Array.isArray(comidas)) renderizarComidas(id, comidas);
    } catch (e) {
        console.error(e);
    }
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

    const res = await fetch(`${API_URL}/restaurantes/${restauranteId}/cardapio?nome=${encodeURIComponent(nome)}&preco=${preco}`, {
        method: "POST"
    });

    if (res.ok) {
        nomeInput.value = "";
        precoInput.value = "";
        const comidasRes = await fetch(`${API_URL}/restaurantes/${restauranteId}/cardapio`);
        const comidas = await comidasRes.json();
        renderizarComidas(restauranteId, comidas);
        carregarRestaurantes();
        mostrarToast("Comida adicionada");
    } else {
        const erro = await res.json();
        mostrarToast(erro.detail || "Erro ao adicionar", true);
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

    const res = await fetch(
        `${API_URL}/restaurantes/${restauranteId}/cardapio/${comidaId}?nome=${encodeURIComponent(novoNome.trim())}&preco=${novoPreco}`,
        { method: "PATCH" }
    );

    if (res.ok) {
        const comidasRes = await fetch(`${API_URL}/restaurantes/${restauranteId}/cardapio`);
        const comidas = await comidasRes.json();
        renderizarComidas(restauranteId, comidas);
        mostrarToast("Comida atualizada");
    } else {
        mostrarToast("Erro ao editar", true);
    }
}

async function deletarComida(restauranteId, comidaId) {
    if (!confirm("Excluir esta comida?")) return;

    const res = await fetch(`${API_URL}/restaurantes/${restauranteId}/cardapio/${comidaId}`, {
        method: "DELETE"
    });

    if (res.ok) {
        const comidasRes = await fetch(`${API_URL}/restaurantes/${restauranteId}/cardapio`);
        const comidas = await comidasRes.json();
        renderizarComidas(restauranteId, comidas);
        carregarRestaurantes();
        mostrarToast("Comida excluída");
    } else {
        mostrarToast("Erro ao excluir", true);
    }
}

async function criarRestaurante() {
    const input = document.getElementById("nome");
    const nome = input.value.trim();
    if (!nome) {
        input.focus();
        return;
    }

    const res = await fetch(`${API_URL}/restaurantes?nome=${encodeURIComponent(nome)}`, {
        method: "POST"
    });

    if (res.ok) {
        input.value = "";
        carregarRestaurantes();
        mostrarToast("Restaurante cadastrado");
    } else {
        const erro = await res.json();
        mostrarToast(erro.detail || "Erro ao cadastrar", true);
    }
}

async function editarRestaurante(id, nomeAtual) {
    const novo = prompt("Novo nome do restaurante:", nomeAtual);
    if (!novo || !novo.trim()) return;

    const res = await fetch(`${API_URL}/restaurantes/${id}?nome=${encodeURIComponent(novo.trim())}`, {
        method: "PATCH"
    });

    if (res.ok) {
        carregarRestaurantes();
        mostrarToast("Restaurante atualizado");
    } else {
        mostrarToast("Erro ao editar", true);
    }
}

async function deletarRestaurante(id) {
    if (!confirm("Deseja excluir este restaurante?")) return;

    const res = await fetch(`${API_URL}/restaurantes/${id}`, {
        method: "DELETE"
    });

    if (res.ok) {
        if (restauranteAberto === id) restauranteAberto = null;
        carregarRestaurantes();
        mostrarToast("Restaurante excluído");
    } else {
        mostrarToast("Erro ao excluir", true);
    }
}

document.getElementById("nome").addEventListener("keydown", e => {
    if (e.key === "Enter") criarRestaurante();
});

carregarRestaurantes();
