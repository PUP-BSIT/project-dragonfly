<?php
require_once '../_headers.php';
require_once '../../includes/db.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if user is logged in
if (!isset($_SESSION['account_holder_id'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized access']);
    exit;
}

try {
    // Get the latest transfer attempt
    $stmt = $pdo->prepare("
        SELECT 
            ut.*,
            a.balance as source_balance,
            ah.phone_number,
            ah.first_name,
            ah.last_name
        FROM user_transaction ut
        JOIN account a ON ut.account_number = a.account_number
        JOIN account_holder ah ON a.account_holder_id = ah.account_holder_id
        WHERE a.account_holder_id = ?
        ORDER BY ut.transaction_timestamp DESC
        LIMIT 1
    ");
    $stmt->execute([$_SESSION['account_holder_id']]);
    $transfer = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$transfer) {
        echo json_encode([
            'success' => false,
            'message' => 'No recent transfers found'
        ]);
        exit;
    }

    // Get OTP log entry
    $stmt = $pdo->prepare("
        SELECT * FROM otp_log 
        WHERE account_number = ? 
        AND otp_code = ? 
        AND purpose = 'Transaction'
        ORDER BY id DESC 
        LIMIT 1
    ");
    $stmt->execute([$transfer['account_number'], $transfer['otp_code']]);
    $otp_log = $stmt->fetch(PDO::FETCH_ASSOC);

    // Format the response
    $response = [
        'success' => true,
        'transfer_details' => [
            'transaction_id' => $transfer['user_transaction_id'],
            'source_account' => $transfer['account_number'],
            'recipient_account' => $transfer['recipient_account_number'],
            'amount' => $transfer['amount'],
            'status' => $transfer['status'],
            'transaction_type' => $transfer['transaction_type'],
            'timestamp' => $transfer['transaction_timestamp'],
            'source_balance' => $transfer['source_balance'],
            'account_holder' => [
                'name' => $transfer['first_name'] . ' ' . $transfer['last_name'],
                'phone' => $transfer['phone_number']
            ]
        ],
        'otp_details' => $otp_log ? [
            'otp_code' => $otp_log['otp_code'],
            'expires_at' => $otp_log['expires_at'],
            'is_used' => $otp_log['is_used']
        ] : null
    ];

    echo json_encode($response);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} 