-- migrate_reservas.sql
-- Script para actualizar la tabla de reservas en cbit_manager
-- Soporte para espacio físico y múltiples equipos

USE cbit_manager;

-- Modificar la estructura de la tabla reservas
ALTER TABLE reservas ADD COLUMN espacio VARCHAR(150) NOT NULL AFTER id;
ALTER TABLE reservas CHANGE equipo equipos_ids TEXT NOT NULL COMMENT 'códigos de equipos reservados (JSON array)';
