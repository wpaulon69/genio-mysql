// Script para debuggear la sesión de autenticación
console.log('=== DEBUG: Sesión de Autenticación ===\n');

// Simular lo que debería devolver useAuth
const mockSession = {
  user: {
    id: "1",
    email: "admin@hospital.com", 
    name: "Admin Hospital",
    role: {
      id: "admin_hospital",
      name: "admin_hospital",
      displayName: "Administrador Hospital",
      level: 2,
      permissions: [
        "manage_all_services",
        "manage_all_employees", 
        "manage_all_schedules",
        "view_all_services",
        "view_all_employees",
        "view_all_schedules",
        "approve_shift_changes",
        "view_all_reports",
        "manage_holidays",
        "manage_users"
      ]
    },
    serviceId: null, // Admin hospital no tiene servicio fijo
    employeeId: null,
    permissions: [
      "manage_all_services",
      "manage_all_employees", 
      "manage_all_schedules",
      "view_all_services",
      "view_all_employees",
      "view_all_schedules",
      "approve_shift_changes",
      "view_all_reports",
      "manage_holidays",
      "manage_users"
    ],
    mustChangePassword: false
  }
};

console.log('Estructura esperada de la sesión:');
console.log(JSON.stringify(mockSession, null, 2));

console.log('\n=== Verificaciones ===');
console.log('¿Tiene role?', !!mockSession.user.role);
console.log('¿Tiene role.name?', !!mockSession.user.role?.name);
console.log('¿Es admin_hospital?', mockSession.user.role?.name === 'admin_hospital');
console.log('¿Tiene serviceId?', mockSession.user.serviceId);
console.log('¿Puede gestionar todos los servicios?', mockSession.user.permissions.includes('manage_all_services'));

console.log('\n=== Lógica del componente ===');
const isJefeServicio = mockSession.user.role?.name === 'jefe_servicio';
const canManageAllServices = mockSession.user.permissions.includes('manage_all_services');

console.log('isJefeServicio:', isJefeServicio);
console.log('canManageAllServices:', canManageAllServices);
console.log('targetServiceId (admin):', isJefeServicio ? mockSession.user.serviceId : 'selectedServiceIdView');

console.log('\n=== Fin del Debug ===');