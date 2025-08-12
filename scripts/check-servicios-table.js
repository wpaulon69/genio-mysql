require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function checkServiciosTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Verificando estructura de tabla servicios...');

    // Verificar estructura
    const [structure] = await connection.execute('DESCRIBE servicios');
    console.log('\n📋 Columnas existentes:');
    structure.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Verificar datos de ejemplo
    const [data] = await connection.execute('SELECT * FROM servicios LIMIT 2');
    console.log('\n📊 Datos de ejemplo:');
    data.forEach((row, i) => {
      console.log(`${i+1}.`, row);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkServiciosTable();