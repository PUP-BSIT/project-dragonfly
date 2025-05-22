<?php
session_start();
require_once '../../includes/db.php';

if (!isset($_SESSION['account_holder_id'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Unauthorized']);
  exit;
}

$account_holder_id = $_SESSION['account_holder_id'];

$sql = "SELECT a.account_number, a.balance
        FROM account a
        WHERE a.account_holder_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $account_holder_id);
$stmt->execute();
$result = $stmt->get_result()->fetch_assoc();

echo json_encode($result);
?>
