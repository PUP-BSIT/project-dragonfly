<?php
session_start();
require_once __DIR__ . '/../_headers.php';

// Destroy all session variables
$_SESSION = [];

// Destroy the session itself
session_destroy();

// Optional: force cookie deletion (if using cookies)
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// Respond with a success message (for frontend handling)
header("Content-Type: application/json");
echo json_encode(["success" => true, "message" => "Logged out successfully."]);
