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

// Get POST data
$otp = isset($_POST['otp']) ? $_POST['otp'] : '';
$source_account_no = isset($_POST['source_account_no']) ? $_POST['source_account_no'] : '';
$recipient_account_no = isset($_POST['recipient_account_no']) ? $_POST['recipient_account_no'] : '';
$transaction_amount = isset($_POST['transaction_amount']) ? $_POST['transaction_amount'] : '';

// Log the incoming request
error_log("OTP Verification Request: " . json_encode([
    'otp' => $otp,
    'source_account' => $source_account_no,
    'recipient_account' => $recipient_account_no,
    'amount' => $transaction_amount,
    'session_id' => session_id()
]));

// Validate required fields
if (empty($otp) || empty($source_account_no) || empty($recipient_account_no) || empty($transaction_amount)) {
    $error = 'Missing required fields';
    error_log("OTP Verification Error: " . $error);
    echo json_encode(['success' => false, 'error' => $error]);
    exit;
}

try {
    // Start transaction
    $pdo->beginTransaction();

    // Find the pending transaction by account number and OTP code
    $stmt = $pdo->prepare("
        SELECT * 
        FROM user_transaction
        WHERE account_number = ? 
        AND otp_code = ?
        AND status = 'Pending'
        ORDER BY transaction_timestamp DESC 
        LIMIT 1
    ");
    $stmt->execute([$source_account_no, $otp]);
    $transaction = $stmt->fetch(PDO::FETCH_ASSOC);

    error_log("Attempting to find pending transaction with OTP. Found: " . json_encode($transaction));

    if (!$transaction) {
        throw new Exception('Invalid OTP or no matching pending transaction found');
    }

    // Log the found transaction
    error_log("Found pending transaction for OTP verification: " . json_encode($transaction));

    // The OTP is already verified by finding the transaction with the matching OTP
    // We just need to proceed with balance checks and updates

    // Check if source account has sufficient balance
    $stmt = $pdo->prepare("SELECT balance FROM account WHERE account_number = ?");
    $stmt->execute([$source_account_no]);
    $source_account = $stmt->fetch(PDO::FETCH_ASSOC);

    error_log("Source account balance for verification: " . json_encode($source_account));

    if (!$source_account || $source_account['balance'] < $transaction['amount']) {
         // If balance is insufficient at this stage, mark transaction as failed
        $stmt_fail = $pdo->prepare("UPDATE user_transaction SET status = 'Failed' WHERE user_transaction_id = ?");
        $stmt_fail->execute([$transaction['user_transaction_id']]);
         // Also mark OTP as used (failed attempt)
        $stmt_otp_used_fail = $pdo->prepare("
            UPDATE otp_log 
            SET is_used = 1 
            WHERE account_number = ? 
            AND otp_code = ? 
            AND purpose = 'Transaction'
            AND is_used = 0
        ");
        $stmt_otp_used_fail->execute([$source_account_no, $otp]);

        $pdo->commit(); // Commit the status update and OTP usage

        throw new Exception('Insufficient balance for transaction');
    }

    // Update source account balance
    $stmt = $pdo->prepare("
        UPDATE account 
        SET balance = balance - ? 
        WHERE account_number = ?
    ");
    $stmt->execute([$transaction['amount'], $source_account_no]);

    error_log("Updated source account balance during verification");

    // Update recipient account balance
    // This should only happen for internal transfers (recipient_bank_code = 'Dragon Vault')
    if ($transaction['recipient_bank_code'] === 'Dragon Vault') {
        $stmt = $pdo->prepare("
            UPDATE account 
            SET balance = balance + ? 
            WHERE account_number = ?
        ");
        // Ensure recipient_account_number is not NULL before executing
        if (!empty($transaction['recipient_account_number'])) {
             $stmt->execute([$transaction['amount'], $transaction['recipient_account_number']]);
             error_log("Updated recipient account balance for internal transfer");
        } else {
            error_log("Recipient account number is NULL for internal transfer: " . json_encode($transaction));
            // Depending on desired behavior, you might rollback or handle differently
            // For now, we'll log and proceed without updating recipient balance
        }
    }

    // Update transaction status to Completed
    $stmt = $pdo->prepare("
        UPDATE user_transaction 
        SET status = 'Completed' 
        WHERE user_transaction_id = ?
    ");
    $stmt->execute([$transaction['user_transaction_id']]);

    error_log("Updated transaction status to Completed");

    // Mark OTP as used in otp_log
    $stmt = $pdo->prepare("
        UPDATE otp_log 
        SET is_used = 1 
        WHERE account_number = ? 
        AND otp_code = ? 
        AND purpose = 'Transaction'
        AND is_used = 0
    ");
    $stmt->execute([$source_account_no, $otp]);

    error_log("Marked OTP as used");

    // Commit transaction
    $pdo->commit();

    // Log success
    error_log("OTP verification successful for transaction: " . $transaction['user_transaction_id']);

    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Transaction completed successfully',
        'transaction_id' => $transaction['user_transaction_id']
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    // Log error
    error_log("OTP verification error: " . $e->getMessage());

    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} 