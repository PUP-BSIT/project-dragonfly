<?php
require_once __DIR__ . '/../_headers.php';

if (!isset($_SESSION['account_holder_id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Unauthorized. Please log in."]);
    exit();
}

require_once '../../includes/db.php';

$accountHolderId = $_SESSION['account_holder_id'];

try {
    // Get full name by concatenating first_name and last_name
    $stmtUser = $pdo->prepare("SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM account_holder WHERE account_holder_id = ?");
    $stmtUser->execute([$accountHolderId]);
    $user = $stmtUser->fetch();

    // Get total balance across all accounts
    $stmtBalance = $pdo->prepare("SELECT SUM(balance) AS total_balance FROM account WHERE account_holder_id = ?");
    $stmtBalance->execute([$accountHolderId]);
    $balanceResult = $stmtBalance->fetch();

    //acc number
    $stmtAccount = $pdo->prepare("SELECT account_number FROM account WHERE account_holder_id = ? LIMIT 1");
    $stmtAccount->execute([$accountHolderId]);
    $accountResult = $stmtAccount->fetch();

    echo json_encode([
        "success" => true,
        "full_name" => $user['full_name'],
        "account_number" => $accountResult['account_number'] ?? null, 
        "total_balance" => $balanceResult['total_balance'] ?? 0.00,
        "recent_transactions" => [] 
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Server error: " . $e->getMessage()]);
}
?>
