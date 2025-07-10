<?php
require_once __DIR__ . '/../_headers.php';

// Allow only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Only POST method allowed."]);
    exit();
}

// Load database connection
require_once '../../includes/db.php';

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);

// Validate input
if (!isset($data['username'], $data['password'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing username or password."]);
    exit();
}

$username = $data['username'];
$password = $data['password'];

// Fetch manager from database
$stmt = $pdo->prepare("SELECT * FROM manager_account WHERE username = ?");
$stmt->execute([$username]);
$manager = $stmt->fetch();

if ($manager && password_verify($password, $manager['password'])) {
    // Regenerate session ID to prevent session fixation
    regenerate_session();
    
    // Login success, set session variables
    $_SESSION['manager_id'] = $manager['manager_id'];
    $_SESSION['manager_username'] = $manager['username'];
    $_SESSION['manager_full_name'] = $manager['full_name'];
    $_SESSION['last_activity'] = time();

    // Optionally update last_login
    $update = $pdo->prepare("UPDATE manager_account SET last_login = NOW() WHERE manager_id = ?");
    $update->execute([$manager['manager_id']]);

    echo json_encode([
        "success" => true,
        "message" => "Login successful.",
        "username" => $manager['username']
    ]);
} else {
    http_response_code(401);
    echo json_encode(["error" => "Invalid username or password."]);
} 