// Simulación completa del comportamiento del componente
console.log('=== SIMULACIÓN: Comportamiento del Componente ===\n');

// Estado inicial del componente
let componentState = {
  selectedServiceIdView: undefined,
  services: [
    { id_servicio: 1, nombre_servicio: 'mucamas' },
    { id_servicio: 2, nombre_servicio: 'enfermeria' },
    { id_servicio: 3, nombre_servicio: 'medicina' }
  ],
  serviceInfo: null,
  employees: [],
  schedules: []
};

const mockUser = {
  role: { name: 'admin_hospital' },
  serviceId: null,
  permissions: ['manage_all_services']
};

function hasPermission(user, permission) {
  return user.permissions.includes(permission);
}

function simulateComponentRender() {
  const isJefeServicio = mockUser.role.name === 'jefe_servicio';
  const canManageAllServices = hasPermission(mockUser, 'manage_all_services');
  const targetServiceId = isJefeServicio ? mockUser.serviceId : componentState.selectedServiceIdView;
  
  console.log('🔍 Render del componente:');
  console.log('  selectedServiceIdView:', componentState.selectedServiceIdView);
  console.log('  targetServiceId:', targetServiceId);
  console.log('  canManageAllServices:', canManageAllServices);
  
  // Simular condición para mostrar contenido
  if (!targetServiceId) {
    console.log('  📋 Mostrando: "Selecciona un servicio para ver y gestionar sus horarios"');
    return 'SELECT_SERVICE';
  }
  
  // Simular carga de serviceInfo
  if (targetServiceId) {
    componentState.serviceInfo = componentState.services.find(s => 
      s.id_servicio.toString() === targetServiceId.toString()
    );
    console.log('  📋 serviceInfo cargado:', componentState.serviceInfo?.nombre_servicio);
  }
  
  if (!componentState.serviceInfo) {
    console.log('  📋 Mostrando: "Información del servicio no disponible"');
    return 'SERVICE_INFO_NOT_AVAILABLE';
  }
  
  console.log('  📋 Mostrando: Pestañas Ver/Generar horarios');
  return 'SHOW_TABS';
}

// Simulación paso a paso
console.log('1. Estado inicial:');
const initialResult = simulateComponentRender();
console.log('   Resultado:', initialResult);

console.log('\n2. Usuario selecciona "mucamas":');
componentState.selectedServiceIdView = "1"; // Select devuelve string
const afterSelectionResult = simulateComponentRender();
console.log('   Resultado:', afterSelectionResult);

console.log('\n3. Verificación de queries:');
console.log('   Query services: enabled =', hasPermission(mockUser, 'manage_all_services'));
console.log('   Query serviceInfo: enabled =', !!componentState.selectedServiceIdView);
console.log('   Query employees: enabled =', !!componentState.selectedServiceIdView);

console.log('\n4. Estado final esperado:');
console.log('   ✅ Servicio seleccionado: mucamas');
console.log('   ✅ serviceInfo cargado');
console.log('   ✅ Pestañas visibles');
console.log('   ✅ Puede generar horarios');

console.log('\n=== Fin de la Simulación ===');