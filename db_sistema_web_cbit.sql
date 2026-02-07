-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         12.1.2-MariaDB - MariaDB Server
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para db_sistema_web_cbit
CREATE DATABASE IF NOT EXISTS `db_sistema_web_cbit` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci */;
USE `db_sistema_web_cbit`;

-- Volcando estructura para tabla db_sistema_web_cbit.actividad
CREATE TABLE IF NOT EXISTS `actividad` (
  `id_actividad` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id_actividad`),
  UNIQUE KEY `id_actividad` (`id_actividad`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Volcando datos para la tabla db_sistema_web_cbit.actividad: ~0 rows (aproximadamente)

-- Volcando estructura para tabla db_sistema_web_cbit.categoria
CREATE TABLE IF NOT EXISTS `categoria` (
  `id_categoria` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Volcando datos para la tabla db_sistema_web_cbit.categoria: ~0 rows (aproximadamente)

-- Volcando estructura para tabla db_sistema_web_cbit.detalle_solicitudes
CREATE TABLE IF NOT EXISTS `detalle_solicitudes` (
  `id_detalle_solicitud` int(11) NOT NULL AUTO_INCREMENT,
  `id_inventario` int(11) DEFAULT NULL,
  `id_solicitud` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_detalle_solicitud`),
  KEY `esta_` (`id_inventario`),
  KEY `tiene` (`id_solicitud`),
  CONSTRAINT `esta_` FOREIGN KEY (`id_inventario`) REFERENCES `inventario` (`id_inventario`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tiene` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitudes` (`id_solicitud`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Volcando datos para la tabla db_sistema_web_cbit.detalle_solicitudes: ~0 rows (aproximadamente)

-- Volcando estructura para tabla db_sistema_web_cbit.equipos
CREATE TABLE IF NOT EXISTS `equipos` (
  `id_equipos` int(11) NOT NULL AUTO_INCREMENT,
  `modelo` varchar(100) NOT NULL,
  `id_categoria` int(11) DEFAULT NULL,
  `id_marca` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_equipos`),
  KEY `posee_` (`id_categoria`),
  KEY `posee` (`id_marca`),
  CONSTRAINT `posee` FOREIGN KEY (`id_marca`) REFERENCES `marca` (`id_marca`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `posee_` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Volcando datos para la tabla db_sistema_web_cbit.equipos: ~0 rows (aproximadamente)

-- Volcando estructura para tabla db_sistema_web_cbit.espacio
CREATE TABLE IF NOT EXISTS `espacio` (
  `id_espacio` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(1000) NOT NULL,
  PRIMARY KEY (`id_espacio`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Volcando datos para la tabla db_sistema_web_cbit.espacio: ~0 rows (aproximadamente)

-- Volcando estructura para tabla db_sistema_web_cbit.horario
CREATE TABLE IF NOT EXISTS `horario` (
  `id_horario` int(11) NOT NULL AUTO_INCREMENT,
  `id_solicitud` int(11) DEFAULT NULL,
  `dia_semana` enum('Lunes','Martes','Miercoles','Jueves','Viernes') NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_final` time NOT NULL,
  PRIMARY KEY (`id_horario`),
  KEY `esta_anexado` (`id_solicitud`),
  CONSTRAINT `esta_anexado` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitudes` (`id_solicitud`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Volcando datos para la tabla db_sistema_web_cbit.horario: ~0 rows (aproximadamente)

-- Volcando estructura para tabla db_sistema_web_cbit.inventario
CREATE TABLE IF NOT EXISTS `inventario` (
  `id_inventario` int(11) NOT NULL AUTO_INCREMENT,
  `id_equipos` int(11) DEFAULT NULL,
  `id_ubicacion_fisica` int(11) DEFAULT NULL,
  `serial` varchar(50) NOT NULL,
  `estado` enum('Operativo','No operativo','Mantenimiento') NOT NULL,
  PRIMARY KEY (`id_inventario`),
  UNIQUE KEY `serial` (`serial`),
  KEY `estan_agregados` (`id_equipos`),
  KEY `tienè` (`id_ubicacion_fisica`),
  CONSTRAINT `estan_agregados` FOREIGN KEY (`id_equipos`) REFERENCES `equipos` (`id_equipos`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tienè` FOREIGN KEY (`id_ubicacion_fisica`) REFERENCES `ubicacion_fisica` (`id_ubicacion_fisica`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Volcando datos para la tabla db_sistema_web_cbit.inventario: ~0 rows (aproximadamente)

-- Volcando estructura para tabla db_sistema_web_cbit.mantenimiento
CREATE TABLE IF NOT EXISTS `mantenimiento` (
  `id_mantenimiento` int(11) NOT NULL AUTO_INCREMENT,
  `id_inventario` int(11) DEFAULT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `fecha_reporte` datetime NOT NULL,
  `fecha_resolucion` datetime DEFAULT NULL,
  `tipo` enum('Preventivo','Correctivo','Incidencia') NOT NULL,
  `descripicon_falla` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id_mantenimiento`),
  KEY `sele_realiza` (`id_inventario`),
  KEY `hace_solicitudes` (`id_usuario`),
  CONSTRAINT `hace_solicitudes` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `sele_realiza` FOREIGN KEY (`id_inventario`) REFERENCES `inventario` (`id_inventario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Volcando datos para la tabla db_sistema_web_cbit.mantenimiento: ~0 rows (aproximadamente)

-- Volcando estructura para tabla db_sistema_web_cbit.marca
CREATE TABLE IF NOT EXISTS `marca` (
  `id_marca` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id_marca`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Volcando datos para la tabla db_sistema_web_cbit.marca: ~0 rows (aproximadamente)

-- Volcando estructura para tabla db_sistema_web_cbit.persona
CREATE TABLE IF NOT EXISTS `persona` (
  `id_persona` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `cedula` varchar(20) NOT NULL,
  `telefono` varchar(40) NOT NULL,
  PRIMARY KEY (`id_persona`),
  UNIQUE KEY `cedula` (`cedula`),
  UNIQUE KEY `telefono` (`telefono`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Volcando datos para la tabla db_sistema_web_cbit.persona: ~3 rows (aproximadamente)
INSERT INTO `persona` (`id_persona`, `nombre`, `apellido`, `cedula`, `telefono`) VALUES
	(1, 'Administrador', 'Sistema', 'V12345678', '0412-1234567'),
	(2, 'María', 'González', 'V87654321', '0414-7654321'),
	(5, 'Eddy', 'Pacheco', '31394074', '04242016422');

-- Volcando estructura para tabla db_sistema_web_cbit.sesiones
CREATE TABLE IF NOT EXISTS `sesiones` (
  `id_sesion` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `activa` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id_sesion`),
  KEY `fk_usuario_sesion` (`id_usuario`),
  CONSTRAINT `fk_usuario_sesion` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Volcando datos para la tabla db_sistema_web_cbit.sesiones: ~1 rows (aproximadamente)
INSERT INTO `sesiones` (`id_sesion`, `id_usuario`, `token`, `fecha_inicio`, `fecha_fin`, `ip_address`, `activa`) VALUES
	(1, 5, '959d96835064a89085efbe8d9559bac7538b9c8aff542f3b6ea190161fd9ebed', '2026-02-03 23:16:41', NULL, '::1', 1);

-- Volcando estructura para tabla db_sistema_web_cbit.solicitudes
CREATE TABLE IF NOT EXISTS `solicitudes` (
  `id_solicitud` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) DEFAULT NULL,
  `id_espacio` int(11) DEFAULT NULL,
  `id_actividad` int(11) DEFAULT NULL,
  `fecha` datetime NOT NULL,
  `estado` enum('Aprobado','Pendiente','Cancelado') NOT NULL,
  PRIMARY KEY (`id_solicitud`),
  KEY `realiza` (`id_usuario`),
  KEY `esta_asignado` (`id_espacio`),
  KEY `tiene_` (`id_actividad`),
  CONSTRAINT `esta_asignado` FOREIGN KEY (`id_espacio`) REFERENCES `espacio` (`id_espacio`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `realiza` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tiene_` FOREIGN KEY (`id_actividad`) REFERENCES `actividad` (`id_actividad`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Volcando datos para la tabla db_sistema_web_cbit.solicitudes: ~0 rows (aproximadamente)

-- Volcando estructura para tabla db_sistema_web_cbit.ubicacion_fisica
CREATE TABLE IF NOT EXISTS `ubicacion_fisica` (
  `id_ubicacion_fisica` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id_ubicacion_fisica`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Volcando datos para la tabla db_sistema_web_cbit.ubicacion_fisica: ~0 rows (aproximadamente)
INSERT INTO `ubicacion_fisica` (`id_ubicacion_fisica`, `nombre`) VALUES
	(2, 'ALMACEN DE EQUIPOS');

-- Volcando estructura para tabla db_sistema_web_cbit.usuario
CREATE TABLE IF NOT EXISTS `usuario` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `id_persona` int(11) DEFAULT NULL,
  `nombre_usuario` varchar(50) NOT NULL,
  `contrasena_usuario` varchar(50) NOT NULL,
  `correo` varchar(50) NOT NULL,
  `estado` enum('Activo','Inactivo','Bloqueado') NOT NULL DEFAULT 'Activo',
  `roles` enum('Administrador','Docente') NOT NULL DEFAULT 'Administrador',
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `nombre_usuario` (`nombre_usuario`),
  UNIQUE KEY `correo` (`correo`),
  KEY `puede_ser` (`id_persona`),
  CONSTRAINT `puede_ser` FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Volcando datos para la tabla db_sistema_web_cbit.usuario: ~3 rows (aproximadamente)
INSERT INTO `usuario` (`id_usuario`, `id_persona`, `nombre_usuario`, `contrasena_usuario`, `correo`, `estado`, `roles`) VALUES
	(5, 5, 'eddy_19', 'eddy_19', 'eddy15pacheco@gmail.com', 'Activo', 'Administrador'),
	(10, 1, 'admin', 'admin123', 'admin@cbit.edu.ve', 'Activo', 'Administrador'),
	(11, 2, 'docente', 'docente123', 'docente@cbit.edu.ve', 'Activo', 'Docente');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
