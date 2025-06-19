<?php
require_once __DIR__ . '/../_headers.php';

// Destroy the session using our secure function
destroy_session();

// Respond with a success message
echo json_encode(["success" => true, "message" => "Logged out successfully."]);
