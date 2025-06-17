<?php
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../_headers.php';

$data = json_decode(file_get_contents('php://input'), true);
$phone_number = $data['phone_number'] ?? '';
$otp = $data['otp'] ?? '';

if (empty($phone_number) || empty($otp)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit();
}

try {
    // Validate OTP against otp_log table for 'Forgot Password' purpose using phone_number
    $stmt = $pdo->prepare("SELECT * FROM otp_log WHERE phone_number = ? AND otp_code = ? AND purpose = 'Forgot Password' AND expires_at > NOW() AND is_used = FALSE");
    $stmt->execute([$phone_number, $otp]);
    $otp_entry = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($otp_entry) {
        // Mark OTP as used
        $stmt = $pdo->prepare("UPDATE otp_log SET is_used = TRUE WHERE id = ?");
        $stmt->execute([$otp_entry['id']]);

        echo json_encode(['success' => true, 'message' => 'OTP verified successfully']);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired OTP']);
    }
} catch (PDOException $e) {
    error_log("OTP verification error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to verify OTP']);
}
?> 