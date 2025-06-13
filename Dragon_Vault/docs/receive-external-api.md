# External Transfer API Documentation

## API Endpoint
```
POST https://dragonvault.example.com/api/transfer/receive-external.php
```

## Description
This endpoint is intended to be called by external banks to transfer funds into a Dragon Vault account. It does not require user session authentication.

## Request Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| transaction_amount | number | The amount to be transferred. |
| source_account_no | string | The source account number from the external bank. |
| source_bank_code | string | The bank code for the source external bank. |
| recipient_account_no | string | The recipient account number in Dragon Vault. |

## Request Example
```json 
{
  "transaction_amount": 1500.00,
  "source_account_no": "EXT123456789",
  "source_bank_code": "Blinders Vault",
  "recipient_account_no": "1000000001"
}
```

## Response Format

### Success Response
```json
{
  "fund_transfer_success": true,
  "transaction_id": 12345
}
```

### Error Response
```json
{
  "fund_transfer_success": false,
  "error": "Error message here"
}
``` 