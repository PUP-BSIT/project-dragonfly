<?php
require_once '../_headers.php';
require_once '../../includes/db.php';

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

    // Check if user is trying to transfer to their own account
    if ($source_account['account_number'] == $recipient_account_no) {
        throw new Exception('You cannot transfer money to your own account');
    }

    // Generate a random 6-digit OTP
    $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    // Store OTP in otp_log table and get its id
    $stmt = $pdo->prepare("
        INSERT INTO otp_log (
            account_number,
            phone_number,
            otp_code,
            purpose,
            expires_at,
            is_used
        ) VALUES (?, ?, ?, 'Transaction', DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0)
    ");
    $stmt->execute([$source_account['account_number'], $source_account['phone_number'], $otp]);
    $otp_log_id = $pdo->lastInsertId();

    // Create transaction record with OTP and otp_log_id
    $stmt = $pdo->prepare("
        INSERT INTO user_transaction (
            account_number, 
            transaction_type, 
            otp_code, 
            amount, 
            status, 
            recipient_account_number,
            recipient_bank_code,
            transaction_timestamp,
            otp_log_id
        ) VALUES (?, ?, ?, ?, 'Pending', ?, ?, NOW(), ?)
    ");
    $stmt->execute([
        $source_account['account_number'],
        $transaction_type,
        $otp,
        $transaction_amount,
        $recipient_account_no,
        $recipient_bank_code,
        $otp_log_id
    ]);
    $transaction_id = $pdo->lastInsertId();

    error_log("Created transaction with ID: " . $transaction_id);

    // Send OTP via SMS
    $smsData = [
        'phone_number' => $source_account['phone_number'],
        'otp' => $otp,
        'purpose' => 'Transaction'
    ];

    error_log("Attempting to send SMS OTP for transaction: " . json_encode($smsData));

    $ch = curl_init('https://dragonvault.site/Dragon_Vault/api/otp/send_sms_otp.php');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($smsData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_VERBOSE, true);
    
    // Create a temporary file handle for CURL debug output
    $verbose = fopen('php://temp', 'w+');
    curl_setopt($ch, CURLOPT_STDERR, $verbose);
    
    $smsResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    // Get the verbose debug information
    rewind($verbose);
    $verboseLog = stream_get_contents($verbose);
    error_log("CURL Verbose Log: " . $verboseLog);
    
    if (curl_errno($ch)) {
        $error = curl_error($ch);
        error_log("SMS API Error: " . $error);
        curl_close($ch);
        throw new Exception("Failed to send SMS: " . $error);
    }
    
    curl_close($ch);
    fclose($verbose);

    error_log("SMS API Response (HTTP $httpCode): " . $smsResponse);

    $smsResult = json_decode($smsResponse, true);
    if ($httpCode !== 200 || !isset($smsResult['success']) || !$smsResult['success']) {
        error_log("Failed to send SMS. HTTP Code: $httpCode, Response: " . $smsResponse);
        throw new Exception("Failed to send OTP via SMS. Please try again.");
    }

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