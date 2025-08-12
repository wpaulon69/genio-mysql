require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function testScheduleGenerationFull() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔍 Simulando generación completa de horarios...\n');

    // 1. Obtener servicio (igual que el endpoint)
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
        dotacion_objetivo_sab_dom_feriados_noche
      FROM servicios 
      WHERE id_servicio = ?
    `, [1]);

    if (services.length === 0) {
      console.log('❌ No se encontró el servicio');
      return;
    }

    const service = services[0];
    console.log('1. SERVICIO:');
    console.log(`   ✅ ${service.nombre_servicio}`);
    console.log(`   - Dotación L-V: M:${service.dotacion_objetivo_lunes_a_viernes_mananas}, T:${service.dotacion_objetivo_lunes_a_viernes_tardes}, N:${service.dotacion_objetivo_lunes_a_viernes_noche}`);
    console.log(`   - Dotación FDS: M:${service.dotacion_objetivo_sab_dom_feriados_mananas}, T:${service.dotacion_objetivo_sab_dom_feriados_tardes}, N:${service.dotacion_objetivo_sab_dom_feriados_noche}`);

    // 2. Obtener empleados (igual que el endpoint)
    const [employees] = await connection.execute(`
      SELECT 
        id_empleado,
        id_servicio,
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
    `, [1]);

    console.log(`\n2. EMPLEADOS: ${employees.length} encontrados`);

    // Agregar turnos fijos y asignaciones a cada empleado
    for (let employee of employees) {
      // Turnos fijos
      const [turnosFijos] = await connection.execute(`
        SELECT dia_semana, tipo_turno
        FROM turnos_fijos_empleado
        WHERE id_empleado = ?
        ORDER BY FIELD(dia_semana, 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo')
      `, [employee.id_empleado]);

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

      employee.turnos_fijos = turnosFijos || [];
      employee.asignaciones = asignaciones || [];
      
      console.log(`   - ${employee.nombre}: ${employee.turnos_fijos.length} turnos fijos, ${employee.asignaciones.length} asignaciones`);
    }

    // 3. Verificar filtro de empleados del servicio (como hace el algoritmo)
    const employeesForService = employees.filter(emp => emp.id_servicio === service.id_servicio);
    console.log(`\n3. FILTRO DE EMPLEADOS:`);
    console.log(`   ✅ Empleados filtrados para servicio ${service.id_servicio}: ${employeesForService.length}`);

    if (employeesForService.length === 0) {
      console.log('   ❌ PROBLEMA: No hay empleados después del filtro!');
      console.log('   🔍 Verificando id_servicio de empleados:');
      employees.forEach(emp => {
        console.log(`      - ${emp.nombre}: id_servicio = ${emp.id_servicio} (tipo: ${typeof emp.id_servicio})`);
      });
      console.log(`   🔍 Servicio buscado: ${service.id_servicio} (tipo: ${typeof service.id_servicio})`);
    } else {
      console.log('   ✅ Empleados disponibles para generación');
    }

    // 4. Simular primer día del algoritmo
    console.log(`\n4. SIMULACIÓN PRIMER DÍA (1 de agosto 2025):`);
    const currentDate = new Date(2025, 7, 1); // 1 de agosto 2025
    const currentDayOfWeekNum = currentDate.getDay(); // 5 = viernes
    const isWeekendDay = currentDayOfWeekNum === 0 || currentDayOfWeekNum === 6;
    
    console.log(`   - Fecha: ${currentDate.toLocaleDateString()}`);
    console.log(`   - Día de semana: ${currentDayOfWeekNum} (${isWeekendDay ? 'Fin de semana' : 'Día laboral'})`);
    
    const staffingNeeds = {
      morning: isWeekendDay ? service.dotacion_objetivo_sab_dom_feriados_mananas : service.dotacion_objetivo_lunes_a_viernes_mananas,
      afternoon: isWeekendDay ? service.dotacion_objetivo_sab_dom_feriados_tardes : service.dotacion_objetivo_lunes_a_viernes_tardes,
      night: service.habilitar_turno_noche ? (isWeekendDay ? service.dotacion_objetivo_sab_dom_feriados_noche : service.dotacion_objetivo_lunes_a_viernes_noche) : 0,
    };
    
    console.log(`   - Necesidades de personal: M:${staffingNeeds.morning}, T:${staffingNeeds.afternoon}, N:${staffingNeeds.night}`);
    
    // Verificar empleados con turnos fijos para este día
    const dayName = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'][currentDayOfWeekNum];
    console.log(`   - Buscando turnos fijos para: ${dayName}`);
    
    const employeesWithFixedShiftToday = employeesForService.filter(emp => 
      emp.turnos_fijos?.some(fs => fs.dia_semana === dayName)
    );
    
    console.log(`   - Empleados con turno fijo hoy: ${employeesWithFixedShiftToday.length}`);
    employeesWithFixedShiftToday.forEach(emp => {
      const fixedShift = emp.turnos_fijos.find(fs => fs.dia_semana === dayName);
      console.log(`     * ${emp.nombre}: ${fixedShift.tipo_turno}`);
    });

    console.log('\n✅ Simulación completada. Los datos parecen estar correctos.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testScheduleGenerationFull();