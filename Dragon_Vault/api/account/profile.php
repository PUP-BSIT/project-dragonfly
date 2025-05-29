<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['account_holder_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}


require_once '../../includes/db.php';  // This defines $pdo

$account_holder_id = $_SESSION['account_holder_id'];

try {
    $stmt = $pdo->prepare("SELECT CONCAT(first_name, ' ', COALESCE(middle_initial, ''), ' ', last_name) AS full_name, email, phone_number AS phone, created_at 
                           FROM account_holder 
                           WHERE account_holder_id = ?");
    $stmt->execute([$account_holder_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
}
