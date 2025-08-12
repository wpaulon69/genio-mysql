require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

// Configuración por defecto (copiada exacta del código)
const defaultScheduleRulesConfig = {
  minimumRestHoursBetweenShifts: 12,
  maxConsecutiveWorkDays: 7,
  preferredConsecutiveWorkDays: 5,
  maxConsecutiveDaysOff: 4,
  preferredConsecutiveDaysOff: 2,
  minConsecutiveDaysOffRequiredBeforeWork: 1,
  defaultTargetCompleteWeekendsOff: 1,
  scorePenalties: {
    minRestBetweenShiftsViolation: 10,
    minRestBeforeWorkViolation: 5,
    maxConsecutiveWorkDaysViolation: 5,
    maxConsecutiveDaysOffViolation: 1,
    staffingShortagePerEmployee: 5,
    weekendTargetNotMetPerWeekend: 2,
    maxWeekendTargetPenalty: 10,
    fixedShiftViolation: 20,
  },
};

// Función exacta del código
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

async function debugServiceConfigGeneration() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Debuggeando generación de configuración específica del servicio...\n');

    // Obtener datos exactos del servicio
    const [services] = await connection.execute(`
      SELECT * FROM servicios WHERE id_servicio = 1
    `);

    if (services.length === 0) {
      console.log('❌ No se encontró el servicio');
      return;
    }

    const service = services[0];
    
    console.log('📊 Datos RAW del servicio en la BD:');
    console.log(`- max_dias_trabajo_consecutivos: ${service.max_dias_trabajo_consecutivos} (tipo: ${typeof service.max_dias_trabajo_consecutivos})`);
    console.log(`- max_descansos_consecutivos: ${service.max_descansos_consecutivos} (tipo: ${typeof service.max_descansos_consecutivos})`);
    console.log(`- dias_trabajo_consecutivos_preferidos: ${service.dias_trabajo_consecutivos_preferidos} (tipo: ${typeof service.dias_trabajo_consecutivos_preferidos})`);
    console.log(`- dias_descanso_consecutivos_preferidos: ${service.dias_descanso_consecutivos_preferidos} (tipo: ${typeof service.dias_descanso_consecutivos_preferidos})`);
    console.log(`- min_descansos_requeridos_antes_de_trabajar: ${service.min_descansos_requeridos_antes_de_trabajar} (tipo: ${typeof service.min_descansos_requeridos_antes_de_trabajar})`);
    console.log(`- fds_descanso_completo_objetivo: ${service.fds_descanso_completo_objetivo} (tipo: ${typeof service.fds_descanso_completo_objetivo})`);

    console.log('\n🔧 Configuración por defecto:');
    console.log(`- maxConsecutiveDaysOff: ${defaultScheduleRulesConfig.maxConsecutiveDaysOff}`);
    console.log(`- maxConsecutiveWorkDays: ${defaultScheduleRulesConfig.maxConsecutiveWorkDays}`);

    console.log('\n✨ Configuración específica generada:');
    const specificConfig = createServiceSpecificRulesConfig(service);
    console.log(`- maxConsecutiveDaysOff: ${specificConfig.maxConsecutiveDaysOff}`);
    console.log(`- maxConsecutiveWorkDays: ${specificConfig.maxConsecutiveWorkDays}`);
    console.log(`- preferredConsecutiveDaysOff: ${specificConfig.preferredConsecutiveDaysOff}`);

    console.log('\n🔍 Verificación de la lógica OR:');
    console.log(`- service.max_descansos_consecutivos || default: ${service.max_descansos_consecutivos || defaultScheduleRulesConfig.maxConsecutiveDaysOff}`);
    console.log(`- ¿Es falsy el valor del servicio?: ${!service.max_descansos_consecutivos}`);

    // Calcular lookbackDays como lo hace el algoritmo
    const lookbackDays = Math.max(specificConfig.maxConsecutiveWorkDays, specificConfig.maxConsecutiveDaysOff, 7);
    console.log(`\n📊 LookbackDays calculado: ${lookbackDays}`);
    console.log(`- Math.max(${specificConfig.maxConsecutiveWorkDays}, ${specificConfig.maxConsecutiveDaysOff}, 7) = ${lookbackDays}`);

    console.log('\n💡 DIAGNÓSTICO:');
    if (specificConfig.maxConsecutiveDaysOff === 4) {
      console.log('❌ PROBLEMA: Sigue usando configuración por defecto (4)');
      console.log('- Verificar que los valores en la BD no sean NULL o 0');
      console.log('- Verificar que la función createServiceSpecificRulesConfig esté bien');
    } else if (specificConfig.maxConsecutiveDaysOff === 3) {
      console.log('✅ Configuración específica correcta (3)');
      console.log('- El problema debe estar en otro lugar');
    } else {
      console.log(`⚠️  Valor inesperado: ${specificConfig.maxConsecutiveDaysOff}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugServiceConfigGeneration();