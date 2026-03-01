<?php
require_once __DIR__ . '/db_config.php';
$conn = getConnection();
$hash = password_hash('admin123', PASSWORD_BCRYPT);
$stmt = $conn->prepare("UPDATE usuarios_sistema SET password_hash = ? WHERE usuario = 'admin'");
$stmt->bind_param('s', $hash);
$stmt->execute();
echo "Hash actualizado: " . $hash . "\nFilas afectadas: " . $stmt->affected_rows;
$conn->close();
?>
