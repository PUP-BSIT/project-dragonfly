<?php
$host = 'srv607.hstgr.io';
$db   = 'u147312066_DragonVaultDB';
$user = 'u147312066_dragonfly';
$pass = 'Dragonfly_2025';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}
?>
    