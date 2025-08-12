const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkTableStructure() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });

  try {
    console.log('🔍 Verificando estructura de tablas...\n');

    // Verificar tabla empleados
    console.log('📋 Tabla EMPLEADOS:');
    const [empleadosColumns] = await connection.execute(`
      DESCRIBE empleados
    `);
    empleadosColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n📋 Tabla SERVICIOS:');
    const [serviciosColumns] = await connection.execute(`
      DESCRIBE servicios
    `);
    serviciosColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n📋 Tabla USER_ROLES:');
    const [rolesColumns] = await connection.execute(`
      DESCRIBE user_roles
    `);
    rolesColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Verificar datos de ejemplo
    console.log('\n📊 Datos de ejemplo:');
    
    console.log('\n🏥 Servicios disponibles:');
    const [servicios] = await connection.execute(`
      SELECT * FROM servicios LIMIT 5
    `);
    servicios.forEach(servicio => {
      console.log(`  - ID: ${servicio.id_servicio}, Nombre: ${servicio.nombre_servicio}`);
    });

    console.log('\n👥 Empleados disponibles:');
    const [empleados] = await connection.execute(`
      SELECT * FROM empleados LIMIT 5
    `);
    empleados.forEach(empleado => {
      console.log(`  - ID: ${empleado.id_empleado}, Nombre: ${empleado.nombre}`);
    });

    console.log('\n🔐 Roles disponibles:');
    const [roles] = await connection.execute(`
      SELECT * FROM user_roles
    `);
    roles.forEach(role => {
      console.log(`  - ID: ${role.id}, Nombre: ${role.display_name}, Nivel: ${role.level}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkTableStructure();