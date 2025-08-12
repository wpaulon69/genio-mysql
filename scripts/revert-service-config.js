require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function revertServiceConfig() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔧 Revirtiendo configuración del servicio a valores originales...\n');

    // Revertir a configuración original más realista
    await connection.execute(`
      UPDATE servicios 
      SET max_descansos_consecutivos = 3,
          dias_descanso_consecutivos_preferidos = 2
      WHERE id_servicio = 1
    `);

    console.log('✅ Configuración revertida:');
    console.log('   - max_descansos_consecutivos: 7 → 3');
    console.log('   - dias_descanso_consecutivos_preferidos: 3 → 2');

    // Verificar cambios
    const [updated] = await connection.execute(`
      SELECT max_descansos_consecutivos, dias_descanso_consecutivos_preferidos
      FROM servicios 
      WHERE id_servicio = 1
    `);

    console.log('\n📊 Configuración actual:');
    console.log(`   - Máximo descansos consecutivos: ${updated[0].max_descansos_consecutivos}`);
    console.log(`   - Descansos consecutivos preferidos: ${updated[0].dias_descanso_consecutivos_preferidos}`);

    console.log('\n💡 Ahora el algoritmo debería reportar correctamente:');
    console.log('   - Si Alamo realmente tiene 8 días consecutivos → violación válida');
    console.log('   - Si Alamo NO tiene 8 días consecutivos → el bug se hará evidente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

revertServiceConfig();