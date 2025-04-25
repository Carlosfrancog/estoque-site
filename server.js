const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

const estoquePath = path.join(__dirname, 'data', 'estoque.json');

// Função para gerar um novo ID
const gerarId = (estoque) => {
  return (estoque.length > 0) ? Math.max(...estoque.map(item => parseInt(item.codigo))) + 1 : 1;
};

// GET estoque
app.get('/api/estoque', (req, res) => {
  fs.readFile(estoquePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Erro ao ler o estoque');
    }

    let estoque = JSON.parse(data);

    // Garantir que o campo 'codigo' é tratado como inteiro
    estoque = estoque.map(item => {
      if (item.codigo === undefined) {
        console.warn('Campo "codigo" não encontrado, criando um código único.');
        item.codigo = Math.floor(Math.random() * 1000);
      } else {
        item.codigo = parseInt(item.codigo, 10);
      }
      return item;
    });

    res.json(estoque);
  });
});

// POST item (aceita único item ou múltiplos)
app.post('/api/estoque', (req, res) => {
  const dadosRecebidos = req.body;

  fs.readFile(estoquePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).send('Erro ao ler o estoque');

    let estoque = JSON.parse(data);
    let alteracoes = Array.isArray(dadosRecebidos) ? dadosRecebidos : [dadosRecebidos];

    alteracoes.forEach(novoItem => {
      // Garante que todos os campos estão presentes
      novoItem.nome = novoItem.nome?.trim();
      novoItem.descricao = novoItem.descricao?.trim();
      novoItem.quantidade = parseInt(novoItem.quantidade, 10) || 0;

      if (!novoItem.codigo) {
        novoItem.codigo = gerarId(estoque);
      }

      const itemExistente = estoque.find(item => item.codigo.toString() === novoItem.codigo.toString());

      if (itemExistente) {
        // Atualiza o item existente
        itemExistente.nome = novoItem.nome;
        itemExistente.quantidade = novoItem.quantidade;
        itemExistente.descricao = novoItem.descricao;
        itemExistente.ultimaAtualizacao = new Date().toISOString();
      } else {
        // Insere novo item
        novoItem.ultimaAtualizacao = new Date().toISOString();
        estoque.push(novoItem);
      }
    });

    // Converte os códigos para string
    estoque = estoque.map(item => {
      item.codigo = item.codigo.toString();
      return item;
    });

    fs.writeFile(estoquePath, JSON.stringify(estoque, null, 2), err => {
      if (err) return res.status(500).send('Erro ao salvar as alterações');
      res.status(200).send('Alterações salvas com sucesso');
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Acesse a interface em http://localhost:${PORT}/public/index.html`);
});

// DELETE item por código
app.delete('/api/estoque/:codigo', (req, res) => {
  const codigo = req.params.codigo;

  fs.readFile(estoquePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).send('Erro ao ler o estoque');

    let estoque = JSON.parse(data);
    const novoEstoque = estoque.filter(item => item.codigo.toString() !== codigo.toString());

    if (estoque.length === novoEstoque.length) {
      return res.status(404).send('Item não encontrado');
    }

    fs.writeFile(estoquePath, JSON.stringify(novoEstoque, null, 2), err => {
      if (err) return res.status(500).send('Erro ao salvar as alterações após exclusão');
      res.status(200).send('Item excluído com sucesso');
    });
  });
});