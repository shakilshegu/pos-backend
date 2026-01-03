# POS Payment System - Complete Design & Integration Guide

## Overview

Production-ready payment system for retail POS in Bahrain (🇧🇭) with TAP Payments integration. Supports cash, card, and wallet payments with split payment capabilities.

---

## Payment Methods Supported

- **CASH** - Instant success, manual handling
- **CARD** - Credit/Debit cards via TAP Gateway
- **WALLET** - Apple Pay / Google Pay via TAP Gateway

---

## Payment Flow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    POS PAYMENT FLOW                         │
└─────────────────────────────────────────────────────────────┘

1. Order Created (status: DRAFT)
   └─> Add items via barcode scanning

2. Order Confirmed (status: PENDING)
   └─> Ready for payment

3. Cashier Selects Payment Method
   ├─> CASH
   │   ├─> Create payment record
   │   ├─> Mark as SUCCESS immediately
   │   └─> Update order if fully paid
   │
   └─> CARD/WALLET
       ├─> Create payment record (status: INITIATED)
       ├─> Call TAP API to create charge
       ├─> Redirect customer to TAP payment page
       ├─> Customer completes payment
       ├─> TAP sends webhook to backend
       ├─> Verify webhook signature
       ├─> Update payment status (SUCCESS/FAILED)
       └─> Update order if fully paid

4. Order Fully Paid (status: PAID)
   └─> Deduct inventory
   └─> Generate receipt
```

---

## Payment Status Flow

```
INITIATED → SUCCESS
    ↓
  FAILED
    ↓
 REFUNDED
```

**Status Definitions:**
- **INITIATED**: Payment created, awaiting confirmation (card/wallet)
- **SUCCESS**: Payment completed successfully
- **FAILED**: Payment failed or declined
- **REFUNDED**: Payment refunded to customer

---

## Database Schema

### Payment Table

```prisma
model Payment {
  id            String          @id @default(uuid())
  orderId       String
  companyId     String
  storeId       String

  // Payment details
  amount        Decimal         @db.Decimal(10, 2)
  currency      String          @default("BHD")
  method        PaymentMethod   // CASH, CARD, WALLET
  status        PaymentStatus   @default(INITIATED)

  // Provider details
  provider      PaymentProvider @default(INTERNAL)  // INTERNAL, TAP
  providerRef   String?         @unique             // TAP charge ID
  providerData  Json?                               // TAP response data

  // Customer reference
  customerRef   String?

  // Notes
  notes         String?
  failureReason String?

  // Processing info
  processedBy   String
  shiftId       String?

  // Refund tracking
  refundedAt    DateTime?
  refundedBy    String?
  refundReason  String?

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}
```

### Enums

```prisma
enum PaymentMethod {
  CASH
  CARD      // Credit/Debit via TAP
  WALLET    // Apple Pay / Google Pay via TAP
}

enum PaymentStatus {
  INITIATED  // Payment created, awaiting confirmation
  SUCCESS    // Payment successful
  FAILED     // Payment failed
  REFUNDED   // Payment refunded
}

enum PaymentProvider {
  INTERNAL   // For CASH payments
  TAP        // TAP Payment Gateway
}
```

---

## API Endpoints

### 1. Create Payment

**Endpoint:** `POST /api/payments`

**Use Case:** Process payment for a PENDING order

**Access:** CASHIER, MANAGER, ADMIN (PROCESS_PAYMENT permission)

**Request:**
```json
{
  "orderId": "order-uuid",
  "method": "CARD",
  "amount": 10.500,
  "customerRef": "12345678",  // Optional: customer phone
  "notes": "Split payment"     // Optional
}
```

**Response (CASH - 201):**
```json
{
  "success": true,
  "message": "Cash payment recorded successfully",
  "data": {
    "payment": {
      "id": "payment-uuid",
      "orderId": "order-uuid",
      "amount": "10.500",
      "currency": "BHD",
      "method": "CASH",
      "status": "SUCCESS",
      "provider": "INTERNAL",
      "processedBy": "user-uuid",
      "createdAt": "2025-01-27T10:00:00Z"
    }
  }
}
```

**Response (CARD/WALLET - 201):**
```json
{
  "success": true,
  "message": "Payment initiated. Redirect customer to payment page.",
  "data": {
    "payment": {
      "id": "payment-uuid",
      "orderId": "order-uuid",
      "amount": "10.500",
      "currency": "BHD",
      "method": "CARD",
      "status": "INITIATED",
      "provider": "TAP",
      "providerRef": "chg_TS01A2220231543Wk0s1944306",
      "createdAt": "2025-01-27T10:00:00Z"
    },
    "paymentUrl": "https://tap.company/charge/chg_xxx",
    "chargeId": "chg_TS01A2220231543Wk0s1944306"
  }
}
```

**Error Responses:**

```json
// Order not in PENDING status
{
  "success": false,
  "message": "Cannot process payment for order with status: DRAFT. Order must be in PENDING status."
}

