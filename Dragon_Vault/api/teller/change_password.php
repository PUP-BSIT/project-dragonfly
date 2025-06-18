<?php
require_once __DIR__ . '/../_headers.php';

if (!isset($_SESSION['teller_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['currentPassword'], $data['newPassword'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

require_once '../../includes/db.php';

$teller_id = $_SESSION['teller_id'];
$currentPassword = $data['currentPassword'];
$newPassword = $data['newPassword'];

// Fetch current password
$stmt = $pdo->prepare("SELECT password FROM bank_teller WHERE teller_id = ?");
$stmt->execute([$teller_id]);
$hashedPassword = $stmt->fetchColumn();

if (!$hashedPassword || !password_verify($currentPassword, $hashedPassword)) {
    echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
    exit;
}

// Update password
$newHashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
$updateStmt = $pdo->prepare("UPDATE bank_teller SET password = ? WHERE teller_id = ?");
$success = $updateStmt->execute([$newHashedPassword, $teller_id]);

echo json_encode(['success' => $success]);
