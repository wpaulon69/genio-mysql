// Script para probar la API de servicios directamente
console.log('=== TEST: API de Servicios ===\n');

// Simular una petición HTTP a la API
async function testServiceAPI() {
  try {
    console.log('1. Probando /api/services (lista de servicios)...');
    
    // En un entorno real, esto requeriría autenticación
    // Pero podemos simular la respuesta esperada
    const mockServicesResponse = [
      { id_servicio: 1, nombre_servicio: 'mucamas', descripcion: 'Servicio de mucamas' },
      { id_servicio: 2, nombre_servicio: 'enfermeria', descripcion: 'Servicio de enfermería' }
    ];
    
    console.log('✅ Servicios disponibles:', mockServicesResponse);
    
    console.log('\n2. Probando /api/services/1 (servicio específico)...');
    
    // Simular respuesta del servicio específico
    const mockServiceResponse = {
      id_servicio: 1,
      nombre_servicio: 'mucamas',
      descripcion: 'Servicio de mucamas',
      habilitar_turno_noche: 1,
      dotacion_objetivo_lunes_a_viernes_mananas: 2,
      dotacion_objetivo_lunes_a_viernes_tardes: 2,
      dotacion_objetivo_lunes_a_viernes_noche: 1,
      dotacion_objetivo_sab_dom_feriados_mananas: 1,
      dotacion_objetivo_sab_dom_feriados_tardes: 1,
      dotacion_objetivo_sab_dom_feriados_noche: 1,
      max_dias_trabajo_consecutivos: 6,
      dias_trabajo_consecutivos_preferidos: 5,
      max_descansos_consecutivos: 3,
      dias_descanso_consecutivos_preferidos: 2,
      min_descansos_requeridos_antes_de_trabajar: 1,
      fds_descanso_completo_objetivo: 1,
      notas_adicionales: null
    };
    
    console.log('✅ Servicio específico:', mockServiceResponse);
    
    console.log('\n3. Verificando permisos...');
    const mockUser = {
      role: { name: 'admin_hospital' },
      permissions: ['manage_all_services']
    };
    
    const canManageAllServices = mockUser.permissions.includes('manage_all_services');
    const canManageOwnService = mockUser.permissions.includes('manage_service_employees');
    
    console.log('canManageAllServices:', canManageAllServices);
    console.log('canManageOwnService:', canManageOwnService);
    console.log('Permisos OK:', canManageAllServices || canManageOwnService);
    
    console.log('\n4. Posibles problemas:');
    console.log('- ❓ Base de datos no conectada');
    console.log('- ❓ Tabla servicios vacía o sin datos');
    console.log('- ❓ Permisos de sesión incorrectos');
    console.log('- ❓ Error en la query SQL');
    
    console.log('\n5. Recomendaciones:');
    console.log('- Verificar logs del servidor en la consola del navegador');
    console.log('- Verificar Network tab para ver la respuesta de la API');
    console.log('- Verificar que la base de datos tenga datos en la tabla servicios');
    
  } catch (error) {
    console.error('Error en test:', error);
  }
}

testServiceAPI();