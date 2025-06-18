<?php
require_once '../_headers.php';
require_once '../../includes/db.php';

// Check if user is logged in
if (!isset($_SESSION['account_holder_id'])) {
    http_response_code(401);
    echo "data: " . json_encode(['error' => 'Unauthorized']) . "\n\n";
    exit();
}

// Set headers for SSE
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('X-Accel-Buffering: no'); // Disable nginx buffering

// Function to send SSE message
function sendSSE($data) {
    echo "data: " . json_encode($data) . "\n\n";
    ob_flush();
    flush();
}

// Function to check and expire pending transactions
function checkExpiredTransactions($pdo) {
    try {
        // Find all pending transactions with expired, unused OTPs using otp_log_id
        $stmt = $pdo->prepare("
            SELECT ut.user_transaction_id, ut.otp_log_id
            FROM user_transaction ut
            JOIN otp_log ol ON ut.otp_log_id = ol.id
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

        if ($updated > 0) {
            sendSSE([
                'event' => 'transaction_expired',
                'success' => true,
                'expired_transactions' => $updated,
                'message' => "$updated pending transactions expired and marked as failed.",
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        }

        return true;
    } catch (Exception $e) {
        sendSSE([
            'event' => 'error',
            'success' => false,
            'error' => $e->getMessage(),
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        return false;
    }
}

// Send initial connection success message
sendSSE([
    'event' => 'connected',
    'success' => true,
    'message' => 'SSE connection established',
    'timestamp' => date('Y-m-d H:i:s')
]);

// Keep the connection alive and check periodically
$checkInterval = 30; // seconds
$lastCheck = time();

while (true) {
    // Check if client is still connected
    if (connection_aborted()) {
        break;
    }

    // Check if session is still valid
    if (!isset($_SESSION['account_holder_id'])) {
        sendSSE([
            'event' => 'error',
            'success' => false,
            'error' => 'Session expired',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        break;
    }

    // Check for expired transactions every 30 seconds
    if (time() - $lastCheck >= $checkInterval) {
        checkExpiredTransactions($pdo);
        $lastCheck = time();
    }
    
    // Send a heartbeat every 10 seconds to keep the connection alive
    sendSSE([
        'event' => 'heartbeat',
        'type' => 'heartbeat',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
    // Sleep for 10 seconds before next check
    sleep(10);
} 