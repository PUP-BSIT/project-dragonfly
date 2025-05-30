<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['teller_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['fullName'], $data['email'], $data['branch'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

require_once '../../includes/db.php';

$teller_id = $_SESSION['teller_id'];
$fullName = trim($data['fullName']);
$email = trim($data['email']);
$branch = trim($data['branch']);

// Split full name
$nameParts = explode(' ', $fullName);
$first_name = $nameParts[0];
$last_name = isset($nameParts[1]) ? $nameParts[1] : '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

// Check if email is already in use by another teller
$sqlCheck = "SELECT teller_id FROM bank_teller WHERE email = ? AND teller_id != ?";
$stmtCheck = $pdo->prepare($sqlCheck);
$stmtCheck->execute([$email, $teller_id]);
if ($stmtCheck->fetch()) {
    echo json_encode(['success' => false, 'message' => 'Email already in use']);
    exit;
}

// Update teller profile
$sql = "UPDATE bank_teller SET first_name = ?, last_name = ?, email = ?, branch = ? WHERE teller_id = ?";
$stmt = $pdo->prepare($sql);
$success = $stmt->execute([$first_name, $last_name, $email, $branch, $teller_id]);

echo json_encode(['success' => $success]);
