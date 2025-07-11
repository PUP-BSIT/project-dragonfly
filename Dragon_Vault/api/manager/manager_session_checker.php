<?php
header('Content-Type: application/json');
echo json_encode([
    'logged_in' => isset($_SESSION['manager_id'])
]);
exit(); 