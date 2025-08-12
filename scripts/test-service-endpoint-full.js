require('dotenv').config({ path: '.env.local' });

async function testServiceEndpoint() {
  try {
    console.log('🔍 Probando endpoint /api/services/1...');
    
    const response = await fetch('http://localhost:3000/api/services/1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Datos del servicio:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

testServiceEndpoint();