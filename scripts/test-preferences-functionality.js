require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function testPreferencesData() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('Conectado a la base de datos');

    // Verificar empleados existentes
    const [empleados] = await connection.execute(`
      SELECT id_empleado, nombre, id_servicio 
      FROM empleados 
      WHERE id_servicio IS NOT NULL 
      LIMIT 5
    `);
    
    console.log('\n📋 Empleados con servicio asignado:');
    empleados.forEach(emp => {
      console.log(`- ${emp.nombre} (ID: ${emp.id_empleado}, Servicio: ${emp.id_servicio})`);
    });

    // Verificar tipos de asignación
    const [tipos] = await connection.execute(`
      SELECT id_tipo_asignacion, nombre_tipo 
      FROM tipos_asignacion
    `);
    
    console.log('\n🏷️ Tipos de asignación disponibles:');
    tipos.forEach(tipo => {
      console.log(`- ${tipo.nombre_tipo} (ID: ${tipo.id_tipo_asignacion})`);
    });

    // Verificar jefes de servicio
    const [jefes] = await connection.execute(`
      SELECT u.id, u.name, u.email, u.role_id, u.service_id
      FROM users u
      WHERE u.role_id = 2 AND u.service_id IS NOT NULL
    `);
    
    console.log('\n👨‍⚕️ Jefes de servicio:');
    jefes.forEach(jefe => {
      console.log(`- ${jefe.name} (${jefe.email}) - Servicio: ${jefe.service_id}`);
    });

    // Crear datos de prueba si hay empleados
    if (empleados.length > 0) {
      const empleadoPrueba = empleados[0];
      
      // Insertar turnos fijos de prueba
      await connection.execute(`
        INSERT IGNORE INTO turnos_fijos_empleado (id_empleado, dia_semana, tipo_turno)
        VALUES 
        (?, 'Lunes', 'Mañana'),
        (?, 'Martes', 'Mañana'),
        (?, 'Miercoles', 'Mañana'),
        (?, 'Jueves', 'Mañana'),
        (?, 'Viernes', 'Mañana')
      `, [empleadoPrueba.id_empleado, empleadoPrueba.id_empleado, empleadoPrueba.id_empleado, empleadoPrueba.id_empleado, empleadoPrueba.id_empleado]);
      
      // Insertar asignación de prueba
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() + 7); // Una semana desde hoy
      const fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaFin.getDate() + 3); // 3 días de duración
      
      await connection.execute(`
        INSERT IGNORE INTO asignaciones_empleado (id_empleado, id_tipo_asignacion, fecha_inicio, fecha_fin, descripcion)
        VALUES (?, 2, ?, ?, 'Vacaciones de prueba')
      `, [empleadoPrueba.id_empleado, fechaInicio.toISOString().split('T')[0], fechaFin.toISOString().split('T')[0]]);
      
      console.log(`\n✅ Datos de prueba creados para ${empleadoPrueba.nombre}`);
    }

    console.log('\n🎉 Verificación completada exitosamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('1. Inicia sesión como jefe de servicio');
    console.log('2. Ve a "Gestión de Empleados"');
    console.log('3. Haz clic en el ícono de calendario para editar preferencias');
    console.log('4. Prueba las plantillas y asignaciones especiales');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testPreferencesData();