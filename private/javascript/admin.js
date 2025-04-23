let estoqueOriginal = [];

document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.getElementById("formLogin");
    const mensagemErro = document.getElementById("mensagemErro");
  
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const usuario = document.getElementById("usuario").value.trim();
      const senha = document.getElementById("senha").value.trim();
  
      try {
        const response = await fetch("/ESTOQUE_SITE/data/user.json");
  
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
    });
  
    function mostrarErro(texto) {
      mensagemErro.textContent = texto;
      mensagemErro.style.display = "block";
    }
  });
  
    async function carregarEstoqueParaEdicao() {
    const tbody = document.getElementById("tbodyAdmin");
    tbody.innerHTML = "";
  
    try {
      const response = await fetch("/ESTOQUE_SITE/data/estoque.json");
      const estoque = await response.json();
      estoqueOriginal = JSON.parse(JSON.stringify(estoque)); // Clona o original
  
      estoque.forEach((item, index) => {
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
    const linha = document.querySelector(`tr[data-codigo='${codigo}']`);
    if (linha) {
      linha.remove();
    }
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
      })
      .catch(error => {
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
  
  function salvarAlteracoes() {
    const linhas = document.querySelectorAll("#tbodyAdmin tr");
    let log = "";
  
    linhas.forEach((linha) => {
      const nome = linha.querySelector(".input-nome").value.trim();
      const codigo = linha.getAttribute("data-codigo");
      const quantidade = parseInt(linha.querySelector(".input-quantidade").value, 10);
      const descricao = linha.querySelector(".input-descricao").value.trim();
  
      log += `✔ ${nome} (Código: ${codigo}, Qtde: ${quantidade})\n`;
    });
  
    document.getElementById("logAlteracoes").textContent = log;
    document.getElementById("popupConfirmacao").style.display = "flex";
  }
  
  function fecharPopup() {
    document.getElementById("popupConfirmacao").style.display = "none";
  }
  
  function salvarTudo() {
    const linhas = document.querySelectorAll("#tbodyAdmin tr");
    let log = "";
    let alteracoes = [];
  
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
        alteracoes.push({ nome, codigo, quantidade, descricao, atualizado: new Date().toLocaleString() });
        log += `✔ ${nome} (Código: ${codigo}) alterado\n`;
      }
    });
  
    if (alteracoes.length === 0) {
      log = "Nenhuma alteração detectada.";
    }
  
    document.getElementById("logAlteracoes").textContent = log;
    document.getElementById("popupConfirmacao").style.display = "flex";
  
    // Armazena temporariamente para confirmar depois
    window.__alteracoesPendentes = alteracoes;
  }

  function confirmarSalvarTudo() {
    const alteracoes = window.__alteracoesPendentes || [];
  
    if (alteracoes.length === 0) {
      alert("Nenhuma alteração a confirmar.");
      fecharPopup();
      return;
    }
  
    // Requisição POST para atualizar todos os itens alterados
    fetch("http://localhost:3000/api/estoque", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(itemAtualizado)
      })
  
    }