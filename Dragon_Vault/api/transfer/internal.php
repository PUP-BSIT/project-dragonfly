<?php
session_start();
require_once __DIR__ . '/../_headers.php';

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
    // Debug logging
    error_log("Starting transfer process");
    error_log("POST data: " . print_r($_POST, true));
    error_log("Session data: " . print_r($_SESSION, true));
    
    $pdo->beginTransaction();

    // Get sender's account information - FIXED: removed account_id
    $stmtSender = $pdo->prepare("
        SELECT a.account_number, a.balance 
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

    // Get recipient's account information - FIXED: removed account_id
    $stmtRecipient = $pdo->prepare("
        SELECT a.account_number, a.account_holder_id 
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

    // Deduct amount from sender's account - FIXED: use account_number as identifier
    $stmtDeduct = $pdo->prepare("UPDATE account SET balance = balance - ? WHERE account_number = ?");
    $deductResult = $stmtDeduct->execute([$amount, $senderAccount['account_number']]);

    if (!$deductResult) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Failed to deduct amount from sender account."]);
        exit();
    }

    // Add amount to recipient's account - FIXED: use account_number as identifier
    $stmtAdd = $pdo->prepare("UPDATE account SET balance = balance + ? WHERE account_number = ?");
    $addResult = $stmtAdd->execute([$amount, $recipientAccountData['account_number']]);

    if (!$addResult) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Failed to add amount to recipient account."]);
        exit();
    }

    // Record the transaction
    $transactionId = 'TXN' . date('YmdHis') . rand(1000, 9999);
    
    // Debug log before transaction insert
    error_log("Attempting to insert transaction record with ID: " . $transactionId);
    
    // Insert transaction record using the correct table name and columns
    $stmtTransaction = $pdo->prepare("
        INSERT INTO user_transaction 
        (account_number, transaction_type, amount, status, recipient_account_number, transaction_timestamp, recipient_bank_code) 
        VALUES (?, 'Internal transfer', ?, 'Completed', ?, NOW(), 'Dragon Vault')
    ");
    
    $transactionResult = $stmtTransaction->execute([
        $senderAccount['account_number'],
        $amount,
        $recipientAccount
    ]);

    if (!$transactionResult) {
        error_log("Transaction insert error: " . print_r($stmtTransaction->errorInfo(), true));
        // Don't rollback here as the transfer was successful, just log the error
        error_log("Failed to record transaction: " . implode(", ", $stmtTransaction->errorInfo()));
    }

    // Commit the transaction
    $pdo->commit();

    // Get updated balance for response - FIXED: use account_number as identifier
    $stmtUpdatedBalance = $pdo->prepare("SELECT balance FROM account WHERE account_number = ?");
    $stmtUpdatedBalance->execute([$senderAccount['account_number']]);
    $updatedBalance = $stmtUpdatedBalance->fetchColumn();

    echo json_encode([
        "success" => true,
        "message" => "Transfer completed successfully.",
        "transaction_id" => $transactionId,
        "amount_transferred" => number_format($amount, 2),
        "remaining_balance" => number_format($updatedBalance, 2),
        "recipient_account" => $recipientAccount,
        "recipient_bank" => "Dragon Vault"
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    error_log("Database error in internal transfer: " . $e->getMessage());
    error_log("SQL State: " . $e->getCode());
    error_log("Error Info: " . print_r($e->errorInfo, true));
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "error" => "Database error occurred. Please try again.",
        "debug_info" => "Error logged. Check server logs for details."
    ]);
} catch (Exception $e) {
    $pdo->rollBack();
    error_log("General error in internal transfer: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "error" => "An error occurred. Please try again.",
        "debug_info" => "Error logged. Check server logs for details."
    ]);
}
?>