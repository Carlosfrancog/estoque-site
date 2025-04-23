const API_URL = 'http://localhost:3000/api/estoque';
let estoqueOriginal = [];

function mostrarAdicionar() {
  document.getElementById('formularioAdicionar').style.display = 'block';
  document.getElementById('conteudo').innerHTML = '';
}

function exportarCSV() {
  fetch(API_URL)
    .then(res => res.json())
    .then(estoque => {
      if (!estoque.length) {
        alert("Estoque vazio. Nada para exportar.");
        return;
      }

      const BOM = '\uFEFF'; // Byte Order Mark para forçar UTF-8 com acento
      const header = 'Nome,Código,Quantidade,Descrição,Data\n'; // ← aqui está a variável
      const linhas = estoque.map(item => (
        `"${item.nome}","${item.codigo}","${item.quantidade}","${item.descricao}","${new Date(item.ultimaAtualizacao).toLocaleString()}"`
      ));
      
      const csvContent = BOM + header + linhas.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'estoque.csv';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('Estoque exportado para estoque.csv');
    })
    .catch(err => {
      console.error("Erro ao exportar CSV:", err);
      alert("Erro ao exportar CSV. Verifique a conexão com a API.");
    });
}

function cancelarAdicionar() {
  document.getElementById('formularioAdicionar').style.display = 'none';
}

document.getElementById('formAdicionar').addEventListener('submit', async function (e) {
  e.preventDefault();

  const nome = document.getElementById('nome').value;
  const quantidade = parseInt(document.getElementById('quantidade').value);
  const descricao = document.getElementById('descricao').value;

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

    // Gera código até encontrar um código único
    while (codigoExistente) {
      // Gera código aleatório entre 0000 e 9999
      codigoGerado = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

      // Verifica se o código já existe no estoque
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
    descricao: descricaoComCategoria,  // Atualiza a descrição com a categoria
    codigo,  // Adiciona o código gerado
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

      // Lista de categorias para o filtro
      const categorias = [
        'Periféricos', 'Armazenamento', 'Memória e Processamento', 'Placas', 
        'Fontes de Alimentação', 'Cabos e Conectores', 'Refrigeração', 
        'Diversos', 'Equipamentos Completos', 'Outros'
      ];

      // Exibe a tabela do estoque com o filtro de categoria
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

          <label for="categoriaFiltro">Filtrar por categoria:</label>
          <select id="categoriaFiltro" onchange="aplicarFiltro()">
            <option value="">Todas as categorias</option>
            ${categorias.map(categoria => `<option value="${categoria}">${categoria}</option>`).join('')}
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
                  <td>${item.codigo}</td>
                  <td>x${item.quantidade}</td>
                  <td>${item.descricao || ''}</td> <!-- Descrição agora inclui a categoria -->
                  <td>${new Date(item.ultimaAtualizacao).toLocaleString()}</td>
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
  let categoria = document.getElementById('categoriaFiltro').value;
  
  let estoque = [...estoqueOriginal]; // Faz uma cópia para evitar mutação direta

  // Filtra por categoria, se houver categoria selecionada
  if (categoria) {
    estoque = estoque.filter(item => item.descricao.includes(categoria));
  }

  // Aplica o filtro adicional de quantidade ou ordem alfabética
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

  if (!termo) {
    atualizarTabela(estoque);  // Se o campo de pesquisa estiver vazio, exibe todos os itens
    return;
  }

  let resultadoPesquisa = estoque.filter(item => {
    return (
      item.nome.toLowerCase().includes(termo) || 
      (item.codigo && item.codigo.toString().toLowerCase().includes(termo))
    );
  });

  atualizarTabela(resultadoPesquisa);  // Atualiza a tabela com os resultados da pesquisa
}

function atualizarTabela(estoque) {
  const tbody = estoque.map(item => {
    return `
      <tr>
        <td>${item.nome}</td>
        <td>${item.codigo}</td>
        <td>${item.quantidade}</td>
        <td>${item.descricao || ''}</td> <!-- Descrição com a categoria incluída -->
        <td>${new Date(item.ultimaAtualizacao).toLocaleString()}</td>
      </tr>
    `;
  }).join('');

  document.getElementById('tbodyEstoque').innerHTML = tbody;
}
