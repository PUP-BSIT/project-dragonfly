<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['account_holder_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['currentPassword'], $data['newPassword'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

require_once '../includes/db.php';

$account_holder_id = $_SESSION['account_holder_id'];
$currentPassword = $data['currentPassword'];
$newPassword = $data['newPassword'];

// Get current password hash
$sql = "SELECT password FROM account_holder WHERE account_holder_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $account_holder_id);
$stmt->execute();
$stmt->bind_result($hashedPassword);
$stmt->fetch();

if (!password_verify($currentPassword, $hashedPassword)) {
    echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
    exit;
}

// Hash new password
$newHashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

// Update password
$sqlUpdate = "UPDATE account_holder SET password = ? WHERE account_holder_id = ?";
$stmtUpdate = $conn->prepare($sqlUpdate);
$stmtUpdate->bind_param('si', $newHashedPassword, $account_holder_id);

if ($stmtUpdate->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to change password']);
}
