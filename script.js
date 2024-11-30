document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");

    document.getElementById('data-form').addEventListener('submit', function(event) {
        event.preventDefault();
        console.log("Form submitted");

        var serial = document.getElementById('serial').value.toUpperCase();
        var model = document.getElementById('model').value.toUpperCase();
        var date = new Date().toISOString().split('T')[0]; // Data atual no formato YYYY-MM-DD
        var currie = document.getElementById('currie').value.toUpperCase();

        console.log("Form values:", { serial, model, date, currie });

        if (isDuplicateSerial(serial)) {
            alert("ESN já registrado!");
            document.getElementById('serial').style.borderColor = "red";
            return;
        }

        document.getElementById('serial').style.borderColor = ""; // Resetar cor da borda

        addNewEntry(serial, model, date, currie);
        document.getElementById('data-form').reset();
        document.getElementById('duplicate-warning').style.display = 'none'; // Esconder aviso de duplicação após adicionar
        sortTableByColumn(4); // Ordenar pela coluna dos nomes (Nome Courier)
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

    function addNewEntry(serial, model, date, currie) {
        var formattedDate = formatDateToBrazilian(date);
        var table = document.getElementById('data-table').getElementsByTagName('tbody')[0];
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

        console.log("New entry added:", { serial, model, formattedDate, currie, daysInSystem });
        sortTableByColumn(4); // Ordenar após adição
    }

    function removeRow(button) {
        var row = button.parentNode.parentNode;
        row.parentNode.removeChild(row);
    }

    function sortTableByColumn(columnIndex) {
        var table = document.getElementById('data-table');
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
            var option = document.createElement('option');
            option.text = newCourier;
            option.value = newCourier;
            select.add(option);
            document.getElementById('new-courier').value = ''; // Limpar o campo de entrada
        }
    }

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

            jsonData.forEach(function(row, index) {
                if (index === 0) return; // Ignorar cabeçalho
                var serial = row[0];
                var model = row[1];
                var date = formatDateFromExcel(row[2]);
                var currie = row[3];
                addNewEntry(serial, model, date, currie);
            });
        };
        reader.readAsArrayBuffer(file);
    });

    document.getElementById('export-btn').addEventListener('click', function() {
        var table = document.getElementById('data-table');
        var wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
        XLSX.writeFile(wb, 'dados.xlsx');
    });

    function formatDateFromExcel(excelDate) {
        var date = new Date(Math.round((excelDate - 25569) * 86400 * 1000)); // Corrige a data do Excel
        var day = ("0" + date.getDate()).slice(-2);
        var month = ("0" + (date.getMonth() + 1)).slice(-2);
        var year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
});

        var year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
});
