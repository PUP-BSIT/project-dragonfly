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
    // First, find the account_holder_id using the phone_number
    $stmt = $pdo->prepare("SELECT account_holder_id FROM account_holder WHERE phone_number = ?");
    $stmt->execute([$phone_number]);
    $account_holder = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$account_holder) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Phone number not found']);
        exit();
    }

    $account_holder_id = $account_holder['account_holder_id'];

    // Validate OTP against otp_log table
    $stmt = $pdo->prepare("SELECT * FROM otp_log WHERE account_number = ? AND otp_code = ? AND expires_at > NOW() AND is_used = FALSE");
    $stmt->execute([$account_holder_id, $otp]);
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