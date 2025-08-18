// Script para debuggear el problema específico de días consecutivos de Montu
console.log('🔍 DEBUGGING DÍAS CONSECUTIVOS - CASO MONTU');
console.log('===========================================');

// Simular los datos del mes anterior (junio 2025)
const previousMonthShifts = [
  { date: '2025-06-20', employeeName: 'Montu', notes: 'M' }, // Mañana
  { date: '2025-06-21', employeeName: 'Montu', notes: 'D' }, // Descanso
  { date: '2025-06-22', employeeName: 'Montu', notes: 'D' }, // Descanso
  { date: '2025-06-23', employeeName: 'Montu', notes: 'M' }, // Mañana
  { date: '2025-06-24', employeeName: 'Montu', notes: 'M' }, // Mañana
  { date: '2025-06-25', employeeName: 'Montu', notes: 'M' }, // Mañana
  { date: '2025-06-26', employeeName: 'Montu', notes: 'M' }, // Mañana
  { date: '2025-06-27', employeeName: 'Montu', notes: 'D' }, // Descanso
  { date: '2025-06-28', employeeName: 'Montu', notes: 'D' }, // Descanso
  { date: '2025-06-29', employeeName: 'Montu', notes: 'M' }, // Mañana
  { date: '2025-06-30', employeeName: 'Montu', notes: 'M' }  // Mañana (último día de junio)
];

// Simular el horario de julio (primeros días)
const julyShifts = [
  { date: '2025-07-01', employeeName: 'Montu', notes: 'D' }, // Descanso ← Este es el día problemático
  { date: '2025-07-02', employeeName: 'Montu', notes: 'D' }, // Descanso
  { date: '2025-07-03', employeeName: 'Montu', notes: 'D' }, // Descanso
  // ... más días
];

console.log('\n📅 DATOS DEL MES ANTERIOR (Junio 2025):');
console.table(previousMonthShifts.map(s => ({
  fecha: s.date,
  empleado: s.employeeName,
  turno: s.notes === 'M' ? 'Mañana' : s.notes === 'D' ? 'Descanso' : s.notes
})));

console.log('\n📅 DATOS DEL MES ACTUAL (Julio 2025 - primeros días):');
console.table(julyShifts.map(s => ({
  fecha: s.date,
  empleado: s.employeeName,
  turno: s.notes === 'M' ? 'Mañana' : s.notes === 'D' ? 'Descanso' : s.notes
})));

console.log('\n🔍 ANÁLISIS MANUAL DE SECUENCIAS:');

// Analizar secuencias manualmente
function analyzeSequences(shifts) {
  console.log('\nAnálisis día por día:');
  let consecutiveRest = 0;
  let consecutiveWork = 0;
  let lastType = null;
  
  shifts.forEach((shift, index) => {
    const isWork = shift.notes === 'M' || shift.notes === 'T' || shift.notes === 'N';
    const isRest = !isWork;
    
    if (isWork) {
      if (lastType === 'work') {
        consecutiveWork++;
      } else {
        consecutiveWork = 1;
      }
      consecutiveRest = 0;
      lastType = 'work';
    } else {
      if (lastType === 'rest' || lastType === null) {
        consecutiveRest++;
      } else {
        consecutiveRest = 1;
      }
      consecutiveWork = 0;
      lastType = 'rest';
    }
    
    console.log(`${shift.date}: ${shift.notes} → Trabajo: ${consecutiveWork}, Descanso: ${consecutiveRest}`);
  });
  
  return { consecutiveWork, consecutiveRest };
}

console.log('\n🔍 ANÁLISIS JUNIO (últimos 10 días):');
const juneAnalysis = analyzeSequences(previousMonthShifts.slice(-10));

console.log('\n🔍 ANÁLISIS JULIO (primeros días):');
// Simular continuidad desde junio
let finalConsecutiveRest = juneAnalysis.consecutiveRest;
let finalConsecutiveWork = juneAnalysis.consecutiveWork;

console.log(`\n📊 ESTADO AL FINAL DE JUNIO:`);
console.log(`- Días de trabajo consecutivos: ${finalConsecutiveWork}`);
console.log(`- Días de descanso consecutivos: ${finalConsecutiveRest}`);

// Analizar el 1 de julio
const july1 = julyShifts[0];
console.log(`\n🎯 EVALUANDO ${july1.date} (${july1.notes}):`);

if (july1.notes === 'D') {
  // Es descanso
  const lastJuneShift = previousMonthShifts[previousMonthShifts.length - 1];
  if (lastJuneShift.notes === 'D') {
    // El último día de junio también fue descanso
    finalConsecutiveRest++;
    console.log(`❌ PROBLEMA: Continuando secuencia de descanso desde junio`);
    console.log(`   Último día junio: ${lastJuneShift.date} = ${lastJuneShift.notes}`);
    console.log(`   Primer día julio: ${july1.date} = ${july1.notes}`);
    console.log(`   Días consecutivos calculados: ${finalConsecutiveRest}`);
  } else {
    // El último día de junio fue trabajo
    finalConsecutiveRest = 1;
    console.log(`✅ CORRECTO: Nuevo inicio de secuencia de descanso`);
    console.log(`   Último día junio: ${lastJuneShift.date} = ${lastJuneShift.notes}`);
    console.log(`   Primer día julio: ${july1.date} = ${july1.notes}`);
    console.log(`   Días consecutivos calculados: ${finalConsecutiveRest}`);
  }
}

console.log('\n🎯 PROBLEMA IDENTIFICADO:');
console.log('El algoritmo parece estar contando mal la continuidad entre meses.');
console.log('Según los datos:');
console.log('- 29/06: Mañana (rompe cualquier secuencia de descanso anterior)');
console.log('- 30/06: Mañana (día de trabajo)');
console.log('- 01/07: Descanso (debería ser día 1 de nueva secuencia)');
console.log('');
console.log('Pero el sistema reporta "8 días consecutivos", lo que indica un error en:');
console.log('1. La inicialización del estado desde el mes anterior');
console.log('2. El cálculo de lookbackDays');
console.log('3. La lógica de continuidad entre meses');

console.log('\n💡 SOLUCIÓN SUGERIDA:');
console.log('Revisar la función initializeEmployeeStatesFromHistory en state.ts');
console.log('Específicamente la lógica de cálculo de días consecutivos.');