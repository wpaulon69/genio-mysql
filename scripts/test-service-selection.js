// Script para simular la lógica de selección de servicios
console.log('=== TEST: Lógica de Selección de Servicios ===\n');

// Simular datos
const mockUser = {
  role: { name: 'admin_hospital' },
  serviceId: null, // Admin hospital no tiene servicio fijo
  permissions: ['manage_all_services', 'manage_all_employees']
};

const mockServices = [
  { id_servicio: 1, nombre_servicio: 'mucamas' },
  { id_servicio: 2, nombre_servicio: 'enfermeria' },
  { id_servicio: 3, nombre_servicio: 'medicina' }
];

// Simular función hasPermission
function hasPermission(user, permission) {
  return user.permissions.includes(permission);
}

// Simular estado del componente
let selectedServiceIdView = undefined;

console.log('1. Estado inicial:');
console.log('selectedServiceIdView:', selectedServiceIdView);

// Simular selección de servicio "mucamas" (id_servicio: 1)
selectedServiceIdView = "1"; // El Select devuelve string
console.log('\n2. Después de seleccionar mucamas:');
console.log('selectedServiceIdView:', selectedServiceIdView);

// Lógica del componente
const isJefeServicio = mockUser.role.name === 'jefe_servicio';
const canManageAllServices = hasPermission(mockUser, 'manage_all_services');
const targetServiceId = isJefeServicio ? mockUser.serviceId : selectedServiceIdView;

console.log('\n3. Lógica del componente:');
console.log('isJefeServicio:', isJefeServicio);
console.log('canManageAllServices:', canManageAllServices);
console.log('targetServiceId:', targetServiceId);

// Verificar si debería mostrar contenido
const shouldShowContent = !!targetServiceId;
console.log('shouldShowContent:', shouldShowContent);

// Simular query de serviceInfo
const serviceInfo = targetServiceId ? mockServices.find(s => s.id_servicio.toString() === targetServiceId) : null;
console.log('serviceInfo:', serviceInfo);

console.log('\n4. Resultado esperado:');
console.log('- Debería mostrar selector de servicios: ✅');
console.log('- Debería permitir seleccionar mucamas: ✅');
console.log('- Debería cargar información del servicio: ✅');
console.log('- Debería mostrar pestañas de Ver/Generar: ✅');

console.log('\n=== Fin del Test ===');