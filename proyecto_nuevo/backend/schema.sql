-- =====================================================
-- CBIT Manager — Schema SQL
-- Base de datos: cbit_manager
-- Compatible con: MariaDB / MySQL
-- =====================================================

CREATE DATABASE IF NOT EXISTS cbit_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cbit_manager;

-- ==============================
-- TABLA: usuarios (sistema)
-- ==============================
CREATE TABLE IF NOT EXISTS usuarios_sistema (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(150) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    rol         VARCHAR(60)  NOT NULL DEFAULT 'Administrador',
    estado      VARCHAR(20)  NOT NULL DEFAULT 'Activo',
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insertar usuario administrador por defecto
INSERT IGNORE INTO usuarios_sistema (nombre, email, rol, estado)
VALUES ('Administrador CBIT', 'admin@cbit.com', 'Administrador', 'Activo');

-- ==============================
-- TABLA: ingresos
-- ==============================
CREATE TABLE IF NOT EXISTS ingresos (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    tipo      VARCHAR(50)  NOT NULL COMMENT 'Estudiante | Docente | Personal CBIT',
    cedula    VARCHAR(20)  NOT NULL,
    nombre    VARCHAR(150) NOT NULL,
    motivo    VARCHAR(255),
    hora      TIME         NOT NULL DEFAULT (CURRENT_TIME()),
    fecha     DATE         NOT NULL DEFAULT (CURRENT_DATE()),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==============================
-- TABLA: equipos
-- ==============================
CREATE TABLE IF NOT EXISTS equipos (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    codigo   VARCHAR(30)  NOT NULL UNIQUE,
    modelo   VARCHAR(150) NOT NULL,
    marca    VARCHAR(80),
    estado   VARCHAR(30)  NOT NULL DEFAULT 'Operativo' COMMENT 'Operativo | En Reparación | Dañado | Baja',
    fecha    DATE NOT NULL DEFAULT (CURRENT_DATE()),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modificado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Sample data
INSERT IGNORE INTO equipos (codigo, modelo, marca, estado) VALUES
('CBIT-LAP-01', 'HP ProBook G8',      'HP',     'Operativo'),
('CBIT-PC-05',  'ThinkCentre M920',   'Lenovo', 'En Reparación'),
('CBIT-LAP-04', 'Latitude 5510',      'Dell',   'Dañado');

-- ==============================
-- TABLA: reservas
-- ==============================
CREATE TABLE IF NOT EXISTS reservas (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    equipo     VARCHAR(30)  NOT NULL,
    usuario    VARCHAR(150) NOT NULL,
    inicio     DATETIME     NOT NULL,
    fin        DATETIME     NOT NULL,
    proposito  VARCHAR(255),
    estado     VARCHAR(20)  NOT NULL DEFAULT 'Activa' COMMENT 'Activa | Finalizada',
    creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==============================
-- TABLA: soporte_tecnico
-- ==============================
CREATE TABLE IF NOT EXISTS soporte_tecnico (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    cedula      VARCHAR(20)  NOT NULL,
    nombre      VARCHAR(150) NOT NULL,
    empresa     VARCHAR(150),
    fecha       DATE         NOT NULL,
    tipo        VARCHAR(100) NOT NULL,
    descripcion TEXT,
    equipos_ids TEXT COMMENT 'códigos de equipos intervenidos (JSON array)',
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==============================
-- TABLA: actividad (log)
-- ==============================
CREATE TABLE IF NOT EXISTS actividad_log (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    mensaje   VARCHAR(255) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
