-- Crear tabla empleadopreferencias para el sistema de gestión hospitalaria
-- Esta tabla almacena las preferencias específicas de empleados por mes/año

USE hospital_management;

-- Crear tabla empleadopreferencias
CREATE TABLE IF NOT EXISTS empleadopreferencias (
  id_preferencia INT AUTO_INCREMENT PRIMARY KEY,
  id_empleado INT NOT NULL,
  mes INT NOT NULL CHECK (mes >= 1 AND mes <= 12),
  anio INT NOT NULL CHECK (anio >= 2020 AND anio <= 2050),
  elegible_franco_pos_guardia BOOLEAN DEFAULT FALSE COMMENT 'Si el empleado puede tener franco después de guardia',
  prefiere_trabajar_fines_semana BOOLEAN DEFAULT FALSE COMMENT 'Si el empleado prefiere trabajar fines de semana',
  disponibilidad_general ENUM('disponible', 'limitado', 'no_disponible') DEFAULT 'disponible' COMMENT 'Disponibilidad general del empleado',
  restricciones_especificas TEXT COMMENT 'Restricciones específicas del empleado para el mes',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Claves foráneas
  FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado) ON DELETE CASCADE,
  
  -- Índices
  UNIQUE KEY unique_empleado_mes_anio (id_empleado, mes, anio),
  INDEX idx_mes_anio (mes, anio),
  INDEX idx_empleado (id_empleado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Preferencias específicas de empleados por mes/año';

-- Insertar algunos datos de ejemplo (opcional)
-- Puedes descomentar estas líneas si quieres datos de prueba

/*
INSERT IGNORE INTO empleadopreferencias (id_empleado, mes, anio, elegible_franco_pos_guardia, prefiere_trabajar_fines_semana, disponibilidad_general, restricciones_especificas) 
SELECT 
  e.id_empleado,
  8 as mes,
  2025 as anio,
  FALSE as elegible_franco_pos_guardia,
  FALSE as prefiere_trabajar_fines_semana,
  'disponible' as disponibilidad_general,
  NULL as restricciones_especificas
FROM empleados e 
WHERE e.id_servicio = (SELECT id_servicio FROM servicios WHERE nombre_servicio = 'mucamas')
LIMIT 3;
*/

-- Verificar que la tabla se creó correctamente
SELECT 'Tabla empleadopreferencias creada exitosamente' as resultado;

-- Mostrar estructura de la tabla
DESCRIBE empleadopreferencias;