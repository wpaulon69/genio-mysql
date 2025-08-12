// Script para probar la API de horarios directamente
const fetch = require('node-fetch');

async function testSchedulesAPI() {
  try {
    console.log('🔍 Probando API de horarios...');
    
    // Simular la llamada que hace el frontend
    const url = 'http://localhost:9002/api/monthlySchedules?year=2025&month=5&serviceId=1';
    console.log('URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('❌ Error en la respuesta:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Respuesta recibida');
    console.log('📊 Número de horarios:', data.length);
    
    if (data.length > 0) {
      const schedule = data[0];
      console.log('\n📅 Primer horario:');
      console.log('- ID:', schedule.id);
      console.log('- Nombre:', schedule.horario_nombre);
      console.log('- Status:', schedule.status);
      console.log('- Score:', schedule.score);
      console.log('- Shifts:', schedule.shifts?.length || 'undefined');
      
      if (schedule.shifts && schedule.shifts.length > 0) {
        console.log('\n🔄 Primeros 3 turnos:');
        schedule.shifts.slice(0, 3).forEach((shift, i) => {
          console.log(`${i+1}.`, {
            employeeName: shift.employeeName,
            date: shift.date,
            startTime: shift.startTime,
            endTime: shift.endTime,
            notes: shift.notes
          });
        });
      } else {
        console.log('❌ No hay turnos en el horario');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSchedulesAPI();