<?php
session_start();
require_once __DIR__ . '/../_headers.php';
ob_start();
require_once '../../includes/db.php';

$data = json_decode(file_get_contents("php://input"), true);

$first_name = $data['first_name'];
$last_name = $data['last_name'];
$middle_initial = $data['middle_initial'] ?? null;
$phone_number = $data['phone_number'];
$email = $data['email'];
$username = $data['username'];
$password = password_hash($data['password'], PASSWORD_BCRYPT);

try {
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

    // Insert new account holder
    $stmt = $pdo->prepare("INSERT INTO account_holder (first_name, last_name, middle_initial, phone_number, email, username, password)
                           VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$first_name, $last_name, $middle_initial, $phone_number, $email, $username, $password]);

    // Get the ID of the newly created account holder
    $holder_id = $pdo->lastInsertId();

    // Get the last account_number and increment it
    $stmt = $pdo->query("SELECT MAX(account_number) AS last_account_number FROM account");
    $lastAccountNumber = $stmt->fetch(PDO::FETCH_ASSOC)['last_account_number'] ?? 1000000000; // Default start

    $newAccountNumber = $lastAccountNumber + 1;

    // Insert new account record with new account_number
    $insertAccount = $pdo->prepare("INSERT INTO account (account_number, account_holder_id, account_type, balance)
                                    VALUES (?, ?, 'Savings', 0.00)");
    $insertAccount->execute([$newAccountNumber, $holder_id]);

    // Return success response with account holder ID
    echo json_encode([
        "success" => true, 
        "message" => "Account holder and savings account created successfully.",
        "account_holder_id" => $holder_id,
        "account_number" => $newAccountNumber
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
    exit;
}