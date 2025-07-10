<?php
require_once '../_headers.php';
require_once '../../includes/db.php';

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
        throw new Exception('The OTP code you entered does not match. Please try again.');
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

    // Handle external bank transfer if applicable
    if ($transaction['recipient_bank_code'] !== 'Dragon Vault') {
        $external_transfer_success = false;
        $external_response = null;

        if ($transaction['recipient_bank_code'] === 'StackOverCash') {
            $external_payload = [
                'transaction_amount' => floatval($transaction['amount']),
                'source_account_no' => $source_account_no,
                'source_bank_code' => 'Dragon Vault',
                'recipient_account_no' => $transaction['recipient_account_number']
            ];

            error_log("Calling StackOverCash API with payload: " . json_encode($external_payload));

            $ch = curl_init('https://dev.stackovercash.site/api/services/soc_transfer');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($external_payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json'
            ]);

            $response = curl_exec($ch);
            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            error_log("StackOverCash API Response (HTTP $http_code): " . $response);

            if ($http_code === 200) {
                $external_response = json_decode($response, true);
                $external_transfer_success = isset($external_response['success']) && $external_response['success'] === true;
            }
        } else if ($transaction['recipient_bank_code'] === 'Blinders Vault') {
            $external_payload = [
                'transaction_amount' => floatval($transaction['amount']),
                'source_account_no' => $source_account_no,
                'source_bank_code' => 'DragonVault',
                'recipient_account_no' => $transaction['recipient_account_number']
            ];

            error_log("Calling Blinders Vault API with payload: " . json_encode($external_payload));

            $ch = curl_init('https://blindvault.site/php/receive_external_transfer.php');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($external_payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json'
            ]);

            $response = curl_exec($ch);
            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            error_log("Blinders Vault API Response (HTTP $http_code): " . $response);

            if ($http_code === 200) {
                $external_response = json_decode($response, true);
                $external_transfer_success = isset($external_response['success']) && $external_response['success'] === true;
            }
        }

        if (!$external_transfer_success) {
            // If external transfer fails, revert the source account balance
            $stmt_revert = $pdo->prepare("
                UPDATE account 
                SET balance = balance + ? 
                WHERE account_number = ?
            ");
            $stmt_revert->execute([$transaction['amount'], $source_account_no]);
            
            // Mark transaction as failed
            $stmt_fail = $pdo->prepare("UPDATE user_transaction SET status = 'Failed' WHERE user_transaction_id = ?");
            $stmt_fail->execute([$transaction['user_transaction_id']]);
            
            throw new Exception('Failed to process external transfer: ' . 
                ($external_response ? json_encode($external_response) : 'Unknown error'));
        }
    } else {
        // Update recipient account balance for internal transfers
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

    // Mark OTP as used in otp_log using otp_log_id
    if (!empty($transaction['otp_log_id'])) {
        $stmt = $pdo->prepare("
            UPDATE otp_log 
            SET is_used = 1 
            WHERE id = ?
        ");
        $stmt->execute([$transaction['otp_log_id']]);
        error_log("Marked OTP as used by otp_log_id");
    } else {
        // Fallback for legacy transactions
        $stmt = $pdo->prepare("
            UPDATE otp_log 
            SET is_used = 1 
            WHERE account_number = ? 
            AND otp_code = ? 
            AND purpose = 'Transaction'
            AND is_used = 0
        ");
        $stmt->execute([$source_account_no, $otp]);
        error_log("Marked OTP as used by account_number and otp_code (legacy)");
    }

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