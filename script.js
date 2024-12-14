document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const client = urlParams.get('client');
    document.getElementById('client-name').textContent = `Controle de Backups - ${client || 'Cliente Padrão'}`;

    document.getElementById('data-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const serial = document.getElementById('serial').value.toUpperCase();
        const model = document.getElementById('model').value.toUpperCase();
        const date = new Date().toISOString().split('T')[0];
        const currie = document.getElementById('currie').value.toUpperCase();

        const duplicateRow = isDuplicateSerial(serial);
        if (duplicateRow) {
            if (confirm("ESN já registrado! Deseja remover o ESN existente?")) {
                removeRow(duplicateRow);
            } else {
                document.getElementById('serial').style.borderColor = "red";
                return;
            }
        }

        document.getElementById('serial').style.borderColor = "";
        addNewEntry(serial, model, date, currie);
        document.getElementById('data-form').reset();
        sortTableByColumn(4);
        updateTimeColumn();
    });

    document.getElementById('import-btn').addEventListener('click', function () {
        document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                jsonData.forEach((row, index) => {
                    if (index === 0) return; // Ignora o cabeçalho
                    const [serial, model, date, currie] = row;

                    if (serial && model && date && currie) {
                        const formattedDate = typeof date === 'number' ? excelDateToISO(date) : date;
                        addNewEntry(serial, model, formattedDate, currie);
                    }
                });

                updateTimeColumn();
            } catch (error) {
                console.error("Erro ao processar a planilha:", error);
            }
        };

        reader.onerror = function (error) {
            console.error("Erro ao carregar o arquivo:", error);
        };

        reader.readAsArrayBuffer(file);
    });

    document.getElementById('export-btn').addEventListener('click', function () {
        const table = document.getElementById('data-table');
        const wb = XLSX.utils.table_to_book(table, { sheet: "Dados" });
        XLSX.writeFile(wb, 'dados.xlsx');
    });

    document.getElementById('serial').addEventListener('input', function () {
        const serial = this.value.toUpperCase();
        const duplicateRow = isDuplicateSerial(serial);
        const serialField = document.getElementById('serial');
        const duplicateMessage = document.getElementById('duplicate-message');

        if (duplicateRow) {
            serialField.style.borderColor = "red";
            duplicateMessage.textContent = "ESN já registrado!";
            duplicateMessage.style.color = "red";
        } else {
            serialField.style.borderColor = "";
            duplicateMessage.textContent = "";
        }
    });

    function isDuplicateSerial(serial) {
        const rows = document.querySelectorAll('#data-table tbody tr');
        for (const row of rows) {
            if (row.cells[1].textContent === serial) return row;
        }
        return null;
    }

    function addNewEntry(serial, model, date, currie) {
        const tableBody = document.querySelector('#data-table tbody');
        const row = document.createElement('tr');
        const formattedDate = formatDate(date);

        row.innerHTML = `
            <td>${tableBody.children.length + 1}</td>
            <td>${serial}</td>
            <td>${model}</td>
            <td>${formattedDate}</td>
            <td>${currie}</td>
            <td></td>
            <td><button onclick="removeRow(this)">Remover</button></td>
        `;
        tableBody.appendChild(row);
        addCourierToSelect(currie);
    }

    function formatDate(date) {
        return date.split('-').reverse().join('/');
    }

    function excelDateToISO(excelDate) {
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
    }

    function removeRow(button) {
        const row = button.closest('tr');
        row.parentElement.removeChild(row);
        updateTimeColumn();
    }

    function sortTableByColumn(columnIndex) {
        const rows = Array.from(document.querySelectorAll('#data-table tbody tr'));
        rows.sort((a, b) => a.cells[columnIndex].textContent.localeCompare(b.cells[columnIndex].textContent));
        const tableBody = document.querySelector('#data-table tbody');
        rows.forEach(row => tableBody.appendChild(row));
    }

    function calculateDaysInSystem(date) {
        const currentDate = new Date();
        const entryDate = new Date(date);
        return Math.floor((currentDate - entryDate) / (1000 * 60 * 60 * 24));
    }

    function getDaysColor(days) {
        if (days <= 30) return 'green';
        else if (days <= 60) return 'orange';
        else return 'red';
    }

    function addCourierToSelect(currie) {
        const select = document.getElementById('currie');
        if (!Array.from(select.options).some(option => option.value === currie)) {
            const option = document.createElement('option');
            option.value = currie;
            option.text = currie;
            select.appendChild(option);
        }
    }

    function updateTimeColumn() {
        const rows = document.querySelectorAll('#data-table tbody tr');
        rows.forEach(row => {
            const dateCell = row.cells[3];
            const timeCell = row.cells[5];
            const entryDate = new Date(dateCell.textContent.split('/').reverse().join('-'));
            const daysInSystem = calculateDaysInSystem(entryDate);
            const daysColor = getDaysColor(daysInSystem);

            timeCell.textContent = `${daysInSystem} dias`;
            timeCell.style.color = daysColor;
        });
    }

    function searchTable() {
        const input = document.getElementById('search-box').value.toUpperCase();
        const table = document.getElementById('data-table');
        const rows = table.querySelectorAll('tbody tr');
        const column = parseInt(document.getElementById('search-column').value);

        rows.forEach(row => {
            const cell = row.cells[column];
            if (cell) {
                const txtValue = cell.textContent || cell.innerText;
                row.style.display = txtValue.toUpperCase().includes(input) ? "" : "none";
            }
        });
    }

    window.goHome = function () {
        window.location.href = 'index.html';
    };

    window.searchTable
    // Outras funções...
});
