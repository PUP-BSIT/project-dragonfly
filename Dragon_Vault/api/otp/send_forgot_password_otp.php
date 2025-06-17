<?php
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../_headers.php';

$data = json_decode(file_get_contents('php://input'), true);
$phone_number = $data['phone_number'] ?? '';

if (empty($phone_number)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing phone number']);
    exit();
}

try {
    // Find the account_holder_id using the phone_number
    $stmt = $pdo->prepare("SELECT account_holder_id FROM account_holder WHERE phone_number = ?");
    $stmt->execute([$phone_number]);
    $account_holder = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$account_holder) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Phone number not found']);
        exit();
    }

    $account_holder_id = $account_holder['account_holder_id'];

    // Retrieve account_number using account_holder_id
    $stmt = $pdo->prepare("SELECT account_number FROM account WHERE account_holder_id = ?");
    $stmt->execute([$account_holder_id]);
    $account = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$account) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'No account found for this phone number.']);
        exit();
    }

    $account_number = $account['account_number'];

    // Generate a 6-digit OTP
    $otp_code = "654321";

    // Set OTP expiration (e.g., 5 minutes from now)
    $expires_at = date('Y-m-d H:i:s', strtotime('+5 minutes'));

    // Store OTP in the database
    // For 'Forgot Password' purpose, we use the actual account_number.
    $stmt = $pdo->prepare("INSERT INTO otp_log (account_number, phone_number, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$account_number, $phone_number, $otp_code, 'Forgot Password', $expires_at]);

    // In a real application, you would send the OTP via SMS here.

    echo json_encode(['success' => true, 'message' => 'OTP sent successfully']);
} catch (PDOException $e) {
    error_log("Send OTP error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to send OTP']);
}
?> 