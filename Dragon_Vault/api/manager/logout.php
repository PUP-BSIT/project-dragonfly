<?php
require_once __DIR__ . '/../_headers.php';

// Destroy manager session
session_unset();
session_destroy();
header('Content-Type: application/json');
echo json_encode(["success" => true]); 