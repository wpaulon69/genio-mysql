require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

// Función exacta del código
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

function createServiceSpecificRulesConfig(service) {
  console.log('🔍 Ejecutando createServiceSpecificRulesConfig...');
  console.log('📊 Service recibido:', service ? 'Objeto válido' : 'NULL/UNDEFINED');
  
  if (!service) {
    console.log('❌ Service es null/undefined, devolviendo configuración por defecto');
    return defaultScheduleRulesConfig;
  }
  
  console.log('📊 Propiedades del service:');
  console.log(`- max_descansos_consecutivos: ${service.max_descansos_consecutivos} (${typeof service.max_descansos_consecutivos})`);
  
  const result = {
    ...defaultScheduleRulesConfig,
    maxConsecutiveWorkDays: service.max_dias_trabajo_consecutivos || defaultScheduleRulesConfig.maxConsecutiveWorkDays,
    preferredConsecutiveWorkDays: service.dias_trabajo_consecutivos_preferidos || defaultScheduleRulesConfig.preferredConsecutiveWorkDays,
    maxConsecutiveDaysOff: service.max_descansos_consecutivos || defaultScheduleRulesConfig.maxConsecutiveDaysOff,
    preferredConsecutiveDaysOff: service.dias_descanso_consecutivos_preferidos || defaultScheduleRulesConfig.preferredConsecutiveDaysOff,
    minConsecutiveDaysOffRequiredBeforeWork: service.min_descansos_requeridos_antes_de_trabajar || defaultScheduleRulesConfig.minConsecutiveDaysOffRequiredBeforeWork,
    defaultTargetCompleteWeekendsOff: service.fds_descanso_completo_objetivo || defaultScheduleRulesConfig.defaultTargetCompleteWeekendsOff,
  };
  
  console.log('✅ Configuración generada:');
  console.log(`- maxConsecutiveDaysOff: ${result.maxConsecutiveDaysOff}`);
  
  return result;
}

async function debugFunctionReturnValue() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Debuggeando valor de retorno de createServiceSpecificRulesConfig...\n');

    // Obtener servicio exacto como lo hace el componente
    const [services] = await connection.execute(`
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
        dotacion_objetivo_sab_dom_feriados_noche,
        max_dias_trabajo_consecutivos,
        max_descansos_consecutivos,
        dias_trabajo_consecutivos_preferidos,
        dias_descanso_consecutivos_preferidos,
        min_descansos_requeridos_antes_de_trabajar,
        fds_descanso_completo_objetivo
      FROM servicios 
      WHERE id_servicio = 1
    `);

    if (services.length === 0) {
      console.log('❌ No se encontró el servicio');
      return;
    }

    const service = services[0];
    console.log('📊 Service obtenido de la BD:');
    console.log(JSON.stringify(service, null, 2));

    console.log('\n🔧 Llamando a createServiceSpecificRulesConfig...');
    const rulesConfig = createServiceSpecificRulesConfig(service);
    
    console.log('\n📊 Resultado final:');
    console.log(`- maxConsecutiveDaysOff: ${rulesConfig.maxConsecutiveDaysOff}`);
    console.log(`- Tipo: ${typeof rulesConfig.maxConsecutiveDaysOff}`);
    
    console.log('\n💡 DIAGNÓSTICO:');
    if (rulesConfig.maxConsecutiveDaysOff === 4) {
      console.log('❌ PROBLEMA: Está devolviendo configuración por defecto (4)');
      console.log('- Verificar que service.max_descansos_consecutivos no sea falsy');
    } else if (rulesConfig.maxConsecutiveDaysOff === 3) {
      console.log('✅ Configuración específica correcta (3)');
      console.log('- El problema debe estar en otro lugar');
    } else {
      console.log(`⚠️  Valor inesperado: ${rulesConfig.maxConsecutiveDaysOff}`);
    }

    // Simular exactamente lo que hace el algoritmo de generación
    console.log('\n🔍 Simulando llamada al algoritmo de generación...');
    console.log('generateAlgorithmicSchedule(service, month, year, employees, holidays, previousMonthShifts, rulesConfig)');
    console.log(`Donde rulesConfig.maxConsecutiveDaysOff = ${rulesConfig.maxConsecutiveDaysOff}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugFunctionReturnValue();