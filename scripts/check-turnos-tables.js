require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function checkTurnosTables() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Verificando tablas de turnos...');

    // Verificar qué tablas existen relacionadas con turnos
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE '%turno%'
    `);
    
    console.log('\n📋 Tablas relacionadas con turnos:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`- ${tableName}`);
    });

    // Verificar estructura de turnos_fijos si existe
    try {
      const [structure] = await connection.execute('DESCRIBE turnos_fijos');
      console.log('\n📋 Estructura de turnos_fijos:');
      structure.forEach(col => {
        console.log(`- ${col.Field} (${col.Type})`);
      });
      
      // Verificar datos
      const [data] = await connection.execute('SELECT * FROM turnos_fijos LIMIT 5');
      console.log('\n📊 Datos de turnos_fijos:');
      data.forEach((row, i) => {
        console.log(`${i+1}.`, row);
      });
    } catch (e) {
      console.log('\n❌ Tabla turnos_fijos no existe');
    }

    // Verificar estructura de turnos_fijos_empleado si existe
    try {
      const [structure2] = await connection.execute('DESCRIBE turnos_fijos_empleado');
      console.log('\n📋 Estructura de turnos_fijos_empleado:');
      structure2.forEach(col => {
        console.log(`- ${col.Field} (${col.Type})`);
      });
    } catch (e) {
      console.log('\n❌ Tabla turnos_fijos_empleado no existe');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTurnosTables();