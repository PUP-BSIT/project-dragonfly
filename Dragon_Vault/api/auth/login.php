<?php
require_once __DIR__ . '/../_headers.php';

// Allow only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Only POST method allowed."]);
    exit();
}

// Load database connection
require_once '../../includes/db.php';

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);

// If this is just a session check, allow it
if (isset($data['check_session']) && $data['check_session'] === true) {
    if (isset($_SESSION['account_holder_id'])) {
        echo json_encode([
            "success" => true,
            "already_logged_in" => true,
            "redirect" => "../../public/dashboard.html"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "already_logged_in" => false
        ]);
    }
    exit();
}

// Validate input for normal login
if (!isset($data['username'], $data['password'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing username or password."]);
    exit();
}

$username = $data['username'];
$password = $data['password'];

// Fetch user from database
$stmt = $pdo->prepare("SELECT * FROM account_holder WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password'])) {
    // Regenerate session ID to prevent session fixation
    regenerate_session();
    
    // Login success, set session variables
    $_SESSION['account_holder_id'] = $user['account_holder_id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['last_activity'] = time();

    echo json_encode([
        "success" => true,
        "message" => "Login successful.",
        "username" => $user['username']
    ]);
} else {
    http_response_code(401);
    echo json_encode(["error" => "Invalid username or password."]);
}
