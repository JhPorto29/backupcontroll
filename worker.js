self.addEventListener('message', function(event) {
    var data = event.data;
    var jsonData = data.jsonData;
    var couriers = new Set();
    var chunkSize = 100;
    var index = 0;

    function processChunk() {
        var chunk = jsonData.slice(index, index + chunkSize);

        chunk.forEach(function(row) {
            var serial = row[0];
            var model = row[1];
            var dateExcelFormat = row[2];
            var currie = row[3];

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
            setTimeout(processChunk, 0); // Processar o próximo bloco
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
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}