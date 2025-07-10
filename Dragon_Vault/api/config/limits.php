<?php
require_once '../_headers.php';
require_once '../../includes/db.php';
header('Content-Type: application/json');

$stmt = $pdo->prepare("SELECT config_key, config_value FROM system_config WHERE config_key IN ('transfer_limit', 'withdrawal_limit')");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
$transfer_limit = isset($rows['transfer_limit']) ? $rows['transfer_limit'] : '';
$withdrawal_limit = isset($rows['withdrawal_limit']) ? $rows['withdrawal_limit'] : '';
echo json_encode([
    "success" => true,
    "transfer_limit" => $transfer_limit,
    "withdrawal_limit" => $withdrawal_limit
]); 