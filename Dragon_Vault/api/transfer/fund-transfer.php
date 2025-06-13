<?php
require_once '../_headers.php';
require_once '../../includes/db.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if user is logged in
if (!isset($_SESSION['account_holder_id'])) {
    $response = ['success' => false, 'error' => 'Unauthorized access'];
    error_log("Fund Transfer Error: " . json_encode($response));
    echo json_encode($response);
    exit;
}

// Get POST data
$recipient_account_no = isset($_POST['recipient_account_no']) ? $_POST['recipient_account_no'] : '';
$transaction_amount = isset($_POST['transaction_amount']) ? $_POST['transaction_amount'] : '';
$transaction_type = isset($_POST['transaction_type']) ? $_POST['transaction_type'] : 'Internal transfer';
$recipient_bank_code = isset($_POST['recipient_bank_code']) ? $_POST['recipient_bank_code'] : null;

// For internal transfers, explicitly set recipient_bank_code to 'Dragon Vault'
if ($transaction_type === 'Internal transfer') {
    $recipient_bank_code = 'Dragon Vault';
}

// Log incoming request
error_log("Fund Transfer Request: " . json_encode([
    'account_holder_id' => $_SESSION['account_holder_id'],
    'recipient_account' => $recipient_account_no,
    'amount' => $transaction_amount,
    'type' => $transaction_type,
    'bank_code' => $recipient_bank_code
]));

// Validate required fields
if (empty($recipient_account_no) || empty($transaction_amount)) {
    $response = ['success' => false, 'error' => 'Missing required fields'];
    error_log("Fund Transfer Error: " . json_encode($response));
    echo json_encode($response);
    exit;
}

try {
    // Start transaction
    $pdo->beginTransaction();

    // Get source account number from account_holder_id
    $stmt = $pdo->prepare("
        SELECT a.account_number, a.balance, ah.phone_number 
        FROM account a 
        JOIN account_holder ah ON a.account_holder_id = ah.account_holder_id 
        WHERE a.account_holder_id = ?
        ORDER BY a.balance DESC 
        LIMIT 1
    ");
    $stmt->execute([$_SESSION['account_holder_id']]);
    $source_account = $stmt->fetch(PDO::FETCH_ASSOC);

    error_log("Source account details: " . json_encode($source_account));

    if (!$source_account) {
        throw new Exception('Source account not found');
    }

    if ($source_account['balance'] < $transaction_amount) {
        throw new Exception('Insufficient balance');
    }

    // Check if recipient account exists
    $stmt = $pdo->prepare("SELECT account_number FROM account WHERE account_number = ?");
    $stmt->execute([$recipient_account_no]);
    $recipient_account = $stmt->fetch(PDO::FETCH_ASSOC);

    error_log("Recipient account details: " . json_encode($recipient_account));

    if (!$recipient_account) {
        throw new Exception('Recipient account not found');
    }

    // Generate OTP
    $otp = 123456;

    // Create transaction record with OTP
    $stmt = $pdo->prepare("
        INSERT INTO user_transaction (
            account_number, 
            transaction_type, 
            amount, 
            status, 
            recipient_account_number,
            recipient_bank_code,
            otp_code,
            transaction_timestamp
        ) VALUES (?, ?, ?, 'Pending', ?, ?, ?, NOW())
    ");
    $stmt->execute([
        $source_account['account_number'],
        $transaction_type,
        $transaction_amount,
        $recipient_account_no,
        $recipient_bank_code,
        $otp
    ]);
    $transaction_id = $pdo->lastInsertId();

    error_log("Created transaction with ID: " . $transaction_id);

    // Store OTP in otp_log table
    $stmt = $pdo->prepare("
        INSERT INTO otp_log (
            account_number,
            otp_code,
            purpose,
            expires_at,
            is_used
        ) VALUES (?, ?, 'Transaction', DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0)
    ");
    $stmt->execute([$source_account['account_number'], $otp]);

    error_log("Stored OTP in otp_log table");

    // Send OTP via SMS (implement your SMS sending logic here)
    // For now, we'll just log it
    error_log("OTP for transaction $transaction_id: $otp sent to {$source_account['phone_number']}");

    // Commit transaction
    $pdo->commit();

    // Prepare success response
    $response = [
        'success' => true,
        'message' => 'OTP has been sent to your registered mobile number',
        'transaction_id' => $transaction_id
    ];

    // Log success response
    error_log("Fund Transfer Success: " . json_encode($response));

    // Return success response
    echo json_encode($response);

} catch (Exception $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    $response = [
        'success' => false,
        'error' => $e->getMessage()
    ];

    // Log error response
    error_log("Fund Transfer Error: " . json_encode($response));

    echo json_encode($response);
} 