<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../_headers.php';
require_once '../../includes/sanitize.php';

if (!isset($_SESSION['account_holder_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['firstName'], $data['lastName'], $data['email'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

require_once '../../includes/db.php';

$account_holder_id = $_SESSION['account_holder_id'];
$first_name = trim($data['firstName']);
$middle_initial = isset($data['middleInitial']) && !empty($data['middleInitial']) ? trim($data['middleInitial']) : null;
$last_name = trim($data['lastName']);
$email = trim($data['email']);
$phone = isset($data['phone']) ? trim($data['phone']) : null;

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

try {
    // Check if email already exists
    $sqlCheck = "SELECT account_holder_id FROM account_holder WHERE email = ? AND account_holder_id != ?";
    $stmtCheck = $pdo->prepare($sqlCheck);
    $stmtCheck->execute([$email, $account_holder_id]);
    if ($stmtCheck->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Email already in use']);
        exit;
    }

    // Update
    $sql = "UPDATE account_holder SET first_name = ?, middle_initial = ?, last_name = ?, email = ?, phone_number = ? WHERE account_holder_id = ?";
    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute([$first_name, $middle_initial, $last_name, $email, $phone, $account_holder_id]);

    if ($success) {
        echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
    } else {
        $errorInfo = $stmt->errorInfo();
        echo json_encode(['success' => false, 'message' => 'Failed to update profile', 'error' => $errorInfo]);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'General error: ' . $e->getMessage()]);
}