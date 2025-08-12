require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function checkEmpleadosStructure() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Verificando estructura de tabla empleados...');

    // Verificar estructura
    const [structure] = await connection.execute('DESCRIBE empleados');
    console.log('\n📋 Columnas existentes:');
    structure.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Verificar empleados del servicio 1
    console.log('\n📊 Empleados del servicio 1:');
    const [employees] = await connection.execute(`
      SELECT id_empleado, nombre, id_servicio 
      FROM empleados 
      WHERE id_servicio = 1
    `);
    
    if (employees.length === 0) {
      console.log('❌ NO HAY EMPLEADOS ASIGNADOS AL SERVICIO 1');
      
      // Verificar todos los empleados
      const [allEmployees] = await connection.execute('SELECT id_empleado, nombre, id_servicio FROM empleados LIMIT 10');
      console.log('\n📋 Todos los empleados:');
      allEmployees.forEach(emp => {
        console.log(`   - ${emp.nombre} (ID: ${emp.id_empleado}, Servicio: ${emp.id_servicio})`);
      });
    } else {
      console.log(`✅ Empleados encontrados: ${employees.length}`);
      employees.forEach(emp => {
        console.log(`   - ${emp.nombre} (ID: ${emp.id_empleado})`);
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

checkEmpleadosStructure();