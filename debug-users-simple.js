const mysql = require('mysql2/promise');

async function checkUsers() {
  try {
    const connection = await mysql.createConnection({
      host: '10.175.6.16',
      user: 'root',
      password: 'nokia3189',
      database: 'horarios_des'
    });

    console.log('Conectado a la base de datos');

    const [users] = await connection.execute(`
      SELECT email, name FROM users LIMIT 5
    `);

    console.log('Usuarios encontrados:', users);
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUsers();