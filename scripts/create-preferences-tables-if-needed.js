const mysql = require('mysql2/promise');

async function createPreferencesTablesIfNeeded() {
  console.log('🔧 Verificando y creando tablas de preferencias si es necesario...');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'horarios_des'
  });

  try {
    // Verificar si las columnas de preferencias existen en la tabla empleados
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM empleados LIKE 'trabaja_feriados'
    `);

    if (columns.length === 0) {
      console.log('📝 Agregando columnas de preferencias a la tabla empleados...');
      
      await connection.execute(`
        ALTER TABLE empleados 
        ADD COLUMN trabaja_feriados BOOLEAN DEFAULT FALSE,
        ADD COLUMN elegible_franco_pos_guardia BOOLEAN DEFAULT FALSE,
        ADD COLUMN prefiere_trabajar_fines_semana BOOLEAN DEFAULT FALSE,
        ADD COLUMN disponibilidad_general TEXT,
        ADD COLUMN restricciones_especificas TEXT
      `);
      
      console.log('✅ Columnas de preferencias agregadas a empleados');
    } else {
      console.log('✅ Columnas de preferencias ya existen en empleados');
    }

    // Verificar si existe la tabla turnos_fijos_empleado
    const [turnosFijosTable] = await connection.execute(`
      SHOW TABLES LIKE 'turnos_fijos_empleado'
    `);

    if (turnosFijosTable.length === 0) {
      console.log('📝 Creando tabla turnos_fijos_empleado...');
      
      await connection.execute(`
        CREATE TABLE turnos_fijos_empleado (
          id_turno_fijo INT AUTO_INCREMENT PRIMARY KEY,
          id_empleado INT NOT NULL,
          dia_semana INT NOT NULL COMMENT '0=Domingo, 1=Lunes, ..., 6=Sábado',
          tipo_turno VARCHAR(10) NOT NULL COMMENT 'M=Mañana, T=Tarde, N=Noche',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado) ON DELETE CASCADE,
          UNIQUE KEY unique_empleado_dia (id_empleado, dia_semana)
        )
      `);
      
      console.log('✅ Tabla turnos_fijos_empleado creada');
    } else {
      console.log('✅ Tabla turnos_fijos_empleado ya existe');
    }

    // Verificar si existe la tabla tipos_asignacion
    const [tiposAsignacionTable] = await connection.execute(`
      SHOW TABLES LIKE 'tipos_asignacion'
    `);

    if (tiposAsignacionTable.length === 0) {
      console.log('📝 Creando tabla tipos_asignacion...');
      
      await connection.execute(`
        CREATE TABLE tipos_asignacion (
          id_tipo_asignacion INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          descripcion TEXT,
          color VARCHAR(7) DEFAULT '#6B7280',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insertar tipos de asignación por defecto
      await connection.execute(`
        INSERT INTO tipos_asignacion (nombre, descripcion, color) VALUES
        ('Vacaciones', 'Período de vacaciones del empleado', '#10B981'),
        ('Licencia Médica', 'Licencia por motivos médicos', '#EF4444'),
        ('Capacitación', 'Período de capacitación o entrenamiento', '#3B82F6'),
        ('Licencia Personal', 'Licencia por motivos personales', '#F59E0B'),
        ('Suspensión', 'Período de suspensión', '#6B7280')
      `);
      
      console.log('✅ Tabla tipos_asignacion creada con datos por defecto');
    } else {
      console.log('✅ Tabla tipos_asignacion ya existe');
    }

    // Verificar si existe la tabla asignaciones_empleado
    const [asignacionesTable] = await connection.execute(`
      SHOW TABLES LIKE 'asignaciones_empleado'
    `);

    if (asignacionesTable.length === 0) {
      console.log('📝 Creando tabla asignaciones_empleado...');
      
      await connection.execute(`
        CREATE TABLE asignaciones_empleado (
          id_asignacion INT AUTO_INCREMENT PRIMARY KEY,
          id_empleado INT NOT NULL,
          id_tipo_asignacion INT NOT NULL,
          fecha_inicio DATE NOT NULL,
          fecha_fin DATE NULL,
          descripcion TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado) ON DELETE CASCADE,
          FOREIGN KEY (id_tipo_asignacion) REFERENCES tipos_asignacion(id_tipo_asignacion)
        )
      `);
      
      console.log('✅ Tabla asignaciones_empleado creada');
    } else {
      console.log('✅ Tabla asignaciones_empleado ya existe');
    }

    console.log('');
    console.log('🎉 Verificación y creación de tablas completada');
    console.log('');
    console.log('📊 Tablas de preferencias disponibles:');
    console.log('- empleados (con columnas de preferencias)');
    console.log('- turnos_fijos_empleado');
    console.log('- tipos_asignacion');
    console.log('- asignaciones_empleado');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

createPreferencesTablesIfNeeded();