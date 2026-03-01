<?php
// Test de conexión a la base de datos
$host = '127.0.0.1';
$port = 3306;
$dbname = 'cbit_manager';
$username = 'root';
$password = '';

// Crear conexión
$conn = new mysqli($host, $username, $password, $dbname, $port);

// Verificar conexión
if ($conn->connect_error) {
    echo "Error de conexión: " . $conn->connect_error;
} else {
    echo "Conexión exitosa a MySQL!\n";
    
    // Probar consulta simple
    $result = $conn->query("SHOW TABLES");
    if ($result) {
        echo "Tablas en la base de datos:\n";
        while ($row = $result->fetch_array()) {
            echo "- " . $row[0] . "\n";
        }
    } else {
        echo "Error en consulta: " . $conn->error;
    }
}

$conn->close();
?>
