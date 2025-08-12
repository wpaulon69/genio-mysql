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

async function debugEvaluationStepByStep() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Debuggeando evaluación paso a paso...\n');

    // 1. Simular que tenemos un horario generado de junio con Alamo descansando el 1 de junio
    const generatedShifts = [
      {
        date: '2025-06-01',
        employeeName: 'Alamo',
        serviceName: 'mucamas',
        startTime: '',
        endTime: '',
        notes: 'D (Descanso)'
      }
    ];

    // 2. Obtener horario del mes anterior (mayo)
    const [maySchedules] = await connection.execute(`
      SELECT id FROM horarios 
      WHERE year = '2025' AND month = '5' AND serviceId = 1 AND status = 'published'
      ORDER BY createdAt DESC LIMIT 1
    `);

    const [mayShifts] = await connection.execute(`
      SELECT hd.date, hd.startTime, hd.endTime, hd.notes, e.nombre as employeeName
      FROM horario_detalles hd 
      JOIN empleados e ON hd.employeeId = e.id_empleado 
      WHERE hd.horario_id = ? AND e.nombre = 'Alamo'
      ORDER BY hd.date ASC
    `, [maySchedules[0].id]);

    // 3. Configuración del servicio
    const [services] = await connection.execute(`SELECT * FROM servicios WHERE id_servicio = 1`);
    const service = services[0];
    
    const rulesConfig = {
      maxConsecutiveWorkDays: service.max_dias_trabajo_consecutivos || 6,
      maxConsecutiveDaysOff: service.max_descansos_consecutivos || 3,
    };

    console.log(`📊 Configuración: maxConsecutiveDaysOff = ${rulesConfig.maxConsecutiveDaysOff}`);

    // 4. Simular inicialización de estado (función initializeEmployeeStatesFromHistory)
    const firstDayOfCurrentMonth = new Date(2025, 5, 1); // 1 de junio 2025
    const lookbackDays = Math.max(rulesConfig.maxConsecutiveWorkDays, rulesConfig.maxConsecutiveDaysOff, 7);
    
    console.log(`\n🔍 PASO 1: Inicialización (lookbackDays = ${lookbackDays})`);
    
    let currentConsecutiveWork = 0;
    let currentConsecutiveRest = 0;
    let lastTypeEncountered = undefined;

    // Simular exactamente la inicialización
    for (let i = lookbackDays - 1; i >= 0; i--) {
      const dateToCheck = subDays(firstDayOfCurrentMonth, i + 1);
      const dateToCheckStr = formatDate(dateToCheck);
      const shiftToday = mayShifts.find(s => s.date.toISOString().split('T')[0] === dateToCheckStr);

      if (shiftToday) {
        const shiftType = getShiftType(shiftToday);
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
        // AQUÍ PUEDE ESTAR EL BUG - cuenta días sin datos como descansos
        currentConsecutiveRest = (lastTypeEncountered === 'D' || lastTypeEncountered === 'F' || lastTypeEncountered === 'LAO' || lastTypeEncountered === 'LM' || lastTypeEncountered === 'C' || lastTypeEncountered === undefined) ? currentConsecutiveRest + 1 : 1;
        currentConsecutiveWork = 0;
        lastTypeEncountered = 'D';
      }
    }

    console.log(`Estado inicial de Alamo:`);
    console.log(`- consecutiveRestDays: ${currentConsecutiveRest}`);
    console.log(`- lastShiftType: ${lastTypeEncountered}`);

    // 5. Simular evaluación del 1 de junio
    console.log(`\n🔍 PASO 2: Evaluación del 1 de junio`);
    
    const alamoState = {
      consecutiveRestDays: currentConsecutiveRest,
      lastShiftType: lastTypeEncountered
    };

    // Simular el turno del 1 de junio
    const juneFirstShift = generatedShifts[0];
    const shiftType = getShiftType(juneFirstShift);
    const isRest = isRestDay(shiftType);
    
    console.log(`Turno del 1 de junio: ${juneFirstShift.notes} → ${shiftType} (${isRest ? 'Descanso' : 'Trabajo'})`);

    if (isRest) {
      // Esta es la línea EXACTA del algoritmo de evaluación
      const newConsecutiveRestDays = isRestDay(alamoState.lastShiftType) ? alamoState.consecutiveRestDays + 1 : 1;
      
      console.log(`\n📊 Cálculo de días consecutivos:`);
      console.log(`- Estado inicial: ${alamoState.consecutiveRestDays} días`);
      console.log(`- Último tipo: ${alamoState.lastShiftType}`);
      console.log(`- ¿Último era descanso?: ${isRestDay(alamoState.lastShiftType)}`);
      console.log(`- Fórmula: ${isRestDay(alamoState.lastShiftType)} ? ${alamoState.consecutiveRestDays} + 1 : 1`);
      console.log(`- Resultado: ${newConsecutiveRestDays} días`);
      
      if (newConsecutiveRestDays > rulesConfig.maxConsecutiveDaysOff) {
        console.log(`\n❌ VIOLACIÓN GENERADA:`);
        console.log(`- ${newConsecutiveRestDays} días > ${rulesConfig.maxConsecutiveDaysOff} máximo`);
        console.log(`- Mensaje: "Descansó ${newConsecutiveRestDays} días (máx: ${rulesConfig.maxConsecutiveDaysOff})"`);
        console.log(`- Fecha: 2025-06-01`);
      } else {
        console.log(`\n✅ No hay violación: ${newConsecutiveRestDays} ≤ ${rulesConfig.maxConsecutiveDaysOff}`);
      }
    }

    console.log('\n💡 ANÁLISIS DEL BUG:');
    if (currentConsecutiveRest >= 7) {
      console.log('❌ BUG ENCONTRADO EN LA INICIALIZACIÓN:');
      console.log('- La función initializeEmployeeStatesFromHistory está contando mal');
      console.log('- Está inflando el contador de días consecutivos');
      console.log('- Probablemente cuenta días sin datos como descansos');
    } else {
      console.log('✅ La inicialización parece correcta');
      console.log('- El problema debe estar en otro lugar');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugEvaluationStepByStep();