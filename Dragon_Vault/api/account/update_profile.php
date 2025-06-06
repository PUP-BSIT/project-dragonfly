<?php
session_start();
require_once __DIR__ . '/../_headers.php';

if (!isset($_SESSION['account_holder_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['fullName'], $data['email'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

require_once '../../includes/db.php';

$account_holder_id = $_SESSION['account_holder_id'];
$fullName = trim($data['fullName']);
$email = trim($data['email']);
$phone = isset($data['phone']) ? trim($data['phone']) : null;

// Split full name

$nameParts = explode(' ', $fullName);
$first_name = $nameParts[0];
$middle_initial = null;
$last_name = null;

if (count($nameParts) === 2) {
    $last_name = $nameParts[1];
} elseif (count($nameParts) > 2) {
    $middle_initial = substr($nameParts[1], 0, 1);
    $last_name = $nameParts[count($nameParts) - 1];
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

// Check if email already exists
$sqlCheck = "SELECT account_holder_id FROM account_holder WHERE email = ? AND account_holder_id != ?";
$stmtCheck = $pdo->prepare($sqlCheck);
$stmtCheck->execute([$email, $account_holder_id]);
if ($stmtCheck->fetch()) {
    echo json_encode(['success' => false, 'message' => 'Email already in use']);
    exit;
}

// Update
$sql = "UPDATE account_holder SET first_name = ?, middle_initial = ?, last_name = ?, email = ?, phone_number = ? WHERE account_holder_id = ?";
$stmt = $pdo->prepare($sql);
$success = $stmt->execute([$first_name, $middle_initial, $last_name, $email, $phone, $account_holder_id]);

echo json_encode(['success' => $success]);