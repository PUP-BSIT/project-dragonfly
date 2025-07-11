<?php
require_once '../_headers.php';
require_once '../../includes/db.php';
header('Content-Type: application/json');

// Only support GET for fetching limits
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare("
            SELECT config_key, config_value FROM system_config 
            WHERE config_key IN (
                'transfer_limit', 
                'withdrawal_limit', 
                'transfer_minimum', 
                'deposit_minimum', 
                'minimum_withdrawal'
            )");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    echo json_encode([
        "success" => true,
        "transfer_limit" => isset($rows['transfer_limit']) ? $rows['transfer_limit'] : '',
        "withdrawal_limit" => isset($rows['withdrawal_limit']) ? $rows['withdrawal_limit'] : '',
        "transfer_minimum" => isset($rows['transfer_minimum']) ? $rows['transfer_minimum'] : '',
        "deposit_minimum" => isset($rows['deposit_minimum']) ? $rows['deposit_minimum'] : '',
        "minimum_withdrawal" => isset($rows['minimum_withdrawal']) ? $rows['minimum_withdrawal'] : ''
    ]);
    exit;
}

echo json_encode(["success" => false, "message" => "Invalid request method."]); 