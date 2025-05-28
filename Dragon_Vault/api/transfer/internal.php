<?php
session_start();
header("Content-Type: application/json");

// Allow only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Only POST method allowed."]);
    exit();
}

// Check if user is logged in
if (!isset($_SESSION['account_holder_id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Unauthorized. Please log in."]);
    exit();
}

require_once '../../includes/db.php';

// Get form data
$recipientAccount = $_POST['recipient_account'] ?? '';
$amount = floatval($_POST['amount'] ?? 0);
$senderId = $_SESSION['account_holder_id'];

// Validate input
if (empty($recipientAccount) || $amount <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid recipient account or amount."]);
    exit();
}

// Additional validation for amount format
if (!is_numeric($_POST['amount']) || $amount != $_POST['amount']) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid amount format."]);
    exit();
}

try {
    $pdo->beginTransaction();

    // Get sender's account information
    $stmtSender = $pdo->prepare("
        SELECT a.account_id, a.account_number, a.balance 
        FROM account a 
        WHERE a.account_holder_id = ? 
        ORDER BY a.balance DESC 
        LIMIT 1
    ");
    $stmtSender->execute([$senderId]);
    $senderAccount = $stmtSender->fetch();

    if (!$senderAccount) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Sender account not found."]);
        exit();
    }

    // Check if sender has sufficient balance
    if ($senderAccount['balance'] < $amount) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Insufficient balance. Available: " . number_format($senderAccount['balance'], 2)]);
        exit();
    }

    // Get recipient's account information
    $stmtRecipient = $pdo->prepare("
        SELECT a.account_id, a.account_number, a.account_holder_id 
        FROM account a 
        WHERE a.account_number = ?
    ");
    $stmtRecipient->execute([$recipientAccount]);
    $recipientAccountData = $stmtRecipient->fetch();

    if (!$recipientAccountData) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Recipient account not found."]);
        exit();
    }

    // Prevent self-transfer
    if ($senderAccount['account_number'] == $recipientAccount) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Cannot transfer to your own account."]);
        exit();
    }

    // Deduct amount from sender's account
    $stmtDeduct = $pdo->prepare("UPDATE account SET balance = balance - ? WHERE account_id = ?");
    $deductResult = $stmtDeduct->execute([$amount, $senderAccount['account_id']]);

    if (!$deductResult) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Failed to deduct amount from sender account."]);
        exit();
    }

    // Add amount to recipient's account
    $stmtAdd = $pdo->prepare("UPDATE account SET balance = balance + ? WHERE account_id = ?");
    $addResult = $stmtAdd->execute([$amount, $recipientAccountData['account_id']]);

    if (!$addResult) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Failed to add amount to recipient account."]);
        exit();
    }

    // Record the transaction (assuming you have a transactions table)
    $transactionId = 'TXN' . date('YmdHis') . rand(1000, 9999);
    
    // Insert transaction record - adjust table name and columns as per your database structure
    $stmtTransaction = $pdo->prepare("
        INSERT INTO transactions 
        (transaction_id, sender_account_id, recipient_account_id, amount, transaction_type, status, created_at) 
        VALUES (?, ?, ?, ?, 'internal_transfer', 'completed', NOW())
    ");
    
    $transactionResult = $stmtTransaction->execute([
        $transactionId,
        $senderAccount['account_id'],
        $recipientAccountData['account_id'],
        $amount
    ]);

    if (!$transactionResult) {
        // Don't rollback here as the transfer was successful, just log the error
        error_log("Failed to record transaction: " . implode(", ", $stmtTransaction->errorInfo()));
    }

    // Commit the transaction
    $pdo->commit();

    // Get updated balance for response
    $stmtUpdatedBalance = $pdo->prepare("SELECT balance FROM account WHERE account_id = ?");
    $stmtUpdatedBalance->execute([$senderAccount['account_id']]);
    $updatedBalance = $stmtUpdatedBalance->fetchColumn();

    echo json_encode([
        "success" => true,
        "message" => "Transfer completed successfully.",
        "transaction_id" => $transactionId,
        "amount_transferred" => number_format($amount, 2),
        "remaining_balance" => number_format($updatedBalance, 2),
        "recipient_account" => $recipientAccount
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    error_log("Database error in internal transfer: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database error occurred. Please try again."]);
} catch (Exception $e) {
    $pdo->rollBack();
    error_log("General error in internal transfer: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "An error occurred. Please try again."]);
}
?>