require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function updateServiceConfig() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔧 Actualizando configuración del servicio mucamas...\n');

    // Actualizar configuración más realista
    await connection.execute(`
      UPDATE servicios 
      SET max_descansos_consecutivos = 7,
          dias_descanso_consecutivos_preferidos = 3
      WHERE id_servicio = 1
    `);

    console.log('✅ Configuración actualizada:');
    console.log('   - max_descansos_consecutivos: 3 → 7');
    console.log('   - dias_descanso_consecutivos_preferidos: 2 → 3');

    // Verificar cambios
    const [updated] = await connection.execute(`
      SELECT max_descansos_consecutivos, dias_descanso_consecutivos_preferidos
      FROM servicios 
      WHERE id_servicio = 1
    `);

    console.log('\n📊 Configuración actual:');
    console.log(`   - Máximo descansos consecutivos: ${updated[0].max_descansos_consecutivos}`);
    console.log(`   - Descansos consecutivos preferidos: ${updated[0].dias_descanso_consecutivos_preferidos}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateServiceConfig();