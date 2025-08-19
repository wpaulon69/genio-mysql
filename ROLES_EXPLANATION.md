# 📋 EXPLICACIÓN DE ROLES DEL SISTEMA

## 🏥 Contexto del Sistema
Este es un sistema de gestión de horarios para un **hospital**, donde se organizan turnos de trabajo para diferentes servicios (como mucamas, cocina, enfermería, etc.).

## 👥 ROLES Y JERARQUÍA

### 1. 🔧 **Super Administrador** (Nivel 1)
- **Quién es**: Desarrollador o administrador técnico del sistema
- **Acceso**: TOTAL - Puede hacer todo en el sistema
- **Responsabilidades**:
  - Configurar el sistema
  - Gestionar todos los usuarios
  - Acceso a configuraciones técnicas
  - Resolver problemas del sistema

### 2. 🏥 **Administrador Hospital** (Nivel 2)
- **Quién es**: Director o administrador general del hospital
- **Acceso**: Gestión completa del hospital (todos los servicios)
- **Responsabilidades**:
  - Gestionar usuarios de todos los servicios
  - Ver reportes de todo el hospital
  - Aprobar cambios importantes
  - Gestionar feriados y configuraciones generales

### 3. 👨‍⚕️ **Jefe de Servicio** (Nivel 3) ⭐
- **Quién es**: **Jefe de un servicio específico** (ej: Jefe de Mucamas, Jefe de Cocina)
- **Acceso**: Solo SU servicio asignado
- **Responsabilidades**:
  - Gestionar empleados de SU servicio únicamente
  - Crear y modificar horarios de SU servicio
  - Aprobar cambios de turno de SU equipo
  - Ver reportes de SU servicio
  - **NO puede ver otros servicios**

**Ejemplo práctico:**
- Juan es "Jefe de Servicio" asignado al servicio "Mucamas"
- Puede gestionar solo a los empleados de mucamas
- NO puede ver ni modificar nada de "Cocina"
- Puede crear horarios solo para mucamas

### 4. 👷 **Supervisor** (Nivel 4)
- **Quién es**: Supervisor de turno o encargado de área
- **Acceso**: Ver información de su servicio, solicitar cambios
- **Responsabilidades**:
  - Ver empleados y horarios de su servicio
  - Solicitar cambios de turno
  - Solicitar intercambios con otros empleados
  - **NO puede aprobar cambios**

### 4. 👤 **Empleado** (Nivel 4)
- **Quién es**: Empleado regular (mucama, cocinero, etc.)
- **Acceso**: Solo su información personal
- **Responsabilidades**:
  - Ver su propio horario
  - Solicitar intercambios de turno
  - Ver su información personal
  - **NO puede ver otros empleados**

## 🔄 FLUJO DE TRABAJO TÍPICO

### Ejemplo: Servicio de Mucamas
```
1. Admin Hospital crea el servicio "Mucamas"
2. Admin Hospital crea usuario "Jefe de Mucamas" (rol: Jefe de Servicio)
3. Admin Hospital asigna al "Jefe de Mucamas" al servicio "Mucamas"
4. Jefe de Mucamas puede:
   - Crear empleados de mucamas
   - Hacer horarios para mucamas
   - Aprobar cambios de turno de mucamas
   - NO puede tocar el servicio "Cocina"
```

## 🎯 ¿POR QUÉ EXISTE EL ROL "JEFE DE SERVICIO"?

### Problema que resuelve:
- **Descentralización**: No todo debe pasar por el Admin Hospital
- **Especialización**: Cada servicio tiene sus propias reglas
- **Autonomía**: Cada jefe maneja su equipo independientemente
- **Seguridad**: Un jefe no puede afectar otros servicios

### Ejemplo Real:
```
🏥 Hospital San Juan tiene:
├── 🧹 Servicio Mucamas (20 empleados)
│   └── 👨‍💼 Jefe: Carlos Martínez
├── 🍳 Servicio Cocina (15 empleados)
│   └── 👩‍💼 Jefe: Ana López
└── 🩺 Servicio Enfermería (30 empleados)
    └── 👨‍⚕️ Jefe: Dr. Pérez

Carlos (Jefe Mucamas) puede:
✅ Gestionar horarios de mucamas
✅ Aprobar cambios de turno de mucamas
❌ NO puede ver empleados de cocina
❌ NO puede modificar horarios de enfermería
```

## 🔧 CONFIGURACIÓN RECOMENDADA

### Para crear un Jefe de Servicio:
1. **Crear usuario** con rol "Jefe de Servicio"
2. **Asignar servicio** específico (ej: "Mucamas")
3. **El sistema automáticamente** limita su acceso a ese servicio

### Permisos automáticos:
- ✅ Gestionar empleados de SU servicio
- ✅ Crear horarios de SU servicio
- ✅ Aprobar cambios de SU servicio
- ❌ NO puede ver otros servicios
- ❌ NO puede crear usuarios del sistema

## 💡 RESUMEN SIMPLE

**"Jefe de Servicio" = Jefe de un departamento específico del hospital**

- Es como ser "jefe de mucamas" o "jefe de cocina"
- Solo puede gestionar SU departamento
- No puede meterse en otros departamentos
- Tiene autonomía para manejar su equipo
- Es el nivel intermedio entre Admin Hospital y Empleados