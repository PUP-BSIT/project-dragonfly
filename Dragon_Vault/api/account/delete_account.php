<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['account_holder_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Password required']);
    exit;
}

require_once '../includes/db.php';

$account_holder_id = $_SESSION['account_holder_id'];
$password = $data['password'];

// Verify current password
$sql = "SELECT password FROM account_holder WHERE account_holder_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $account_holder_id);
$stmt->execute();
$stmt->bind_result($hashedPassword);
$stmt->fetch();

if (!password_verify($password, $hashedPassword)) {
    echo json_encode(['success' => false, 'message' => 'Incorrect password']);
    exit;
}

// Delete related data first if necessary (e.g., accounts, transactions)
// If foreign keys are ON DELETE CASCADE, this is automatic, else delete manually:
// Example manual cascade (adjust if needed):
// $conn->query("DELETE FROM user_transaction WHERE account_number IN (SELECT account_number FROM account WHERE account_holder_id = $account_holder_id)");
// $conn->query("DELETE FROM account WHERE account_holder_id = $account_holder_id");

// Delete account_holder
$sqlDelete = "DELETE FROM account_holder WHERE account_holder_id = ?";
$stmtDelete = $conn->prepare($sqlDelete);
$stmtDelete->bind_param('i', $account_holder_id);

if ($stmtDelete->execute()) {
    // Destroy session after deletion
    session_destroy();
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to delete account']);
}
