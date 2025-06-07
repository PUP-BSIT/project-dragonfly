<?php
require_once '../_headers.php';
require_once '../../includes/db.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// This endpoint is intended to be called by external banks.
// It does not require user session authentication.

// Allow only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['fund_transfer_success' => false, 'error' => 'Only POST method allowed.']);
    exit();
}

// Get POST data
$json_data = json_decode(file_get_contents('php://input'), true);

if ($json_data === null) {
    http_response_code(400);
    echo json_encode(['fund_transfer_success' => false, 'error' => 'Invalid JSON data']);
    exit();
}

$transaction_amount = isset($json_data['transaction_amount']) ? floatval($json_data['transaction_amount']) : 0;
$source_account_no = isset($json_data['source_account_no']) ? $json_data['source_account_no'] : '';
$source_bank_code = isset($json_data['source_bank_code']) ? $json_data['source_bank_code'] : '';
$recipient_account_no = isset($json_data['recipient_account_no']) ? $json_data['recipient_account_no'] : '';

// Log incoming request
error_log("Receive External Transfer Request: " . json_encode([
    'amount' => $transaction_amount,
    'source_account' => $source_account_no,
    'source_bank' => $source_bank_code,
    'recipient_account' => $recipient_account_no
]));

// Validate required fields
if (empty($source_account_no) || empty($source_bank_code) || empty($recipient_account_no) || $transaction_amount <= 0) {
    http_response_code(400);
    echo json_encode(['fund_transfer_success' => false, 'error' => 'Missing or invalid required fields']);
    exit();
}

// Validate source bank code against allowed external banks
$allowed_source_banks = ['Blinders Vault', 'StackOverCash']; // Add other external banks here
if (!in_array($source_bank_code, $allowed_source_banks)) {
    http_response_code(400);
    echo json_encode(['fund_transfer_success' => false, 'error' => 'Invalid source bank code']);
    exit();
}

try {
    // Start transaction
    $pdo->beginTransaction();

    // Verify recipient account exists in our bank (Dragon Vault)
    $stmt = $pdo->prepare("SELECT account_number, account_holder_id FROM account WHERE account_number = ?");
    $stmt->execute([$recipient_account_no]);
    $recipient_account_data = $stmt->fetch(PDO::FETCH_ASSOC);

    error_log("Checking recipient account: " . $recipient_account_no);
    error_log("Recipient account data: " . json_encode($recipient_account_data));

    if (!$recipient_account_data) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode([
            'fund_transfer_success' => false, 
            'error' => 'Recipient account not found in Dragon Vault',
            'details' => 'Account number: ' . $recipient_account_no
        ]);
        exit();
    }

    // Add amount to the recipient's account balance
    $stmt_add = $pdo->prepare("UPDATE account SET balance = balance + ? WHERE account_number = ?");
    $add_result = $stmt_add->execute([$transaction_amount, $recipient_account_no]);

    if (!$add_result) {
        $pdo->rollBack();
        error_log("Error adding amount to recipient account: " . print_r($stmt_add->errorInfo(), true));
        http_response_code(500);
        echo json_encode(['fund_transfer_success' => false, 'error' => 'Failed to update recipient account balance']);
        exit();
    }

    // Record the incoming external transaction
    $stmt_transaction = $pdo->prepare("
        INSERT INTO user_transaction (
            account_number, 
            transaction_type, 
            amount, 
            status, 
            recipient_account_number,
            recipient_bank_code,
            transaction_timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");
    
    // Note: For an incoming external transfer, the 'account_number' column in user_transaction
    // should ideally refer to the internal account receiving the funds.
    // The source account details are stored in source_account_number and source_bank_code.
    
    $transaction_type = 'External transfer (inbound)'; // Define a type for incoming external transfers
    $status = 'Completed';

    $transaction_insert_result = $stmt_transaction->execute([
        $source_account_no, 
        $transaction_type,
        $transaction_amount,
        $status,
        $recipient_account_no, 
        $source_bank_code, 
    ]);

    if (!$transaction_insert_result) {
        $pdo->rollBack();
        error_log("Error inserting inbound transaction record: " . print_r($stmt_transaction->errorInfo(), true));
        http_response_code(500);
        echo json_encode(['fund_transfer_success' => false, 'error' => 'Failed to record incoming transaction']);
        exit();
    }

    $transaction_id = $pdo->lastInsertId();

    // Commit transaction
    $pdo->commit();

    error_log("Receive External Transfer Success: Transaction ID " . $transaction_id);

    // Return success response
    echo json_encode([
        'fund_transfer_success' => true,
        'transaction_id' => $transaction_id
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Receive External Transfer Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'fund_transfer_success' => false,
        'error' => $e->getMessage()
    ]);
} 