<?php
// Load environment variables
$env_file = __DIR__ . '/../../../.env';
if (file_exists($env_file)) {
    $env_vars = parse_ini_file($env_file);
    foreach ($env_vars as $key => $value) {
        putenv("$key=$value");
    }
}

// Database configuration from environment variables
$host = getenv('DB_HOST');
$db   = getenv('DB_NAME');
$user = getenv('DB_USER');
$pass = getenv('DB_PASS');

// PDO options for better security
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
    PDO::ATTR_TIMEOUT => 5, // 5 second timeout
];

try {
    $dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    // Log the error but don't expose details to the user
    error_log("Database connection failed: " . $e->getMessage());
    die("Database connection failed. Please try again later.");
}
?>
    