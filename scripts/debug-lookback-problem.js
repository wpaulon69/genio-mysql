// Script para debuggear el problema de lookbackDays
console.log('🔍 DEBUGGING PROBLEMA LOOKBACK DAYS');
console.log('==================================');

// Simular la configuración
const rulesConfig = {
  maxConsecutiveWorkDays: 7,
  maxConsecutiveDaysOff: 4, // Pero el error dice máx: 3
};

const lookbackDays = Math.max(rulesConfig.maxConsecutiveWorkDays, rulesConfig.maxConsecutiveDaysOff, 7);
console.log(`📊 Configuración:`);
console.log(`   - maxConsecutiveWorkDays: ${rulesConfig.maxConsecutiveWorkDays}`);
console.log(`   - maxConsecutiveDaysOff: ${rulesConfig.maxConsecutiveDaysOff}`);
console.log(`   - lookbackDays calculado: ${lookbackDays}`);

// Simular fechas
const firstDayOfCurrentMonth = new Date('2025-07-01');
console.log(`\n📅 Primer día del mes actual: ${firstDayOfCurrentMonth.toISOString().slice(0, 10)}`);

console.log(`\n🔍 Días que se están revisando (lookback):`);
for (let i = 0; i < lookbackDays; i++) {
  const dateToCheck = new Date(firstDayOfCurrentMonth);
  dateToCheck.setDate(dateToCheck.getDate() - (lookbackDays - i));
  const dateStr = dateToCheck.toISOString().slice(0, 10);
  console.log(`   ${i + 1}. ${dateStr}`);
}

// Datos reales de Rios según el contexto
const riosData = [
  { date: '2025-06-20', shift: 'D' }, // Descanso
  { date: '2025-06-21', shift: 'D' }, // Descanso
  { date: '2025-06-22', shift: 'M' }, // Mañana
  { date: '2025-06-23', shift: 'M' }, // Mañana
  { date: '2025-06-24', shift: 'T' }, // Tarde
  { date: '2025-06-25', shift: 'T' }, // Tarde
  { date: '2025-06-26', shift: 'T' }, // Tarde
  { date: '2025-06-27', shift: 'D' }, // Descanso
  { date: '2025-06-28', shift: 'D' }, // Descanso
  { date: '2025-06-29', shift: 'M' }, // Mañana
  { date: '2025-06-30', shift: null }, // Sin datos - ¿qué pasa aquí?
];

console.log(`\n📋 Datos reales de Rios (junio 2025):`);
riosData.forEach(d => {
  console.log(`   ${d.date}: ${d.shift || 'SIN_DATOS'}`);
});

console.log(`\n🎯 PROBLEMA IDENTIFICADO:`);
console.log(`1. lookbackDays = 7 días`);
console.log(`2. Está revisando desde 2025-06-24 hasta 2025-06-30`);
console.log(`3. Si 2025-06-30 no tiene datos, lo asume como DESCANSO`);
console.log(`4. Esto puede estar creando una secuencia artificial de descansos`);

console.log(`\n💡 ANÁLISIS MANUAL:`);
console.log(`Según los datos del contexto:`);
console.log(`- 27/06: Descanso`);
console.log(`- 28/06: Descanso`);
console.log(`- 29/06: Mañana ← ROMPE LA SECUENCIA`);
console.log(`- 30/06: ¿Sin datos? → Asumido como Descanso`);
console.log(`- 01/07: Descanso (del horario generado)`);

console.log(`\nSi 30/06 se asume como descanso:`);
console.log(`- 29/06: Mañana`);
console.log(`- 30/06: Descanso (asumido) ← Día 1`);
console.log(`- 01/07: Descanso ← Día 2`);
console.log(`Resultado: 2 días consecutivos (no 8)`);

console.log(`\n🔧 POSIBLES SOLUCIONES:`);
console.log(`1. No asumir que días sin datos son descansos`);
console.log(`2. Reducir lookbackDays a un valor más razonable`);
console.log(`3. Solo contar días con datos reales`);
console.log(`4. Verificar la configuración del servicio (máx: 3 vs 4)`);

console.log(`\n⚠️ SOSPECHA PRINCIPAL:`);
console.log(`El algoritmo está contando días SIN DATOS como descansos,`);
console.log(`creando secuencias artificiales de 7-8 días consecutivos.`);