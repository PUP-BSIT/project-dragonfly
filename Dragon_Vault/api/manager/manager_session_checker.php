<?php
require_once __DIR__ . '/../_headers.php';
echo json_encode([
    'logged_in' => isset($_SESSION['manager_id']),
    'manager_id' => $_SESSION['manager_id'] ?? null,
]);
exit(); 