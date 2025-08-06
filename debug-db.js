// Debug script to test database queries
const mysql = require('mysql2/promise');

const dbConfig = {
  host: '10.175.6.16',
  user: 'root',
  password: 'nokia3189',
  database: 'horarios_des',
  timezone: '+00:00',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function debugQueries() {
  let connection;
  try {
    console.log('🔍 Testing database queries...');
    const pool = mysql.createPool(dbConfig);
    connection = await pool.getConnection();

    // Test basic horarios query
    console.log('📋 Testing horarios table...');
    const result1 = await connection.execute('SELECT * FROM horarios WHERE year = ? AND month = ? AND serviceId = ?', ['2025', '5', '1']);
    console.log('Result type:', typeof result1);
    console.log('Result is array:', Array.isArray(result1));
    console.log('Result length:', result1 ? result1.length : 'undefined');
    console.log('First element type:', result1 && result1[0] ? typeof result1[0] : 'undefined');
    console.log('First element is array:', result1 && result1[0] ? Array.isArray(result1[0]) : 'undefined');
    console.log('First element length:', result1 && result1[0] && Array.isArray(result1[0]) ? result1[0].length : 'undefined');

    if (result1 && result1[0] && Array.isArray(result1[0]) && result1[0].length > 0) {
      const scheduleId = result1[0][0].id;
      console.log('📝 Testing horario_detalles with scheduleId:', scheduleId);

      const result2 = await connection.execute('SELECT * FROM horario_detalles WHERE horario_id = ?', [scheduleId]);
      console.log('Shifts result type:', typeof result2);
      console.log('Shifts result is array:', Array.isArray(result2));
      console.log('Shifts result length:', result2 ? result2.length : 'undefined');

      console.log('🚨 Testing problemashorarios with scheduleId:', scheduleId);
      const result3 = await connection.execute('SELECT * FROM problemashorarios WHERE monthlyScheduleId = ?', [scheduleId]);
      console.log('Violations result type:', typeof result3);
      console.log('Violations result is array:', Array.isArray(result3));
      console.log('Violations result length:', result3 ? result3.length : 'undefined');
    }

    connection.release();
    await pool.end();
    console.log('✅ Debug completed');

  } catch (error) {
    console.error('❌ Debug failed:', error);
    if (connection) {
      connection.release();
    }
  }
}

debugQueries();