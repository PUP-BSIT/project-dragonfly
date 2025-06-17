<?php
session_start();
require_once __DIR__ . '/../_headers.php';

if (!isset($_SESSION['account_holder_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

require_once '../../includes/db.php';

$account_holder_id = $_SESSION['account_holder_id'];

// Fetch account numbers for this account holder
$stmt = $pdo->prepare("SELECT account_number FROM account WHERE account_holder_id = ?");
$stmt->execute([$account_holder_id]);
$accounts = $stmt->fetchAll(PDO::FETCH_COLUMN);

if (empty($accounts)) {
    echo json_encode(['success' => true, 'transactions' => []]);
    exit;
}

// Prepare placeholders for the IN clause
$placeholders = str_repeat('?,', count($accounts) - 1) . '?';

// Get recent 5 transactions (teller + user) sorted by timestamp
$query = "
    SELECT 'user' AS source, transaction_type, amount, transaction_timestamp 
    FROM user_transaction 
    WHERE account_number IN ($placeholders)
    UNION
    SELECT 'user_inbound' AS source, transaction_type, amount, transaction_timestamp
    FROM user_transaction
    WHERE recipient_account_number IN ($placeholders)
    UNION
    SELECT 'teller' AS source, transaction_type, amount, transaction_timestamp 
    FROM teller_transaction 
    WHERE account_number IN ($placeholders)
    ORDER BY transaction_timestamp DESC
    LIMIT 5
";
$params = array_merge($accounts, $accounts, $accounts);
$stmt = $pdo->prepare($query);
$stmt->execute($params);
$transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Convert transaction timestamps to Asia/Manila timezone for consistent display
foreach ($transactions as &$transaction) {
    $dateTime = new DateTime($transaction['transaction_timestamp'], new DateTimeZone('UTC'));
    $dateTime->setTimezone(new DateTimeZone('Asia/Manila'));
    $transaction['transaction_timestamp'] = $dateTime->format('Y-m-d H:i:s');
}

echo json_encode(['success' => true, 'transactions' => $transactions]);