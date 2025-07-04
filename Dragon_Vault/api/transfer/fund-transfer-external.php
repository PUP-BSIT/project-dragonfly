<?php
require_once '../_headers.php';
require_once '../../includes/db.php';

// Check if user is logged in
if (!isset($_SESSION['account_holder_id'])) {
    $response = ['success' => false, 'error' => 'Unauthorized access'];
    error_log("Fund Transfer External Error: " . json_encode($response));
    echo json_encode($response);
    exit;
}

// Get POST data
$recipient_account_no = isset($_POST['recipient_account_no']) ? $_POST['recipient_account_no'] : '';
$transaction_amount = isset($_POST['transaction_amount']) ? $_POST['transaction_amount'] : '';
$transaction_type = 'Transfer to other bank'; // Explicitly set for this endpoint
$recipient_bank_code = isset($_POST['recipient_bank_code']) ? $_POST['recipient_bank_code'] : null;

// Log incoming request
error_log("Fund Transfer External Request: " . json_encode([
    'account_holder_id' => $_SESSION['account_holder_id'],
    'recipient_account' => $recipient_account_no,
    'amount' => $transaction_amount,
    'type' => $transaction_type,
    'bank_code' => $recipient_bank_code
]));

// Validate required fields
if (empty($recipient_account_no) || empty($transaction_amount) || empty($recipient_bank_code)) {
    $response = ['success' => false, 'error' => 'Missing required fields'];
    error_log("Fund Transfer External Error: " . json_encode($response));
    echo json_encode($response);
    exit;
}

// Validate recipient bank code against allowed values (optional but recommended)
$allowed_bank_codes = ['Blinders Vault', 'StackOverCash']; // Add other external banks here
if (!in_array($recipient_bank_code, $allowed_bank_codes)) {
    $response = ['success' => false, 'error' => 'Invalid recipient bank code'];
    error_log("Fund Transfer External Error: " . json_encode($response));
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

    error_log("Created external transaction with ID: " . $transaction_id);

    // Send OTP via SMS
    $otpApiUrl = (in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1']))
        ? 'http://localhost/Dragon_Vault/api/otp/send_sms_otp.php'
        : 'https://dragonvault.site/Dragon_Vault/api/otp/send_sms_otp.php';
    $ch = curl_init($otpApiUrl);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'phone_number' => $source_account['phone_number'],
        'otp' => $otp,
        'purpose' => 'Transaction'
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    $smsResponse = curl_exec($ch);
    curl_close($ch);
    
    // Commit transaction
    $pdo->commit();

    // Prepare success response
    $response = [
        'success' => true,
        'message' => 'OTP has been sent to your registered mobile number for external transfer',
        'transaction_id' => $transaction_id
    ];

    // Log success response
    error_log("Fund Transfer External Success: " . json_encode($response));

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
    error_log("Fund Transfer External Error: " . json_encode($response));

    echo json_encode($response);
} 