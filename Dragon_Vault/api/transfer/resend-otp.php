<?php
require_once '../_headers.php';
require_once '../../includes/db.php';

// Check if user is logged in
if (!isset($_SESSION['account_holder_id'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized access']);
    exit;
}

// Get POST data
$source_account_no = isset($_POST['source_account_no']) ? $_POST['source_account_no'] : '';
$recipient_account_no = isset($_POST['recipient_account_no']) ? $_POST['recipient_account_no'] : '';
$transaction_amount = isset($_POST['transaction_amount']) ? $_POST['transaction_amount'] : '';

// Validate required fields
if (empty($source_account_no) || empty($recipient_account_no) || empty($transaction_amount)) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

try {
    // Start transaction
    $pdo->beginTransaction();

    // Get the latest pending transaction
    $stmt = $pdo->prepare("
        SELECT ut.*, ah.phone_number 
        FROM user_transaction ut
        JOIN account a ON ut.account_number = a.account_number
        JOIN account_holder ah ON a.account_holder_id = ah.account_holder_id
        WHERE ut.account_number = ? 
        AND ut.recipient_account_number = ? 
        AND ut.amount = ? 
        AND ut.status = 'Pending' 
        ORDER BY ut.transaction_timestamp DESC 
        LIMIT 1
    ");
    $stmt->execute([$source_account_no, $recipient_account_no, $transaction_amount]);
    $transaction = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$transaction) {
        throw new Exception('No pending transaction found');
    }

    // Generate new OTP
    $new_otp = 123456;

    // Insert new OTP into otp_log and get its id
    $stmt = $pdo->prepare("
        INSERT INTO otp_log (
            account_number,
            otp_code,
            purpose,
            expires_at,
            is_used
        ) VALUES (?, ?, 'Transaction', DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0)
    ");
    $stmt->execute([$source_account_no, $new_otp]);
    $otp_log_id = $pdo->lastInsertId();

    // Update transaction with new OTP and new otp_log_id
    $stmt = $pdo->prepare("
        UPDATE user_transaction 
        SET otp_code = ?, otp_log_id = ?
        WHERE user_transaction_id = ?
    ");
    $stmt->execute([$new_otp, $otp_log_id, $transaction['user_transaction_id']]);

    // Send new OTP via SMS (implement your SMS sending logic here)
    // For now, we'll just log it
    error_log("New OTP for transaction {$transaction['user_transaction_id']}: $new_otp sent to {$transaction['phone_number']}");

    // Commit transaction
    $pdo->commit();

    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'OTP has been resent successfully'
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} 