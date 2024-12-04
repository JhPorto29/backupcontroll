document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const client = urlParams.get("client");
    document.getElementById("client-name").textContent = `Controle de Backups - ${client || "Cliente Padrão"}`;
 
    document.getElementById("data-form").addEventListener("submit", function (event) {
        event.preventDefault();
        const serial = document.getElementById("serial").value.toUpperCase();
        const model = document.getElementById("model").value.toUpperCase();
        const date = new Date().toISOString().split("T")[0];
        const currie = document.getElementById("currie").value.toUpperCase();
 
        const duplicateRow = isDuplicateSerial(serial);
        if (duplicateRow) {
            if (confirm("ESN já registrado! Deseja remover o ESN existente?")) {
                removeRow(duplicateRow);
            } else {
                document.getElementById("serial").style.borderColor = "red";
                return;
            }
        }
 
        document.getElementById("serial").style.borderColor = "";
        addNewEntry(serial, model, date, currie);
        document.getElementById("data-form").reset();
        sortTableByColumn(4);
    });
 
    document.getElementById("import-btn").addEventListener("click", function () {
        document.getElementById("import-file").click();
    });
 
    document.getElementById("import-file").addEventListener("change", function (event) {
        const file = event.target.files[0];
        const reader = new FileReader();
 
        reader.onload = function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
 
            jsonData.forEach(row => {
                if (row[0] && row[1] && row[2] && row[3]) {
                    const serial = row[0].toString().toUpperCase();
                    const model = row[1].toString().toUpperCase();
                    const date = row[2];
                    const currie = row[3].toString().toUpperCase();
 
                    if (!isNaN(Date.parse(date))) {
                        addNewEntry(serial, model, date, currie);
                    } else {
                        console.warn(`Entrada ignorada: Data inválida (${date})`);
                    }
                }
            });
        };
 
        reader.onerror = function (error) {
            console.error("Erro ao ler o arquivo:", error);
        };
 
        reader.readAsArrayBuffer(file);
    });
 
    document.getElementById("export-btn").addEventListener("click", function () {
        const table = document.getElementById("data-table");
        const wb = XLSX.utils.table_to_book(table, { sheet: "Dados" });
        XLSX.writeFile(wb, "dados.xlsx");
    });
 
    function isDuplicateSerial(serial) {
        const rows = document.querySelectorAll("#data-table tbody tr");
        for (const row of rows) {
            if (row.cells[1].textContent === serial) return row;
        }
        return null;
    }
 
    function addNewEntry(serial, model, date, currie) {
        const tableBody = document.querySelector("#data-table tbody");
        if (!tableBody) {
            console.error("Table body not found");
            return;
        }
        const row = document.createElement("tr");
        const formattedDate = formatDate(date);
        const daysInSystem = calculateDaysInSystem(date);
        const daysColor = getDaysColor(daysInSystem);
 
        row.innerHTML = `
            <td>${tableBody.children.length + 1}</td>
            <td>${serial}</td>
            <td>${model}</td>
            <td>${formattedDate}</td>
            <td>${currie}</td>
            <td style="color: ${daysColor};">${daysInSystem} dias</td>
            <td><button class="remove-button">Remover</button></td>
        `;
        tableBody.appendChild(row);
 
        row.querySelector(".remove-button").addEventListener("click", function () {
            removeRow(row);
        });
    }
 
    function formatDate(date) {
        if (!date) return "Data Inválida";
        try {
            if (typeof date === "string") {
                const parts = date.split(/[-/]/);
                if (parts.length === 3 && parts[0].length === 4) {
                    return `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
            }
            return new Date(date).toLocaleDateString("pt-BR");
        } catch {
            return "Data Inválida";
        }
    }
 
    function removeRow(row) {
        row.parentElement.removeChild(row);
    }
 
    function sortTableByColumn(columnIndex) {
        const rows = Array.from(document.querySelectorAll("#data-table tbody tr"));
        rows.sort((a, b) => a.cells[columnIndex].textContent.localeCompare(b.cells[columnIndex].textContent));
        const tableBody = document.querySelector("#data-table tbody");
        rows.forEach(row => tableBody.appendChild(row));
    }
 
    function calculateDaysInSystem(date) {
        const currentDate = new Date();
        const entryDate = new Date(date);
        return Math.ceil((currentDate - entryDate) / (1000 * 60 * 60 * 24));
    }
 
    function getDaysColor(days) {
        if (days <= 30) return "green";
        if (days <= 60) return "orange";
        return "red";
    }
});
