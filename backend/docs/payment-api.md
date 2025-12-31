# Payment System API Documentation 📚

## Overview
Complete RESTful API for payment processing with PCI DSS compliance.

**Base URL:** `/api/payment`  
**Authentication:** JWT Bearer Token (except webhook)

---

## Endpoints

### 1. Initiate Payment
**POST** `/initiate`

Initiates a new payment transaction.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "dealId": 123,
  "amount": 1500.00,
  "currency": "SAR",
  "paymentGateway": "mada",
  "paymentMethodId": "uuid-optional",
  "metadata": {
    "orderId": "ORD-12345"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "transaction": {
    "id": "uuid",
    "transactionId": "txn_timestamp_random",
    "amount": 1500.00,
    "currency": "SAR",
    "status": "pending",
    "gateway": "mada"
  }
}
```

**Rate Limit:** 5 requests / 15 minutes

---

### 2. Process Payment
**POST** `/process/:transactionId`

Processes a payment after gateway callback.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "gatewayResponse": {
    "status": "success",
    "transactionId": "gw_12345"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "transaction": {
    "id": "uuid",
    "transactionId": "txn_...",
    "status": "completed",
    "completedAt": "2025-11-23T23:00:00Z"
  }
}
```

**Rate Limit:** 5 requests / 15 minutes

---

### 3. Get Payment Status
**GET** `/status/:transactionId`

Retrieves the current status of a payment transaction.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "transactionId": "txn_...",
    "amount": 1500.00,
    "currency": "SAR",
    "status": "completed",
    "gateway": "mada",
    "initiatedAt": "2025-11-23T22:00:00Z",
    "completedAt": "2025-11-23T23:00:00Z",
    "deal": {
      "id": 123,
      "finalAmount": 1500.00
    }
  }
}
```

---

### 4. Cancel Payment
**POST** `/cancel/:transactionId`

Cancels a pending payment transaction.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment cancelled successfully",
  "transaction": {
    "id": "uuid",
    "transactionId": "txn_...",
    "status": "cancelled"
  }
}
```

---

### 5. Save Payment Method
**POST** `/methods`

Saves a tokenized payment method for future use.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "card",
  "provider": "mada",
  "cardData": {
    "lastFour": "1234",
    "brand": "Mada",
    "expiryMonth": 12,
    "expiryYear": 2025
  },
  "isDefault": true
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Payment method saved successfully",
  "paymentMethod": {
    "id": "uuid",
    "type": "card",
    "provider": "mada",
    "lastFourDigits": "1234",
    "cardBrand": "Mada",
    "isDefault": true
  }
}
```

---

### 6. Get Payment Methods
**GET** `/methods`

Retrieves all active payment methods for the user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "paymentMethods": [
    {
      "id": "uuid-1",
      "type": "card",
      "provider": "mada",
      "lastFourDigits": "1234",
      "cardBrand": "Mada",
      "expiryMonth": 12,
      "expiryYear": 2025,
      "isDefault": true,
      "createdAt": "2025-11-23T20:00:00Z"
    }
  ]
}
```

---

### 7. Delete Payment Method
**DELETE** `/methods/:id`

Soft deletes a payment method.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment method deleted successfully"
}
```

---

### 8. Payment Webhook
**POST** `/webhook`

Receives callbacks from payment gateways.

**Headers:**
```
X-Payment-Signature: <hmac_signature>
Content-Type: application/json
```

**Request Body:**
```json
{
  "gateway": "mada",
  "transactionId": "txn_...",
  "status": "completed",
  "gatewayResponse": {
    "gatewayTransactionId": "gw_12345"
  }
}
```

**Response (200):**
```json
{
  "received": true,
  "processed": true
}
```

**Rate Limit:** 20 requests / 1 minute

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "فشل في بدء عملية الدفع. الرجاء المحاولة مرة أخرى."
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid signature"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "غير مصرح لك بالوصول إلى هذه المعاملة"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "لم يتم العثور على المعاملة"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many payment attempts, please try again later"
}
```

### 503 Service Unavailable
```json
{
  "success": false,
  "message": "🏛️ نظام الدفع الإلكتروني جاهز وسيُفعّل قريباً بعد استكمال التصاريح الرسمية"
}
```

---

## Transaction Statuses

| Status | Description |
|--------|-------------|
| `pending` | Payment initiated, awaiting processing |
| `processing` | Being processed by gateway |
| `completed` | Successfully completed |
| `failed` | Payment failed |
| `cancelled` | Cancelled by user |
| `refunded` | Payment refunded |

---

## Security

### Authentication
All endpoints (except webhook) require JWT authentication via Bearer token.

### Rate Limiting
- Payment operations: 5 requests / 15 minutes
- Webhooks: 20 requests / 1 minute

### Webhook Verification
Webhooks must include valid HMAC-SHA256 signature in `X-Payment-Signature` header.

### PCI DSS Compliance
- NO card numbers stored
- All sensitive data encrypted (AES-256-GCM)
- Tokenization for payment methods
- Comprehensive audit logging

---

## Examples

### cURL Example
```bash
curl -X POST https://api.example.com/api/payment/initiate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dealId": 123,
    "amount": 1500.00,
    "currency": "SAR",
    "paymentGateway": "mada"
  }'
```

### JavaScript Example
```javascript
const response = await fetch('/api/payment/initiate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    dealId: 123,
    amount: 1500.00,
    currency: 'SAR',
    paymentGateway: 'mada'
  })
});

const data = await response.json();
```

---

**Version:** 1.0  
**Last Updated:** 2025-11-23
