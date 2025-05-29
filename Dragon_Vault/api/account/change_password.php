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

require_once '../../includes/db.php';

$account_holder_id = $_SESSION['account_holder_id'];
$currentPassword = $data['currentPassword'];
$newPassword = $data['newPassword'];

// Fetch current password
$stmt = $pdo->prepare("SELECT password FROM account_holder WHERE account_holder_id = ?");
$stmt->execute([$account_holder_id]);
$hashedPassword = $stmt->fetchColumn();

if (!$hashedPassword || !password_verify($currentPassword, $hashedPassword)) {
    echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
    exit;
}

// Update password
$newHashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
$updateStmt = $pdo->prepare("UPDATE account_holder SET password = ? WHERE account_holder_id = ?");
$success = $updateStmt->execute([$newHashedPassword, $account_holder_id]);

echo json_encode(['success' => $success]);