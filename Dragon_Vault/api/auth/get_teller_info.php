<?php
session_start();
require_once __DIR__ . '/../_headers.php';

if (!isset($_SESSION['teller_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

require_once '../../includes/db.php';

$teller_id = $_SESSION['teller_id'];

$sql = "SELECT first_name, last_name FROM bank_teller WHERE teller_id = ?";
$stmt = $pdo->prepare($sql);
$stmt->execute([$teller_id]);
$teller = $stmt->fetch();

if ($teller) {
    $full_name = $teller['first_name'] . ' ' . $teller['last_name'];
    echo json_encode(['success' => true, 'full_name' => $full_name]);
} else {
    echo json_encode(['success' => false, 'message' => 'Teller not found']);
}
