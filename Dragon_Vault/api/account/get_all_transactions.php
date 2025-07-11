<?php
require_once __DIR__ . '/../_headers.php';
require_once '../../includes/db.php';

if (!isset($_SESSION['account_holder_id'])) {
    echo json_encode(["success" => false, "message" => "Not logged in."]);
    exit;
}

$accountHolderId = $_SESSION['account_holder_id'];

// Get sort order from request, default to DESC
$sortOrder = isset($_GET['sort_order']) && in_array(strtoupper($_GET['sort_order']), ['ASC', 'DESC']) ? strtoupper($_GET['sort_order']) : 'DESC';

try {
    // Get all account numbers for this account holder
    $stmt = $pdo->prepare("SELECT account_number FROM account WHERE account_holder_id = ?");
    $stmt->execute([$accountHolderId]);
    $accountNumbers = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($accountNumbers)) {
        echo json_encode(["success" => false, "message" => "No accounts found."]);
        exit;
    }

    // Prepare placeholders for IN clause
    $placeholders = implode(',', array_fill(0, count($accountNumbers), '?'));

    // Helper function to check if a transaction is expired
    function isTransactionExpired($pdo, $otp_log_id) {
        if (!$otp_log_id) return false;
        $stmt = $pdo->prepare("SELECT expires_at, is_used FROM otp_log WHERE id = ?");
        $stmt->execute([$otp_log_id]);
        $otp = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$otp) return false;
        return ($otp['is_used'] == 0 && strtotime($otp['expires_at']) < time());
    }

    // User Outbound Transactions
    $userOutboundQuery = "
        SELECT * FROM user_transaction 
        WHERE account_number IN ($placeholders) 
        ORDER BY transaction_timestamp $sortOrder
    ";
    $userOutboundStmt = $pdo->prepare($userOutboundQuery);
    $userOutboundStmt->execute($accountNumbers);
    $userOutboundTransactions = $userOutboundStmt->fetchAll(PDO::FETCH_ASSOC);
    // Update status if expired
    foreach ($userOutboundTransactions as &$tx) {
        if ($tx['status'] === 'Pending' && isTransactionExpired($pdo, $tx['otp_log_id'])) {
            $tx['status'] = 'Failed';
        }
    }
    unset($tx);

    // User Inbound Transactions
    $userInboundQuery = "
        SELECT * FROM user_transaction 
        WHERE recipient_account_number IN ($placeholders)
        ORDER BY transaction_timestamp $sortOrder
    ";
    $userInboundStmt = $pdo->prepare($userInboundQuery);
    $userInboundStmt->execute($accountNumbers);
    $userInboundTransactions = $userInboundStmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($userInboundTransactions as &$tx) {
        if ($tx['status'] === 'Pending' && isTransactionExpired($pdo, $tx['otp_log_id'])) {
            $tx['status'] = 'Failed';
        }
    }
    unset($tx);

    // Teller Transactions (joined with teller info)
    $tellerQuery = "
        SELECT tt.*, bt.first_name AS teller_first_name, bt.last_name AS teller_last_name 
        FROM teller_transaction tt 
        JOIN bank_teller bt ON tt.teller_id = bt.teller_id
        WHERE account_number IN ($placeholders) 
        ORDER BY tt.transaction_timestamp $sortOrder
    ";
    $tellerStmt = $pdo->prepare($tellerQuery);
    $tellerStmt->execute($accountNumbers);
    $tellerTransactions = $tellerStmt->fetchAll(PDO::FETCH_ASSOC);
 
    echo json_encode([
        "success" => true,
        "user_outbound_transactions" => $userOutboundTransactions,
        "user_inbound_transactions" => $userInboundTransactions,
        "teller_transactions" => $tellerTransactions
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
