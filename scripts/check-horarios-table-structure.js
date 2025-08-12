require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function checkHorariosTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Verificando tabla horarios...\n');

    // Verificar estructura
    const [structure] = await connection.execute('DESCRIBE horarios');
    console.log('📋 Estructura de horarios:');
    structure.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Verificar contenido
    console.log('\n📊 Horarios existentes:');
    const [schedules] = await connection.execute(`
      SELECT id, scheduleKey, year, month, serviceId, serviceName, status, horario_nombre, createdAt
      FROM horarios 
      ORDER BY year DESC, month DESC, createdAt DESC
      LIMIT 10
    `);

    if (schedules.length === 0) {
      console.log('❌ No hay horarios guardados');
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

    // Buscar mayo 2025 para servicio 1
    console.log('🔍 Buscando mayo 2025 para servicio 1:');
    const [maySchedules] = await connection.execute(`
      SELECT id, horario_nombre, status
      FROM horarios 
      WHERE year = '2025' AND month = '5' AND serviceId = 1
      ORDER BY createdAt DESC
    `);

    if (maySchedules.length === 0) {
      console.log('❌ No hay horarios para mayo 2025 del servicio 1');
    } else {
      console.log(`✅ ${maySchedules.length} horarios encontrados para mayo 2025:`);
      maySchedules.forEach(schedule => {
        console.log(`   - ${schedule.horario_nombre} (${schedule.status})`);
      });
    }

    // Verificar tabla horario_detalles
    console.log('\n🔍 Verificando tabla horario_detalles:');
    const [detailsStructure] = await connection.execute('DESCRIBE horario_detalles');
    console.log('📋 Estructura de horario_detalles:');
    detailsStructure.forEach(col => {
      console.log(`- ${col.Field} (${col.Type})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkHorariosTable();