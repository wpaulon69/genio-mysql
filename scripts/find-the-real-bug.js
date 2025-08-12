require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

// Funciones exactas del algoritmo
function subDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function getShiftType(shift) {
  if (!shift) return '';
  const note = shift.notes?.toUpperCase();
  if (note === '_EMPTY_') return '';
  if (note === 'C' || note === 'C (FRANCO COMP.)' || note?.includes('FRANCO COMP')) return 'C';
  if (note?.startsWith('F') || note?.includes('FERIADO')) return 'F';
  if (note === 'D' || note === 'D (DESCANSO)' || note?.includes('DESCANSO') || note === 'D (FIJO SEMANAL)' || note === 'D (FDS OBJETIVO)' || note === 'D (FIJO)') return 'D';
  if (note?.startsWith('LAO')) return 'LAO';
  if (note?.startsWith('LM')) return 'LM';
  if (note?.startsWith('V')) return 'V';
  
  if (shift.startTime && shift.startTime.trim() !== '') {
    if (shift.startTime.startsWith('07:') || shift.startTime.startsWith('08:')) return 'M';
    if (shift.startTime.startsWith('14:') || shift.startTime.startsWith('15:')) return 'T';
    if (shift.startTime.startsWith('22:') || shift.startTime.startsWith('23:')) return 'N';
  }
  
  if (note?.includes('MAÑANA') || note?.includes('(M)')) return 'M';
  if (note?.includes('TARDE') || note?.includes('(T)')) return 'T';
  if (note?.includes('NOCHE') || note?.includes('(N)')) return 'N';
  
  if ((!shift.startTime || shift.startTime.trim() === '') && (!note || note.trim() === '')) return 'D';
  return '';
}

function isRestDay(shiftType) {
  if (!shiftType) return true;
  return ['D', 'F', 'C', 'LAO', 'LM', 'V'].includes(shiftType.toUpperCase());
}

