<?php
require_once __DIR__ . '/../_headers.php';
require_once '../../includes/db.php';

header('Content-Type: application/json');

// Check manager session
if (!isset($_SESSION['manager_id'])) {
    echo json_encode(["success" => false, "error" => "Not authenticated."]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Fetch all limits and minimums from system_config
    $stmt = $pdo->prepare("SELECT config_key, config_value FROM system_config WHERE config_key IN ('transfer_limit', 'withdrawal_limit', 'deposit_minimum', 'transfer_minimum', 'minimum_withdrawal', 'sms_gateway_enabled')");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    $transfer_limit = isset($rows['transfer_limit']) ? $rows['transfer_limit'] : '';
    $withdrawal_limit = isset($rows['withdrawal_limit']) ? $rows['withdrawal_limit'] : '';
    $deposit_minimum = isset($rows['deposit_minimum']) ? $rows['deposit_minimum'] : '';
    $transfer_minimum = isset($rows['transfer_minimum']) ? $rows['transfer_minimum'] : '';
    $minimum_withdrawal = isset($rows['minimum_withdrawal']) ? $rows['minimum_withdrawal'] : '';
    $sms_gateway_enabled = isset($rows['sms_gateway_enabled']) ? $rows['sms_gateway_enabled'] : 'false';
    $manager_name = isset($_SESSION['manager_full_name']) ? $_SESSION['manager_full_name'] : '';
    echo json_encode([
        "success" => true,
        "transfer_limit" => $transfer_limit,
        "withdrawal_limit" => $withdrawal_limit,
        "deposit_minimum" => $deposit_minimum,
        "transfer_minimum" => $transfer_minimum,
        "minimum_withdrawal" => $minimum_withdrawal,
        "sms_gateway_enabled" => $sms_gateway_enabled,
        "manager_name" => $manager_name
    ]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $response = ["success" => false];
    if (isset($data['transfer_limit'])) {
        $new_limit = $data['transfer_limit'];
        if (!is_numeric($new_limit) || $new_limit < 0) {
            echo json_encode(["success" => false, "error" => "Invalid transfer limit."]);
            exit();
        }
        $stmt = $pdo->prepare("UPDATE system_config SET config_value = ? WHERE config_key = 'transfer_limit'");
        $success = $stmt->execute([$new_limit]);
        $response = $success ? ["success" => true] : ["success" => false, "error" => "Failed to update transfer limit."];
    } elseif (isset($data['withdrawal_limit'])) {
        $new_limit = $data['withdrawal_limit'];
        if (!is_numeric($new_limit) || $new_limit < 0) {
            echo json_encode(["success" => false, "error" => "Invalid withdrawal limit."]);
            exit();
        }
        $stmt = $pdo->prepare("UPDATE system_config SET config_value = ? WHERE config_key = 'withdrawal_limit'");
        $success = $stmt->execute([$new_limit]);
        $response = $success ? ["success" => true] : ["success" => false, "error" => "Failed to update withdrawal limit."];
    } elseif (isset($data['deposit_minimum'])) {
        $new_min = $data['deposit_minimum'];
        if (!is_numeric($new_min) || $new_min < 0) {
            echo json_encode(["success" => false, "error" => "Invalid deposit minimum."]);
            exit();
        }
        $stmt = $pdo->prepare("UPDATE system_config SET config_value = ? WHERE config_key = 'deposit_minimum'");
        $success = $stmt->execute([$new_min]);
        $response = $success ? ["success" => true] : ["success" => false, "error" => "Failed to update deposit minimum."];
    } elseif (isset($data['transfer_minimum'])) {
        $new_min = $data['transfer_minimum'];
        if (!is_numeric($new_min) || $new_min < 0) {
            echo json_encode(["success" => false, "error" => "Invalid transfer minimum."]);
            exit();
        }
        $stmt = $pdo->prepare("UPDATE system_config SET config_value = ? WHERE config_key = 'transfer_minimum'");
        $success = $stmt->execute([$new_min]);
        $response = $success ? ["success" => true] : ["success" => false, "error" => "Failed to update transfer minimum."];
    } elseif (isset($data['minimum_withdrawal'])) {
        $new_min = $data['minimum_withdrawal'];
        if (!is_numeric($new_min) || $new_min < 0) {
            echo json_encode(["success" => false, "error" => "Invalid minimum withdrawal."]);
            exit();
        }
        $stmt = $pdo->prepare("UPDATE system_config SET config_value = ? WHERE config_key = 'minimum_withdrawal'");
        $success = $stmt->execute([$new_min]);
        $response = $success ? ["success" => true] : ["success" => false, "error" => "Failed to update minimum withdrawal."];
    } elseif (isset($data['sms_gateway_enabled'])) {
        $new_status = $data['sms_gateway_enabled'] === 'true' ? 'true' : 'false';
        $stmt = $pdo->prepare("UPDATE system_config SET config_value = ? WHERE config_key = 'sms_gateway_enabled'");
        $success = $stmt->execute([$new_status]);
        $response = $success ? ["success" => true] : ["success" => false, "error" => "Failed to update SMS gateway status."];
    }
    echo json_encode($response);
    exit();
}

echo json_encode(["success" => false, "error" => "Invalid request method."]); 