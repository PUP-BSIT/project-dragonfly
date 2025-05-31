<?php
session_start();
header("Content-Type: application/json");
require_once '../../includes/db.php';

if (!isset($_SESSION['account_holder_id'])) {
    echo json_encode(["success" => false, "message" => "Not logged in."]);
    exit;
}

$accountHolderId = $_SESSION['account_holder_id'];

try {
    // Get all account numbers for this account holder
    $stmt = $pdo->prepare("SELECT account_number FROM account WHERE account_holder_id = ?");
    $stmt->execute([$accountHolderId]);
    $accountNumbers = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($accountNumbers)) {
        echo json_encode(["success" => false, "message" => "No accounts found."]);
        exit;
    }

    // Prepare placeholders for IN clause
    $placeholders = implode(',', array_fill(0, count($accountNumbers), '?'));

    // User Transactions
    $userQuery = "
        SELECT * FROM user_transaction 
        WHERE account_number IN ($placeholders) 
        ORDER BY transaction_type ASC, transaction_timestamp DESC
    ";
    $userStmt = $pdo->prepare($userQuery);
    $userStmt->execute($accountNumbers);
    $userTransactions = $userStmt->fetchAll(PDO::FETCH_ASSOC);

    // Teller Transactions (joined with teller info)
    $tellerQuery = "
        SELECT tt.*, bt.first_name AS teller_first_name, bt.last_name AS teller_last_name 
        FROM teller_transaction tt 
        JOIN bank_teller bt ON tt.teller_id = bt.teller_id
        WHERE account_number IN ($placeholders) 
        ORDER BY tt.transaction_type ASC, tt.transaction_timestamp DESC
    ";
    $tellerStmt = $pdo->prepare($tellerQuery);
    $tellerStmt->execute($accountNumbers);
    $tellerTransactions = $tellerStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "user_transactions" => $userTransactions,
        "teller_transactions" => $tellerTransactions
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
