document.addEventListener('DOMContentLoaded', function () {
  const urlParams = new URLSearchParams(window.location.search);
  const client = urlParams.get('client');
  document.getElementById('client-name').textContent = `Controle de Backups - ${client || 'Cliente Padrão'}`;
 
  // Event listener para o formulário
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
  });
 
  // Importar dados de arquivo
  document.getElementById('import-btn').addEventListener('click', function () {
    document.getElementById('import-file').click();
  });
 
  document.getElementById('import-file').addEventListener('change', function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();
 
    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
 
      jsonData.forEach(row => {
        if (row[0]) addNewEntry(row[0], row[1], row[2], row[3]);
      });
    };
 
    reader.onerror = function (error) {
      console.error("Erro ao carregar o arquivo:", error);
    };
 
    reader.readAsArrayBuffer(file);
  });
 
  // Exportar dados
  document.getElementById('export-btn').addEventListener('click', function () {
    const table = document.getElementById('data-table');
    const wb = XLSX.utils.table_to_book(table, { sheet: "Dados" });
    XLSX.writeFile(wb, 'dados.xlsx');
  });
 
  // Funções principais
  function isDuplicateSerial(serial) {
    const rows = document.querySelectorAll('#data-table tbody tr');
    for (const row of rows) {
      if (row.cells[1].textContent === serial) return row;
    }
    return null;
  }
 
  function addNewEntry(serial, model, date, currie) {
    const tableBody = document.querySelector('#data-table tbody');
    if (!tableBody) {
      console.error("Table body not found");
      return;
    }
 
    const formattedDate = formatDate(date);
    const daysInSystem = calculateDaysInSystem(date);
    const daysColor = getDaysColor(daysInSystem);
 
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${tableBody.children.length + 1}</td>
      <td>${serial}</td>
      <td>${model}</td>
      <td>${formattedDate}</td>
      <td>${currie}</td>
      <td style="color: ${daysColor};">${daysInSystem} dias</td>
      <td><button onclick="removeRow(this)">Remover</button></td>
    `;
    tableBody.appendChild(row);
  }
 
  function formatDate(date) {
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate)) throw new Error('Data inválida');
      return parsedDate.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error("Erro ao formatar a data:", error);
      return '!';
    }
  }
 
  function removeRow(button) {
    const row = button.closest('tr');
    row.parentElement.removeChild(row);
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
    return Math.ceil((currentDate - entryDate) / (1000 * 60 * 60 * 24));
  }
 
  function getDaysColor(days) {
    if (days <= 30) return 'green';
    if (days <= 60) return 'orange';
    return 'red';
  }
 
  // Pesquisa na tabela
  window.searchTable = function () {
    const input = document.getElementById('search-box').value.toUpperCase();
    const rows = document.querySelectorAll('#data-table tbody tr');
    const column = parseInt(document.getElementById('search-column').value);
 
    rows.forEach(row => {
      const cell = row.cells[column];
row.style.display = cell && cell.textContent.toUpperCase().includes(input) ? "" : "none";
    });
  };
 
  // Exportar para JSON
  window.goToTransport = function () {
    const rows = document.querySelectorAll('#data-table tbody tr');
    if (!rows.length) {
      alert('Não há dados para gerar o documento de transporte.');
      return;
    }
 
    const transportData = Array.from(rows).map(row => ({
      esn: row.cells[1].textContent,
      model: row.cells[2].textContent,
      date: row.cells[3].textContent,
      courier: row.cells[4].textContent,
      daysInSystem: row.cells[5].textContent
    }));
 
    const blob = new Blob([JSON.stringify(transportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
a.download = 'transport_document.json';
    document.body.appendChild(a);
a.click();
    document.body.removeChild(a);
  };
});
