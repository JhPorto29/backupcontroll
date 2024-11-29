document.getElementById('data-form').addEventListener('submit', function(event) {
    event.preventDefault();

    var serial = document.getElementById('serial').value;
    var model = document.getElementById('model').value;
    var date = document.getElementById('date').value;
    var currie = document.getElementById('currie').value;

    if (isDuplicateSerial(serial)) {
        alert("ESN já registrado!");
        document.getElementById('serial').style.borderColor = "red";
        return;
    }

    document.getElementById('serial').style.borderColor = ""; // Resetar cor da borda

    addNewEntry(serial, model, date, currie);
    saveDataToLocalStorage();
    document.getElementById('data-form').reset();
    document.getElementById('duplicate-warning').style.display = 'none'; // Esconder aviso de duplicação após adicionar
});

function isDuplicateSerial(serial) {
    var table = document.getElementById('data-table').getElementsByTagName('tbody')[0];
    var rows = table.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var cells = rows[i].getElementsByTagName('td');
        if (cells[1].textContent === serial) {
            return true;
        }
    }
    return false;
}

function checkDuplicateSerial() {
    var serial = document.getElementById('serial').value;
    if (isDuplicateSerial(serial)) {
        document.getElementById('duplicate-warning').style.display = 'block';
    } else {
        document.getElementById('duplicate-warning').style.display = 'none';
    }
}

function removeSerialPrompt() {
    var serial = document.getElementById('serial').value;
    removeSerial(serial);
    saveDataToLocalStorage();
    document.getElementById('duplicate-warning').style.display = 'none';
    document.getElementById('serial').style.borderColor = ""; // Resetar cor da borda após remoção
}

function formatDateToBrazilian(date) {
    if (!date || typeof date !== 'string') return date;
    var parts = date.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatDateFromExcel(excelDate) {
    var date = new Date(Math.round((excelDate - 25569) * 86400 * 1000)); // Corrige a data do Excel
    var day = ("0" + date.getDate()).slice(-2);
    var month = ("0" + (date.getMonth() + 1)).slice(-2);
    var year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function addNewEntry(serial, model, date, currie) {
    var formattedDate = formatDateToBrazilian(date);
    var table = document.getElementById('data-table').getElementsByTagName('tbody')[0];
    var newRow = table.insertRow();

    newRow.innerHTML = `
        <td>${table.rows.length + 1}</td>
        <td>${serial}</td>
        <td>${model}</td>
        <td>${formattedDate}</td>
        <td>${currie}</td>
        <td><button onclick="removeRow(this)">Remover</button></td>
    `;
}

function removeRow(button) {
    var row = button.parentElement.parentElement;
    row.parentElement.removeChild(row);
    saveDataToLocalStorage();
}

function removeSerial(serial) {
    var table = document.getElementById('data-table').getElementsByTagName('tbody')[0];
    var rows = table.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var cells = rows[i].getElementsByTagName('td');
        if (cells[1].textContent === serial) {
            table.deleteRow(i);
            break;
        }
    }
    saveDataToLocalStorage();
}

function saveDataToLocalStorage() {
    var table = document.getElementById('data-table').getElementsByTagName('tbody')[0];
    var rows = table.getElementsByTagName('tr');
    var data = [];
    for (var i = 0; i < rows.length; i++) {
        var cells = rows[i].getElementsByTagName('td');
        var rowData = {
            index: cells[0].textContent,
            serial: cells[1].textContent,
            model: cells[2].textContent,
            date: cells[3].textContent,
            currie: cells[4].textContent
        };
        data.push(rowData);
    }
    localStorage.setItem('backupData', JSON.stringify(data));
}

function loadDataFromLocalStorage() {
    var data = JSON.parse(localStorage.getItem('backupData'));
    if (data) {
        var table = document.getElementById('data-table').getElementsByTagName('tbody')[0];
        data.forEach(function(rowData) {
            var newRow = table.insertRow();
            newRow.innerHTML = `
                <td>${rowData.index}</td>
                <td>${rowData.serial}</td>
                <td>${rowData.model}</td>
                <td>${rowData.date}</td>
                <td>${rowData.currie}</td>
                <td><button onclick="removeRow(this)">Remover</button></td>
            `;
        });
    }
}

function searchSerial() {
    var input = document.getElementById('search-box').value.toLowerCase();
    var table = document.getElementById('data-table').getElementsByTagName('tbody')[0];
    var rows = table.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var cells = rows[i].getElementsByTagName('td');
        if (cells[1].textContent.toLowerCase().indexOf(input) > -1) {
            rows[i].style.display = "";
        } else {
            rows[i].style.display = "none";
        }
    }
}

document.getElementById('export-btn').addEventListener('click', function() {
    var table = document.getElementById('data-table');
    var rows = Array.from(table.rows);

    var data = rows.map(function(row) {
        return Array.from(row.cells).map(function(cell) {
            return cell.textContent;
        });
    });

    var worksheet = XLSX.utils.aoa_to_sheet(data);
    var workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");

    XLSX.writeFile(workbook, "dados_registrados.xlsx");
});

document.getElementById('import-btn').addEventListener('click', function() {
    var fileInput = document.getElementById('import-file');
    fileInput.click();
    fileInput.addEventListener('change', function() {
        var file = fileInput.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var content = e.target.result;
                var workbook = XLSX.read(content, {type: 'binary'});
                var sheetName = workbook.SheetNames[0];
                var worksheet = workbook.Sheets[sheetName];
                var jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});

                var table = document.getElementById('data-table').getElementsByTagName('tbody')[0];
                table.innerHTML = ''; // Limpar a tabela antes de adicionar novos dados

                jsonData.forEach(function(row, index) {
                    if (index !== 0) { // Skip header row
                        var formattedDate = isNaN(row[2]) ? formatDateToBrazilian(row[2]) : formatDateFromExcel(row[2]);
                        var newRow = table.insertRow();
                        newRow.innerHTML = `
                            <td>${table.rows.length + 1}</td>
                            <td>${row[0] || ''}</td>
                            <td>${row[1] || ''}</td>
                            <td>${formattedDate}</td>
                            <td>${row[3] || ''}</td>
                            <td><button onclick="removeRow(this)">Remover</button></td>
                        `;
                    }
                });
                saveDataToLocalStorage();
            };
            reader.onerror = function(ex) {
                console.log(ex);
                alert('Erro ao ler o arquivo');
            };
            reader.readAsBinaryString(file);
        } else {
            alert('Por favor, selecione um arquivo para importar.');
        }
    });
});

            alert('Por favor, selecione um arquivo para importar.');
        }
    });
});
