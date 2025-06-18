<?php
require_once __DIR__ . '/../_headers.php';
require_once '../../includes/db.php';

$data = json_decode(file_get_contents("php://input"), true);

$phone_number = $data['phone_number'] ?? '';
$otp = $data['otp'] ?? '';

if (empty($phone_number) || empty($otp)) {
    echo json_encode(['success' => false, 'message' => 'Missing phone number or OTP.']);
    exit();
}

try {
    // Verify OTP for registration purpose
    $stmt = $pdo->prepare("SELECT * FROM otp_log WHERE phone_number = ? AND otp_code = ? AND purpose = 'Registration' AND expires_at > NOW() AND is_used = FALSE");
    $stmt->execute([$phone_number, $otp]);
    $otp_entry = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$otp_entry) {
        echo json_encode(['success' => false, 'message' => 'Invalid, expired, or already used OTP.']);
        exit();
    }

    // Mark OTP as used
    $stmt = $pdo->prepare("UPDATE otp_log SET is_used = TRUE WHERE id = ?");
    $stmt->execute([$otp_entry['id']]);

    // Retrieve registration data from session
    if (!isset($_SESSION['registration_data']) || $_SESSION['registration_data']['phone_number'] !== $phone_number) {
        echo json_encode(['success' => false, 'message' => 'Registration data not found or mismatched. Please start registration again.']);
        exit();
    }

    $reg_data = $_SESSION['registration_data'];

    // Insert new account holder
    $stmt = $pdo->prepare("INSERT INTO account_holder (first_name, last_name, middle_initial, phone_number, email, username, password)
                           VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $reg_data['first_name'],
        $reg_data['last_name'],
        $reg_data['middle_initial'],
        $reg_data['phone_number'],
        $reg_data['email'],
        $reg_data['username'],
        $reg_data['password']
    ]);
    $holder_id = $pdo->lastInsertId();

    // Get the last account_number and increment it
    $stmt = $pdo->query("SELECT MAX(account_number) AS last_account_number FROM account");
    $lastAccountNumber = $stmt->fetch(PDO::FETCH_ASSOC)['last_account_number'] ?? 1000000000; // Default start

    $newAccountNumber = $lastAccountNumber + 1;

    // Insert new account record with new account_number
    $insertAccount = $pdo->prepare("INSERT INTO account (account_number, account_holder_id, account_type, balance)
                                    VALUES (?, ?, 'Savings', 0.00)");
    $insertAccount->execute([$newAccountNumber, $holder_id]);

    // Clear registration data from session
    unset($_SESSION['registration_data']);

    echo json_encode([
        "success" => true, 
        "message" => "Account holder and savings account created successfully.",
        "account_holder_id" => $holder_id,
        "account_number" => $newAccountNumber
    ]);

} catch (PDOException $e) {
    error_log("Registration OTP verification error: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => "Error during registration verification: " . $e->getMessage()
    ]);
}
?> 