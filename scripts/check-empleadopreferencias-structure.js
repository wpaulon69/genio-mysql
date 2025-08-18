const mysql = require('mysql2/promise');

async function checkEmpleadoPreferenciasStructure() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_management'
    });

    console.log('🔍 VERIFICANDO ESTRUCTURA DE TABLA empleadopreferencias');
    console.log('=====================================================');

    // 1. Verificar si la tabla existe
    console.log('\n1️⃣ Verificando si la tabla existe:');
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE 'empleadopreferencias'
    `);
    
    if (tables.length === 0) {
      console.log('❌ La tabla empleadopreferencias NO EXISTE');
      
      // Verificar variaciones del nombre
      console.log('\n🔍 Buscando variaciones del nombre:');
      const [allTables] = await connection.execute('SHOW TABLES');
      const preferencesTables = allTables.filter(table => 
        Object.values(table)[0].toLowerCase().includes('preferencia')
      );
      
      if (preferencesTables.length > 0) {
        console.log('📋 Tablas relacionadas con preferencias encontradas:');
        preferencesTables.forEach(table => {
          console.log(`   - ${Object.values(table)[0]}`);
        });
      } else {
        console.log('❌ No se encontraron tablas relacionadas con preferencias');
      }
      
      return;
    }

    console.log('✅ La tabla empleadopreferencias EXISTE');

    // 2. Mostrar estructura de la tabla
    console.log('\n2️⃣ Estructura de la tabla empleadopreferencias:');
    const [columns] = await connection.execute(`
      DESCRIBE empleadopreferencias
    `);
    
    console.table(columns);

    // 3. Verificar datos de ejemplo
    console.log('\n3️⃣ Datos de ejemplo (primeros 5 registros):');
    const [sampleData] = await connection.execute(`
      SELECT * FROM empleadopreferencias LIMIT 5
    `);
    
    if (sampleData.length > 0) {
      console.table(sampleData);
    } else {
      console.log('📝 La tabla está vacía');
    }

    // 4. Verificar relación con empleados
    console.log('\n4️⃣ Verificando relación con tabla empleados:');
    try {
      const [relationCheck] = await connection.execute(`
        SELECT COUNT(*) as total_empleados,
               (SELECT COUNT(*) FROM empleadopreferencias) as total_preferencias
        FROM empleados
      `);
      console.table(relationCheck);
    } catch (error) {
      console.log('❌ Error verificando relación:', error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solución: Asegúrate de que MySQL esté ejecutándose');
      console.log('   - Verificar que el servidor MySQL esté activo');
      console.log('   - Verificar credenciales de conexión');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkEmpleadoPreferenciasStructure().catch(console.error);