<?php
// =====================================================
// CBIT Manager — Configuración de Base de Datos
// =====================================================
define('DB_HOST', '127.0.0.1');
define('DB_PORT', 3306);
define('DB_NAME', 'cbit_manager');
define('DB_USER', 'root');
define('DB_PASS', 'Eddy123.'); // Laragon por defecto: sin contraseña
define('DB_CHARSET', 'utf8mb4');

function getConnection(): mysqli
{
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
    if ($conn->connect_error) {
        http_response_code(503);
        die(json_encode(['error' => 'Error de conexión a la base de datos: ' . $conn->connect_error]));
    }
    $conn->set_charset(DB_CHARSET);
    return $conn;
}
?>
