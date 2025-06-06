<?php
session_start();
require_once __DIR__ . '/../_headers.php';

if (!isset($_SESSION['teller_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

require_once '../../includes/db.php';

$teller_id = $_SESSION['teller_id'];

try {
    $stmt = $pdo->prepare("SELECT CONCAT(first_name, ' ', last_name) AS full_name, email, branch 
                           FROM bank_teller 
                           WHERE teller_id = ?");
    $stmt->execute([$teller_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Teller not found']);
    }
} catch (PDOException $e) {
    error_log("Profile error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
}
