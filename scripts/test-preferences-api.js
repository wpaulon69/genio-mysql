// Script para probar la API de preferencias
console.log('=== TEST: API de Preferencias ===\n');

// Simular los parámetros que debería recibir la API
const testParams = {
  month: '7', // julio
  year: '2025',
  serviceId: '1' // mucamas
};

console.log('1. Parámetros de prueba:', testParams);

// Simular la URL que se construiría
const testUrl = `/api/service-management/employees/preferences?month=${testParams.month}&year=${testParams.year}&serviceId=${testParams.serviceId}`;
console.log('2. URL que se construiría:', testUrl);

// Simular la lógica de permisos
const mockUser = {
  role: { name: 'admin_hospital' },
  serviceId: null, // Admin hospital no tiene serviceId fijo
  permissions: ['MANAGE_ALL_EMPLOYEES']
};

function hasPermission(user, permission) {
  return user.permissions.includes(permission);
}

console.log('\n3. Verificación de permisos:');
const canManageAllEmployees = hasPermission(mockUser, 'MANAGE_ALL_EMPLOYEES');
const canManageServiceEmployees = hasPermission(mockUser, 'MANAGE_SERVICE_EMPLOYEES');

console.log('canManageAllEmployees:', canManageAllEmployees);
console.log('canManageServiceEmployees:', canManageServiceEmployees);
console.log('Permisos OK:', canManageAllEmployees || canManageServiceEmployees);

console.log('\n4. Determinación de serviceId:');
let serviceId;
if (canManageAllEmployees && testParams.serviceId) {
  serviceId = parseInt(testParams.serviceId);
  console.log('ServiceId desde parámetros (Admin Hospital):', serviceId);
} else if (mockUser.serviceId) {
  serviceId = mockUser.serviceId;
  console.log('ServiceId del usuario (Jefe Servicio):', serviceId);
} else {
  console.log('❌ No se pudo determinar serviceId');
}

console.log('\n5. Query SQL que se ejecutaría:');
console.log(`
SELECT 
  e.id_empleado,
  e.nombre,
  COALESCE(e.trabaja_feriados, 0) as trabaja_feriados
FROM empleados e
WHERE e.id_servicio = ${serviceId} AND e.activo = 1
ORDER BY e.nombre
`);

console.log('\n6. Estructura de respuesta esperada:');
const mockResponse = [
  {
    id_empleado: 1,
    nombre: 'Juan Pérez',
    trabaja_feriados: true,
    elegible_franco_pos_guardia: false,
    prefiere_trabajar_fines_semana: false,
    disponibilidad_general: 'disponible',
    restricciones_especificas: '',
    mes: 7,
    anio: 2025,
    turnos_fijos: [],
    asignaciones: []
  }
];

console.log(JSON.stringify(mockResponse, null, 2));

console.log('\n7. Posibles problemas:');
console.log('- ❓ Tabla empleados no tiene datos para serviceId 1');
console.log('- ❓ Campo trabaja_feriados no existe en la tabla');
console.log('- ❓ Permisos del usuario no son correctos');
console.log('- ❓ ServiceId no se está pasando correctamente');

console.log('\n=== Fin del Test ===');