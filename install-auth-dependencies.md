# Dependencias para el Sistema de Autenticación

Ejecuta estos comandos para instalar las dependencias necesarias:

```bash
# Dependencias principales de autenticación
npm install next-auth bcryptjs

# Tipos de TypeScript
npm install --save-dev @types/bcryptjs

# Ya tienes instalado (verificar en package.json):
# - @hookform/resolvers
# - react-hook-form
# - zod
# - lucide-react
# - @radix-ui/react-* (para componentes UI)
```

## Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env.local`:

```env
NEXTAUTH_URL=http://localhost:9002
NEXTAUTH_SECRET=tu-clave-secreta-super-segura-aqui
```

## Configuración de la Base de Datos

1. Ejecuta el archivo `database/auth_tables.sql` en tu base de datos MySQL
2. Esto creará todas las tablas necesarias para el sistema de autenticación

## Crear Usuario Administrador Inicial

Después de ejecutar las migraciones, puedes crear un usuario administrador inicial ejecutando este SQL:

```sql
-- Crear usuario administrador inicial
INSERT INTO users (email, name, hashed_password, role_id, is_active, must_change_password) 
VALUES (
  'admin@hospital.com', 
  'Administrador Sistema', 
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', -- password: admin123
  'super_admin', 
  TRUE, 
  TRUE
);
```

**Credenciales iniciales:**
- Email: admin@hospital.com  
- Contraseña: admin123
- Deberá cambiar la contraseña en el primer login