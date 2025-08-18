// Script simple para probar la API de preferencias
console.log('🔍 TESTING PREFERENCES API');
console.log('==========================');

// Simular una petición a la API
const testApiCall = async () => {
  try {
    console.log('\n1️⃣ Probando estructura de URL:');
    const month = '7';
    const year = '2025';
    const url = `/api/service-management/employees/preferences?month=${month}&year=${year}`;
    console.log('URL:', url);
    
    console.log('\n2️⃣ Parámetros esperados:');
    console.log('- month:', month);
    console.log('- year:', year);
    console.log('- serviceId: (del usuario en sesión)');
    
    console.log('\n3️⃣ Posibles problemas:');
    console.log('❌ Usuario sin sesión válida');
    console.log('❌ Usuario sin serviceId asignado');
    console.log('❌ Permisos insuficientes');
    console.log('❌ Error en consulta SQL');
    console.log('❌ Tablas no existen');
    
    console.log('\n4️⃣ Verificaciones necesarias:');
    console.log('✅ Verificar que el usuario Jefe Servicio tenga serviceId');
    console.log('✅ Verificar que existan empleados en ese servicio');
    console.log('✅ Verificar que las tablas existan');
    console.log('✅ Verificar permisos MANAGE_SERVICE_EMPLOYEES');
    
    console.log('\n5️⃣ Próximos pasos:');
    console.log('1. Verificar logs del servidor');
    console.log('2. Verificar Network tab en DevTools');
    console.log('3. Verificar datos de sesión');
    console.log('4. Verificar estructura de base de datos');
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testApiCall();