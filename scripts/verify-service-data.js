require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function verifyServiceData() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Verificando datos del servicio con ID 1...');

    // Consulta igual que en el endpoint
    const [service] = await connection.execute(`
      SELECT 
        id_servicio,
        nombre_servicio,
        descripcion,
        habilitar_turno_noche,
        dotacion_objetivo_lunes_a_viernes_mananas,
        dotacion_objetivo_lunes_a_viernes_tardes,
        dotacion_objetivo_lunes_a_viernes_noche,
        dotacion_objetivo_sab_dom_feriados_mananas,
        dotacion_objetivo_sab_dom_feriados_tardes,
        dotacion_objetivo_sab_dom_feriados_noche
      FROM servicios 
      WHERE id_servicio = ?
    `, [1]);

    if (service.length === 0) {
      console.log('❌ No se encontró el servicio con ID 1');
      return;
    }

    console.log('✅ Datos del servicio:');
    console.log(JSON.stringify(service[0], null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyServiceData();