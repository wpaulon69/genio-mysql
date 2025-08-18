const mysql = require('mysql2/promise');

async function debugPreferencesJefe() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_management'
  });

  try {
    console.log('🔍 DEBUGGING PREFERENCIAS JEFE SERVICIO');
    console.log('=====================================');

    // 1. Verificar usuarios Jefe Servicio
    console.log('\n1️⃣ Usuarios Jefe Servicio:');
    const [jefes] = await connection.execute(`
      SELECT u.id, u.username, u.role, u.serviceId, s.nombre_servicio
      FROM users u
      LEFT JOIN servicios s ON u.serviceId = s.id_servicio
      WHERE u.role = 'Jefe Servicio'
    `);
    console.table(jefes);

    // 2. Verificar empleados del servicio mucamas
    console.log('\n2️⃣ Empleados del servicio mucamas:');
    const [empleados] = await connection.execute(`
      SELECT e.id_empleado, e.nombre, e.id_servicio, s.nombre_servicio, e.trabaja_feriados
      FROM empleados e
      LEFT JOIN servicios s ON e.id_servicio = s.id_servicio
      WHERE s.nombre_servicio = 'mucamas'
    `);
    console.table(empleados);

    if (empleados.length === 0) {
      console.log('❌ No hay empleados en el servicio mucamas');
      return;
    }

    const serviceId = empleados[0].id_servicio;
    console.log(`\n🎯 Usando serviceId: ${serviceId}`);

    // 3. Simular la consulta de la API
    console.log('\n3️⃣ Simulando consulta API de preferencias:');
    const month = '7'; // julio
    const year = '2025';

    console.log(`📅 Consultando para: ${month}/${year}`);

    // Empleados básicos
    const [empBasicos] = await connection.execute(`
      SELECT 
        e.id_empleado,
        e.nombre,
        COALESCE(e.trabaja_feriados, 0) as trabaja_feriados
      FROM empleados e
      WHERE e.id_servicio = ?
      ORDER BY e.nombre
    `, [serviceId]);
    
    console.log(`\n👥 Empleados básicos encontrados: ${empBasicos.length}`);
    console.table(empBasicos);

    // Turnos fijos
    const [turnosFijos] = await connection.execute(`
      SELECT 
        tf.id_empleado,
        tf.dia_semana,
        tf.tipo_turno
      FROM turnos_fijos tf
      INNER JOIN empleados e ON tf.id_empleado = e.id_empleado
      WHERE e.id_servicio = ?
      ORDER BY tf.id_empleado, tf.dia_semana
    `, [serviceId]);
    
    console.log(`\n⏰ Turnos fijos encontrados: ${turnosFijos.length}`);
    if (turnosFijos.length > 0) {
      console.table(turnosFijos);
    }

    // Asignaciones
    const startOfMonth = `${year}-${month.padStart(2, '0')}-01`;
    const endOfMonth = `${year}-${month.padStart(2, '0')}-31`;
    
    const [asignaciones] = await connection.execute(`
      SELECT 
        a.id_empleado,
        a.id_tipo_asignacion,
        ta.nombre_tipo as tipo_asignacion,
        a.fecha_inicio,
        a.fecha_fin,
        a.descripcion
      FROM asignaciones_empleado a
      INNER JOIN empleados e ON a.id_empleado = e.id_empleado
      INNER JOIN tipos_asignacion ta ON a.id_tipo_asignacion = ta.id_tipo_asignacion
      WHERE e.id_servicio = ? 
        AND (
          (a.fecha_inicio <= ? AND a.fecha_fin >= ?) OR
          (a.fecha_inicio >= ? AND a.fecha_inicio <= ?)
        )
      ORDER BY a.id_empleado, a.fecha_inicio
    `, [serviceId, endOfMonth, startOfMonth, startOfMonth, endOfMonth]);
    
    console.log(`\n📋 Asignaciones encontradas: ${asignaciones.length}`);
    if (asignaciones.length > 0) {
      console.table(asignaciones);
    }

    // Preferencias específicas
    const [preferenciasEspecificas] = await connection.execute(`
      SELECT 
        ep.id_empleado,
        ep.mes,
        ep.anio,
        ep.elegible_franco_pos_guardia,
        ep.prefiere_trabajar_fines_semana,
        ep.disponibilidad_general,
        ep.restricciones_especificas
      FROM empleadopreferencias ep
      INNER JOIN empleados e ON ep.id_empleado = e.id_empleado
      WHERE e.id_servicio = ? AND ep.mes = ? AND ep.anio = ?
      ORDER BY ep.id_empleado
    `, [serviceId, parseInt(month), parseInt(year)]);
    
    console.log(`\n⚙️ Preferencias específicas encontradas: ${preferenciasEspecificas.length}`);
    if (preferenciasEspecificas.length > 0) {
      console.table(preferenciasEspecificas);
    }

    // 4. Verificar estructura de respuesta
    console.log('\n4️⃣ Estructura de respuesta final:');
    const employeesWithPreferences = empBasicos.map(emp => {
      const preferencia = preferenciasEspecificas.find(p => p.id_empleado === emp.id_empleado);
      
      return {
        id_empleado: emp.id_empleado,
        nombre: emp.nombre,
        trabaja_feriados: Boolean(emp.trabaja_feriados),
        elegible_franco_pos_guardia: preferencia?.elegible_franco_pos_guardia || false,
        prefiere_trabajar_fines_semana: preferencia?.prefiere_trabajar_fines_semana || false,
        disponibilidad_general: preferencia?.disponibilidad_general || 'disponible',
        restricciones_especificas: preferencia?.restricciones_especificas || '',
        mes: parseInt(month),
        anio: parseInt(year),
        turnos_fijos: turnosFijos.filter(tf => tf.id_empleado === emp.id_empleado),
        asignaciones: asignaciones.filter(a => a.id_empleado === emp.id_empleado)
      };
    });

    console.log(`\n✅ Respuesta final: ${employeesWithPreferences.length} empleados`);
    console.log(JSON.stringify(employeesWithPreferences, null, 2));

    // 5. Probar la API directamente
    console.log('\n5️⃣ Probando API directamente...');
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`http://localhost:3000/api/service-management/employees/preferences?month=${month}&year=${year}`, {
        headers: {
          'Cookie': 'next-auth.session-token=your-session-token-here' // Necesitarás el token real
        }
      });
      
      console.log(`Status: ${response.status}`);
      const data = await response.text();
      console.log('Response:', data);
    } catch (apiError) {
      console.log('❌ Error probando API:', apiError.message);
      console.log('💡 Esto es normal si no tienes una sesión válida');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

debugPreferencesJefe().catch(console.error);