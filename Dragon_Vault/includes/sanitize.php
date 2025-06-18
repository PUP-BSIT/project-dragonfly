<?php
/**
 * Sanitization functions for handling HTML special characters and other security concerns
 */

/**
 * Sanitize a string for HTML output
 * @param string $input The string to sanitize
 * @return string The sanitized string
 */
function sanitize_html($input) {
    return htmlspecialchars($input, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

/**
 * Sanitize an array of strings for HTML output
 * @param array $input The array to sanitize
 * @return array The sanitized array
 */
function sanitize_array($input) {
    if (!is_array($input)) {
        return sanitize_html($input);
    }
    
    $result = [];
    foreach ($input as $key => $value) {
        $result[$key] = is_array($value) ? sanitize_array($value) : sanitize_html($value);
    }
    return $result;
}

/**
 * Sanitize user input for database storage
 * @param string $input The string to sanitize
 * @return string The sanitized string
 */
function sanitize_db_input($input) {
    return trim($input);
}

/**
 * Sanitize output for JSON response
 * @param mixed $data The data to sanitize
 * @return mixed The sanitized data
 */
function sanitize_json_output($data) {
    if (is_array($data)) {
        return array_map('sanitize_json_output', $data);
    }
    return is_string($data) ? sanitize_html($data) : $data;
} 