// Amount exceeds remaining balance
{
  "success": false,
  "message": "Payment amount (15.000) exceeds remaining balance (10.500)"
}

// Order already fully paid
{
  "success": false,
  "message": "Order is already fully paid"
}
```

---

### 2. Get Payment by ID

**Endpoint:** `GET /api/payments/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "payment-uuid",
    "orderId": "order-uuid",
    "amount": "10.500",
    "currency": "BHD",
    "method": "CARD",
    "status": "SUCCESS",
    "provider": "TAP",
    "providerRef": "chg_TS01A2220231543Wk0s1944306",
    "order": {
      "id": "order-uuid",
      "orderNumber": "ORD-20250127-001",
      "totalAmount": "25.500",
      "status": "PAID"
    },
    "processedByUser": {
      "id": "user-uuid",
      "firstName": "John",
      "lastName": "Doe"
    },
    "createdAt": "2025-01-27T10:00:00Z"
  }
}
```

---

### 3. Get Payments for Order

**Endpoint:** `GET /api/payments/order/:orderId`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "payment-1-uuid",
      "amount": "10.000",
      "method": "CASH",
      "status": "SUCCESS",
      "createdAt": "2025-01-27T10:00:00Z"
    },
    {
      "id": "payment-2-uuid",
      "amount": "15.500",
      "method": "CARD",
      "status": "SUCCESS",
      "createdAt": "2025-01-27T10:05:00Z"
    }
  ],
  "summary": {
    "orderTotal": 25.500,
    "totalPaid": 25.500,
    "remainingAmount": 0,
    "fullyPaid": true
  }
}
```

---

### 4. List Payments with Filters

**Endpoint:** `GET /api/payments`

**Query Parameters:**
- `orderId` - Filter by order
- `method` - Filter by payment method (CASH, CARD, WALLET)
- `status` - Filter by status (INITIATED, SUCCESS, FAILED, REFUNDED)
- `provider` - Filter by provider (INTERNAL, TAP)
- `storeId` - Filter by store
- `from` - Start date (ISO datetime)
- `to` - End date (ISO datetime)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "payment-uuid",
      "amount": "10.500",
      "method": "CARD",
      "status": "SUCCESS",
      "order": {
        "orderNumber": "ORD-20250127-001"
      },
      "createdAt": "2025-01-27T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 5. Process Refund

**Endpoint:** `POST /api/payments/:id/refund`

**Use Case:** Refund a successful payment

**Access:** MANAGER, ADMIN (PROCESS_PAYMENT permission)

**Request:**
```json
{
  "refundReason": "Customer returned product",
  "amount": 10.500  // Optional: for partial refund
}
```

**Response (CASH):**
```json
{
  "success": true,
  "message": "Cash refund recorded. Please return cash to customer.",
  "data": {
    "id": "payment-uuid",
    "status": "REFUNDED",
    "refundedAt": "2025-01-27T12:00:00Z",
    "refundReason": "Customer returned product"
  }
}
```

**Response (CARD/WALLET):**
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "id": "payment-uuid",
    "status": "REFUNDED",
    "refundedAt": "2025-01-27T12:00:00Z"
  },
  "refund": {
    "id": "ref_xxx",
    "status": "SUCCESS",
    "amount": 10.500
  }
}
```

---

### 6. Get Payment Statistics

**Endpoint:** `GET /api/payments/statistics`

**Access:** MANAGER, ADMIN (VIEW_REPORTS permission)

**Query Parameters:**
- `from` - Start date (ISO datetime)
- `to` - End date (ISO datetime)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAmount": 5420.750,
    "totalPayments": 142,
    "byMethod": {
      "CASH": {
        "count": 85,
        "amount": 2150.500
      },
      "CARD": {
        "count": 45,
        "amount": 2890.250
      },
      "WALLET": {
        "count": 12,
        "amount": 380.000
      }
    },
    "byStatus": {
      "SUCCESS": 139,
      "FAILED": 2,
      "REFUNDED": 1
    }
  }
}
```

---

## TAP Payments Integration

### Setup & Configuration

**Environment Variables Required:**

