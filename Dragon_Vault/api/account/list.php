<?php
header("Content-Type: application/json");
session_start();

if (!isset($_SESSION['account_holder_id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Unauthorized"]);
    exit();
}

require_once '../../includes/db.php';

$accountHolderId = $_SESSION['account_holder_id'];

try {
    // Correct table name should be 'account'
    $stmt = $pdo->prepare("SELECT account_number, account_type, balance FROM account WHERE account_holder_id = ?");
    $stmt->execute([$accountHolderId]);

    $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "accounts" => $accounts
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Server error: " . $e->getMessage()
    ]);
}