async function findTheRealBug() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Buscando el verdadero bug en el cálculo...\n');

    // 1. Obtener horario de mayo
    const [maySchedules] = await connection.execute(`
      SELECT id FROM horarios 
      WHERE year = '2025' AND month = '5' AND serviceId = 1 AND status = 'published'
      ORDER BY createdAt DESC LIMIT 1
    `);

    if (maySchedules.length === 0) {
      console.log('❌ No se encontró horario de mayo 2025');
      return;
    }

    // 2. Obtener TODOS los turnos de mayo para Alamo
    const [mayShifts] = await connection.execute(`
      SELECT hd.date, hd.startTime, hd.endTime, hd.notes
      FROM horario_detalles hd 
      JOIN empleados e ON hd.employeeId = e.id_empleado 
      WHERE hd.horario_id = ? AND e.nombre = 'Alamo'
      ORDER BY hd.date ASC
    `, [maySchedules[0].id]);

    console.log(`📊 Total turnos de Alamo en mayo: ${mayShifts.length}`);

    // 3. Simular EXACTAMENTE la función initializeEmployeeStatesFromHistory
    const firstDayOfCurrentMonth = new Date(2025, 5, 1); // 1 de junio 2025
    const lookbackDays = 7;
    
    console.log('\n🔍 PASO 1: Inicialización desde historial');
    console.log(`Mirando desde ${formatDate(subDays(firstDayOfCurrentMonth, lookbackDays))} hasta ${formatDate(subDays(firstDayOfCurrentMonth, 1))}`);
    
    let currentConsecutiveWork = 0;
    let currentConsecutiveRest = 0;
    let lastTypeEncountered = undefined;

    console.log('\nFecha       | Turno | Tipo | Consec.Desc | Consec.Trab | LastType');
    console.log('------------|-------|------|-------------|-------------|----------');

    // Iterar exactamente como el algoritmo
    for (let i = lookbackDays - 1; i >= 0; i--) {
      const dateToCheck = subDays(firstDayOfCurrentMonth, i + 1);
      const dateToCheckStr = formatDate(dateToCheck);
      const shiftToday = mayShifts.find(s => s.date.toISOString().split('T')[0] === dateToCheckStr);

      let shiftType = '';
      let foundShift = 'No';

      if (shiftToday) {
        foundShift = 'Sí';
        shiftType = getShiftType({
          notes: shiftToday.notes,
          startTime: shiftToday.startTime,
          endTime: shiftToday.endTime
        });

        if (shiftType === 'M' || shiftType === 'T' || shiftType === 'N') {
          currentConsecutiveWork = (lastTypeEncountered === 'M' || lastTypeEncountered === 'T' || lastTypeEncountered === 'N') ? currentConsecutiveWork + 1 : 1;
          currentConsecutiveRest = 0;
          lastTypeEncountered = shiftType;
        } else {
          currentConsecutiveRest = (lastTypeEncountered === 'D' || lastTypeEncountered === 'F' || lastTypeEncountered === 'LAO' || lastTypeEncountered === 'LM' || lastTypeEncountered === 'C') ? currentConsecutiveRest + 1 : 1;
          currentConsecutiveWork = 0;
          lastTypeEncountered = shiftType;
        }
      } else {
        // AQUÍ PUEDE ESTAR EL BUG
        foundShift = 'No→D';
        shiftType = 'D';
        currentConsecutiveRest = (lastTypeEncountered === 'D' || lastTypeEncountered === 'F' || lastTypeEncountered === 'LAO' || lastTypeEncountered === 'LM' || lastTypeEncountered === 'C' || lastTypeEncountered === undefined) ? currentConsecutiveRest + 1 : 1;
        currentConsecutiveWork = 0;
        lastTypeEncountered = 'D';
      }

      const dateStr = dateToCheck.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      console.log(`${dateStr}      | ${foundShift.padEnd(5)} | ${shiftType.padEnd(4)} | ${currentConsecutiveRest.toString().padEnd(11)} | ${currentConsecutiveWork.toString().padEnd(11)} | ${lastTypeEncountered || 'undef'}`);
    }

    console.log(`\n📊 Estado inicial calculado:`);
    console.log(`- Días de descanso consecutivos: ${currentConsecutiveRest}`);
    console.log(`- Último tipo: ${lastTypeEncountered}`);

    // 4. Simular qué pasaría el primer día de junio
    console.log('\n🔍 PASO 2: Simulando primer día de junio');
    console.log('Si el 1 de junio fuera descanso:');
    
    const newConsecutiveRestDays = isRestDay(lastTypeEncountered) ? currentConsecutiveRest + 1 : 1;
    console.log(`- Nuevo contador: ${newConsecutiveRestDays} días consecutivos`);
    
    if (newConsecutiveRestDays > 3) {
      console.log(`❌ VIOLACIÓN: ${newConsecutiveRestDays} > 3 máximo`);
      console.log(`📍 FECHA DE VIOLACIÓN: 2025-06-01`);
    }

    // 5. Verificar si hay datos faltantes o corruptos
    console.log('\n🔍 PASO 3: Verificando integridad de datos');
    
    // Verificar si hay días faltantes en mayo
    const expectedDays = 31;
    if (mayShifts.length !== expectedDays) {
      console.log(`⚠️  PROBLEMA: Se esperaban ${expectedDays} días, pero hay ${mayShifts.length} turnos`);
    }

    // Verificar fechas consecutivas
    const dates = mayShifts.map(s => s.date.toISOString().split('T')[0]).sort();
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i-1]);
      const currDate = new Date(dates[i]);
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffDays > 1) {
        console.log(`⚠️  HUECO ENCONTRADO: Entre ${dates[i-1]} y ${dates[i]} (${diffDays} días)`);
      }
    }

    console.log('\n💡 CONCLUSIÓN:');
    if (currentConsecutiveRest >= 8) {
      console.log('❌ El bug está en la inicialización - cuenta días sin datos como descansos');
    } else if (newConsecutiveRestDays >= 8) {
      console.log('❌ El bug está en el procesamiento del primer día de junio');
    } else {
      console.log('✅ El cálculo parece correcto - el problema puede estar en otro lugar');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

findTheRealBug();