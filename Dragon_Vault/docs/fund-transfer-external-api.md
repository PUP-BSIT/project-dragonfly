# External Transfer API Documentation

## API Endpoint
```
POST https://dragonvault.example.com/api/transfer/fund-transfer-external.php
```

## Description
This API initiates an external fund transfer from a Dragon Vault account to an account in another bank. It checks the source account balance and, if sufficient, creates a pending transaction and generates a One-Time Password (OTP). The OTP is sent via SMS to the source account owner's registered phone number and stored for verification. The API returns a JSON response indicating success or failure and provides the transaction ID if successful. The user is then expected to enter the received OTP on a separate page/form to finalize the transfer.

## Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| recipient_account_no | string | The recipient account number in the external bank. |
| transaction_amount | number | The amount to be transferred. |
| recipient_bank_code | string | The code of the recipient's external bank. |

## Request Example
```json 
{
  "recipient_account_no": "EXT987654321",
  "transaction_amount": 2500.00,
  "recipient_bank_code": "StackOverCash"
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "OTP has been sent to your registered mobile number for external transfer",
  "transaction_id": 67890
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
``` 