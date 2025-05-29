<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['account_holder_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['fullName'], $data['email'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

require_once '../includes/db.php';

$account_holder_id = $_SESSION['account_holder_id'];
$fullName = trim($data['fullName']);
$email = trim($data['email']);
$phone = isset($data['phone']) ? trim($data['phone']) : null;

// Split fullName into first, middle initial, last
$nameParts = explode(' ', $fullName);
$first_name = $nameParts[0];
$middle_initial = null;
$last_name = null;

if (count($nameParts) === 2) {
    $last_name = $nameParts[1];
} elseif (count($nameParts) > 2) {
    $middle_initial = substr($nameParts[1], 0, 1);
    $last_name = $nameParts[count($nameParts) - 1];
    // If there are more than 3 parts, you could improve this logic as needed
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

// Optional: check if email is already used by another user
$sqlCheck = "SELECT account_holder_id FROM account_holder WHERE email = ? AND account_holder_id != ?";
$stmtCheck = $conn->prepare($sqlCheck);
$stmtCheck->bind_param('si', $email, $account_holder_id);
$stmtCheck->execute();
$stmtCheck->store_result();
if ($stmtCheck->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Email already in use']);
    exit;
}

// Update query
$sql = "UPDATE account_holder SET first_name = ?, middle_initial = ?, last_name = ?, email = ?, phone_number = ? WHERE account_holder_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('sssssi', $first_name, $middle_initial, $last_name, $email, $phone, $account_holder_id);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update profile']);
}
