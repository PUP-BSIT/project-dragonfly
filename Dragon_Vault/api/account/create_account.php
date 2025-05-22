<?php
require_once '../../includes/db.php';

$data = json_decode(file_get_contents("php://input"), true);

$account_holder_id = $data['account_holder_id'] ?? null;
$account_type = $data['account_type'] ?? 'Savings';

if (!$account_holder_id) {
    echo json_encode(["success" => false, "message" => "Missing account holder ID."]);
    exit;
}

try {
    // Get last account number
    $stmt = $pdo->query("SELECT MAX(account_number) AS last_account_number FROM account");
    $lastAccountNumber = $stmt->fetch(PDO::FETCH_ASSOC)['last_account_number'] ?? 1000000000;
    $newAccountNumber = $lastAccountNumber + 1;

    // Insert new account
    $stmt = $pdo->prepare("INSERT INTO account (account_number, account_holder_id, account_type, balance)
                           VALUES (?, ?, ?, 0.00)");
    $stmt->execute([$newAccountNumber, $account_holder_id, $account_type]);

    echo json_encode(["success" => true, "message" => "Account created.", "account_number" => $newAccountNumber]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
