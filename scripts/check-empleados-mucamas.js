const mysql = require('mysql2/promise');

async function checkEmpleadosMucamas() {
  console.log('=== VERIFICACIÓN: Empleados del Servicio Mucamas ===\n');
  
  let connection;
  
  try {
    // Usar la configuración correcta de .env.local
    connection = await mysql.createConnection({
      host: '10.175.6.16',
      user: 'root',
      password: 'nokia3189',
      database: 'horarios_des'
    });
    
    console.log('✅ Conectado a la base de datos');

    // 1. Verificar el servicio mucamas
    console.log('\n1. Información del servicio mucamas:');
    const [servicios] = await connection.execute(`
      SELECT * FROM servicios WHERE id_servicio = 1
    `);
    
    if (servicios.length > 0) {
      console.log('✅ Servicio encontrado:');
      console.log(`   ID: ${servicios[0].id_servicio}`);
      console.log(`   Nombre: ${servicios[0].nombre_servicio}`);
    } else {
      console.log('❌ Servicio con ID 1 no encontrado');
      return;
    }

    // 2. Verificar empleados del servicio mucamas
    console.log('\n2. Empleados del servicio mucamas:');
    const [empleados] = await connection.execute(`
      SELECT 
        id_empleado,
        nombre,
        apellido,
        id_servicio,
        activo,
        trabaja_feriados
      FROM empleados 
      WHERE id_servicio = 1
      ORDER BY nombre
    `);
    
    console.log(`Empleados encontrados: ${empleados.length}`);
    
    if (empleados.length > 0) {
      console.log('\n✅ Lista de empleados:');
      empleados.forEach((emp, index) => {
        console.log(`   ${index + 1}. ${emp.nombre} ${emp.apellido || ''}`);
        console.log(`      ID: ${emp.id_empleado}`);
        console.log(`      Activo: ${emp.activo ? 'Sí' : 'No'}`);
        console.log(`      Trabaja feriados: ${emp.trabaja_feriados ? 'Sí' : 'No'}`);
        console.log('');
      });
      
      // 3. Verificar empleados activos
      const empleadosActivos = empleados.filter(emp => emp.activo === 1);
      console.log(`\n3. Empleados activos: ${empleadosActivos.length}`);
      
      if (empleadosActivos.length === 0) {
        console.log('❌ No hay empleados activos en el servicio mucamas');
        console.log('   Esto explicaría por qué la API no devuelve datos');
      } else {
        console.log('✅ Hay empleados activos que deberían aparecer en las preferencias');
      }
      
    } else {
      console.log('❌ No hay empleados asignados al servicio mucamas');
      console.log('   Esto explicaría por qué la API no devuelve datos');
    }

    // 4. Verificar estructura de la tabla empleados
    console.log('\n4. Estructura de la tabla empleados:');
    const [estructura] = await connection.execute('DESCRIBE empleados');
    
    const camposImportantes = ['id_empleado', 'nombre', 'id_servicio', 'activo', 'trabaja_feriados'];
    console.log('Campos importantes:');
    camposImportantes.forEach(campo => {
      const existe = estructura.find(col => col.Field === campo);
      console.log(`   ${campo}: ${existe ? '✅' : '❌'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkEmpleadosMucamas();