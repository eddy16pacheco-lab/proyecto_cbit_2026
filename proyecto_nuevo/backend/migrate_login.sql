-- Migración: Agregar campos de autenticación a usuarios_sistema
-- Compatible con MySQL 8.x

-- Verificar y agregar columnas nuevas
SET @exist_usuario = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='cbit_manager' AND TABLE_NAME='usuarios_sistema' AND COLUMN_NAME='usuario');
SET @sql_usr = IF(@exist_usuario = 0, 'ALTER TABLE usuarios_sistema ADD COLUMN usuario VARCHAR(60) UNIQUE AFTER email', 'SELECT 1');
PREPARE stmt FROM @sql_usr; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_pass = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='cbit_manager' AND TABLE_NAME='usuarios_sistema' AND COLUMN_NAME='password_hash');
SET @sql_pass = IF(@exist_pass = 0, 'ALTER TABLE usuarios_sistema ADD COLUMN password_hash VARCHAR(255) AFTER usuario', 'SELECT 1');
PREPARE stmt FROM @sql_pass; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_ced = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='cbit_manager' AND TABLE_NAME='usuarios_sistema' AND COLUMN_NAME='cedula');
SET @sql_ced = IF(@exist_ced = 0, 'ALTER TABLE usuarios_sistema ADD COLUMN cedula VARCHAR(20) AFTER nombre', 'SELECT 1');
PREPARE stmt FROM @sql_ced; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Actualizar admin con credenciales por defecto (contraseña: admin123)
UPDATE usuarios_sistema
SET usuario      = 'admin',
    password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    cedula        = '00000000'
WHERE email = 'admin@cbit.com';
