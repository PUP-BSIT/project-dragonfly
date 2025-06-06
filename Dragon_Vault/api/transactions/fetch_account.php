<?php
session_start();
require_once __DIR__ . '/../_headers.php';
require_once '../../includes/db.php';

$data = json_decode(file_get_contents("php://input"), true);
$account_number = $data['account_number'] ?? '';

if (!$account_number) {
    echo json_encode(["success" => false, "message" => "Account number is required."]);
    exit;
}

$stmt = $pdo->prepare("SELECT a.account_number, a.balance, a.account_type, h.first_name, h.last_name 
                       FROM account a 
                       JOIN account_holder h ON a.account_holder_id = h.account_holder_id 
                       WHERE a.account_number = ?");
$stmt->execute([$account_number]);

if ($stmt->rowCount() === 0) {
    echo json_encode(["success" => false, "message" => "Account not found."]);
    exit;
}

$row = $stmt->fetch();
echo json_encode([
    "success" => true,
    "account_number" => $row["account_number"],
    "account_type" => $row["account_type"],
    "balance" => $row["balance"],
    "full_name" => $row["first_name"] . " " . $row["last_name"]
]);
