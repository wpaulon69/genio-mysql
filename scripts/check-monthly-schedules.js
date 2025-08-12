require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function checkMonthlySchedules() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Verificando horarios mensuales...\n');

    // Verificar estructura de la tabla
    const [structure] = await connection.execute('DESCRIBE monthly_schedules');
    console.log('📋 Estructura de monthly_schedules:');
    structure.forEach(col => {
      console.log(`- ${col.Field} (${col.Type})`);
    });

    // Verificar horarios existentes
    console.log('\n📊 Horarios existentes:');
    const [schedules] = await connection.execute(`
      SELECT id, year, month, serviceId, serviceName, horario_nombre, status, createdAt
      FROM monthly_schedules 
      ORDER BY year DESC, month DESC, createdAt DESC
    `);

    if (schedules.length === 0) {
      console.log('❌ No hay horarios guardados en la base de datos');
    } else {
      console.log(`✅ ${schedules.length} horarios encontrados:`);
      schedules.forEach(schedule => {
        console.log(`   - ${schedule.horario_nombre || 'Sin nombre'}`);
        console.log(`     Servicio: ${schedule.serviceName} (ID: ${schedule.serviceId})`);
        console.log(`     Período: ${schedule.month}/${schedule.year}`);
        console.log(`     Estado: ${schedule.status}`);
        console.log(`     Creado: ${new Date(schedule.createdAt).toLocaleString()}`);
        console.log('');
      });
    }

    // Buscar específicamente mayo 2025 para servicio 1
    console.log('🔍 Buscando horario de mayo 2025 para servicio 1:');
    const [maySchedules] = await connection.execute(`
      SELECT id, horario_nombre, status, shifts
      FROM monthly_schedules 
      WHERE year = '2025' AND month = '5' AND serviceId = '1'
      ORDER BY createdAt DESC
    `);

    if (maySchedules.length === 0) {
      console.log('❌ No hay horarios para mayo 2025 del servicio 1');
      console.log('   Esto explica por qué no se puede obtener el mes anterior para junio');
    } else {
      console.log(`✅ ${maySchedules.length} horarios encontrados para mayo 2025:`);
      maySchedules.forEach(schedule => {
        console.log(`   - ${schedule.horario_nombre || 'Sin nombre'} (${schedule.status})`);
        const shiftsCount = schedule.shifts ? JSON.parse(schedule.shifts).length : 0;
        console.log(`     Turnos: ${shiftsCount}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkMonthlySchedules();