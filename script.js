self.addEventListener('message', function(event) {
    const data = event.data;
    const jsonData = data.jsonData;
    const couriers = new Set();
    const chunkSize = 100;
    let index = 0;

    function processChunk() {
        const chunk = jsonData.slice(index, index + chunkSize);

        chunk.forEach(function(row) {
            const serial = row[0];
            const model = row[1];
            let dateExcelFormat = row[2];
            const currie = row[3];

            // Verificar se a coluna ESN está preenchida
            if (!serial) {
                return; // Ignorar linhas com ESN em branco
            }

            // Corrigir a data do Excel para o formato correto
            if (typeof dateExcelFormat === 'number') {
                dateExcelFormat = formatDateFromExcel(dateExcelFormat);
            } else if (typeof dateExcelFormat === 'string') {
                dateExcelFormat = formatDateString(dateExcelFormat);
            }

            self.postMessage({ serial, model, dateExcelFormat, currie });
            couriers.add(currie);
        });

        index += chunkSize;

        if (index < jsonData.length) {
            requestAnimationFrame(processChunk); // Processar o próximo bloco
        } else {
            self.postMessage({ couriers: Array.from(couriers) });
        }
    }

    processChunk();
});

function formatDateFromExcel(excelDate) {
    // Corrigir a data do Excel para o formato correto
    if (typeof excelDate === 'number') {
        const dateOffset = Math.floor(excelDate - 25569);
        const newDate = new Date(dateOffset * 86400 * 1000);
        return newDate.toISOString().split('T')[0];
    }
    return excelDate;
}

function formatDateString(dateString) {
    // Formatar a string de data para o formato correto
    const parts = dateString.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString; // Retornar a string original se o formato não for esperado
}

function addNewEntry(serial, model, dateExcelFormat, currie) {
    const table = document.getElementById('data-table');
    if (!table) {
        console.error('Tabela não encontrada');
        return;
    }

    const tbody = table.getElementsByTagName('tbody')[0];
    if (!tbody) {
        console.error('Corpo da tabela não encontrado');
        return;
    }

    const newRow = tbody.insertRow();
    newRow.insertCell(0).textContent = tbody.rows.length;
    newRow.insertCell(1).textContent = serial;
    newRow.insertCell(2).textContent = model;
    newRow.insertCell(3).textContent = dateExcelFormat;
    newRow.insertCell(4).textContent = currie;
    newRow.insertCell(5).textContent = calculateDaysInSystem(dateExcelFormat);
    newRow.insertCell(6).innerHTML = '<button onclick="deleteRow(this)">Excluir</button>';
}

function isDuplicateSerial(serial) {
    const table = document.getElementById('data-table');
    if (!table) {
        console.error('Tabela não encontrada');
        return false;
    }

    const tbody = table.getElementsByTagName('tbody')[0];
    if (!tbody) {
        console.error('Corpo da tabela não encontrado');
        return false;
    }

    const rows = tbody.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        if (cells[1] && cells[1].textContent === serial) {
            return true;
        }
    }
    return false;
}

function calculateDaysInSystem(date) {
    const currentDate = new Date();
    const entryDate = new Date(date);
    const diffTime = Math.abs(currentDate - entryDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function deleteRow(button) {
    const row = button.parentNode.parentNode;
    row.parentNode.removeChild(row);
}
