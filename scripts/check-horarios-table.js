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
    console.log('Conectado a la base de datos');

    // Verificar estructura de tabla horarios
    const [structure] = await connection.execute('DESCRIBE horarios');
    console.log('\n📋 Estructura de tabla horarios:');
    structure.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Verificar datos de ejemplo
    const [data] = await connection.execute('SELECT * FROM horarios LIMIT 3');
    console.log('\n📊 Datos de ejemplo:');
    data.forEach((row, i) => {
      console.log(`${i+1}.`, row);
    });

    // Verificar tabla horario_detalles
    const [detailsStructure] = await connection.execute('DESCRIBE horario_detalles');
    console.log('\n📋 Estructura de tabla horario_detalles:');
    detailsStructure.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Verificar datos de ejemplo de detalles
    const [detailsData] = await connection.execute('SELECT * FROM horario_detalles LIMIT 5');
    console.log('\n📊 Datos de ejemplo horario_detalles:');
    detailsData.forEach((row, i) => {
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

checkHorariosTable();