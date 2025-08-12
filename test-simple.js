const http = require('http');

function testAPI(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 9002,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Probando APIs...\n');

  try {
    // Test roles API
    console.log('📋 Probando /api/admin/roles...');
    const rolesResult = await testAPI('/api/admin/roles');
    console.log(`Status: ${rolesResult.status}`);
    if (rolesResult.status === 401) {
      console.log('❌ No autorizado - necesita login');
    } else if (rolesResult.status === 200) {
      console.log('✅ API funcionando');
    }

    // Test services API
    console.log('\n🏥 Probando /api/services...');
    const servicesResult = await testAPI('/api/services');
    console.log(`Status: ${servicesResult.status}`);
    if (servicesResult.status === 401) {
      console.log('❌ No autorizado - necesita login');
    } else if (servicesResult.status === 200) {
      console.log('✅ API funcionando');
    }

    // Test employees API
    console.log('\n👥 Probando /api/employees...');
    const employeesResult = await testAPI('/api/employees');
    console.log(`Status: ${employeesResult.status}`);
    if (employeesResult.status === 401) {
      console.log('❌ No autorizado - necesita login');
    } else if (employeesResult.status === 200) {
      console.log('✅ API funcionando');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runTests();