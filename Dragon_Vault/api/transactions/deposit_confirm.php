<?php
require_once __DIR__ . '/../_headers.php';
require_once '../../includes/db.php';

$data = json_decode(file_get_contents("php://input"), true);
$account_number = $data["account_number"] ?? "";
$amount = (float)($data["amount"] ?? 0);
$teller_id = $_SESSION["teller_id"] ?? null;

if (!$teller_id || !$account_number || $amount <= 0) {
    echo json_encode(["success" => false, "message" => "Missing or invalid input."]);
    exit;
}

try {
    $pdo->beginTransaction();

    // Get current account info with account holder name
    $stmt = $pdo->prepare("
        SELECT a.balance, a.account_type, ah.first_name, ah.last_name
        FROM account a
        JOIN account_holder ah ON a.account_holder_id = ah.account_holder_id
        WHERE a.account_number = ?
    ");
    $stmt->execute([$account_number]);
    $account = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$account) {
        throw new Exception("Account not found.");
    }

    $previous_balance = $account["balance"];
    $new_balance = $previous_balance + $amount;

    // Update balance
    $update = $pdo->prepare("UPDATE account SET balance = ? WHERE account_number = ?");
    $update->execute([$new_balance, $account_number]);

    // Insert transaction
    $insert = $pdo->prepare("
        INSERT INTO teller_transaction (teller_id, account_number, transaction_type, amount)
        VALUES (?, ?, 'Deposit', ?)
    ");
    $insert->execute([$teller_id, $account_number, $amount]);

    $transaction_id = $pdo->lastInsertId();

    $pdo->commit();

    $customer_name = $account['first_name'] . ' ' . $account['last_name'];

    echo json_encode([
        "success" => true,
        "previous_balance" => $previous_balance,
        "new_balance" => $new_balance,
        "transaction_id" => "T" . str_pad($transaction_id, 5, "0", STR_PAD_LEFT),
        "customer_name" => $customer_name,
        "account_type" => $account["account_type"],
        "teller_id" => $teller_id
    ]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(["success" => false, "message" => "Deposit failed. " . $e->getMessage()]);
}
?>
