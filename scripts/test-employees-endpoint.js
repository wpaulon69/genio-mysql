require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function testEmployeesEndpoint() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Simulando consulta del endpoint de empleados...');

    // Simular la consulta del endpoint para servicio 1
    const serviceId = 1;
    
    console.log(`\n1. Consultando empleados del servicio ${serviceId}:`);
    const [employees] = await connection.execute(`
      SELECT 
        id_empleado,
        nombre,
        email_empleado,
        elegible_franco_pos_guardia,
        prefiere_trabajar_fines_semana,
        disponibilidad_general,
        restricciones_especificas,
        trabaja_feriados
      FROM empleados 
      WHERE id_servicio = ?
      ORDER BY nombre ASC
    `, [serviceId]);

    console.log(`✅ Empleados encontrados: ${employees.length}`);
    
    // Para cada empleado, obtener turnos fijos
    for (let employee of employees) {
      console.log(`\n📋 Empleado: ${employee.nombre} (ID: ${employee.id_empleado})`);
      
      // Turnos fijos
      const [turnosFijos] = await connection.execute(`
        SELECT dia_semana, tipo_turno
        FROM turnos_fijos_empleado
        WHERE id_empleado = ?
        ORDER BY FIELD(dia_semana, 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo')
      `, [employee.id_empleado]);

      console.log(`   Turnos fijos: ${turnosFijos.length}`);
      turnosFijos.forEach(turno => {
        console.log(`   - ${turno.dia_semana}: ${turno.tipo_turno}`);
      });

      // Asignaciones
      const [asignaciones] = await connection.execute(`
        SELECT 
          ae.id_tipo_asignacion,
          ae.fecha_inicio,
          ae.fecha_fin,
          ae.descripcion,
          ta.nombre_tipo
        FROM asignaciones_empleado ae
        JOIN tipos_asignacion ta ON ae.id_tipo_asignacion = ta.id_tipo_asignacion
        WHERE ae.id_empleado = ? AND ae.fecha_fin >= CURDATE()
        ORDER BY ae.fecha_inicio
      `, [employee.id_empleado]);

      console.log(`   Asignaciones activas: ${asignaciones.length}`);
      asignaciones.forEach(asig => {
        console.log(`   - ${asig.nombre_tipo}: ${asig.fecha_inicio} a ${asig.fecha_fin}`);
      });

      employee.turnos_fijos = turnosFijos || [];
      employee.asignaciones = asignaciones || [];
    }

    console.log('\n✅ Datos completos de empleados preparados para el algoritmo');
    console.log(`Total empleados con datos: ${employees.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testEmployeesEndpoint();