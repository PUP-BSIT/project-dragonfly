<?php
// Database configuration
$servername = "localhost";
$db_username = "root";
$db_password = "";
$dbname = "teller_info_db";

// Create connection
$conn = new mysqli($servername, $db_username, $db_password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST["username"];
    $password = $_POST["password"];

    // Query to find the user in the database
    $sql = "SELECT teller_id, username, password FROM tellers WHERE username = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows == 1) {
        $row = $result->fetch_assoc();
        // Verify the password using password_verify
        if (password_verify($password, $row["password"])) {
            echo "Login successful!";
            // Here you can set a session or redirect
        } else {
            echo "Invalid password.";
        }
    } else {
        echo "Invalid username.";
    }

    $stmt->close();
}

$conn->close();
?>