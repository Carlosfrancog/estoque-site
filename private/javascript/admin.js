let estoqueOriginal = [];

document.addEventListener("DOMContentLoaded", async () => {
  const formLogin = document.getElementById("formLogin");
  const mensagemErro = document.getElementById("mensagemErro");

  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();

    try {
      const response = await fetch("../data/user.json");

      if (!response.ok) {
        throw new Error("Não foi possível carregar o arquivo user.json");
      }

      const usuarios = await response.json();

      const usuarioValido = usuarios.find(
        (user) => user.name === usuario && user.password === senha
      );

      if (usuarioValido) {
        document.getElementById("login-container").style.display = "none";
        document.getElementById("admin-content").style.display = "block";
        document.getElementById("admin-buttons").style.display = "flex";

        mensagemErro.style.display = "none";
        carregarEstoqueParaEdicao();
      } else {
        mostrarErro("Usuário ou senha inválidos.");
      }
    } catch (error) {
      console.error("Erro ao autenticar:", error);
      mostrarErro("Erro ao carregar dados de login. Verifique o caminho do JSON.");
    }

  function mostrarErro(texto) {
    mensagemErro.textContent = texto;
    mensagemErro.style.display = "block";
  }
}); // Closing brace for DOMContentLoaded event listener
});

async function carregarEstoqueParaEdicao() {
  const tbody = document.getElementById("tbodyAdmin");
  tbody.innerHTML = "";

  try {
    const response = await fetch("../data/estoque.json");
    const estoque = await response.json();
    estoqueOriginal = JSON.parse(JSON.stringify(estoque)); // Clona o original

    estoque.forEach((item) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-codigo", item.codigo);

      tr.innerHTML = `
        <td><input type="text" class="input-nome" value="${item.nome}"></td>
        <td>${item.codigo}</td>
        <td><input type="number" class="input-quantidade" value="${item.quantidade}" min="0"></td>
        <td><input type="text" class="input-descricao" value="${item.descricao}"></td>
        <td>
          <button class="btn-salvar-item" onclick="salvarItemIndividual('${item.codigo}')">💾</button>
          <button class="btn-excluir-item" onclick="excluirItem('${item.codigo}')">🗑️</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error("Erro ao carregar o estoque:", error);
  }
}

function filtrarEstoqueAdmin() {
  const filtro = document.getElementById("filtroBusca").value.trim().toLowerCase();
  const linhas = document.querySelectorAll("#tbodyAdmin tr");

  linhas.forEach((linha) => {
    const nome = linha.querySelector(".input-nome").value.toLowerCase();
    const codigo = linha.getAttribute("data-codigo").toLowerCase();

    linha.style.display = nome.includes(filtro) || codigo.includes(filtro) ? "" : "none";
  });
}

function excluirItem(codigo) {
  if (!confirm(`Tem certeza que deseja excluir o item com código ${codigo}?`)) return;

  fetch(`http://localhost:3000/api/estoque/${codigo}`, {
    method: "DELETE"
  })
  .then(response => {
    if (!response.ok) {
      throw new Error("Erro ao excluir o item.");
    }
    alert("Item excluído com sucesso!");
    carregarEstoqueParaEdicao(); // atualiza a lista na interface
  })
  .catch(error => {
    console.error("Erro ao excluir item:", error);
    alert("Erro ao excluir item. Verifique o console.");
  });
}


function salvarItemIndividual(codigo) {
  const linha = document.querySelector(`tr[data-codigo="${codigo}"]`);
  if (!linha) return;

  const nome = linha.querySelector(".input-nome").value.trim();
  const quantidade = parseInt(linha.querySelector(".input-quantidade").value, 10);
  const descricao = linha.querySelector(".input-descricao").value.trim();

  const original = estoqueOriginal.find(item => item.codigo === codigo);

  if (
    original &&
    (nome !== original.nome || quantidade !== original.quantidade || descricao !== original.descricao)
  ) {
    const itemAtualizado = {
      nome,
      codigo,
      quantidade,
      descricao,
      atualizado: new Date().toLocaleString()
    };

    fetch("http://localhost:3000/api/estoque", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(itemAtualizado)
    }).catch(error => {
      console.error("Erro ao salvar item individual:", error);
    });
  } else {
    alert("Nenhuma alteração detectada para este item.");
  }
}

function salvarItem(codigo) {
  const linha = document.querySelector(`tr[data-codigo='${codigo}']`);
  if (!linha) return;

  const nome = linha.querySelector(".input-nome").value.trim();
  const quantidade = parseInt(linha.querySelector(".input-quantidade").value, 10);
  const descricao = linha.querySelector(".input-descricao").value.trim();

  const itemAtualizado = {
    nome,
    codigo,
    quantidade,
    descricao,
    atualizado: new Date().toLocaleString()
  };

  console.log("Item salvo:", itemAtualizado);
}

// Mostra o formulário de adição
function mostrarAdicionar() {
  const formularioAdicionar = document.getElementById('formularioAdicionar');
  if (formularioAdicionar) {
    formularioAdicionar.style.display = 'block';
  } else {
    console.error("Elemento 'formularioAdicionar' não encontrado.");
  }
}

// Oculta o formulário de adição
function cancelarAdicionar() {
  const formularioAdicionar = document.getElementById('formularioAdicionar');
  if (formularioAdicionar) {
    formularioAdicionar.style.display = 'none';
  } else {
    console.error("Elemento 'formularioAdicionar' não encontrado.");
  }
}

