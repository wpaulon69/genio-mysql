require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function testServiceEndpoint() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Probando endpoint de servicio...');

    // Verificar el usuario y su service_id
    const [users] = await connection.execute(`
      SELECT id, name, email, service_id
      FROM users 
      WHERE email = 'jefe@mucamas.com'
    `);
    
    if (users.length === 0) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    const user = users[0];
    console.log('\n👤 Usuario:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Nombre: ${user.name}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Service ID: ${user.service_id}`);
    
    // Verificar el servicio
    const [services] = await connection.execute(`
      SELECT * FROM servicios WHERE id_servicio = ?
    `, [user.service_id]);
    
    if (services.length === 0) {
      console.log('❌ Servicio no encontrado');
      return;
    }
    
    const service = services[0];
    console.log('\n🏥 Servicio:');
    console.log(`- ID: ${service.id_servicio}`);
    console.log(`- Nombre: ${service.nombre_servicio}`);
    console.log(`- Descripción: ${service.descripcion || 'N/A'}`);
    console.log(`- Turno noche: ${service.habilitar_turno_noche ? 'Sí' : 'No'}`);
    console.log(`- Personal mín. mañana: ${service.personal_minimo_manana || 'N/A'}`);
    console.log(`- Personal mín. tarde: ${service.personal_minimo_tarde || 'N/A'}`);
    console.log(`- Personal mín. noche: ${service.personal_minimo_noche || 'N/A'}`);
    
    console.log('\n✅ Datos correctos para el endpoint');
    console.log(`📡 El endpoint /api/services/${user.service_id} debería devolver:`);
    console.log(JSON.stringify({
      id_servicio: service.id_servicio,
      nombre_servicio: service.nombre_servicio,
      descripcion: service.descripcion,
      habilitar_turno_noche: service.habilitar_turno_noche,
      personal_minimo_manana: service.personal_minimo_manana,
      personal_minimo_tarde: service.personal_minimo_tarde,
      personal_minimo_noche: service.personal_minimo_noche
    }, null, 2));
    
    console.log('\n🔍 Posibles problemas:');
    console.log('1. session.user.serviceId no coincide con el service_id del usuario');
    console.log('2. El permiso MANAGE_SERVICE_EMPLOYEES no está asignado');
    console.log('3. La sesión no se está cargando correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testServiceEndpoint();