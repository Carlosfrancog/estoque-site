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
  // Gera um ID único baseado no timestamp e tamanho do estoque
  return (estoque.length > 0) ? Math.max(...estoque.map(item => item.codigo)) + 1 : 1;
};

// GET estoque
app.get('/api/estoque', (req, res) => {
    fs.readFile(estoquePath, 'utf-8', (err, data) => {
      if (err) {
        return res.status(500).send('Erro ao ler o estoque');
      }
  
      let estoque = JSON.parse(data);
  
      // Adicionando log para verificar os dados lidos
      //console.log('Estoque lido:', estoque);
  
      // Garantir que o campo 'codigo' é tratado como inteiro
      estoque = estoque.map(item => {
        if (item.codigo === undefined) {
          console.warn('Campo "codigo" não encontrado, criando um código único.');
          item.codigo = Math.floor(Math.random() * 1000);  // Gerando um código único, se não existir
        } else {
          item.codigo = parseInt(item.codigo, 10);  // Garantir que 'codigo' seja um número inteiro
        }
  
        return item;
      });
  
      // Adicionando log para verificar como os dados foram manipulados
      //console.log('Estoque após manipulação:', estoque);
  
      res.json(estoque);
    });
  });

// POST item
app.post('/api/estoque', (req, res) => {
  const novoItem = req.body;
  fs.readFile(estoquePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).send('Erro ao ler o estoque');
    let estoque = JSON.parse(data);

    // Adiciona um novo id se não houver um
    if (!novoItem.codigo) {
      novoItem.codigo = gerarId(estoque);
    }

    // Comparação por nome semelhante (ignorando caixa e espaços extras)
    const itemExistente = estoque.find(item => item.nome.trim().toLowerCase() === novoItem.nome.trim().toLowerCase());
    if (itemExistente) {
      itemExistente.quantidade += novoItem.quantidade;
      itemExistente.ultimaAtualizacao = new Date().toISOString();
    } else {
      novoItem.ultimaAtualizacao = new Date().toISOString();
      estoque.push(novoItem);
    }

    // Converte todos os ids para string antes de salvar
    estoque = estoque.map(item => {
      item.codigo = item.codigo.toString();
      return item;
    });

    fs.writeFile(estoquePath, JSON.stringify(estoque, null, 2), err => {
      if (err) return res.status(500).send('Erro ao salvar o item');
      res.status(200).send('Item salvo com sucesso');
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
