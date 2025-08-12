const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function createTestEmployees() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });

  try {
    console.log('🔧 Creando empleados de prueba sin servicio asignado...\n');

    // Empleados para probar asignaciones
    const testEmployees = [
      {
        nombre: 'Ana Martinez',
        email: 'ana.martinez@hospital.com',
        trabaja_feriados: 1,
        elegible_franco_pos_guardia: 0,
        prefiere_trabajar_fines_semana: 1
      },
      {
        nombre: 'Carlos Rodriguez',
        email: 'carlos.rodriguez@hospital.com',
        trabaja_feriados: 0,
        elegible_franco_pos_guardia: 1,
        prefiere_trabajar_fines_semana: 0
      },
      {
        nombre: 'Sofia Herrera',
        email: 'sofia.herrera@hospital.com',
        trabaja_feriados: 1,
        elegible_franco_pos_guardia: 1,
        prefiere_trabajar_fines_semana: 1
      },
      {
        nombre: 'Luis Gonzalez',
        email: 'luis.gonzalez@hospital.com',
        trabaja_feriados: 0,
        elegible_franco_pos_guardia: 0,
        prefiere_trabajar_fines_semana: 0
      }
    ];

    for (const employee of testEmployees) {
      // Verificar si ya existe
      const [existing] = await connection.execute(`
        SELECT id_empleado FROM empleados WHERE email_empleado = ?
      `, [employee.email]);

      if (existing.length === 0) {
        await connection.execute(`
          INSERT INTO empleados (
            id_servicio, 
            nombre, 
            email_empleado, 
            elegible_franco_pos_guardia,
            prefiere_trabajar_fines_semana,
            trabaja_feriados
          ) VALUES (0, ?, ?, ?, ?, ?)
        `, [
          employee.nombre,
          employee.email,
          employee.elegible_franco_pos_guardia,
          employee.prefiere_trabajar_fines_semana,
          employee.trabaja_feriados
        ]);

        console.log(`✅ Creado: ${employee.nombre} (${employee.email})`);
      } else {
        console.log(`⚠️  Ya existe: ${employee.nombre} (${employee.email})`);
      }
    }

    console.log('\n🎯 Creando jefe de servicio para Cocina...');

    // Crear usuario jefe de servicio para Cocina
    const [existingUser] = await connection.execute(`
      SELECT id FROM users WHERE email = ?
    `, ['jefe.cocina@hospital.com']);

    if (existingUser.length === 0) {
      const userId = 'jefe-cocina-001';
      const hashedPassword = '$2a$12$8K1p/a0drtOzwNuiD4.a4.BQ9QmjfVVdElHiGf5HiRvfi5wUBRWyG'; // Cocina2025!

      await connection.execute(`
        INSERT INTO users (
          id, email, name, hashed_password, role_id, service_id, is_active, must_change_password
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        'jefe.cocina@hospital.com',
        'Chef María González',
        hashedPassword,
        'jefe_servicio',
        2, // ID del servicio Cocina
        1,
        1
      ]);

      console.log('✅ Creado: Chef María González (jefe.cocina@hospital.com)');
      console.log('🔑 Contraseña: Cocina2025!');
    } else {
      console.log('⚠️  Ya existe jefe de cocina');
    }

    console.log('\n📊 Estado final:');
    
    // Mostrar empleados sin servicio
    const [unassigned] = await connection.execute(`
      SELECT nombre, email_empleado 
      FROM empleados 
      WHERE id_servicio IS NULL 
      ORDER BY nombre
    `);

    console.log(`\n🆓 Empleados sin servicio (${unassigned.length}):`);
    unassigned.forEach(emp => {
      console.log(`  - ${emp.nombre} (${emp.email_empleado})`);
    });

    // Mostrar jefes de servicio
    const [chiefs] = await connection.execute(`
      SELECT u.name, u.email, s.nombre_servicio
      FROM users u
      JOIN servicios s ON u.service_id = s.id_servicio
      WHERE u.role_id = 'jefe_servicio' AND u.is_active = 1
      ORDER BY s.nombre_servicio
    `);

    console.log(`\n👨‍⚕️ Jefes de servicio (${chiefs.length}):`);
    chiefs.forEach(chief => {
      console.log(`  - ${chief.name} (${chief.email}) → ${chief.nombre_servicio}`);
    });

    console.log('\n🎉 ¡Datos de prueba creados exitosamente!');
    console.log('\n🎯 Para probar:');
    console.log('1. Login como Claudia Alamo: calamo@hospital.com');
    console.log('2. Login como Chef María: jefe.cocina@hospital.com / Cocina2025!');
    console.log('3. Ir a /service-management');
    console.log('4. Probar asignación de empleados');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

createTestEmployees();