require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function debugFrontendFlow() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Simulando flujo completo del frontend...');

    // 1. Simular carga de empleados del servicio
    console.log('\n1️⃣ Cargando empleados del servicio...');
    const [employees] = await connection.execute(`
      SELECT id_empleado, nombre 
      FROM empleados 
      WHERE id_servicio = 1
      ORDER BY nombre
    `);
    console.log(`✅ Empleados cargados: ${employees.length}`);
    employees.forEach(emp => console.log(`   - ${emp.nombre} (ID: ${emp.id_empleado})`));

    // 2. Simular carga de info del servicio
    console.log('\n2️⃣ Cargando info del servicio...');
    const [serviceInfo] = await connection.execute(`
      SELECT id_servicio, nombre_servicio 
      FROM servicios 
      WHERE id_servicio = 1
    `);
    console.log(`✅ Servicio: ${serviceInfo[0]?.nombre_servicio}`);

    // 3. Simular carga de horarios
    console.log('\n3️⃣ Cargando horarios disponibles...');
    const [schedules] = await connection.execute(`
      SELECT * FROM horarios 
      WHERE year = '2025' AND month = '5' AND serviceId = 1
    `);
    console.log(`✅ Horarios encontrados: ${schedules.length}`);

    if (schedules.length > 0) {
      const schedule = schedules[0];
      console.log(`   - ID: ${schedule.id}`);
      console.log(`   - Nombre: ${schedule.horario_nombre}`);
      console.log(`   - Status: ${schedule.status}`);

      // 4. Simular carga de shifts del horario seleccionado
      console.log('\n4️⃣ Cargando shifts del horario seleccionado...');
      const [shifts] = await connection.execute(`
        SELECT 
          hd.*,
          e.nombre as employeeName,
          s.nombre_servicio as serviceName
        FROM horario_detalles hd
        LEFT JOIN empleados e ON hd.employeeId = e.id_empleado
        LEFT JOIN servicios s ON hd.serviceId = s.id_servicio
        WHERE hd.horario_id = ?
        ORDER BY hd.date, e.nombre
      `, [schedule.id]);

      console.log(`✅ Shifts cargados: ${shifts.length}`);

      // 5. Simular el objeto completo que llega al frontend
      console.log('\n5️⃣ Objeto completo que debería llegar al frontend:');
      const completeSchedule = {
        ...schedule,
        id: schedule.id.toString(),
        shifts: shifts,
        violations: [],
        scoreBreakdown: null
      };

      console.log('📊 Verificaciones críticas:');
      console.log(`   - selectedScheduleToDisplay existe: ${!!completeSchedule}`);
      console.log(`   - selectedScheduleToDisplay.shifts existe: ${!!completeSchedule.shifts}`);
      console.log(`   - selectedScheduleToDisplay.shifts es array: ${Array.isArray(completeSchedule.shifts)}`);
      console.log(`   - selectedScheduleToDisplay.shifts.length: ${completeSchedule.shifts.length}`);
      console.log(`   - Condición (shifts && shifts.length > 0): ${completeSchedule.shifts && completeSchedule.shifts.length > 0}`);
      console.log(`   - serviceInfo existe: ${!!serviceInfo[0]}`);
      console.log(`   - employees.length: ${employees.length}`);

      // 6. Simular procesamiento de un turno específico
      console.log('\n6️⃣ Ejemplo de procesamiento de turno:');
      const firstShift = shifts[0];
      console.log('   Primer turno:', {
        employeeName: firstShift.employeeName,
        date: firstShift.date,
        startTime: firstShift.startTime,
        endTime: firstShift.endTime,
        notes: firstShift.notes
      });

      // Simular getShiftType
      const getShiftTypeSimulation = (shift) => {
        if (!shift) return '';
        const note = shift.notes?.toUpperCase();
        if (note === '_EMPTY_') return '';
        if (note === 'D' || note?.includes('DESCANSO')) return 'D';
        if (shift.startTime?.startsWith('07:')) return 'M';
        if (shift.startTime?.startsWith('14:')) return 'T';
        if (shift.startTime?.startsWith('22:')) return 'N';
        return '';
      };

      const shiftType = getShiftTypeSimulation(firstShift);
      console.log(`   Tipo de turno calculado: "${shiftType}"`);

      console.log('\n🎉 Todo parece estar correcto en el backend!');
      console.log('🔍 El problema debe estar en el frontend o en el estado de React.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugFrontendFlow();