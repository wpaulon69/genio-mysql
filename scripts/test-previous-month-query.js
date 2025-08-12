require('dotenv').config({ path: '.env.local' });

async function testPreviousMonthQuery() {
  try {
    console.log('🔍 Probando consulta del mes anterior...\n');

    // Simular la consulta que hace el componente para mayo 2025, servicio 1
    const prevYear = 2025;
    const prevMonth = 5;
    const serviceId = 1;
    
    const url = `http://localhost:3000/api/monthlySchedules?year=${prevYear}&month=${prevMonth}&serviceId=${serviceId}&status=published`;
    console.log(`📡 URL: ${url}`);
    
    const response = await fetch(url);
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Respuesta exitosa: ${data.length} horarios encontrados`);
      
      if (data.length > 0) {
        const schedule = data[0];
        console.log(`📋 Horario encontrado:`);
        console.log(`   - Nombre: ${schedule.horario_nombre}`);
        console.log(`   - Estado: ${schedule.status}`);
        console.log(`   - Servicio: ${schedule.serviceName} (ID: ${schedule.serviceId})`);
        console.log(`   - Período: ${schedule.month}/${schedule.year}`);
        console.log(`   - Turnos: ${schedule.shifts ? schedule.shifts.length : 0}`);
        
        if (schedule.shifts && schedule.shifts.length > 0) {
          console.log(`\n📅 Primeros 5 turnos del mes anterior:`);
          schedule.shifts.slice(0, 5).forEach(shift => {
            console.log(`   - ${shift.date}: ${shift.employeeName} - ${shift.notes || 'Sin notas'}`);
          });
        }
      } else {
        console.log('⚠️  No se encontraron horarios publicados para mayo 2025');
      }
    } else {
      const error = await response.text();
      console.log(`❌ Error: ${error}`);
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

testPreviousMonthQuery();