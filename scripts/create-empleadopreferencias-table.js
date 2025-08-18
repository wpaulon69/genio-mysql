// Script para crear la tabla empleadopreferencias
console.log('🔧 CREANDO TABLA empleadopreferencias');
console.log('====================================');

const createTableSQL = `
CREATE TABLE IF NOT EXISTS empleadopreferencias (
  id_preferencia INT AUTO_INCREMENT PRIMARY KEY,
  id_empleado INT NOT NULL,
  mes INT NOT NULL,
  anio INT NOT NULL,
  elegible_franco_pos_guardia BOOLEAN DEFAULT FALSE,
  prefiere_trabajar_fines_semana BOOLEAN DEFAULT FALSE,
  disponibilidad_general ENUM('disponible', 'limitado', 'no_disponible') DEFAULT 'disponible',
  restricciones_especificas TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado) ON DELETE CASCADE,
  UNIQUE KEY unique_empleado_mes_anio (id_empleado, mes, anio)
);
`;

console.log('📋 SQL para crear la tabla:');
console.log(createTableSQL);

console.log('\n🎯 INSTRUCCIONES:');
console.log('1. Conectar a MySQL');
console.log('2. Seleccionar la base de datos hospital_management');
console.log('3. Ejecutar el SQL de arriba');

console.log('\n💡 ALTERNATIVA - Usar phpMyAdmin o similar:');
console.log('1. Abrir phpMyAdmin');
console.log('2. Seleccionar base de datos hospital_management');
console.log('3. Ir a SQL tab');
console.log('4. Pegar y ejecutar el SQL');

console.log('\n🔍 VERIFICACIÓN:');
console.log('Después de crear la tabla, ejecutar:');
console.log('DESCRIBE empleadopreferencias;');

console.log('\n📊 ESTRUCTURA ESPERADA:');
const expectedColumns = [
  { Field: 'id_preferencia', Type: 'int(11)', Key: 'PRI' },
  { Field: 'id_empleado', Type: 'int(11)', Key: 'MUL' },
  { Field: 'mes', Type: 'int(11)', Key: '' },
  { Field: 'anio', Type: 'int(11)', Key: '' },
  { Field: 'elegible_franco_pos_guardia', Type: 'tinyint(1)', Key: '' },
  { Field: 'prefiere_trabajar_fines_semana', Type: 'tinyint(1)', Key: '' },
  { Field: 'disponibilidad_general', Type: 'enum(...)', Key: '' },
  { Field: 'restricciones_especificas', Type: 'text', Key: '' },
  { Field: 'fecha_creacion', Type: 'timestamp', Key: '' },
  { Field: 'fecha_actualizacion', Type: 'timestamp', Key: '' }
];

console.table(expectedColumns);

console.log('\n✅ Una vez creada la tabla, el error debería resolverse.');