// Lida com o envio do formulário de adição
document.getElementById('formAdicionar').addEventListener('submit', async function (e) {
  e.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const quantidade = parseInt(document.getElementById('quantidade').value, 10);
  const descricao = document.getElementById('descricao').value.trim();

  // Função para classificar automaticamente a categoria com base no nome do item
  function classificarCategoria(nome) {
    const nomeUpper = nome.toUpperCase();

    const categorias = {
      'Periféricos': ['TECLADO', 'MOUSE', 'WEBCAM', 'FONE', 'CÂMERA', 'TELEFONE'],
      'Armazenamento': ['HDD', 'SSD', 'HD', 'NVME'],
      'Memória e Processamento': ['MEMÓRIA', 'PROCESSADOR', 'PLACA MÃE'],
      'Placas': ['PLACA DE VIDEO', 'PLACA DE REDE', 'CONTROLADORA', 'MODEM', 'KVM', 'HUB', 'PONTE'],
      'Fontes de Alimentação': ['FONTE'],
      'Cabos e Conectores': ['CABO', 'ADAPTADOR', 'EXTENSOR', 'LEITOR'],
      'Refrigeração': ['COOLER', 'FAN', 'DISSIPADOR', 'WATER COOLER'],
      'Diversos': ['RÉGUA', 'EXTENSÃO', 'SUPORTE', 'ANTENA', 'ESPELHO', 'SWITCH', 'PROTETOR', 'RODA', 'ESTABILIZADOR'],
      'Equipamentos Completos': ['CPU', 'NOTEBOOK', 'MONITOR']
    };

    for (const [categoria, termos] of Object.entries(categorias)) {
      if (termos.some(termo => nomeUpper.includes(termo))) {
        return categoria;
      }
    }

    return 'Outros';
  }

  // Função para gerar código aleatório único entre 0000 e 9999
  function gerarCodigoUnico() {
    let codigoGerado;
    let codigoExistente = true;

    while (codigoExistente) {
      codigoGerado = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      codigoExistente = estoqueOriginal.some(item => item.codigo === codigoGerado);
    }

    return codigoGerado;
  }

  // Classificar a categoria automaticamente
  const categoria = classificarCategoria(nome);

  // Adiciona a categoria ao final da descrição
  const descricaoComCategoria = `${descricao} ${categoria}`;

  // Gera o código único para o novo item
  const codigo = gerarCodigoUnico();

  const novoItem = {
    nome,
    quantidade,
    descricao: descricaoComCategoria,
    codigo,
    ultimaAtualizacao: new Date().toISOString()
  };

  try {
    const response = await fetch('http://localhost:3000/api/estoque', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoItem)
    });

    if (response.ok) {
      alert('Item adicionado com sucesso!');
      cancelarAdicionar();
      carregarEstoqueParaEdicao(); // Atualiza a tabela com o novo item
    } else {
      alert('Erro ao adicionar item.');
    }
  } catch (err) {
    console.error('Erro ao enviar dados:', err);
  }
});

function salvarAlteracoes() {
  const linhas = document.querySelectorAll("#tbodyAdmin tr");
  
  let log = "";
  window.__alteracoesPendentes = [];

  linhas.forEach((linha) => {
    const codigo = linha.getAttribute("data-codigo");
    const nome = linha.querySelector(".input-nome").value.trim();
    const quantidade = parseInt(linha.querySelector(".input-quantidade").value, 10);
    const descricao = linha.querySelector(".input-descricao").value.trim();

    const original = estoqueOriginal.find(item => item.codigo === codigo);

    if (
      original &&
      (nome !== original.nome || quantidade !== original.quantidade || descricao !== original.descricao)
    ) {
      const alteracao = {
        nome,
        codigo,
        quantidade,
        descricao,
        atualizado: new Date().toLocaleString()
      };
      window.__alteracoesPendentes.push(alteracao);
      log += `Item ${codigo} alterado: Nome: ${nome}, Quantidade: ${quantidade}, Descrição: ${descricao}\n`;
    }
  });

  if (window.__alteracoesPendentes.length === 0) {
    alert("Nenhuma alteração detectada.");
    return;
  }

  document.getElementById("logAlteracoes").textContent = log;
  document.getElementById("popupConfirmacao").style.display = "flex";

  // Armazena temporariamente para confirmar depois
  window.__alteracoesPendentes = Array.from(document.querySelectorAll("#tbodyAdmin tr")).map((linha) => {
    const codigo = linha.getAttribute("data-codigo");
    const nome = linha.querySelector(".input-nome").value.trim();
    const quantidade = parseInt(linha.querySelector(".input-quantidade").value, 10);
    const descricao = linha.querySelector(".input-descricao").value.trim();

    const original = estoqueOriginal.find(item => item.codigo === codigo);

    if (
      original &&
      (nome !== original.nome || quantidade !== original.quantidade || descricao !== original.descricao)
    ) {
      return {
        nome,
        codigo,
        quantidade,
        descricao,
        atualizado: new Date().toLocaleString()
      };
    }

    return null;
  }).filter(Boolean);
}

function fecharPopup() {
  document.getElementById("popupConfirmacao").style.display = "none";
}

function confirmarSalvarTudo() {
  const alteracoes = window.__alteracoesPendentes || [];

  if (alteracoes.length === 0) {
    alert("Nenhuma alteração a confirmar.");
    fecharPopup();
    return;
  }

  fetch("http://localhost:3000/api/estoque", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(alteracoes)
  })
  .then(response => response.text())
  .then(data => {
    alert("Alterações salvas com sucesso!");
    fecharPopup();
    carregarEstoqueParaEdicao(); // recarrega dados
  })
  .catch(error => {
    console.error("Erro ao salvar alterações em lote:", error);
    alert("Erro ao salvar alterações.");
  });
}
