document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const client = urlParams.get('client');
    document.getElementById('client-name').textContent = `Controle de Backups - ${client}`;
 
    document.getElementById('data-form').addEventListener('submit', function (event) {
        event.preventDefault();
 
        var serial = document.getElementById('serial').value.toUpperCase();
        var model = document.getElementById('model').value.toUpperCase();
        var date = new Date().toISOString().split('T')[0]; // Data atual no formato YYYY-MM-DD
        var currie = document.getElementById('currie').value.toUpperCase();
 
        if (!serial || !model || !currie) {
            alert('Preencha todos os campos antes de enviar.');
            return;
        }
 
        var duplicateRow = isDuplicateSerial(serial);
        if (duplicateRow) {
            if (confirm("ESN já registrado! Deseja remover o ESN existente?")) {
                removeRow(duplicateRow);
            } else {
                document.getElementById('serial').classList.add('error-border');
                return;
            }
        }
 
        document.getElementById('serial').classList.remove('error-border');
        addNewEntry(serial, model, date, currie);
        document.getElementById('data-form').reset();
        sortTableByColumn(4); // Ordenar pela coluna dos nomes (Nome Courier)
    });
 
    document.getElementById('import-btn').addEventListener('click', function () {
        document.getElementById('import-file').click();
    });
 
    document.getElementById('import-file').addEventListener('change', function (event) {
        var file = event.target.files[0];
        var reader = new FileReader();
 
        reader.onload = function (e) {
            try {
                var data = new Uint8Array(e.target.result);
                var workbook = XLSX.read(data, { type: 'array' });
                var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                var jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
 
                var worker = new Worker('worker.js');
                worker.postMessage({ jsonData });
 
                worker.onmessage = function (event) {
                    var data = event.data;
 
                    if (data.couriers) {
                        data.couriers.forEach(function (courier) {
                            var select = document.getElementById('currie');
                            var option = document.createElement('option');
                            option.text = courier;
                            option.value = courier;
                            select.add(option);
                        });
                    } else {
                        var duplicateRow = isDuplicateSerial(data.serial);
                        if (duplicateRow) {
                            removeRow(duplicateRow);
                        }
                        addNewEntry(data.serial, data.model, formatDateFromExcel(data.dateExcelFormat), data.currie);
                    }
                };
            } catch (error) {
                alert('Erro ao processar o arquivo. Verifique o formato.');
            }
        };
        reader.readAsArrayBuffer(file);
    });
 
    document.getElementById('export-btn').addEventListener('click', function () {
        var table = document.getElementById('data-table');
        if (!table) return;
        var wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
        XLSX.writeFile(wb, 'dados.xlsx');
    });
 
    function goHome() {
        window.location.href = 'index.html';
    }
 
    function goToTransport() {
        const client = urlParams.get('client');
        window.location.href = `transporte.html?client=${client}`;
    }
 
    function isDuplicateSerial(serial) {
        var table = document.getElementById('data-table').getElementsByTagName('tbody')[0];
        if (!table) return null;
        var rows = table.getElementsByTagName('tr');
        for (var i = 0; i < rows.length; i++) {
            var cells = rows[i].getElementsByTagName('td');
            if (cells[1].textContent === serial) {
                return rows[i];
            }
        }
        return null;
    }
 
    function addNewEntry(serial, model, date, currie) {
        var formattedDate = formatDateToBrazilian(date);
        var table = document.getElementById('data-table').getElementsByTagName('tbody')[0];
        if (!table) return;
        var newRow = table.insertRow();
 
        var daysInSystem = calculateDaysInSystem(date);
        var daysColor = getDaysColor(daysInSystem);
 
        newRow.innerHTML = `
            <td>${table.rows.length + 1}</td>
            <td>${serial}</td>
            <td>${model}</td>
            <td>${formattedDate}</td>
            <td>${currie}</td>
            <td style="color: ${daysColor};">${daysInSystem} dias</td>
            <td><button onclick="removeRow(this)">Remover</button></td>
        `;
    }
 
    function removeRow(row) {
        row.parentNode.removeChild(row);
    }
 
    function sortTableByColumn(columnIndex) {
        var table = document.getElementById('data-table');
        if (!table) return;
        var rows = Array.from(table.rows).slice(1); // Ignorar a linha do cabeçalho
        rows.sort(function (a, b) {
            var cellA = parseFloat(a.cells[columnIndex].textContent) || a.cells[columnIndex].textContent.trim();
            var cellB = parseFloat(b.cells[columnIndex].textContent) || b.cells[columnIndex].textContent.trim();
            return cellA > cellB ? 1 : -1;
        });
        rows.forEach(function (row) {
            table.tBodies[0].appendChild(row);
        });
    }
 
    function searchTable() {
        var input = document.getElementById('search-box').value.toUpperCase();
        var table = document.getElementById('data-table');
        if (!table) return;
        var rows = table.getElementsByTagName('tr');
        var column = parseInt(document.getElementById('search-column').value);
 
        for (var i = 1; i < rows.length; i++) {
            var cells = rows[i].getElementsByTagName('td');
            var cell = cells[column];
            if (cell) {
                var txtValue = cell.textContent || cell.innerText;
                rows[i].style.display = txtValue.toUpperCase().includes(input) ? "" : "none";
            }
        }
    }
 
    function formatDateToBrazilian(date) {
        if (!date || !date.includes('-')) return date;
        var parts = date.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
 
    function calculateDaysInSystem(date) {
        var currentDate = new Date();
        var entryDate = new Date(date);
        var timeDiff = Math.abs(currentDate - entryDate);
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    }
 
    function getDaysColor(days) {
        if (days <= 30) {
            return 'green';
        } else if (days <= 60) {
            return 'orange';
        } else {
            return 'red';
        }
    }
 
    function formatDateFromExcel(excelDate) {
        if (typeof excelDate === 'number') {
            const dateOffset = Math.floor(excelDate - 25569);
            const newDate = new Date(dateOffset * 86400 * 1000);
            return newDate.toISOString().split('T')[0];
        }
        return excelDate;
    }
 
    // Tornar as funções acessíveis globalmente
    window.goHome = goHome;
    window.goToTransport = goToTransport;
    window.searchTable = searchTable;
});
