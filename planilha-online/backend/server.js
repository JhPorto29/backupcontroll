const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

// Conexão com banco SQLite
const db = new sqlite3.Database("./dados.db", (err) => {
  if (err) console.error(err.message);
  else console.log("Conectado ao banco de dados SQLite.");
});

// Criação da tabela
db.run(`CREATE TABLE IF NOT EXISTS dados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    valor TEXT
)`);

// Rota para obter os dados
app.get("/dados", (req, res) => {
  db.all("SELECT * FROM dados", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Rota para inserir dados
app.post("/dados", (req, res) => {
  const { nome, valor } = req.body;
  db.run(`INSERT INTO dados (nome, valor) VALUES (?, ?)`, [nome, valor], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, nome, valor });
  });
});

// Iniciar servidor
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
