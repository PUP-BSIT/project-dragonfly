<?php
require_once __DIR__ . '/../_headers.php';

if (!isset($_SESSION['account_holder_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Password required']);
    exit;
}

require_once '../../includes/db.php';

$account_holder_id = $_SESSION['account_holder_id'];
$password = $data['password'];

// Verify current password
$stmt = $pdo->prepare("SELECT password FROM account_holder WHERE account_holder_id = ?");
$stmt->execute([$account_holder_id]);
$hashedPassword = $stmt->fetchColumn();

if (!$hashedPassword || !password_verify($password, $hashedPassword)) {
    echo json_encode(['success' => false, 'message' => 'Incorrect password']);
    exit;
}

// First, delete accounts belonging to the user
$pdo->prepare("DELETE FROM account WHERE account_holder_id = ?")->execute([$account_holder_id]);

// Then delete the user record
$deleteStmt = $pdo->prepare("DELETE FROM account_holder WHERE account_holder_id = ?");
$success = $deleteStmt->execute([$account_holder_id]);

if ($success) {
    session_destroy();
}

echo json_encode(['success' => $success]);