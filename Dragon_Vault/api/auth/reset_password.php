<?php
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../_headers.php';

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);
$phone_number = $data['phone_number'] ?? '';
$new_password = $data['new_password'] ?? '';

if (empty($phone_number) || empty($new_password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit();
}

try {
    // Hash the new password
    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);

    // Update password in database
    $stmt = $pdo->prepare("UPDATE account_holder SET password = ? WHERE phone_number = ?");
    $stmt->execute([$hashed_password, $phone_number]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Password reset successfully']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Phone number not found']);
    }
} catch (PDOException $e) {
    error_log("Password reset error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to reset password']);
}
?> 