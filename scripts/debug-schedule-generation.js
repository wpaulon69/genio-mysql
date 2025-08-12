require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function debugScheduleGeneration() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Debuggeando generación de horarios...\n');

    // 1. Verificar servicio
    console.log('1. VERIFICANDO SERVICIO:');
    const [services] = await connection.execute('SELECT * FROM servicios WHERE id_servicio = 1');
    if (services.length === 0) {
      console.log('❌ No se encontró el servicio con ID 1');
      return;
    }
    const service = services[0];
    console.log(`✅ Servicio: ${service.nombre_servicio}`);
    console.log(`   - Dotación L-V mañana: ${service.dotacion_objetivo_lunes_a_viernes_mananas}`);
    console.log(`   - Dotación L-V tarde: ${service.dotacion_objetivo_lunes_a_viernes_tardes}`);
    console.log(`   - Turno noche habilitado: ${service.habilitar_turno_noche ? 'Sí' : 'No'}\n`);

    // 2. Verificar empleados del servicio
    console.log('2. VERIFICANDO EMPLEADOS DEL SERVICIO:');
    const [employees] = await connection.execute(`
      SELECT id_empleado, nombre, id_servicio, activo 
      FROM empleados 
      WHERE id_servicio = 1 AND activo = 1
    `);
    
    if (employees.length === 0) {
      console.log('❌ NO HAY EMPLEADOS ASIGNADOS AL SERVICIO 1');
      console.log('   Esto explica por qué la generación está vacía.\n');
      
      // Verificar si hay empleados en general
      const [allEmployees] = await connection.execute('SELECT id_empleado, nombre, id_servicio, activo FROM empleados LIMIT 5');
      console.log('📋 Empleados existentes en el sistema:');
      allEmployees.forEach(emp => {
        console.log(`   - ${emp.nombre} (ID: ${emp.id_empleado}, Servicio: ${emp.id_servicio}, Activo: ${emp.activo})`);
      });
      
    } else {
      console.log(`✅ Empleados encontrados: ${employees.length}`);
      employees.forEach(emp => {
        console.log(`   - ${emp.nombre} (ID: ${emp.id_empleado})`);
      });
    }

    // 3. Verificar turnos fijos si hay empleados
    if (employees.length > 0) {
      console.log('\n3. VERIFICANDO TURNOS FIJOS:');
      const [fixedShifts] = await connection.execute(`
        SELECT tf.*, e.nombre 
        FROM turnos_fijos tf 
        JOIN empleados e ON tf.id_empleado = e.id_empleado 
        WHERE e.id_servicio = 1
      `);
      
      if (fixedShifts.length === 0) {
        console.log('⚠️  No hay turnos fijos definidos para los empleados del servicio');
      } else {
        console.log(`✅ Turnos fijos encontrados: ${fixedShifts.length}`);
        fixedShifts.forEach(shift => {
          console.log(`   - ${shift.nombre}: ${shift.dia_semana} - ${shift.tipo_turno}`);
        });
      }

      // 4. Verificar preferencias
      console.log('\n4. VERIFICANDO PREFERENCIAS:');
      const [preferences] = await connection.execute(`
        SELECT p.*, e.nombre 
        FROM preferencias_empleados p 
        JOIN empleados e ON p.id_empleado = e.id_empleado 
        WHERE e.id_servicio = 1
      `);
      
      if (preferences.length === 0) {
        console.log('⚠️  No hay preferencias definidas para los empleados del servicio');
      } else {
        console.log(`✅ Preferencias encontradas: ${preferences.length}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugScheduleGeneration();