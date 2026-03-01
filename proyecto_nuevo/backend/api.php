<?php
// =====================================================
// CBIT Manager — API REST (backend/api.php)
// =====================================================
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/db_config.php';

$conn = getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    switch ($method) {
        case 'GET':
            handleGet($action, $conn);
            break;
        case 'POST':
            handlePost($action, $data, $conn);
            break;
        case 'PUT':
            handlePut($action, $data, $conn);
            break;
        case 'DELETE':
            handleDelete($action, $conn);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
    }
}
catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error interno: ' . $e->getMessage()]);
}
$conn->close();


// =====================================================
// ============  GET  ==================================
// =====================================================
function handleGet(string $action, mysqli $conn): void
{
    switch ($action) {

        /* ---------- INGRESOS ---------- */
        case 'ingresos':
            $fecha = $_GET['fecha'] ?? date('Y-m-d');
            $stmt = $conn->prepare(
                "SELECT id, tipo, cedula, nombre, motivo,
                        TIME_FORMAT(hora,'%H:%i') AS hora,
                        DATE_FORMAT(fecha,'%d/%m/%Y') AS fecha
                 FROM ingresos WHERE fecha = ? ORDER BY hora DESC"
            );
            $stmt->bind_param('s', $fecha);
            $stmt->execute();
            echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
            break;

        /* ---------- EQUIPOS ---------- */
        case 'equipos':
            $q = '%' . ($conn->escape_string($_GET['q'] ?? '')) . '%';
            $stmt = $conn->prepare(
                "SELECT id, codigo, modelo, marca, estado,
                        DATE_FORMAT(fecha,'%d/%m/%Y') AS fecha
                 FROM equipos WHERE codigo LIKE ? OR modelo LIKE ? OR marca LIKE ?
                 ORDER BY codigo"
            );
            $stmt->bind_param('sss', $q, $q, $q);
            $stmt->execute();
            echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
            break;

        /* ---------- RESERVAS ---------- */
        case 'reservas':
            $result = $conn->query(
                "SELECT id, equipo, usuario,
                        DATE_FORMAT(inicio,'%Y-%m-%dT%H:%i') AS inicio,
                        DATE_FORMAT(fin,'%Y-%m-%dT%H:%i') AS fin,
                        proposito, estado
                 FROM reservas ORDER BY inicio DESC"
            );
            echo json_encode($result->fetch_all(MYSQLI_ASSOC));
            break;

        /* ---------- SOPORTE ---------- */
        case 'soporte':
            $result = $conn->query(
                "SELECT id, cedula, nombre, empresa,
                        DATE_FORMAT(fecha,'%Y-%m-%d') AS fecha,
                        tipo, descripcion, equipos_ids
                 FROM soporte_tecnico ORDER BY creado_en DESC"
            );
            $rows = $result->fetch_all(MYSQLI_ASSOC);
            // Decodificar JSON de equipos_ids
            foreach ($rows as &$r) {
                $r['equipos'] = json_decode($r['equipos_ids'] ?? '[]', true);
                unset($r['equipos_ids']);
            }
            echo json_encode($rows);
            break;

        /* ---------- HISTORIAL de un equipo ---------- */
        case 'historial':
            $codigo = $_GET['codigo'] ?? '';
            $stmt = $conn->prepare(
                "SELECT nombre, empresa,
                        DATE_FORMAT(fecha,'%d/%m/%Y') AS fecha,
                        tipo, descripcion
                 FROM soporte_tecnico
                 WHERE JSON_CONTAINS(equipos_ids, JSON_QUOTE(?))
                 ORDER BY fecha DESC"
            );
            $stmt->bind_param('s', $codigo);
            $stmt->execute();
            echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
            break;

        /* ---------- USUARIOS sistema ---------- */
        case 'usuarios':
            $result = $conn->query(
                "SELECT u.id, u.nombre_completo as nombre, u.identificacion as cedula, u.email, u.nom_usuario as usuario, r.nombre as rol, u.estado,
                        DATE_FORMAT(u.created_at,'%d/%m/%Y') AS creado_en
                 FROM usuarios u
                 LEFT JOIN roles r ON u.rol_id = r.id
                 ORDER BY u.created_at DESC"
            );
            echo json_encode($result->fetch_all(MYSQLI_ASSOC));
            break;

        /* ---------- ROLES ---------- */
        case 'roles':
            $result = $conn->query("SELECT id, nombre FROM roles ORDER BY id ASC");
            echo json_encode($result->fetch_all(MYSQLI_ASSOC));
            break;

        /* ---------- ESTADÍSTICAS dashboard ---------- */
        case 'stats':
            $hoy = date('Y-m-d');
            $ing = $conn->query("SELECT COUNT(*) AS n FROM ingresos WHERE fecha = '$hoy'")->fetch_assoc()['n'];
            $rep = $conn->query("SELECT COUNT(*) AS n FROM equipos WHERE estado = 'En Reparación'")->fetch_assoc()['n'];
            $res = $conn->query("SELECT COUNT(*) AS n FROM reservas WHERE estado = 'Activa'")->fetch_assoc()['n'];
            $acts = $conn->query("SELECT mensaje, DATE_FORMAT(creado_en,'%d/%m/%Y %H:%i') AS tiempo FROM actividad_log ORDER BY creado_en DESC LIMIT 10")->fetch_all(MYSQLI_ASSOC);
            echo json_encode(compact('ing', 'rep', 'res', 'acts'));
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Acción GET no reconocida: ' . $action]);
    }
}


// =====================================================
// ============  POST  =================================
// =====================================================
function handlePost(string $action, array $data, mysqli $conn): void
{
    switch ($action) {

        /* ---------- NUEVO INGRESO ---------- */
        case 'ingreso':
            if (empty($data['cedula']) || empty($data['nombre'])) {
                http_response_code(422);
                echo json_encode(['error' => 'Cédula y nombre son requeridos']);
                return;
            }
            $stmt = $conn->prepare(
                "INSERT INTO ingresos (tipo, cedula, nombre, motivo, hora, fecha)
                 VALUES (?, ?, ?, ?, CURRENT_TIME(), CURRENT_DATE())"
            );
            $stmt->bind_param('ssss', $data['tipo'], $data['cedula'], $data['nombre'], $data['motivo']);
            if ($stmt->execute()) {
                logActividad("Ingreso registrado: {$data['tipo']} {$data['nombre']}", $conn);
                echo json_encode(['success' => true, 'id' => $stmt->insert_id]);
            }
            else {
                errSQL($stmt);
            }
            break;

        /* ---------- NUEVO EQUIPO ---------- */
        case 'equipo':
            if (empty($data['codigo']) || empty($data['modelo'])) {
                http_response_code(422);
                echo json_encode(['error' => 'Código y modelo son requeridos']);
                return;
            }
            $stmt = $conn->prepare(
                "INSERT INTO equipos (codigo, modelo, marca, estado, fecha)
                 VALUES (?, ?, ?, ?, CURRENT_DATE())"
            );
            $stmt->bind_param('ssss', $data['codigo'], $data['modelo'], $data['marca'], $data['estado']);
            if ($stmt->execute()) {
                logActividad("Equipo añadido: {$data['codigo']} ({$data['modelo']})", $conn);
                echo json_encode(['success' => true, 'id' => $stmt->insert_id]);
            }
            else {
                errSQL($stmt);
            }
            break;

        /* ---------- NUEVA RESERVA ---------- */
        case 'reserva':
            if (empty($data['espacio']) || empty($data['usuario']) || empty($data['inicio']) || empty($data['fin'])) {
                http_response_code(422);
                echo json_encode(['error' => 'Espacio, usuario, inicio y fin son requeridos']);
                return;
            }
            $equiposJson = json_encode($data['equipos'] ?? []);
            $stmt = $conn->prepare(
                "INSERT INTO reservas (espacio, equipos_ids, usuario, inicio, fin, proposito, estado)
                 VALUES (?, ?, ?, ?, ?, ?, 'Activa')"
            );
            $stmt->bind_param('ssssss', $data['espacio'], $equiposJson, $data['usuario'], $data['inicio'], $data['fin'], $data['proposito']);
            if ($stmt->execute()) {
                $eqs = implode(', ', $data['equipos'] ?? ['(sin equipo)']);
                logActividad("Reserva en {$data['espacio']}: {$eqs} → {$data['usuario']}", $conn);
                echo json_encode(['success' => true, 'id' => $stmt->insert_id]);
            }
            else {
                errSQL($stmt);
            }
            break;

        /* ---------- NUEVO SOPORTE ---------- */
        case 'soporte':
            if (empty($data['cedula']) || empty($data['nombre'])) {
                http_response_code(422);
                echo json_encode(['error' => 'Cédula y nombre del técnico son requeridos']);
                return;
            }
            $equiposJson = json_encode($data['equipos'] ?? []);
            $stmt = $conn->prepare(
                "INSERT INTO soporte_tecnico (cedula, nombre, empresa, fecha, tipo, descripcion, equipos_ids)
                 VALUES (?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->bind_param('sssssss',
                $data['cedula'], $data['nombre'], $data['empresa'],
                $data['fecha'], $data['tipo'], $data['descripcion'], $equiposJson
            );
            if ($stmt->execute()) {
                $eqs = implode(', ', $data['equipos'] ?? ['(no especificado)']);
                logActividad("Soporte: {$data['nombre']} intervino {$eqs}", $conn);
                echo json_encode(['success' => true, 'id' => $stmt->insert_id]);
            }
            else {
                errSQL($stmt);
            }
            break;

        /* ---------- NUEVO USUARIO ---------- */
        case 'usuario':
            if (empty($data['nombre']) || empty($data['email']) || empty($data['usuario']) || empty($data['cedula'])) {
                http_response_code(422);
                echo json_encode(['error' => 'Nombre, email, usuario y cédula son requeridos']);
                return;
            }
            $usuario = $data['usuario'];
            $passHash = !empty($data['password']) ? password_hash($data['password'], PASSWORD_BCRYPT) : password_hash('12345678', PASSWORD_BCRYPT);
            $cedula = $data['cedula'];
            $rol_id = $data['rol_id'] ?? 1; // Default a administrador si no se pasa
            $estado = strtolower($data['estado'] ?? 'activo');

            $stmt = $conn->prepare(
                "INSERT INTO usuarios (identificacion, nombre_completo, nom_usuario, email, rol_id, estado, password_hash)
                 VALUES (?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->bind_param('ssssiss', $cedula, $data['nombre'], $usuario, $data['email'], $rol_id, $estado, $passHash);
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'id' => $stmt->insert_id]);
            }
            else {
                errSQL($stmt);
            }
            break;

        /* ---------- LOGIN ---------- */
        case 'login':
            if (empty($data['usuario']) || empty($data['password'])) {
                http_response_code(422);
                echo json_encode(['error' => 'Usuario y contraseña son requeridos']);
                return;
            }
            $stmt = $conn->prepare(
                "SELECT u.id, u.nombre_completo as nombre, u.email, r.nombre as rol, u.estado, u.nom_usuario as usuario, u.password_hash
                 FROM usuarios u LEFT JOIN roles r ON u.rol_id = r.id WHERE u.nom_usuario = ?"
            );
            $stmt->bind_param('s', $data['usuario']);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();

            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'Usuario no encontrado.']);
                return;
            }
            if (strtolower($user['estado']) !== 'activo') {
                http_response_code(403);
                echo json_encode(['error' => 'Tu cuenta está inactiva. Contacta al administrador.']);
                return;
            }
            // Verificación dual: soporta hash (bcrypt) y texto plano (legacy)
            $passOk = password_verify($data['password'], $user['password_hash']) || ($data['password'] === $user['password_hash']);

            if (!$passOk) {
                http_response_code(401);
                echo json_encode(['error' => 'Contraseña incorrecta.']);
                return;
            }
            unset($user['password_hash']);
            logActividad("Inicio de sesión: {$user['nombre']}", $conn);
            echo json_encode(['success' => true, 'user' => $user]);
            break;

        /* ---------- RECUPERAR CONTRASEÑA ---------- */
        case 'recover':
            if (empty($data['cedula']) || empty($data['email'])) {
                http_response_code(422);
                echo json_encode(['error' => 'Cédula y correo son requeridos.']);
                return;
            }
            $stmt = $conn->prepare(
                "SELECT id, nombre_completo as nombre FROM usuarios WHERE identificacion = ? AND email = ? AND estado = 'activo'"
            );
            $stmt->bind_param('ss', $data['cedula'], $data['email']);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result->num_rows > 0) {
                // En producción aquí se enviaría un correo real
                echo json_encode(['success' => true, 'message' => 'Identidad verificada. Las instrucciones de recuperación han sido enviadas a tu correo electrónico.']);
            }
            else {
                http_response_code(404);
                echo json_encode(['error' => 'No se encontró una cuenta activa con esa cédula y correo.']);
            }
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Acción POST no reconocida: ' . $action]);
    }
}


// =====================================================
// ============  PUT  ==================================
// =====================================================
function handlePut(string $action, array $data, mysqli $conn): void
{
    switch ($action) {

        /* ---------- EDITAR EQUIPO ---------- */
        case 'equipo':
            if (empty($data['id'])) {
                http_response_code(422);
                echo json_encode(['error' => 'ID requerido']);
                return;
            }
            $stmt = $conn->prepare(
                "UPDATE equipos SET codigo=?, modelo=?, marca=?, estado=?, fecha=CURRENT_DATE() WHERE id=?"
            );
            $stmt->bind_param('ssssi', $data['codigo'], $data['modelo'], $data['marca'], $data['estado'], $data['id']);
            if ($stmt->execute()) {
                echo json_encode(['success' => true]);
            }
            else {
                errSQL($stmt);
            }
            break;

        /* ---------- FINALIZAR RESERVA ---------- */
        case 'reserva_finalizar':
            if (empty($data['id'])) {
                http_response_code(422);
                echo json_encode(['error' => 'ID requerido']);
                return;
            }
            $stmt = $conn->prepare("UPDATE reservas SET estado='Finalizada' WHERE id=?");
            $stmt->bind_param('i', $data['id']);
            if ($stmt->execute()) {
                echo json_encode(['success' => true]);
            }
            else {
                errSQL($stmt);
            }
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Acción PUT no reconocida: ' . $action]);
    }
}


// =====================================================
// ============  DELETE  ===============================
// =====================================================
function handleDelete(string $action, mysqli $conn): void
{
    $id = intval($_GET['id'] ?? 0);
    if (!$id) {
        http_response_code(422);
        echo json_encode(['error' => 'ID requerido']);
        return;
    }

    $tableMap = [
        'ingreso' => 'ingresos',
        'equipo' => 'equipos',
        'reserva' => 'reservas',
        'soporte' => 'soporte_tecnico',
        'usuario' => 'usuarios',
    ];

    if (!isset($tableMap[$action])) {
        http_response_code(400);
        echo json_encode(['error' => 'Acción DELETE no reconocida: ' . $action]);
        return;
    }

    $table = $tableMap[$action];
    $stmt = $conn->prepare("DELETE FROM `$table` WHERE id = ?");
    $stmt->bind_param('i', $id);
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    }
    else {
        errSQL($stmt);
    }
}


// =====================================================
// ============  HELPERS  ==============================
// =====================================================
function logActividad(string $msg, mysqli $conn): void
{
    $stmt = $conn->prepare("INSERT INTO actividad_log (mensaje) VALUES (?)");
    $stmt->bind_param('s', $msg);
    $stmt->execute();
}

function errSQL(mysqli_stmt $stmt): void
{
    http_response_code(500);
    echo json_encode(['error' => 'Error SQL: ' . $stmt->error]);
}
?>
