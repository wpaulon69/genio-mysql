const mysql = require('mysql2/promise');

async function debugServiciosTable() {
  console.log('=== DEBUG: Tabla Servicios ===\n');
  
  // Configuraciones de conexión para probar (basadas en .env.local)
  const configs = [
    { host: '10.175.6.16', user: 'root', password: 'nokia3189', database: 'horarios_des' },
    { host: 'localhost', user: 'root', password: 'nokia3189', database: 'horarios_des' },
    { host: '127.0.0.1', user: 'root', password: 'nokia3189', database: 'horarios_des' },
  ];

  let connection = null;

  for (const config of configs) {
    try {
      console.log(`Probando conexión: ${config.host}/${config.database}...`);
      connection = await mysql.createConnection(config);
      console.log('✅ Conexión exitosa!');
      break;
    } catch (error) {
      console.log(`❌ Falló: ${error.message}`);
      continue;
    }
  }

  if (!connection) {
    console.log('\n❌ No se pudo conectar a ninguna base de datos');
    console.log('\nPosibles soluciones:');
    console.log('1. Verificar que MySQL esté corriendo');
    console.log('2. Verificar credenciales de conexión');
    console.log('3. Verificar nombre de la base de datos');
    return;
  }

  try {
    // 1. Verificar si existe la base de datos
    console.log('\n1. Verificando base de datos...');
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('Bases de datos disponibles:');
    databases.forEach(db => console.log(`  - ${Object.values(db)[0]}`));

    // 2. Verificar si existe la tabla servicios
    console.log('\n2. Verificando tabla servicios...');
    try {
      const [tables] = await connection.execute('SHOW TABLES LIKE "servicios"');
      if (tables.length === 0) {
        console.log('❌ La tabla "servicios" NO existe');
        console.log('\nTablas disponibles:');
        const [allTables] = await connection.execute('SHOW TABLES');
        allTables.forEach(table => console.log(`  - ${Object.values(table)[0]}`));
        return;
      }
      console.log('✅ La tabla "servicios" existe');
    } catch (error) {
      console.log('❌ Error verificando tabla servicios:', error.message);
      return;
    }

    // 3. Verificar estructura de la tabla
    console.log('\n3. Estructura de la tabla servicios:');
    const [structure] = await connection.execute('DESCRIBE servicios');
    console.table(structure);

    // 4. Verificar datos en la tabla
    console.log('\n4. Datos en la tabla servicios:');
    const [services] = await connection.execute('SELECT * FROM servicios LIMIT 10');
    if (services.length === 0) {
      console.log('❌ La tabla servicios está VACÍA');
      console.log('\nPara solucionarlo, necesitas insertar datos:');
      console.log(`INSERT INTO servicios (nombre_servicio, descripcion) VALUES ('mucamas', 'Servicio de mucamas');`);
    } else {
      console.log(`✅ Encontrados ${services.length} servicios:`);
      console.table(services);
    }

    // 5. Verificar servicio específico con ID 1
    console.log('\n5. Verificando servicio con ID 1:');
    const [service1] = await connection.execute('SELECT * FROM servicios WHERE id_servicio = 1');
    if (service1.length === 0) {
      console.log('❌ No existe servicio con ID 1');
    } else {
      console.log('✅ Servicio con ID 1 encontrado:');
      console.log(JSON.stringify(service1[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error durante debug:', error);
  } finally {
    await connection.end();
  }
}

debugServiciosTable();