```bash
# TAP API Credentials
TAP_SECRET_KEY=sk_test_xxxxxxxxxxxxx
TAP_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx  # Optional, for frontend

# TAP Webhook
TAP_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# TAP URLs
TAP_BASE_URL=https://api.tap.company/v2  # Default
TAP_REDIRECT_URL=https://yourapp.com/payment/callback
TAP_WEBHOOK_URL=https://yourapp.com/api/webhooks/tap
```

**Get TAP Credentials:**
1. Register at https://www.tap.company/en-bh
2. Navigate to Dashboard → Developers → API Keys
3. Copy Secret Key and Public Key
4. Set up webhook endpoint and get webhook secret

---

### TAP Payment Flow (Detailed)

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Cashier  │         │ Backend  │         │   TAP    │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                     │
     │ 1. Create payment  │                     │
     │   method: CARD     │                     │
     ├───────────────────>│                     │
     │                    │                     │
     │                    │ 2. Create charge    │
     │                    ├────────────────────>│
     │                    │                     │
     │                    │ 3. Return charge    │
     │                    │    + payment URL    │
     │                    │<────────────────────┤
     │                    │                     │
     │ 4. Payment URL     │                     │
     │<───────────────────┤                     │
     │                    │                     │
     │ 5. Redirect customer to TAP payment page │
     │──────────────────────────────────────────>
     │                    │                     │
     │              6. Customer pays            │
     │──────────────────────────────────────────>
     │                    │                     │
     │                    │ 7. Webhook callback │
     │                    │    (payment status) │
     │                    │<────────────────────┤
     │                    │                     │
     │                    │ 8. Verify signature │
     │                    │    Update payment   │
     │                    │    Update order     │
     │                    │                     │
     │ 9. Payment result  │                     │
     │<───────────────────┤                     │
     │                    │                     │
```

---

### TAP Webhook Handling

**Endpoint:** `POST /api/webhooks/tap`

**Access:** Public (signature verified)

**Headers Required:**
```
x-tap-signature: sha256_signature_here
Content-Type: application/json
```

**Webhook Payload Example:**
```json
{
  "id": "chg_TS01A2220231543Wk0s1944306",
  "object": "charge",
  "status": "CAPTURED",
  "amount": 10.5,
  "currency": "BHD",
  "customer": {
    "id": "cus_xxx",
    "phone": {
      "country_code": "+973",
      "number": "12345678"
    }
  },
  "reference": {
    "transaction": "payment-uuid",
    "order": "order-uuid"
  },
  "response": {
    "code": "000",
    "message": "Success"
  },
  "receipt": {
    "id": "receipt_xxx",
    "url": "https://tap.company/receipt/xxx"
  },
  "card": {
    "first_six": "424242",
    "last_four": "4242",
    "brand": "VISA",
    "scheme": "CREDIT"
  },
  "transaction": {
    "created": "2025-01-27T10:05:23Z",
    "url": "https://tap.company/charge/chg_xxx"
  }
}
```

**Backend Processing:**
1. Verify webhook signature using `x-tap-signature` header
2. Extract payment ID from `reference.order`
3. Map TAP status to our status
4. Update payment record
5. Update order status if fully paid
6. Return 200 OK to TAP

**TAP Status Mapping:**
- `CAPTURED` → `SUCCESS`
- `AUTHORIZED` → `SUCCESS`
- `INITIATED` → `INITIATED`
- `FAILED` → `FAILED`
- `CANCELLED` → `FAILED`
- `DECLINED` → `FAILED`

---

## Split Payment Support

### Use Case

Customer wants to pay BHD 25.500 order with:
- BHD 10.000 cash
- BHD 15.500 card

### Flow

```typescript
// Step 1: Create cash payment
POST /api/payments
{
  "orderId": "order-uuid",
  "method": "CASH",
  "amount": 10.000
}

// Response: Payment created, order still PENDING

// Step 2: Create card payment for remaining amount
POST /api/payments
{
  "orderId": "order-uuid",
  "method": "CARD",
  "amount": 15.500
}

// Response: Payment URL returned, customer completes payment

// Step 3: After card payment success
// Backend automatically marks order as PAID (total paid >= order total)
```

**Business Rules:**
- Multiple payments allowed per order
- Sum of successful payments must equal or exceed order total
- Order marked as PAID when fully paid
- Remaining amount calculated: `orderTotal - totalPaid`
- Payment amount cannot exceed remaining amount

---

## Security & Validation

### Payment Security

✅ **Always Validate:**
- Order belongs to user's company/store
- Order status is PENDING
- Payment amount > 0
- Payment amount ≤ remaining amount
- User has PROCESS_PAYMENT permission

✅ **TAP Webhook Security:**
- Verify HMAC-SHA256 signature
- Use timing-safe comparison
- Store TAP secret securely
- Always return 200 OK (even on errors)

✅ **Never Trust Frontend:**
- All calculations server-side
- Payment status updated only via webhook
- Amount validation on backend
- Provider reference stored for auditing

❌ **Forbidden Operations:**
- Process payment on DRAFT orders
- Process payment on PAID orders
- Accept payments exceeding remaining amount
- Skip webhook signature verification
- Update payment status from frontend

---

## Order Lifecycle with Payments

```
DRAFT (Cart)
  │
  │ Confirm Order
  ▼
