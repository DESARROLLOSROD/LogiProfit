const XLSX = require('xlsx');

const wb = XLSX.readFile('CALCULO TANQUE FIBRA HMLLO-COATZACOALCOS CONNECT.xlsx');
const ws = wb.Sheets['TANQUE'];
const data = XLSX.utils.sheet_to_json(ws, {header: 1, defval: '', raw: false});

console.log('===== ANÁLISIS DE COTIZACIÓN DE FLETE =====\n');

// Información de carga
console.log('🚚 INFORMACIÓN DE LA CARGA:');
console.log('Tipo:', 'TANQUE DE FIBRA');
console.log('Peso:', '10.000 TN');
console.log('Dimensiones:', '8.300 x 4.100 x 4.000 MM (L x A x H)');
console.log('Origen:', 'HERMOSILLO, SON');
console.log('Destino:', 'COATZACOALCOS, VER');
console.log('Empresa:', 'ALESSO CONNECT');
console.log('Unidad:', 'LOW BOY ARRASTRE');
console.log('');

// Kilometraje
console.log('📏 KILOMETRAJE:');
console.log('KMs Cargado:', '2,500 km');
console.log('KMs Vacío (Regreso):', '2,150 km');
console.log('Total KMs:', '4,650 km');
console.log('');

// Diesel
console.log('⛽ DIESEL:');
console.log('Rendimiento Cargado:', '1.9 Lt/km');
console.log('Rendimiento Vacío:', '2 Lt/km');
console.log('Rendimiento Promedio:', '1.94 Lt/km');
console.log('Litros a consumir:', '2,390.79 Lt');
console.log('Precio por litro:', '$24.00');
console.log('Costo Total Diesel:', '$57,378.95');
console.log('');

// Casetas
console.log('🛣️  CASETAS:');
console.log('Cargado:', '$14,000.00');
console.log('Vacío:', '$10,500.00');
console.log('Total Casetas:', '$24,500.00');
console.log('');

// Viáticos
console.log('🍽️  VIÁTICOS:');
console.log('Comidas (21 x $120):', '$2,520.00');
console.log('Federal (15 x $100):', '$1,500.00');
console.log('Teléfono (2 x $100):', '$200.00');
console.log('Imprevistos:', '$500.00');
console.log('Total Viáticos:', '$4,720.00');
console.log('');

// Permisos
console.log('📋 PERMISO:', '$2,200.00');
console.log('');

// Subtotal operativo
console.log('💵 SUBTOTAL OPERATIVO:', '$88,798.95');
console.log('');

// Costos adicionales
console.log('🔧 COSTOS ADICIONALES:');
console.log('Mantenimiento (25%):', '$22,199.74');
console.log('Indirectos (20%):', '$17,759.79');
console.log('');

// Carro piloto
console.log('🚗 CARRO PILOTO:');
console.log('Costo base:', '$5,000.00');
console.log('Días:', '5');
console.log('Comidas por día:', '21');
console.log('Gasolina:', '$22,500.00');
console.log('Alimentación:', '$5,040.00');
console.log('Casetas:', '$10,000.00');
console.log('Imprevistos:', '$500.00');
console.log('Total Carro Piloto:', '$38,040.00');
console.log('');

// Totales
console.log('💰 RESUMEN FINANCIERO:');
console.log('Costo Total:', '$174,406.47');
console.log('Margen de Utilidad:', '20%');
console.log('Utilidad:', '$43,601.62');
console.log('Precio de Venta (+ IVA):', '$218,008.09');
console.log('Precio en EUR:', '87.20 €');
console.log('');

// Desglose porcentual
console.log('📊 DESGLOSE DE COSTOS:');
const total = 174406.47;
console.log('Diesel:', ((57378.95/total)*100).toFixed(2) + '%');
console.log('Casetas:', ((24500/total)*100).toFixed(2) + '%');
console.log('Viáticos:', ((4720/total)*100).toFixed(2) + '%');
console.log('Permiso:', ((2200/total)*100).toFixed(2) + '%');
console.log('Mantenimiento:', ((22199.74/total)*100).toFixed(2) + '%');
console.log('Indirectos:', ((17759.79/total)*100).toFixed(2) + '%');
console.log('Carro Piloto:', ((38040/total)*100).toFixed(2) + '%');
console.log('');

// Cálculo de precio por km
console.log('📐 MÉTRICAS:');
console.log('Costo por km:', '$' + (174406.47/4650).toFixed(2));
console.log('Precio venta por km:', '$' + (218008.09/4650).toFixed(2));
console.log('Utilidad por km:', '$' + (43601.62/4650).toFixed(2));
