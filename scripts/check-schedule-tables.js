require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function checkScheduleTables() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Verificando tablas de horarios...\n');

    // Verificar todas las tablas
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Todas las tablas:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`- ${tableName}`);
    });

    // Buscar tablas relacionadas con horarios/schedules
    console.log('\n🔍 Tablas relacionadas con horarios:');
    const [scheduleTables] = await connection.execute(`
      SHOW TABLES LIKE '%schedule%'
    `);
    
    if (scheduleTables.length === 0) {
      console.log('❌ No hay tablas con "schedule" en el nombre');
      
      // Buscar tablas relacionadas con horarios
      const [horarioTables] = await connection.execute(`
        SHOW TABLES LIKE '%horario%'
      `);
      
      if (horarioTables.length === 0) {
        console.log('❌ No hay tablas con "horario" en el nombre');
      } else {
        console.log('📋 Tablas con "horario":');
        horarioTables.forEach(table => {
          const tableName = Object.values(table)[0];
          console.log(`- ${tableName}`);
        });
      }
    } else {
      console.log('📋 Tablas con "schedule":');
      scheduleTables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`- ${tableName}`);
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

checkScheduleTables();