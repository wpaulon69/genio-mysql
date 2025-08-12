// Script para crear usuarios de demostración
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: '10.175.6.16',
  user: 'root',
  password: 'nokia3189',
  database: 'horarios_des',
  timezone: '+00:00'
};

// Función para generar UUID compatible con MySQL 5
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function createDemoUsers() {
  let connection;
  
  try {
    console.log('👥 CREANDO USUARIOS DE DEMOSTRACIÓN...\n');
    
    connection = await mysql.createConnection(dbConfig);
    
    const demoUsers = [
      {
        name: 'Dr. María González',
        email: 'admin.hospital@hospital.com',
        password: 'Hospital2025!',
        roleId: 'admin_hospital',
        serviceId: null,
        employeeId: null
      },
      {
        name: 'Dr. Carlos Martínez',
        email: 'jefe.mucamas@hospital.com',
        password: 'Mucamas2025!',
        roleId: 'jefe_servicio',
        serviceId: 1, // mucamas
        employeeId: 1 // Alamo
      },
      {
        name: 'Enf. Ana López',
        email: 'supervisor.cocina@hospital.com',
        password: 'Cocina2025!',
        roleId: 'supervisor',
        serviceId: 2, // Cocina
        employeeId: 2 // Forni
      },
      {
        name: 'Juan Pérez',
        email: 'empleado.test@hospital.com',
        password: 'Empleado2025!',
        roleId: 'empleado',
        serviceId: 1, // mucamas
        employeeId: 3 // Godoy
      }
    ];
    
    for (const user of demoUsers) {
      try {
        const userId = generateUUID();
        const hashedPassword = await bcrypt.hash(user.password, 12);
        
        await connection.execute(`
          INSERT INTO users (
            id, email, name, hashed_password, role_id, service_id, employee_id, 
            is_active, must_change_password, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, NOW())
        `, [
          userId,
          user.email,
          user.name,
          hashedPassword,
          user.roleId,
          user.serviceId,
          user.employeeId
        ]);
        
        console.log(`  ✅ Usuario creado: ${user.name}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Contraseña: ${user.password}`);
        console.log(`     Rol: ${user.roleId}`);
        console.log('');
        
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`  ⚠️ Usuario ya existe: ${user.email}`);
        } else {
          console.log(`  ❌ Error creando ${user.email}:`, error.message);
        }
      }
    }
    
    // Verificar usuarios creados
    console.log('🔍 VERIFICANDO USUARIOS CREADOS...\n');
    const [users] = await connection.execute(`
      SELECT 
        u.name, u.email, ur.display_name as role, 
        s.nombre_servicio as service, e.nombre as employee
      FROM users u
      JOIN user_roles ur ON u.role_id = ur.id
      LEFT JOIN servicios s ON u.service_id = s.id_servicio
      LEFT JOIN empleados e ON u.employee_id = e.id_empleado
      ORDER BY ur.level ASC, u.name ASC
    `);
    
    console.log('📋 USUARIOS EN EL SISTEMA:');
    users.forEach(user => {
      console.log(`  👤 ${user.name} (${user.email})`);
      console.log(`     Rol: ${user.role}`);
      console.log(`     Servicio: ${user.service || 'Sin asignar'}`);
      console.log(`     Empleado: ${user.employee || 'Sin vincular'}`);
      console.log('');
    });
    
    console.log('🎉 USUARIOS DE DEMOSTRACIÓN CREADOS EXITOSAMENTE');
    console.log('\n📝 CREDENCIALES PARA PRUEBAS:');
    console.log('   Super Admin: admin@shiftflow.com / ShiftFlow2025!');
    console.log('   Admin Hospital: admin.hospital@hospital.com / Hospital2025!');
    console.log('   Jefe Servicio: jefe.mucamas@hospital.com / Mucamas2025!');
    console.log('   Supervisor: supervisor.cocina@hospital.com / Cocina2025!');
    console.log('   Empleado: empleado.test@hospital.com / Empleado2025!');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createDemoUsers();