-- System Configuration Table
CREATE TABLE IF NOT EXISTS system_config (
    config_id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Manager Account Table
CREATE TABLE IF NOT EXISTS manager_account (
    manager_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Store hashed passwords!
    full_name VARCHAR(100),
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Insert default system configuration values
INSERT INTO system_config (config_key, config_value, description) VALUES
('transfer_limit', '500000.00', 'Max transfer per transaction (in currency)'),
('withdrawal_limit', '500000.00', 'Max withdrawal per transaction (in currency)'),
('sms_gateway_enabled', 'true', 'Enable/disable SMS gateway');

-- Insert a sample manager account (replace password hash with a real hash in production)
INSERT INTO manager_account (username, password, full_name, email) VALUES
('admin', '$2y$10$2/niM.rjwx6raYOX6YkdNO7b2JQGQCYy4QnbF8zMIMGDcYLHwEaoa', 'System Administrator', 'admin@example.com');
-- DragonflyAdmin@2025