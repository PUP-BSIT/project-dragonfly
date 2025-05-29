<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['account_holder_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

require_once '../includes/db.php';  // Your DB connection file

$account_holder_id = $_SESSION['account_holder_id'];

$sql = "SELECT CONCAT(first_name, ' ', COALESCE(middle_initial, ''), ' ', last_name) AS full_name, email, phone_number AS phone, created_at 
        FROM account_holder WHERE account_holder_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $account_holder_id);
$stmt->execute();
$result = $stmt->get_result();

if ($user = $result->fetch_assoc()) {
    echo json_encode(['success' => true, 'user' => $user]);
} else {
    echo json_encode(['success' => false, 'message' => 'User not found']);
}
