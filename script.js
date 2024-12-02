document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const client = urlParams.get('client');
    document.getElementById('client-name').textContent = `Controle de Backups - ${client}`;

    document.getElementById('data-form').addEventListener('submit', function(event) {
        event.preventDefault();
        console.log("Form submitted");

        var serial = document.getElementById('serial').value.toUpperCase();
        var model = document.getElementById('model').value.toUpperCase();
        var date = new Date().toISOString().split('T')[0]; // Data atual no formato YYYY-MM-DD
        var currie = document.getElementById('currie').value.toUpperCase();

        console.log("Form values:", { serial, model, date, currie });

        var duplicateRow = isDuplicateSerial(serial);
        if (duplicateRow) {
            if (confirm("ESN já registrado! Deseja remover o ESN existente?")) {
                removeRow(duplicateRow);
            } else {
                document.getElementById('serial').style.borderColor = "red";
                return;
            }
        }

        document.getElementById('serial').style.borderColor = ""; // Resetar cor da borda

        addNewEntry(serial, model, date, currie);
        document.getElementById('data-form').reset();
        sortTableByColumn(4); // Ordenar pela coluna dos nomes (Nome Courier)
    });

    document.getElementById('import-btn').addEventListener('click', function() {
        document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', function(event) {
        var file = event.target.files[0];
        var reader = new FileReader();
        
        reader.onload = function(e) {
            var data = new Uint8Array(e.target.result);
            var workbook = XLSX.read(data, { type: 'array' });
            var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            var jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            var worker = new Worker('worker.js');
            worker.postMessage({ jsonData });

            worker.onmessage = function(event) {
                var data = event.data;

                if (data.couriers) {
                    data.couriers.forEach(function(courier) {
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
                    addNewEntry(data.serial, data.model, data.dateExcelFormat, data.currie);
                }
            };
        };
        reader.readAsArrayBuffer(file);
    });

    document.getElementById('export-btn').addEventListener('click', function() {
        var table = document.getElementById('data-table');
        if (!table) return;
        var wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
        XLSX.writeFile(wb, 'dados.xlsx');
    });

    function goHome() {
        window.location.href = 'index.html';
    }

    function goToTransport() {
        const urlParams = new URLSearchParams(window.location.search);
        const client = urlParams.get('client');
        window.location.href = `transporte.html?client=${client}`;
    }

    function isDuplicateSerial(serial) {
    var table = document.getElementById('data-table');
    if (!table) {
        console.error('data-table element not found');
        return null;
    }
    var tbody = table.getElementsByTagName('tbody')[0];
    var rows = tbody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var cells = rows[i].getElementsByTagName('td');
        if (cells[1].textContent === serial) {
            return rows[i];
        }
    }
    return null;
}
 function isDuplicateSerial(serial) {
    var table = document.getElementById('data-table');
    if (!table) {
        console.error('data-table element not found');
        return null;
    }
    var tbody = table.getElementsByTagName('tbody')[0];
    var rows = tbody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var cells = rows[i].getElementsByTagName('td');
        if (cells[1].textContent === serial) {
            return rows[i];
        }
    }
    return null;
}
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

    function removeRow(button) {
        var row = button.parentNode.parentNode;
        row.parentNode.removeChild(row);
    }

    function sortTableByColumn(columnIndex) {
        var table = document.getElementById('data-table');
        if (!table) return;
        var rows = Array.from(table.rows).slice(1); // Ignorar a linha do cabeçalho
        rows.sort(function(a, b) {
            var cellA = a.cells[columnIndex].textContent.trim();
            var cellB = b.cells[columnIndex].textContent.trim();
            return cellA.localeCompare(cellB);
        });
        rows.forEach(function(row) {
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
                if (txtValue.toUpperCase().indexOf(input) > -1) {
                    rows[i].style.display = "";
                } else {
                    rows[i].style.display = "none";
                }
            }
        }
    }

    function formatDateToBrazilian(date) {
        if (!date || typeof date !== 'string') return date;
        var parts = date.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    function calculateDaysInSystem(date) {
        var currentDate = new Date();
        var entryDate = new Date(date);
        var timeDiff = Math.abs(currentDate - entryDate);
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return diffDays;
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

    function filterCouriers() {
        var input = document.getElementById('new-courier').value.toUpperCase();
        var list = document.getElementById('courier-list');
        var items = list.getElementsByTagName('li');

        for (var i = 0; i < items.length; i++) {
            var txtValue = items[i].textContent || items[i].innerText;
            if (txtValue.toUpperCase().indexOf(input) > -1) {
                items[i].style.display = "";
            } else {
                items[i].style.display = "none";
            }
        }
    }

    function addNewCourier() {
        var newCourier = document.getElementById('new-courier').value;
        if (newCourier) {
            var select = document.getElementById('currie');
            if (!select) return;
            var option = document.createElement('option');
            option.text = newCourier;
            option.value = newCourier;
            select.add(option);
            document.getElementById('new-courier').value = ''; // Limpar o campo de entrada
        }
    }

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
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    function addCourierToTransport(currie) {
        var select = document.getElementById('kit-currie');
        if (!select) return;
        var option = document.createElement('option');
        option.text = currie;
        option.value = currie;
        select.add(option);
    }

    // Tornar as funções acessíveis globalmente
    window.goHome = goHome;
    window.goToTransport = goToTransport;
    window.filterCouriers = filterCouriers;
    window.addNewCourier = addNewCourier;
    window.searchTable = searchTable;
});
