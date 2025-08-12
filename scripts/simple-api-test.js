require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function simulateAPICall() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Simulando llamada API monthlySchedules...');

    // Simular exactamente lo que hace getMonthlySchedules
    const year = '2025';
    const month = '5';
    const serviceId = '1';

    // Obtener horarios
    let query = 'SELECT * FROM horarios WHERE year = ? AND month = ? AND serviceId = ?';
    const params = [year, month, serviceId];

    const scheduleResult = await connection.execute(query, params);
    const scheduleRows = scheduleResult && Array.isArray(scheduleResult) && scheduleResult[0] ? scheduleResult[0] : [];
    
    console.log(`📅 Horarios encontrados: ${scheduleRows.length}`);

    if (scheduleRows.length > 0) {
      const scheduleRow = scheduleRows[0];
      const scheduleId = scheduleRow.id;
      
      console.log('📊 Procesando horario:', {
        id: scheduleId,
        nombre: scheduleRow.horario_nombre,
        status: scheduleRow.status
      });

      // Obtener shifts como lo hace la API
      let shiftsQuery = `
        SELECT hd.*, e.nombre as employeeName, s.nombre_servicio as serviceName 
        FROM horario_detalles hd 
        LEFT JOIN empleados e ON hd.employeeId = e.id_empleado 
        LEFT JOIN servicios s ON hd.serviceId = s.id_servicio 
        WHERE hd.horario_id = ?
      `;
      const shiftsParams = [scheduleId];

      if (year && month) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        shiftsQuery += ' AND hd.date BETWEEN ? AND ?';
        shiftsParams.push(startDate, endDate);
      }

      const shiftsResult = await connection.execute(shiftsQuery, shiftsParams);
      const shifts = shiftsResult && Array.isArray(shiftsResult) && shiftsResult[0] ? shiftsResult[0] : [];
      
      console.log(`🔄 Turnos encontrados: ${shifts.length}`);
      
      if (shifts.length > 0) {
        console.log('\n✅ Estructura de datos que debería llegar al frontend:');
        const mockAPIResponse = [{
          ...scheduleRow,
          id: scheduleId.toString(),
          shifts: shifts,
          violations: [],
          scoreBreakdown: null
        }];
        
        console.log('- ID:', mockAPIResponse[0].id);
        console.log('- Nombre:', mockAPIResponse[0].horario_nombre);
        console.log('- Shifts array length:', mockAPIResponse[0].shifts.length);
        console.log('- Shifts es array?', Array.isArray(mockAPIResponse[0].shifts));
        console.log('- Primer shift:', {
          employeeName: mockAPIResponse[0].shifts[0].employeeName,
          date: mockAPIResponse[0].shifts[0].date,
          startTime: mockAPIResponse[0].shifts[0].startTime,
          notes: mockAPIResponse[0].shifts[0].notes
        });
        
        // Verificar la condición que falla en el frontend
        const hasShifts = mockAPIResponse[0].shifts && mockAPIResponse[0].shifts.length > 0;
        console.log('\n🔍 Verificación de condición frontend:');
        console.log('- shifts existe?', !!mockAPIResponse[0].shifts);
        console.log('- shifts.length > 0?', mockAPIResponse[0].shifts.length > 0);
        console.log('- Condición completa (shifts && shifts.length > 0):', hasShifts);
        
      } else {
        console.log('❌ No se encontraron turnos');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

simulateAPICall();