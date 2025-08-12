const fetch = require('node-fetch');

async function testAdminAPIs() {
  const baseUrl = 'http://localhost:9002';
  
  console.log('🧪 Probando APIs de administración...\n');

  try {
    // Test API de roles
    console.log('📋 Probando API de roles...');
    const rolesResponse = await fetch(`${baseUrl}/api/admin/roles`);
    console.log(`Status: ${rolesResponse.status}`);
    if (rolesResponse.ok) {
      const roles = await rolesResponse.json();
      console.log(`✅ Roles encontrados: ${roles.length}`);
      roles.forEach(role => {
        console.log(`  - ${role.displayName} (Nivel ${role.level})`);
      });
    } else {
      console.log('❌ Error en API de roles');
    }

    console.log('\n🏥 Probando API de servicios...');
    const servicesResponse = await fetch(`${baseUrl}/api/services`);
    console.log(`Status: ${servicesResponse.status}`);
    if (servicesResponse.ok) {
      const services = await servicesResponse.json();
      console.log(`✅ Servicios encontrados: ${services.length}`);
      services.forEach(service => {
        console.log(`  - ${service.nombre_servicio}`);
      });
    } else {
      console.log('❌ Error en API de servicios');
    }

    console.log('\n👥 Probando API de empleados...');
    const employeesResponse = await fetch(`${baseUrl}/api/employees`);
    console.log(`Status: ${employeesResponse.status}`);
    if (employeesResponse.ok) {
      const employees = await employeesResponse.json();
      console.log(`✅ Empleados encontrados: ${employees.length}`);
      employees.slice(0, 3).forEach(employee => {
        console.log(`  - ${employee.nombre} (${employee.email})`);
      });
    } else {
      console.log('❌ Error en API de empleados');
    }

    console.log('\n👤 Probando API de usuarios...');
    const usersResponse = await fetch(`${baseUrl}/api/admin/users`);
    console.log(`Status: ${usersResponse.status}`);
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log(`✅ Usuarios encontrados: ${users.length}`);
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.role.displayName}`);
      });
    } else {
      console.log('❌ Error en API de usuarios');
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testAdminAPIs();