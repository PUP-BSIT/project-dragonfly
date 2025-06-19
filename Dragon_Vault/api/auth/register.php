<?php
require_once __DIR__ . '/../_headers.php';
ob_start();
require_once '../../includes/db.php';

$data = json_decode(file_get_contents("php://input"), true);

$first_name = $data['first_name'] ?? '';
$last_name = $data['last_name'] ?? '';
$middle_initial = $data['middle_initial'] ?? null;
$phone_number = $data['phone_number'] ?? '';
$email = $data['email'] ?? '';
$username = $data['username'] ?? '';
$password = $data['password'] ?? ''; // Password will be hashed upon final registration

// Basic validation to prevent empty submissions
if (empty($first_name) || empty($last_name) || empty($phone_number) || empty($email) || empty($username) || empty($password)) {
    // Check if it's a resend request, in which case only phone_number is required
    if (isset($data['resend']) && $data['resend'] === true && !empty($phone_number)) {
        // Skip full validation for resend, proceed to OTP generation
    } else {
        echo json_encode(["success" => false, "message" => "All fields are required."]);
        exit;
    }
}

try {
    // If it's a resend request, skip account checks and session storage
    if (isset($data['resend']) && $data['resend'] === true) {
        // Generate a random 6-digit OTP
        $otp_code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Set OTP expiration (e.g., 5 minutes from now)
        $expires_at = date('Y-m-d H:i:s', strtotime('+5 minutes'));

        // Store OTP in the database
        $stmt = $pdo->prepare("INSERT INTO otp_log (phone_number, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)");
        $stmt->execute([$phone_number, $otp_code, 'Registration', $expires_at]);

        // Send OTP via SMS
        $smsData = [
            'phone_number' => $phone_number,
            'otp' => $otp_code,
            'purpose' => 'Registration'
        ];

        $ch = curl_init('https://dragonvault.site/Dragon_Vault/api/otp/send_sms_otp.php');
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($smsData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        $smsResponse = curl_exec($ch);
        curl_close($ch);

        error_log("Resend Registration OTP for " . $phone_number . ": " . $otp_code);

        echo json_encode([
            "success" => true,
            "message" => "New OTP sent successfully to your phone number."
        ]);
        exit();
    }

    // Check if username already exists
    $checkUsername = $pdo->prepare("SELECT COUNT(*) FROM account_holder WHERE username = ?");
    $checkUsername->execute([$username]);
    if ($checkUsername->fetchColumn() > 0) {
        echo json_encode(["success" => false, "message" => "Username already exists. Please choose another."]);
        exit;
    }

    // Check if email already exists
    $checkEmail = $pdo->prepare("SELECT COUNT(*) FROM account_holder WHERE email = ?");
    $checkEmail->execute([$email]);
    if ($checkEmail->fetchColumn() > 0) {
        echo json_encode(["success" => false, "message" => "Email is already registered."]);
        exit;
    }

    // Check if phone number already exists
    $checkPhone = $pdo->prepare("SELECT COUNT(*) FROM account_holder WHERE phone_number = ?");
    $checkPhone->execute([$phone_number]);
    if ($checkPhone->fetchColumn() > 0) {
        echo json_encode(["success" => false, "message" => "Phone number is already registered."]);
        exit;
    }

    // Store registration data in session for later use after OTP verification
    $_SESSION['registration_data'] = [
        'first_name' => $first_name,
        'last_name' => $last_name,
        'middle_initial' => $middle_initial,
        'phone_number' => $phone_number,
        'email' => $email,
        'username' => $username,
        'password' => password_hash($password, PASSWORD_BCRYPT) // Hash password now for security
    ];

    // Generate a random 6-digit OTP
    $otp_code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    // Set OTP expiration (e.g., 5 minutes from now)
    $expires_at = date('Y-m-d H:i:s', strtotime('+5 minutes'));

    // Store OTP in the database
    $stmt = $pdo->prepare("INSERT INTO otp_log (phone_number, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)");
    $stmt->execute([$phone_number, $otp_code, 'Registration', $expires_at]);

    // Send OTP via SMS
    $smsData = [
        'phone_number' => $phone_number,
        'otp' => $otp_code,
        'purpose' => 'Registration'
    ];

    $ch = curl_init('https://dragonvault.site/Dragon_Vault/api/otp/send_sms_otp.php');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($smsData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    $smsResponse = curl_exec($ch);
    curl_close($ch);

    echo json_encode([
        "success" => true,
        "message" => "OTP sent successfully to your phone number. Please verify to complete registration.",
        "phone_number" => $phone_number // Return phone number for masking on frontend
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
    exit;
}