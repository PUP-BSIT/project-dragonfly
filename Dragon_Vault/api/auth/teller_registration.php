<?php
session_start();
header("Content-Type: application/json");
require_once '../../includes/db.php';

$data = json_decode(file_get_contents("php://input"), true);

$first_name = trim($data["first_name"] ?? "");
$last_name = trim($data["last_name"] ?? "");
$branch = trim($data["branch"] ?? "");
$email = trim($data["email"] ?? "");
$username = trim($data["username"] ?? "");
$password = trim($data["password"] ?? "");

if (!$first_name || !$last_name || !$branch || !$email || !$username || !$password) {
    echo json_encode(["success" => false, "message" => "All fields are required."]);
    exit;
}

// Check for duplicates
$check_sql = "SELECT * FROM bank_teller WHERE username = ? OR email = ?";
$check_stmt = $pdo->prepare($check_sql);
$check_stmt->execute([$username, $email]);

if ($check_stmt->rowCount() > 0) {
    echo json_encode(["success" => false, "message" => "Username or Email already exists."]);
    exit;
}

// Generate teller ID before inserting
$last_id_stmt = $pdo->query("SELECT teller_id FROM bank_teller ORDER BY teller_id DESC LIMIT 1");
$last_id_row = $last_id_stmt->fetch();

if ($last_id_row) {
    $last_id_num = (int)substr($last_id_row['teller_id'], 1); // Remove "T"
    $new_id_num = $last_id_num + 1;
    $teller_id = "T" . str_pad($new_id_num, 3, "0", STR_PAD_LEFT);
} else {
    $teller_id = "T001"; // First teller
}

// Hash password
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Insert including teller_id
$insert_sql = "INSERT INTO bank_teller (teller_id, first_name, last_name, branch, email, username, password)
               VALUES (?, ?, ?, ?, ?, ?, ?)";
$stmt = $pdo->prepare($insert_sql);
$success = $stmt->execute([$teller_id, $first_name, $last_name, $branch, $email, $username, $hashed_password]);

if ($success) {
    echo json_encode(["success" => true, "message" => "Teller registered successfully.", "teller_code" => $teller_id]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to register teller."]);
}
