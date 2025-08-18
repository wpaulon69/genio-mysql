// Script para probar la corrección de permisos
console.log('=== TEST: Corrección de Permisos ===\n');

// Simular la función hasPermission
const PERMISSIONS = {
  MANAGE_ALL_SERVICES: 'MANAGE_ALL_SERVICES',
  MANAGE_SERVICE_EMPLOYEES: 'MANAGE_SERVICE_EMPLOYEES'
};

const ROLE_PERMISSIONS = {
  admin_hospital: [
    'MANAGE_USERS',
    'MANAGE_ALL_SERVICES',      // ✅ Este es el permiso correcto
    'MANAGE_ALL_EMPLOYEES',
    'VIEW_ALL_SERVICES',
    'VIEW_ALL_EMPLOYEES',
    'VIEW_ALL_REPORTS',
    'MANAGE_HOLIDAYS',
    'APPROVE_SHIFT_CHANGES',
    'VIEW_SERVICE_SCHEDULES',
    'VIEW_OWN_PROFILE'
  ]
};

function hasPermission(user, permission) {
  if (!user?.role?.name) return false;
  const rolePermissions = ROLE_PERMISSIONS[user.role.name];
  return rolePermissions?.includes(permission) || false;
}

// Simular usuario admin hospital
const mockUser = {
  role: { name: 'admin_hospital' },
  permissions: ROLE_PERMISSIONS.admin_hospital
};

console.log('1. Usuario simulado:', mockUser.role.name);
console.log('2. Permisos del rol:', ROLE_PERMISSIONS.admin_hospital);

console.log('\n3. Pruebas de permisos:');

// Prueba con nombres incorrectos (minúsculas) - ANTES
const testIncorrect1 = hasPermission(mockUser, 'manage_all_services');
const testIncorrect2 = hasPermission(mockUser, 'manage_service_employees');
console.log('❌ manage_all_services (minúsculas):', testIncorrect1);
console.log('❌ manage_service_employees (minúsculas):', testIncorrect2);

// Prueba con nombres correctos (mayúsculas) - DESPUÉS
const testCorrect1 = hasPermission(mockUser, 'MANAGE_ALL_SERVICES');
const testCorrect2 = hasPermission(mockUser, 'MANAGE_SERVICE_EMPLOYEES');
console.log('✅ MANAGE_ALL_SERVICES (mayúsculas):', testCorrect1);
console.log('✅ MANAGE_SERVICE_EMPLOYEES (mayúsculas):', testCorrect2);

console.log('\n4. Resultado esperado en la API:');
const canManageAllServices = hasPermission(mockUser, 'MANAGE_ALL_SERVICES');
const canManageOwnService = hasPermission(mockUser, 'MANAGE_SERVICE_EMPLOYEES');

console.log('canManageAllServices:', canManageAllServices);
console.log('canManageOwnService:', canManageOwnService);
console.log('Acceso permitido:', canManageAllServices || canManageOwnService);

if (canManageAllServices || canManageOwnService) {
  console.log('\n✅ ÉXITO: El usuario admin hospital debería poder acceder a /api/services/1');
} else {
  console.log('\n❌ ERROR: El usuario admin hospital NO puede acceder');
}

console.log('\n=== Fin del Test ===');