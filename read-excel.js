const XLSX = require('xlsx');

const wb = XLSX.readFile('CALCULO TANQUE FIBRA HMLLO-COATZACOALCOS CONNECT.xlsx');

console.log('Hojas disponibles:', wb.SheetNames);

wb.SheetNames.forEach(sheetName => {
  console.log('\n========================================');
  console.log('HOJA:', sheetName);
  console.log('========================================\n');

  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, {header: 1, defval: '', raw: false});

  data.forEach((row, i) => {
    const hasContent = row.some(cell => cell !== null && cell !== undefined && cell !== '');
    if (hasContent) {
      console.log(`Fila ${i + 1}:`, row);
    }
  });
});
