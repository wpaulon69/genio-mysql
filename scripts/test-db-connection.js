const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('Probando conexión a la base de datos...');
  
  // Diferentes configuraciones para probar
  const configs = [
    {
      name: 'Config 1 (localhost sin password)',
      config: {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_schedule'
      }
    },
    {
      name: 'Config 2 (localhost con password)',
      config: {
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'hospital_schedule'
      }
    },
    {
      name: 'Config 3 (127.0.0.1)',
      config: {
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'hospital_schedule'
      }
    }
  ];

  for (const { name, config } of configs) {
    try {
      console.log(`\nProbando ${name}...`);
      const connection = await mysql.createConnection(config);
      
      // Probar consulta simple
      const [result] = await connection.execute('SELECT 1 as test');
      console.log(`✅ ${name} - Conexión exitosa`);
      
      // Verificar si existe la base de datos
      const [databases] = await connection.execute('SHOW DATABASES');
      const dbExists = databases.some(db => db.Database === 'hospital_schedule');
      console.log(`   Base de datos existe: ${dbExists ? '✅' : '❌'}`);
      
      if (dbExists) {
        // Verificar tablas principales
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`   Tablas encontradas: ${tables.length}`);
        tables.forEach(table => {
          console.log(`   - ${Object.values(table)[0]}`);
        });
      }
      
      await connection.end();
      break; // Si esta configuración funciona, usar esta
      
    } catch (error) {
      console.log(`❌ ${name} - Error: ${error.message}`);
    }
  }
}

testConnection();