PENDING (Awaiting Payment)
  │
  │ Process Payment(s)
  │ └─> Sum(SUCCESS payments) >= orderTotal
  ▼
PAID (Payment Complete)
  │
  │ (Optional) Process Refund
  ▼
REFUNDED
```

**Key Points:**
- Orders start as DRAFT (cart)
- Confirm order → status becomes PENDING
- Only PENDING orders can receive payments
- Order becomes PAID when total paid ≥ order total
- Inventory deducted ONLY when order becomes PAID

---

## Error Handling

### Common Errors

**1. Order Not Found**
```json
{
  "success": false,
  "message": "Order not found"
}
```

**2. Invalid Order Status**
```json
{
  "success": false,
  "message": "Cannot process payment for order with status: PAID. Order must be in PENDING status."
}
```

**3. Payment Amount Exceeds Balance**
```json
{
  "success": false,
  "message": "Payment amount (20.000) exceeds remaining balance (15.500)"
}
```

**4. TAP API Failure**
```json
{
  "success": false,
  "message": "Failed to create TAP payment: Invalid API key"
}
```

**5. Refund Already Processed**
```json
{
  "success": false,
  "message": "Payment is already refunded"
}
```

---

## Frontend Integration

### Complete Payment Flow Example

```typescript
// 1. Get order details and calculate remaining amount
async function getOrderPaymentInfo(orderId: string) {
  const response = await fetch(`/api/payments/order/${orderId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const { data, summary } = await response.json();

  return {
    payments: data,
    orderTotal: summary.orderTotal,
    totalPaid: summary.totalPaid,
    remainingAmount: summary.remainingAmount,
    fullyPaid: summary.fullyPaid
  };
}

// 2. Process cash payment
async function processCashPayment(orderId: string, amount: number) {
  const response = await fetch('/api/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      orderId,
      method: 'CASH',
      amount
    })
  });

  if (response.ok) {
    const { data } = await response.json();
    toast.success('Cash payment recorded');
    return data.payment;
  } else {
    const error = await response.json();
    toast.error(error.message);
    throw new Error(error.message);
  }
}

// 3. Process card payment
async function processCardPayment(
  orderId: string,
  amount: number,
  customerPhone: string
) {
  const response = await fetch('/api/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      orderId,
      method: 'CARD',
      amount,
      customerRef: customerPhone
    })
  });

  if (response.ok) {
    const { data } = await response.json();

    // Open TAP payment page
    window.open(data.paymentUrl, '_blank');

    toast.info('Redirecting to payment page...');

    // Poll payment status
    pollPaymentStatus(data.payment.id);

    return data.payment;
  } else {
    const error = await response.json();
    toast.error(error.message);
    throw new Error(error.message);
  }
}

// 4. Poll payment status (for card/wallet payments)
async function pollPaymentStatus(paymentId: string) {
  const maxAttempts = 60; // 5 minutes (5s interval)
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;

    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const { data } = await response.json();

      if (data.status === 'SUCCESS') {
        clearInterval(interval);
        toast.success('Payment successful!');
        // Refresh order
        await refreshOrder();
      } else if (data.status === 'FAILED') {
        clearInterval(interval);
        toast.error('Payment failed');
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        toast.warning('Payment status check timeout');
      }
    } catch (error) {
      console.error('Payment status check failed:', error);
    }
  }, 5000); // Check every 5 seconds
}

// 5. Process refund
async function processRefund(paymentId: string, reason: string) {
  const response = await fetch(`/api/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      refundReason: reason
    })
  });

  if (response.ok) {
    const { message } = await response.json();
    toast.success(message);
  } else {
    const error = await response.json();
    toast.error(error.message);
  }
}
```

---

### Payment UI Component Example

```tsx
function PaymentScreen({ orderId, orderTotal }: PaymentScreenProps) {
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    loadPaymentInfo();
  }, [orderId]);

  async function loadPaymentInfo() {
    const info = await getOrderPaymentInfo(orderId);
    setPaymentInfo(info);
    setAmount(info.remainingAmount);
  }

  async function handlePayment() {
    if (selectedMethod === 'CASH') {
      await processCashPayment(orderId, amount);
    } else {
      await processCardPayment(orderId, amount, customerPhone);
    }
    await loadPaymentInfo();
  }

  if (!paymentInfo) return <div>Loading...</div>;

  if (paymentInfo.fullyPaid) {
    return <div>Order fully paid! ✓</div>;
  }

  return (
    <div>
      <h2>Process Payment</h2>

      <div>
        <p>Order Total: BHD {paymentInfo.orderTotal}</p>
        <p>Total Paid: BHD {paymentInfo.totalPaid}</p>
        <p>Remaining: BHD {paymentInfo.remainingAmount}</p>
      </div>

      <div>
        <label>Payment Method:</label>
        <select
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value as any)}
        >
          <option value="CASH">Cash</option>
          <option value="CARD">Card</option>
        </select>
      </div>

      <div>
        <label>Amount:</label>
        <input
          type="number"
          step="0.001"
          max={paymentInfo.remainingAmount}
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
        />
      </div>

      <button onClick={handlePayment}>
        {selectedMethod === 'CASH' ? 'Record Payment' : 'Pay with Card'}
      </button>

      <div>
        <h3>Previous Payments</h3>
        {paymentInfo.payments.map((payment: any) => (
          <div key={payment.id}>
            {payment.method}: BHD {payment.amount} - {payment.status}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Testing Checklist

### Manual Testing

- [ ] Create CASH payment → Payment SUCCESS, order updated
- [ ] Create CARD payment → Payment URL returned
- [ ] TAP webhook with SUCCESS status → Payment marked SUCCESS
- [ ] TAP webhook with FAILED status → Payment marked FAILED
- [ ] Split payment (CASH + CARD) → Order marked PAID when total reached
- [ ] Payment amount exceeds remaining → Error returned
- [ ] Payment on DRAFT order → Error returned
- [ ] Payment on PAID order → Error returned
- [ ] Refund CASH payment → Status updated to REFUNDED
- [ ] Refund CARD payment → TAP refund created
- [ ] Invalid webhook signature → Rejected
- [ ] Get payments for order → All payments listed with summary

### TAP Testing

**Test Mode:**
- Use `sk_test_` and `pk_test_` keys
- Test card: 4242 4242 4242 4242
- Expiry: Any future date
- CVV: Any 3 digits

**Webhook Testing:**
- Use ngrok or similar to expose local endpoint
- Configure webhook URL in TAP dashboard
- Test with real TAP charge flow

---

## Production Deployment

### Environment Setup

```bash
# Production TAP Keys
TAP_SECRET_KEY=sk_live_xxxxxxxxxxxxx
TAP_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
TAP_WEBHOOK_SECRET=whsec_live_xxxxxxxx

# Production URLs
TAP_REDIRECT_URL=https://yourdomain.com/payment/callback
TAP_WEBHOOK_URL=https://yourdomain.com/api/webhooks/tap
```

### Deployment Checklist

- [ ] Update Prisma schema with payment changes
- [ ] Run database migration: `npx prisma migrate deploy`
- [ ] Set production TAP keys in environment
- [ ] Configure TAP webhook URL in dashboard
- [ ] Test webhook signature verification
- [ ] Set up payment monitoring/alerts
- [ ] Configure SSL for webhook endpoint
- [ ] Test with real TAP account in test mode
- [ ] Enable production mode in TAP dashboard

---

## Best Practices

### ✅ DO

- Always verify webhook signatures
- Store TAP charge ID (`providerRef`) for reference
- Handle TAP webhooks idempotently
- Log all payment attempts for auditing
- Support split payments
- Calculate remaining amount server-side
- Mark order PAID only when fully paid
- Return 200 OK to all TAP webhooks
- Use HTTPS for webhook endpoints
- Store payment failures with reasons

### ❌ DON'T

- Trust frontend payment success
- Skip signature verification
- Process payments on DRAFT orders
- Allow overpayment
- Deduct inventory before payment confirmation
- Expose TAP secret keys
- Use synchronous payment verification (use webhooks)
- Return errors to TAP webhooks (causes retries)
- Allow payments without permission checks

---

## Summary

✅ **Complete Payment System:**
- Multi-method support (CASH, CARD, WALLET)
- TAP Payments integration
- Split payment capability
- Refund processing
- Real-time webhook handling

✅ **Security:**
- Webhook signature verification
- Permission-based access control
- Server-side validation
- Multi-tenant isolation

✅ **POS-Ready:**
- Fast cash payments
- Card payment with TAP redirect
- Split payment support
- Real-time order status updates
- Complete audit trail

**The payment system is production-ready for Bahrain retail POS operations!** 🚀🇧🇭
