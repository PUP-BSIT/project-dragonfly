<?php
session_start();
header("Content-Type: application/json");
require_once '../../includes/db.php';

if (!isset($_SESSION['teller_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$teller_id = $_SESSION['teller_id'];

try {
    $stmt = $pdo->prepare("SELECT teller_id, first_name, last_name, email, branch, username FROM bank_teller WHERE teller_id = ?");
    $stmt->execute([$teller_id]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($profile) {
        echo json_encode(['profile' => $profile]);
    } else {
        echo json_encode(['error' => 'Teller not found']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
