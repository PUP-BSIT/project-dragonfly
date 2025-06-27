<?php
file_put_contents(__DIR__ . '/sms_otp.log', date('Y-m-d H:i:s') . " - Test log entry\n", FILE_APPEND);
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../_headers.php';

// Get environment variables
$apiKey = getenv('SMS_API_KEY');
$apiUrl = getenv('SMS_API_URL');
$senderId = getenv('SMS_SENDER_ID');

// Validate required environment variables
if (!$apiKey || !$senderId || !$apiUrl) {
    error_log("Missing SMS configuration. API Key: " . ($apiKey ? 'set' : 'missing') . 
             ", Sender ID: " . ($senderId ? 'set' : 'missing') . 
             ", API URL: " . ($apiUrl ? 'set' : 'missing'));
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Missing required SMS configuration'
    ]);
    exit;
}

// Set up log file
$logFile = __DIR__ . '/sms_otp.log';

// Check if directory is writable
if (!is_writable(dirname($logFile))) {
    error_log("SMS Error: Log directory is not writable: " . dirname($logFile));
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server configuration error'
    ]);
    exit;
}

// Create log file if it doesn't exist
if (!file_exists($logFile)) {
    touch($logFile);
    chmod($logFile, 0644);
}

function logMessage($message, $data = []) {
    global $logFile;
    try {
        $logMessage = date('Y-m-d H:i:s') . " - " . $message;
        if (!empty($data)) {
            $logMessage .= "\nData: " . json_encode($data, JSON_PRETTY_PRINT);
        }
        $logMessage .= "\n" . str_repeat("-", 80) . "\n";
        
        if (!file_put_contents($logFile, $logMessage, FILE_APPEND)) {
            error_log("Failed to write to SMS log file: " . $logFile);
        }
    } catch (Exception $e) {
        error_log("Error writing to SMS log: " . $e->getMessage());
    }
}

function formatPhoneNumber($phoneNumber) {
    // Remove any non-numeric characters
    $number = preg_replace('/[^0-9]/', '', $phoneNumber);
    
    // If number starts with 0, replace with 63
    if (substr($number, 0, 1) === '0') {
        $number = '63' . substr($number, 1);
    }
    
    // If number doesn't start with 63, add it
    if (substr($number, 0, 2) !== '63') {
        $number = '63' . $number;
    }
    
    error_log("Formatted phone number: $number (original: $phoneNumber)");
    return $number;
}

function getMessageTemplate($purpose, $otp) {
    switch ($purpose) {
        case 'Registration':
            return "Welcome to Dragon Vault! Your OTP code is {otp}. Please use it within 5 minutes to complete your registration.";
        case 'Forgot Password':
            return "Your Dragon Vault password reset OTP code is {otp}. Please use it within 5 minutes.";
        case 'Transaction':
            return "Your Dragon Vault transaction OTP code is {otp}. Please use it within 5 minutes to complete your transaction.";
        default:
            return "Your Dragon Vault OTP code is {otp}. Please use it within 5 minutes.";
    }
}

function sendOTPViaSemaphore($phoneNumber, $otp, $purpose) {
    global $apiKey, $apiUrl, $logFile;
    
    // Format phone number to ensure it starts with 63
    $formattedNumber = formatPhoneNumber($phoneNumber);
    
    // Prepare message based on purpose
    $message = getMessageTemplate($purpose, $otp);

    // Prepare API request
    $data = [
        'apikey' => $apiKey,
        'number' => $formattedNumber,
        'message' => $message,
        'code' => $otp
    ];

    logMessage("Sending SMS via Semaphore", [
        'phone' => $formattedNumber,
        'purpose' => $purpose,
        'request_data' => $data,
        'api_url' => $apiUrl
    ]);

    // Initialize cURL session
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_VERBOSE, true);
    
    // Add headers for Semaphore API
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/x-www-form-urlencoded',
        'Accept: application/json',
        'User-Agent: DragonVault/1.0'
    ]);
    
    // Create a file handle for CURL debug output
    $verboseFile = fopen($logFile, 'a');
    curl_setopt($ch, CURLOPT_STDERR, $verboseFile);

    // Execute cURL request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    // Log the complete request and response
    logMessage("CURL Request Details", [
        'url' => $apiUrl,
        'method' => 'POST',
        'headers' => [
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json',
            'User-Agent: DragonVault/1.0'
        ],
        'post_data' => $data
    ]);
    
    if (curl_errno($ch)) {
        $error = curl_error($ch);
        logMessage("CURL Error", ['error' => $error]);
        curl_close($ch);
        fclose($verboseFile);
        throw new Exception("Failed to send SMS: " . $error);
    }
    
    curl_close($ch);
    fclose($verboseFile);

    logMessage("Semaphore API Response", [
        'http_code' => $httpCode,
        'response' => $response,
        'response_headers' => curl_getinfo($ch)
    ]);

    // Parse response
    $result = json_decode($response, true);
    
    if ($httpCode !== 200) {
        logMessage("Invalid HTTP code", ['code' => $httpCode]);
        throw new Exception("Failed to send SMS: Invalid API response code");
    }
    
    if (!isset($result[0]['status']) || $result[0]['status'] !== 'Pending') {
        logMessage("Invalid response format", ['response' => $result]);
        throw new Exception("Failed to send SMS: Invalid API response format");
    }

    return $result[0];
}

function sendOTP($phoneNumber, $otp, $purpose) {
    /*
    try {
        error_log("Starting OTP send process for $phoneNumber, purpose: $purpose");
        // Send OTP via Semaphore
        $smsResult = sendOTPViaSemaphore($phoneNumber, $otp, $purpose);
        error_log("SMS sent successfully. Message ID: " . $smsResult['message_id']);
        return [
            'success' => true,
            'message' => 'OTP sent successfully',
            'message_id' => $smsResult['message_id']
        ];
    } catch (Exception $e) {
        error_log("Error sending OTP: " . $e->getMessage());
        return [
            'success' => false,
            'message' => 'Failed to send OTP: ' . $e->getMessage()
        ];
    }
    */
    // For testing: do not send SMS, just log and return success
    error_log("[TEST MODE] Would send OTP $otp to $phoneNumber for $purpose");
    return [
        'success' => true,
        'message' => '[TEST MODE] OTP not sent, but treated as success',
        'message_id' => 'test-mode-message-id'
    ];
}

// Handle incoming requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    error_log("Received SMS OTP request: " . json_encode($data));
    
    $phoneNumber = $data['phone_number'] ?? '';
    $otp = $data['otp'] ?? '';
    $purpose = $data['purpose'] ?? '';
    
    if (empty($phoneNumber) || empty($otp) || empty($purpose)) {
        error_log("Missing required parameters. Phone: " . ($phoneNumber ? 'set' : 'missing') . 
                 ", OTP: " . ($otp ? 'set' : 'missing') . 
                 ", Purpose: " . ($purpose ? 'set' : 'missing'));
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required parameters'
        ]);
        exit;
    }
    
    try {
        $result = sendOTP($phoneNumber, $otp, $purpose);
        echo json_encode($result);
    } catch (Exception $e) {
        error_log("Error in SMS OTP handler: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Server error: ' . $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
} 