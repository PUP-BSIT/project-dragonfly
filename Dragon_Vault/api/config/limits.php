<?php
require_once '../_headers.php';
require_once '../../includes/db.php';
header('Content-Type: application/json');

$stmt = $pdo->prepare("SELECT config_value FROM system_config WHERE config_key = 'transfer_limit'");
$stmt->execute();
$row = $stmt->fetch();
$transfer_limit = $row ? $row['config_value'] : '';
echo json_encode([
    "success" => true,
    "transfer_limit" => $transfer_limit
]); 