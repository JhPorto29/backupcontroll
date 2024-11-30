document.addEventListener('DOMContentLoaded', function() {
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
            var txtValue = items[i].textContent || items[i].
