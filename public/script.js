const API_URL = 'http://localhost:3000/api/estoque';
let estoqueOriginal = [];

function mostrarAdicionar() {
  document.getElementById('formularioAdicionar').style.display = 'block';
  document.getElementById('conteudo').innerHTML = '';
}

function cancelarAdicionar() {
  document.getElementById('formularioAdicionar').style.display = 'none';
}

document.getElementById('formAdicionar').addEventListener('submit', async function (e) {
  e.preventDefault();

  const nome = document.getElementById('nome').value;
  const quantidade = parseInt(document.getElementById('quantidade').value);
  const descricao = document.getElementById('descricao').value;

  const novoItem = {
    nome,
    quantidade,
    descricao,
    ultimaAtualizacao: new Date().toISOString()
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoItem)
    });

    if (response.ok) {
      alert('Item adicionado com sucesso!');
      cancelarAdicionar();
    } else {
      alert('Erro ao adicionar item.');
    }
  } catch (err) {
    console.error('Erro ao enviar dados:', err);
  }
});

function mostrarEstoque() {
  document.getElementById('formularioAdicionar').style.display = 'none';

  fetch(API_URL)
    .then(res => res.json())
    .then(estoque => {
      estoqueOriginal = estoque; // Salva os dados do estoque original para referência

      // Exibe a tabela do estoque
      let html = `
        <div class="filtro-container">
          <label for="pesquisa">Pesquisar por nome ou ID:</label>
          <input type="text" id="pesquisa" oninput="aplicarPesquisa()" placeholder="Ex: Cabo RJ45 ou ID" />
          
          <label for="filtro">Filtrar por:</label>
          <select id="filtro" onchange="aplicarFiltro()">
            <option value="quantidade-maior">Maior quantidade de itens</option>
            <option value="quantidade-menor">Menor quantidade de itens</option>
            <option value="alfabetico-crescente">Ordem alfabética crescente</option>
            <option value="alfabetico-decrescente">Ordem alfabética decrescente</option>
          </select>
        </div>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Código (ID)</th>
                <th>Quantidade</th>
                <th>Descrição</th>
                <th>Última Atualização</th>
              </tr>
            </thead>
            <tbody id="tbodyEstoque">
              ${estoque.map(item => `
                <tr>
                  <td>${item.nome}</td>
                  <td>${item.codigo}</td>           <!-- Certificando-se de que o ID está correto -->
                  <td>x${item.quantidade}</td>      <!-- Quantidade -->
                  <td>${item.descricao || ''}</td>  <!-- Descrição -->
                  <td>${new Date(item.ultimaAtualizacao).toLocaleString()}</td> <!-- Última Atualização -->
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;

      document.getElementById('conteudo').innerHTML = html;
    })
    .catch(err => console.error('Erro ao carregar estoque:', err));
}

function aplicarFiltro() {
  let tipo = document.getElementById('filtro').value;

  let estoque = [...estoqueOriginal]; // Faz uma cópia para evitar mutação direta

  switch (tipo) {
    case 'quantidade-maior':
      estoque.sort((a, b) => b.quantidade - a.quantidade);
      break;
    case 'quantidade-menor':
      estoque.sort((a, b) => a.quantidade - b.quantidade);
      break;
    case 'alfabetico-crescente':
      estoque.sort((a, b) => a.nome.localeCompare(b.nome));
      break;
    case 'alfabetico-decrescente':
      estoque.sort((a, b) => b.nome.localeCompare(a.nome));
      break;
  }

  aplicarPesquisa(estoque); // Reaplica a pesquisa após o filtro
}

function aplicarPesquisa(estoque = estoqueOriginal) {
  const termo = document.getElementById('pesquisa').value.trim().toLowerCase();

  // Verifique se o termo de pesquisa não está vazio
  if (!termo) {
    atualizarTabela(estoque);  // Se o campo de pesquisa estiver vazio, exibe todos os itens
    return;
  }

  // Filtra o estoque, permitindo busca por nome ou ID (convertendo ambos para string e minúsculas)
  let resultadoPesquisa = estoque.filter(item => {
    return (
      item.nome.toLowerCase().includes(termo) || 
      (item.codigo && item.codigo.toString().toLowerCase().includes(termo)) // Verifique se o codigo (ID) existe e converta para string
    );
  });

  atualizarTabela(resultadoPesquisa);  // Atualiza a tabela com os resultados da pesquisa
}

function atualizarTabela(estoque) {
  const tbody = estoque.map(item => {
    // A ordem correta das colunas é:
    // Nome, Código (ID), Quantidade, Descrição, Última Atualização
    return `
      <tr>
        <td>${item.nome}</td>              <!-- Nome -->
        <td>${item.codigo}</td>            <!-- Código (ID) -->
        <td>${item.quantidade}</td>        <!-- Quantidade -->
        <td>${item.descricao || ''}</td>   <!-- Descrição -->
        <td>${new Date(item.ultimaAtualizacao).toLocaleString()}</td> <!-- Última Atualização -->
      </tr>
    `;
  }).join('');

  document.getElementById('tbodyEstoque').innerHTML = tbody;
}
