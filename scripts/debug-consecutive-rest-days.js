// Script para debuggear el problema de días de descanso consecutivos

console.log('=== DEBUGGING CONSECUTIVE REST DAYS CALCULATION ===\n');

// Datos del ejemplo mostrado en la imagen
const previousMonthShifts = [
  { date: '2025-05-21', employeeName: 'Forni', shiftType: 'T' }, // Tarde
  { date: '2025-05-22', employeeName: 'Forni', shiftType: 'T' }, // Tarde
  { date: '2025-05-23', employeeName: 'Forni', shiftType: 'T' }, // Tarde
  { date: '2025-05-24', employeeName: 'Forni', shiftType: 'D' }, // Descanso
  { date: '2025-05-25', employeeName: 'Forni', shiftType: 'D' }, // Descanso
  { date: '2025-05-26', employeeName: 'Forni', shiftType: 'M' }, // Mañana
  { date: '2025-05-27', employeeName: 'Forni', shiftType: 'M' }, // Mañana
  { date: '2025-05-28', employeeName: 'Forni', shiftType: 'M' }, // Mañana
  { date: '2025-05-29', employeeName: 'Forni', shiftType: 'M' }, // Mañana
  { date: '2025-05-30', employeeName: 'Forni', shiftType: 'M' }, // Mañana
];

console.log('Historial del mes anterior (mayo 2025):');
previousMonthShifts.forEach(shift => {
  const date = new Date(shift.date);
  const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
  console.log(`${dayName}, ${shift.date}: ${shift.shiftType === 'T' ? 'Tarde' : shift.shiftType === 'M' ? 'Mañana' : 'Descanso'}`);
});

console.log('\nAnálisis manual de días consecutivos:');
console.log('- 21/05 (mié): Tarde (trabajo)');
console.log('- 22/05 (jue): Tarde (trabajo)');
console.log('- 23/05 (vie): Tarde (trabajo)');
console.log('- 24/05 (sáb): Descanso ← Inicio secuencia descanso');
console.log('- 25/05 (dom): Descanso ← 2 días consecutivos');
console.log('- 26/05 (lun): Mañana (trabajo) ← Fin secuencia descanso');
console.log('- 27/05 (mar): Mañana (trabajo)');
console.log('- 28/05 (mié): Mañana (trabajo)');
console.log('- 29/05 (jue): Mañana (trabajo)');
console.log('- 30/05 (vie): Mañana (trabajo)');

console.log('\n📊 RESULTADO CORRECTO:');
console.log('- Días de descanso consecutivos: 2 (24 y 25 de mayo)');
console.log('- Máximo permitido: 3');
console.log('- ✅ NO debería haber violación');

console.log('\n❌ PROBLEMA DETECTADO:');
console.log('- El sistema reporta: "Descansó 4 días (máx: 3)"');
console.log('- Esto es INCORRECTO');

console.log('\n🔍 POSIBLES CAUSAS:');
console.log('1. El algoritmo está contando días sin datos como descanso');
console.log('2. Hay un bug en la lógica de inicialización desde historial');
console.log('3. El lookback está incluyendo días incorrectos');
console.log('4. La lógica de consecutiveRestDays tiene un error');

console.log('\n🛠️ SOLUCIONES A IMPLEMENTAR:');
console.log('1. Revisar initializeEmployeeStatesFromHistory()');
console.log('2. Corregir la lógica de cálculo de días consecutivos');
console.log('3. Asegurar que solo se cuentan días realmente consecutivos');
console.log('4. Mejorar el manejo de días sin datos');

// Simulación del algoritmo actual (simplificado)
function simulateCurrentAlgorithm() {
  console.log('\n🧮 SIMULACIÓN DEL ALGORITMO ACTUAL:');
  
  let consecutiveRest = 0;
  let lastShiftType = undefined;
  
  // Simular los últimos días del mes anterior
  const shifts = [
    { date: '2025-05-24', type: 'D' },
    { date: '2025-05-25', type: 'D' },
    { date: '2025-05-26', type: 'M' },
    { date: '2025-05-27', type: 'M' },
    { date: '2025-05-28', type: 'M' },
    { date: '2025-05-29', type: 'M' },
    { date: '2025-05-30', type: 'M' },
  ];
  
  shifts.forEach(shift => {
    if (shift.type === 'D') {
      consecutiveRest = (lastShiftType === 'D') ? consecutiveRest + 1 : 1;
      console.log(`${shift.date}: Descanso, consecutiveRest = ${consecutiveRest}`);
    } else {
      consecutiveRest = 0;
      console.log(`${shift.date}: Trabajo (${shift.type}), consecutiveRest = ${consecutiveRest}`);
    }
    lastShiftType = shift.type;
  });
  
  console.log(`\nResultado simulación: máximo consecutiveRest = 2 ✅`);
}

simulateCurrentAlgorithm();

module.exports = { simulateCurrentAlgorithm };