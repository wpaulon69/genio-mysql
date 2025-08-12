require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

// Función para determinar si es día de descanso (copiada del algoritmo)
function isRestDay(shiftType) {
  return !shiftType || shiftType === 'D' || shiftType === 'F' || shiftType === 'LAO' || shiftType === 'LM';
}

// Función para obtener el tipo de turno desde las notas
function getShiftTypeFromNotes(notes) {
  if (!notes) return 'D';
  if (notes.includes('Mañana') || notes.includes('07:00')) return 'M';
  if (notes.includes('Tarde') || notes.includes('14:00')) return 'T';
  if (notes.includes('Noche') || notes.includes('21:00')) return 'N';
  if (notes.includes('Descanso') || notes.includes('D (')) return 'D';
  if (notes.includes('Feriado') || notes.includes('F (')) return 'F';
  if (notes.includes('LAO')) return 'LAO';
  if (notes.includes('LM')) return 'LM';
  return 'D'; // Por defecto descanso
}

async function debugConsecutiveDaysCalculation() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Debuggeando cálculo de días consecutivos para Alamo...\n');

    // 1. Obtener horario de mayo 2025
    const [maySchedules] = await connection.execute(`
      SELECT id, horario_nombre
      FROM horarios 
      WHERE year = '2025' AND month = '5' AND serviceId = 1 AND status = 'published'
      ORDER BY createdAt DESC
      LIMIT 1
    `);

    if (maySchedules.length === 0) {
      console.log('❌ No se encontró horario de mayo 2025');
      return;
    }

    const maySchedule = maySchedules[0];
    console.log(`📅 Horario de mayo: ${maySchedule.horario_nombre}`);

    // 2. Obtener turnos de Alamo en mayo
    const [mayShifts] = await connection.execute(`
      SELECT hd.date, hd.startTime, hd.endTime, hd.notes, e.nombre
      FROM horario_detalles hd 
      JOIN empleados e ON hd.employeeId = e.id_empleado 
      WHERE hd.horario_id = ? AND e.nombre = 'Alamo'
      ORDER BY hd.date ASC
    `, [maySchedule.id]);

    console.log(`\n📊 Turnos de Alamo en mayo: ${mayShifts.length}`);

    // 3. Simular el cálculo de días consecutivos como lo hace el algoritmo
    console.log('\n🔍 Simulando cálculo de días consecutivos:');
    console.log('Fecha       | Turno    | Tipo | ¿Descanso? | Consec.Desc | Consec.Trab');
    console.log('------------|----------|------|------------|-------------|------------');

    let consecutiveRestDays = 0;
    let consecutiveWorkDays = 0;
    let lastShiftType = null;

    // Procesar últimos 15 días de mayo para ver el patrón
    const lastDays = mayShifts.slice(-15);
    
    lastDays.forEach((shift, index) => {
      const date = new Date(shift.date);
      const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      const shiftType = getShiftTypeFromNotes(shift.notes);
      const isRest = isRestDay(shiftType);
      
      // Calcular días consecutivos como lo hace el algoritmo
      if (isRest) {
        consecutiveRestDays = isRestDay(lastShiftType) ? consecutiveRestDays + 1 : 1;
        consecutiveWorkDays = 0;
      } else {
        consecutiveWorkDays = isRestDay(lastShiftType) ? 1 : consecutiveWorkDays + 1;
        consecutiveRestDays = 0;
      }
      
      console.log(`${dateStr}      | ${shift.notes.substring(0, 8).padEnd(8)} | ${shiftType.padEnd(4)} | ${isRest ? 'Sí' : 'No'}.padEnd(10)} | ${consecutiveRestDays.toString().padEnd(11)} | ${consecutiveWorkDays}`);
      
      lastShiftType = shiftType;
    });

    // 4. Obtener horario de junio para ver qué pasa el 1 de junio
    console.log('\n🔍 Verificando horario de junio...');
    const [juneSchedules] = await connection.execute(`
      SELECT id, horario_nombre
      FROM horarios 
      WHERE year = '2025' AND month = '6' AND serviceId = 1
      ORDER BY createdAt DESC
      LIMIT 1
    `);

    if (juneSchedules.length > 0) {
      const juneSchedule = juneSchedules[0];
      console.log(`📅 Horario de junio: ${juneSchedule.horario_nombre}`);

      // Obtener primeros días de junio para Alamo
      const [juneShifts] = await connection.execute(`
        SELECT hd.date, hd.startTime, hd.endTime, hd.notes, e.nombre
        FROM horario_detalles hd 
        JOIN empleados e ON hd.employeeId = e.id_empleado 
        WHERE hd.horario_id = ? AND e.nombre = 'Alamo'
        ORDER BY hd.date ASC
        LIMIT 5
      `, [juneSchedule.id]);

      console.log('\n📊 Primeros días de junio para Alamo:');
      juneShifts.forEach(shift => {
        const date = new Date(shift.date);
        const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        const shiftType = getShiftTypeFromNotes(shift.notes);
        const isRest = isRestDay(shiftType);
        
        console.log(`${dateStr}/06: ${shift.notes} (Tipo: ${shiftType}, ¿Descanso?: ${isRest})`);
      });
    }

    console.log('\n💡 Análisis:');
    console.log(`- Estado final de mayo: ${consecutiveRestDays} días descanso consecutivos`);
    console.log(`- Último tipo de turno: ${lastShiftType}`);
    console.log('- Si el algoritmo dice 8 días consecutivos, hay un bug en el cálculo');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugConsecutiveDaysCalculation();