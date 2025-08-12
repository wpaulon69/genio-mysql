require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hospital_schedule',
  port: process.env.MYSQL_PORT || 3306,
};

async function createPreferencesTables() {
  let connection;
  
  try {
    console.log('Configuración de DB:', {
      host: config.host,
      user: config.user,
      database: config.database,
      port: config.port
    });
    
    connection = await mysql.createConnection(config);
    console.log('Conectado a la base de datos');

    // Crear tabla de tipos de asignación
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tipos_asignacion (
        id_tipo_asignacion INT AUTO_INCREMENT PRIMARY KEY,
        nombre_tipo VARCHAR(100) NOT NULL,
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Tabla tipos_asignacion creada');

    // Insertar tipos de asignación básicos
    await connection.execute(`
      INSERT IGNORE INTO tipos_asignacion (id_tipo_asignacion, nombre_tipo, descripcion) VALUES
      (1, 'Licencia Médica', 'Licencia por enfermedad o tratamiento médico'),
      (2, 'Vacaciones', 'Período de vacaciones programadas'),
      (3, 'Licencia Especial', 'Licencia por motivos especiales (matrimonio, fallecimiento, etc.)'),
      (4, 'Capacitación', 'Período de capacitación o entrenamiento'),
      (5, 'Licencia Maternidad/Paternidad', 'Licencia por maternidad o paternidad'),
      (6, 'Suspensión', 'Suspensión temporal de actividades'),
      (7, 'Franco Compensatorio', 'Franco por horas extras o trabajo en feriados')
    `);
    console.log('✓ Tipos de asignación básicos insertados');

    // Crear tabla de turnos fijos por empleado
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS turnos_fijos_empleado (
        id_turno_fijo INT AUTO_INCREMENT PRIMARY KEY,
        id_empleado INT NOT NULL,
        dia_semana ENUM('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo') NOT NULL,
        tipo_turno ENUM('Mañana', 'Tarde', 'Noche', 'Descanso') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado) ON DELETE CASCADE,
        UNIQUE KEY unique_empleado_dia (id_empleado, dia_semana)
      )
    `);
    console.log('✓ Tabla turnos_fijos_empleado creada');

    // Crear tabla de asignaciones especiales por empleado
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS asignaciones_empleado (
        id_asignacion INT AUTO_INCREMENT PRIMARY KEY,
        id_empleado INT NOT NULL,
        id_tipo_asignacion INT NOT NULL,
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE NOT NULL,
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado) ON DELETE CASCADE,
        FOREIGN KEY (id_tipo_asignacion) REFERENCES tipos_asignacion(id_tipo_asignacion)
      )
    `);
    console.log('✓ Tabla asignaciones_empleado creada');

    // Crear índices para mejorar el rendimiento
    try {
      await connection.execute(`CREATE INDEX idx_turnos_fijos_empleado ON turnos_fijos_empleado(id_empleado)`);
    } catch (e) {
      // Índice ya existe
    }
    
    try {
      await connection.execute(`CREATE INDEX idx_asignaciones_empleado ON asignaciones_empleado(id_empleado)`);
    } catch (e) {
      // Índice ya existe
    }
    
    try {
      await connection.execute(`CREATE INDEX idx_asignaciones_fechas ON asignaciones_empleado(fecha_inicio, fecha_fin)`);
    } catch (e) {
      // Índice ya existe
    }
    
    console.log('✓ Índices creados');

    console.log('\n🎉 Todas las tablas de preferencias han sido creadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createPreferencesTables();