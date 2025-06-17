<?php
require_once '../_headers.php';
require_once '../../includes/db.php';

header('Content-Type: application/json');

try {
    // Find all pending transactions with expired, unused OTPs
    $stmt = $pdo->prepare("
        SELECT ut.user_transaction_id, ut.account_number, ut.otp_code, ol.id AS otp_log_id
        FROM user_transaction ut
        JOIN otp_log ol ON ut.account_number = ol.account_number AND ut.otp_code = ol.otp_code
        WHERE ut.status = 'Pending'
          AND ol.purpose = 'Transaction'
          AND ol.is_used = 0
          AND ol.expires_at < NOW()
    ");
    $stmt->execute();
    $expired = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $updated = 0;
    foreach ($expired as $row) {
        // Mark transaction as Failed
        $stmt1 = $pdo->prepare("UPDATE user_transaction SET status = 'Failed' WHERE user_transaction_id = ?");
        $stmt1->execute([$row['user_transaction_id']]);
        // Mark OTP as used
        $stmt2 = $pdo->prepare("UPDATE otp_log SET is_used = 1 WHERE id = ?");
        $stmt2->execute([$row['otp_log_id']]);
        $updated++;
    }

    echo json_encode([
        'success' => true,
        'expired_transactions' => $updated,
        'message' => "$updated pending transactions expired and marked as failed."
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} 