const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware para analisar o corpo das requisições
app.use(bodyParser.json());

// Rota para adicionar dados
app.post('/data', (req, res) => {
    const data = req.body;
    const filePath = path.join(__dirname, 'data.json');

    // Ler dados existentes
    fs.readFile(filePath, 'utf8', (err, fileData) => {
        if (err && err.code !== 'ENOENT') {
            return res.status(500).json({ error: 'Erro ao ler o arquivo' });
        }

        const existingData = fileData ? JSON.parse(fileData) : [];
        existingData.push(data);

        // Escrever dados atualizados
        fs.writeFile(filePath, JSON.stringify(existingData, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao salvar os dados' });
            }
            res.status(200).json({ message: 'Dados salvos com sucesso' });
        });
    });
});

// Rota para listar todos os dados
app.get('/data', (req, res) => {
    const filePath = path.join(__dirname, 'data.json');

    fs.readFile(filePath, 'utf8', (err, fileData) => {
        if (err && err.code !== 'ENOENT') {
            return res.status(500).json({ error: 'Erro ao ler o arquivo' });
        }

        const data = fileData ? JSON.parse(fileData) : [];
        res.status(200).json(data);
    });
});

// Rota para remover dados por índice
app.delete('/data/:index', (req, res) => {
    const { index } = req.params;
    const filePath = path.join(__dirname, 'data.json');

    fs.readFile(filePath, 'utf8', (err, fileData) => {
        if (err && err.code !== 'ENOENT') {
            return res.status(500).json({ error: 'Erro ao ler o arquivo' });
        }

        let data = fileData ? JSON.parse(fileData) : [];
        if (index >= 0 && index < data.length) {
            data.splice(index, 1);

            fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Erro ao salvar os dados' });
                }
                res.status(200).json({ message: `Dados no índice ${index} removidos` });
            });
        } else {
            res.status(400).json({ error: 'Índice inválido' });
        }
    });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});