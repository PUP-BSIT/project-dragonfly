<?php
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Only POST method allowed."]);
    exit();
}

// Load database
require_once '../../includes/db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['username'], $data['password'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing username or password."]);
    exit();
}

$username = $data['username'];
$password = $data['password'];

// Check user
$stmt = $pdo->prepare("SELECT * FROM account_holder WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password'])) {
    echo json_encode(["success" => true, "message" => "Login successful."]);
} else {
    http_response_code(401);
    echo json_encode(["error" => "Invalid credentials."]);
}
