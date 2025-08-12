require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function setupJefeServicioUser() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('🔧 Configurando usuario Jefe de Servicio...');

    await connection.beginTransaction();

    // 1. Verificar/crear el permiso MANAGE_SERVICE_EMPLOYEES
    const [existingPerm] = await connection.execute(`
      SELECT id FROM permissions WHERE name = 'MANAGE_SERVICE_EMPLOYEES'
    `);

    let permissionId;
    if (existingPerm.length === 0) {
      const [permResult] = await connection.execute(`
        INSERT INTO permissions (name, description) 
        VALUES ('MANAGE_SERVICE_EMPLOYEES', 'Gestionar empleados del servicio')
      `);
      permissionId = permResult.insertId;
      console.log('✅ Permiso MANAGE_SERVICE_EMPLOYEES creado');
    } else {
      permissionId = existingPerm[0].id;
      console.log('✅ Permiso MANAGE_SERVICE_EMPLOYEES ya existe');
    }

    // 2. Asignar el permiso al rol de jefe de servicio (role_id = 2)
    const [existingRolePerm] = await connection.execute(`
      SELECT * FROM role_permissions WHERE role_id = 2 AND permission_id = ?
    `, [permissionId]);

    if (existingRolePerm.length === 0) {
      await connection.execute(`
        INSERT INTO role_permissions (role_id, permission_id) 
        VALUES (2, ?)
      `, [permissionId]);
      console.log('✅ Permiso asignado al rol Jefe de Servicio');
    } else {
      console.log('✅ Permiso ya estaba asignado al rol');
    }

    // 3. Crear/actualizar usuario de prueba
    const [existingUser] = await connection.execute(`
      SELECT id FROM users WHERE email = 'jefe@mucamas.com'
    `);

    if (existingUser.length === 0) {
      await connection.execute(`
        INSERT INTO users (name, email, role_id, service_id) 
        VALUES ('Jefe Mucamas', 'jefe@mucamas.com', 2, 1)
      `);
      console.log('✅ Usuario jefe de servicio creado');
    } else {
      await connection.execute(`
        UPDATE users 
        SET role_id = 2, service_id = 1 
        WHERE email = 'jefe@mucamas.com'
      `);
      console.log('✅ Usuario jefe de servicio actualizado');
    }

    await connection.commit();

    // 4. Verificar la configuración
    const [finalCheck] = await connection.execute(`
      SELECT 
        u.name,
        u.email,
        u.role_id,
        u.service_id,
        s.nombre_servicio
      FROM users u
      LEFT JOIN servicios s ON u.service_id = s.id_servicio
      WHERE u.email = 'jefe@mucamas.com'
    `);

    if (finalCheck.length > 0) {
      const user = finalCheck[0];
      console.log('\n🎉 Configuración completada:');
      console.log(`- Usuario: ${user.name} (${user.email})`);
      console.log(`- Role ID: ${user.role_id}`);
      console.log(`- Service ID: ${user.service_id}`);
      console.log(`- Servicio: ${user.nombre_servicio}`);
    }

    console.log('\n📝 Para probar:');
    console.log('1. Inicia sesión con: jefe@mucamas.com');
    console.log('2. Ve a /service-management/schedules');
    console.log('3. Selecciona mayo 2025 y carga horarios');
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupJefeServicioUser();