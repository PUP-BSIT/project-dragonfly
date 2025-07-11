<?php
require_once '../_headers.php';
require_once '../../includes/db.php';

// Check if user is logged in
if (!isset($_SESSION['account_holder_id'])) {
    http_response_code(401);
    echo "data: " . json_encode(['error' => 'Unauthorized']) . "\n\n";
    exit();
}
// Release the session lock so other PHP requests (like AJAX calls) can run in 
// parallel while this script keeps running.
session_write_close(); 

// Set headers for SSE
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('X-LiteSpeed-Accel-Buffering: no');

// Function to send SSE message
function sendSSE($data) {
    echo "data: " . json_encode($data) . "\n\n";
    ob_flush();
    flush();
}

// Add this at the top, after requires
function getPDO() {
    // Detect if running on localhost or 127.0.0.1
    $localHosts = ['localhost', '127.0.0.1'];
    $currentHost = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : (isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : '');

    if (in_array($currentHost, $localHosts, true)) {
        $host = 'localhost';
        $db   = 'u147312066_DragonVaultDB';
        $user = 'root';
        $pass = '';
    } else {
        $host = getenv('DB_HOST') ?: 'localhost';
        $db   = getenv('DB_NAME') ?: 'u147312066_DragonVaultDB';
        $user = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS') ?: '';
    }
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
        PDO::ATTR_TIMEOUT => 5,
    ];
    if (function_exists('date_default_timezone_set')) {
        date_default_timezone_set('Asia/Manila');
    }
    $dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, $options);
    $pdo->exec("SET time_zone = '+08:00'");
    return $pdo;
}

// Update checkExpiredTransactions to auto-reconnect
function checkExpiredTransactions(&$pdo) {
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
        $errors = [];
        foreach ($expired as $row) {
            // Mark transaction as Failed
            $stmt1 = $pdo->prepare("UPDATE user_transaction SET status = 'Failed' WHERE user_transaction_id = ?");
            if (!$stmt1->execute([$row['user_transaction_id']])) {
                $errorInfo = $stmt1->errorInfo();
                $errors[] = "Failed to update user_transaction_id: " . $row['user_transaction_id'] . " Error: " . implode(" | ", $errorInfo);
            }
            // Mark OTP as used
            $stmt2 = $pdo->prepare("UPDATE otp_log SET is_used = 1 WHERE id = ?");
            if (!$stmt2->execute([$row['otp_log_id']])) {
                $errorInfo = $stmt2->errorInfo();
                $errors[] = "Failed to update otp_log_id: " . $row['otp_log_id'] . " Error: " . implode(" | ", $errorInfo);
            }
            $updated++;
        }

        if ($updated > 0) {
            sendSSE([
                'event' => 'transaction_expired',
                'success' => count($errors) === 0,
                'expired_transactions' => $updated,
                'message' => "$updated pending transactions expired and marked as failed.",
                'errors' => $errors,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        }

        return true;
    } catch (PDOException $e) {
        if ($e->getCode() == 2006) { // MySQL server has gone away
            // Reconnect and retry ONCE
            $pdo = getPDO();
            try {
                // Try again
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
                $errors = [];
                foreach ($expired as $row) {
                    $stmt1 = $pdo->prepare("UPDATE user_transaction SET status = 'Failed' WHERE user_transaction_id = ?");
                    if (!$stmt1->execute([$row['user_transaction_id']])) {
                        $errorInfo = $stmt1->errorInfo();
                        $errors[] = "Failed to update user_transaction_id: " . $row['user_transaction_id'] . " Error: " . implode(" | ", $errorInfo);
                    }
                    $stmt2 = $pdo->prepare("UPDATE otp_log SET is_used = 1 WHERE id = ?");
                    if (!$stmt2->execute([$row['otp_log_id']])) {
                        $errorInfo = $stmt2->errorInfo();
                        $errors[] = "Failed to update otp_log_id: " . $row['otp_log_id'] . " Error: " . implode(" | ", $errorInfo);
                    }
                    $updated++;
                }
                if ($updated > 0) {
                    sendSSE([
                        'event' => 'transaction_expired',
                        'success' => count($errors) === 0,
                        'expired_transactions' => $updated,
                        'message' => "$updated pending transactions expired and marked as failed (after reconnect).",
                        'errors' => $errors,
                        'timestamp' => date('Y-m-d H:i:s')
                    ]);
                }
                return true;
            } catch (PDOException $e2) {
                sendSSE([
                    'event' => 'error',
                    'success' => false,
                    'error' => 'Reconnect failed: ' . $e2->getMessage(),
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
                return false;
            }
        } else {
            sendSSE([
                'event' => 'error',
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            return false;
        }
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