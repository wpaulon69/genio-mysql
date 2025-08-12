require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

// Configuración por defecto (copiada del código)
const defaultScheduleRulesConfig = {
  minimumRestHoursBetweenShifts: 12,
  maxConsecutiveWorkDays: 7,
  preferredConsecutiveWorkDays: 5,
  maxConsecutiveDaysOff: 4,
  preferredConsecutiveDaysOff: 2,
  minConsecutiveDaysOffRequiredBeforeWork: 1,
  defaultTargetCompleteWeekendsOff: 1,
};

// Función para crear configuración específica del servicio
function createServiceSpecificRulesConfig(service) {
  return {
    ...defaultScheduleRulesConfig,
    maxConsecutiveWorkDays: service.max_dias_trabajo_consecutivos || defaultScheduleRulesConfig.maxConsecutiveWorkDays,
    preferredConsecutiveWorkDays: service.dias_trabajo_consecutivos_preferidos || defaultScheduleRulesConfig.preferredConsecutiveWorkDays,
    maxConsecutiveDaysOff: service.max_descansos_consecutivos || defaultScheduleRulesConfig.maxConsecutiveDaysOff,
    preferredConsecutiveDaysOff: service.dias_descanso_consecutivos_preferidos || defaultScheduleRulesConfig.preferredConsecutiveDaysOff,
    minConsecutiveDaysOffRequiredBeforeWork: service.min_descansos_requeridos_antes_de_trabajar || defaultScheduleRulesConfig.minConsecutiveDaysOffRequiredBeforeWork,
    defaultTargetCompleteWeekendsOff: service.fds_descanso_completo_objetivo || defaultScheduleRulesConfig.defaultTargetCompleteWeekendsOff,
  };
}

async function testServiceSpecificConfig() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Probando configuración específica del servicio...\n');

    // Obtener configuración del servicio mucamas
    const [services] = await connection.execute(`
      SELECT * FROM servicios WHERE id_servicio = 1
    `);

    if (services.length === 0) {
      console.log('❌ No se encontró el servicio');
      return;
    }

    const service = services[0];
    
    console.log('📊 Configuración del servicio mucamas:');
    console.log(`- max_dias_trabajo_consecutivos: ${service.max_dias_trabajo_consecutivos}`);
    console.log(`- max_descansos_consecutivos: ${service.max_descansos_consecutivos}`);
    console.log(`- dias_trabajo_consecutivos_preferidos: ${service.dias_trabajo_consecutivos_preferidos}`);
    console.log(`- dias_descanso_consecutivos_preferidos: ${service.dias_descanso_consecutivos_preferidos}`);
    console.log(`- min_descansos_requeridos_antes_de_trabajar: ${service.min_descansos_requeridos_antes_de_trabajar}`);
    console.log(`- fds_descanso_completo_objetivo: ${service.fds_descanso_completo_objetivo}`);

    console.log('\n🔧 Configuración por defecto:');
    console.log(`- maxConsecutiveDaysOff: ${defaultScheduleRulesConfig.maxConsecutiveDaysOff}`);

    console.log('\n✨ Configuración específica generada:');
    const specificConfig = createServiceSpecificRulesConfig(service);
    console.log(`- maxConsecutiveDaysOff: ${specificConfig.maxConsecutiveDaysOff}`);
    console.log(`- maxConsecutiveWorkDays: ${specificConfig.maxConsecutiveWorkDays}`);
    console.log(`- preferredConsecutiveDaysOff: ${specificConfig.preferredConsecutiveDaysOff}`);

    console.log('\n💡 Resultado:');
    if (specificConfig.maxConsecutiveDaysOff === 7) {
      console.log('✅ La configuración específica está usando 7 días máximo');
      console.log('✅ Alamo con 1-2 días consecutivos NO debería generar violación');
    } else {
      console.log(`❌ La configuración sigue usando ${specificConfig.maxConsecutiveDaysOff} días máximo`);
      console.log('❌ Esto podría causar violaciones incorrectas');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testServiceSpecificConfig();