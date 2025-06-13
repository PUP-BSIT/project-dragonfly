<?php
require_once '../../includes/db.php';
session_start();
require_once __DIR__ . '/../_headers.php';

if (!isset($_SESSION['teller_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$teller_id = $_SESSION['teller_id'];

try {
    $stmt = $pdo->prepare("SELECT tt.teller_transaction_id, tt.account_number, tt.transaction_type, tt.amount, tt.transaction_timestamp,
                           CONCAT(ah.first_name, ' ', ah.last_name) as account_holder_name
                           FROM teller_transaction tt
                           JOIN account a ON tt.account_number = a.account_number
                           JOIN account_holder ah ON a.account_holder_id = ah.account_holder_id
                           WHERE tt.teller_id = ?
                           ORDER BY tt.transaction_timestamp DESC");
    $stmt->execute([$teller_id]);
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['transactions' => $transactions]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
