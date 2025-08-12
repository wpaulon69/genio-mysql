require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function verifyUserService() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Verificando usuario y servicio...');

    // Verificar el usuario jefe de servicio
    const [users] = await connection.execute(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role_id,
        u.service_id,
        s.nombre_servicio
      FROM users u
      LEFT JOIN servicios s ON u.service_id = s.id_servicio
      WHERE u.email = 'jefe@mucamas.com'
    `);
    
    if (users.length === 0) {
      console.log('❌ Usuario jefe@mucamas.com no encontrado');
      return;
    }
    
    const user = users[0];
    console.log('\n👤 Usuario encontrado:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Nombre: ${user.name}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Role ID: ${user.role_id}`);
    console.log(`- Service ID: ${user.service_id}`);
    console.log(`- Servicio: ${user.nombre_servicio}`);
    
    if (!user.service_id) {
      console.log('\n❌ PROBLEMA: Usuario no tiene service_id asignado');
      return;
    }
    
    // Verificar que el servicio existe
    const [services] = await connection.execute(`
      SELECT * FROM servicios WHERE id_servicio = ?
    `, [user.service_id]);
    
    if (services.length === 0) {
      console.log(`\n❌ PROBLEMA: Servicio con ID ${user.service_id} no existe`);
      return;
    }
    
    console.log('\n🏥 Servicio verificado:');
    console.log(`- ID: ${services[0].id_servicio}`);
    console.log(`- Nombre: ${services[0].nombre_servicio}`);
    
    // Verificar horarios para este servicio
    const [schedules] = await connection.execute(`
      SELECT id, horario_nombre, status 
      FROM horarios 
      WHERE serviceId = ? AND year = '2025' AND month = '5'
    `, [user.service_id]);
    
    console.log(`\n📅 Horarios para este servicio: ${schedules.length}`);
    schedules.forEach(schedule => {
      console.log(`- ${schedule.horario_nombre} (${schedule.status})`);
    });
    
    console.log('\n✅ Verificación completada');
    console.log('\n📝 Para probar:');
    console.log('1. Inicia sesión con: jefe@mucamas.com');
    console.log('2. El user.serviceId debería ser:', user.service_id);
    console.log('3. La API /api/services/' + user.service_id + ' debería funcionar');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyUserService();