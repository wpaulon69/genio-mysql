const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });

  try {
    console.log('👥 Usuarios en la base de datos:\n');

    const [users] = await connection.execute(`
      SELECT 
        u.id,
        u.email,
        u.name,
        ur.display_name as role,
        u.is_active,
        u.must_change_password,
        u.created_at
      FROM users u
      JOIN user_roles ur ON u.role_id = ur.id
      ORDER BY ur.level ASC, u.name ASC
    `);

    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      return;
    }

    users.forEach(user => {
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Nombre: ${user.name}`);
      console.log(`🔐 Rol: ${user.role}`);
      console.log(`✅ Activo: ${user.is_active ? 'Sí' : 'No'}`);
      console.log(`🔄 Debe cambiar contraseña: ${user.must_change_password ? 'Sí' : 'No'}`);
      console.log(`📅 Creado: ${user.created_at}`);
      console.log('─'.repeat(50));
    });

    console.log(`\n📊 Total de usuarios: ${users.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkUsers();