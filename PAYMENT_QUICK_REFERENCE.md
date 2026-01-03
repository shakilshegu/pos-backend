# Payment System - Quick Reference

## For Frontend Developers

### Payment Methods
- **CASH** - Instant success
- **CARD** - Credit/Debit via TAP
- **WALLET** - Apple Pay / Google Pay via TAP

---

## Quick Start

### 1. Process Cash Payment

```javascript
const response = await fetch('/api/payments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderId: 'order-uuid',
    method: 'CASH',
    amount: 10.500
  })
});

const { data } = await response.json();
// Payment immediately marked as SUCCESS
```

---

### 2. Process Card Payment

```javascript
const response = await fetch('/api/payments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderId: 'order-uuid',
    method: 'CARD',
    amount: 10.500,
    customerRef: '12345678' // Customer phone
  })
});

const { data } = await response.json();

// Redirect to TAP payment page
window.open(data.paymentUrl, '_blank');

// Poll for payment status
pollPaymentStatus(data.payment.id);
```

---

### 3. Check Payment Status

```javascript
async function pollPaymentStatus(paymentId) {
  const interval = setInterval(async () => {
    const res = await fetch(`/api/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const { data } = await res.json();

    if (data.status === 'SUCCESS') {
      clearInterval(interval);
      toast.success('Payment successful!');
    } else if (data.status === 'FAILED') {
      clearInterval(interval);
      toast.error('Payment failed');
    }
  }, 5000); // Check every 5 seconds
}
```

---

### 4. Get Order Payment Summary

```javascript
const response = await fetch(`/api/payments/order/${orderId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { data, summary } = await response.json();

console.log('Total Paid:', summary.totalPaid);
console.log('Remaining:', summary.remainingAmount);
console.log('Fully Paid:', summary.fullyPaid);
```

---

### 5. Split Payment Example

```javascript
// Step 1: Pay BHD 10.000 with cash
await fetch('/api/payments', {
  method: 'POST',
  body: JSON.stringify({
    orderId: 'order-uuid',
    method: 'CASH',
    amount: 10.000
  })
});

// Step 2: Pay remaining BHD 15.500 with card
await fetch('/api/payments', {
  method: 'POST',
  body: JSON.stringify({
    orderId: 'order-uuid',
    method: 'CARD',
    amount: 15.500
  })
});

// Order automatically marked as PAID when total reached
```

---

### 6. Process Refund

```javascript
const response = await fetch(`/api/payments/${paymentId}/refund`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    refundReason: 'Customer returned product'
  })
});

const { message } = await response.json();
toast.success(message);
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments` | Create payment |
| GET | `/api/payments/:id` | Get payment by ID |
| GET | `/api/payments/order/:orderId` | Get payments for order |
| GET | `/api/payments` | List payments with filters |
| GET | `/api/payments/statistics` | Get payment statistics |
| POST | `/api/payments/:id/refund` | Process refund |

---

## Response Formats

### Cash Payment Response
```json
{
  "success": true,
  "message": "Cash payment recorded successfully",
  "data": {
    "payment": {
      "id": "uuid",
      "status": "SUCCESS",
      "amount": "10.500",
      "method": "CASH"
    }
  }
}
```

### Card Payment Response
```json
{
  "success": true,
  "message": "Payment initiated. Redirect customer to payment page.",
  "data": {
    "payment": {
      "id": "uuid",
      "status": "INITIATED",
      "amount": "10.500",
      "method": "CARD"
    },
    "paymentUrl": "https://tap.company/charge/xxx",
    "chargeId": "chg_xxx"
  }
}
```

### Order Payment Summary
```json
{
  "success": true,
  "data": [...payments],
  "summary": {
    "orderTotal": 25.500,
    "totalPaid": 10.000,
    "remainingAmount": 15.500,
    "fullyPaid": false
  }
}
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

---

## Common Error Messages

```javascript
// Order not in PENDING status
"Cannot process payment for order with status: DRAFT"

// Amount exceeds remaining
"Payment amount (20.000) exceeds remaining balance (15.500)"

// Order already paid
"Order is already fully paid"

// Invalid refund
"Only successful payments can be refunded"
```

---

## Testing

### Test Card (TAP Test Mode)
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVV: Any 3 digits

### Test Flow
1. Create order → Confirm → Status PENDING
2. Create payment → Get payment URL (for card)
3. Complete payment on TAP page
4. Check payment status → SUCCESS
5. Check order status → PAID

---

## Best Practices

✅ **DO:**
- Check remaining amount before payment
- Poll payment status for card/wallet
- Show payment summary to user
- Handle split payments
- Validate payment amount

❌ **DON'T:**
- Create payments on DRAFT orders
- Exceed remaining amount
- Trust frontend for payment success
- Skip payment status polling

---

## Complete Payment Component

```tsx
function PaymentForm({ orderId }: { orderId: string }) {
  const [method, setMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [amount, setAmount] = useState(0);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadPaymentSummary();
  }, [orderId]);

  async function loadPaymentSummary() {
    const res = await fetch(`/api/payments/order/${orderId}`);
    const { summary } = await res.json();
    setSummary(summary);
    setAmount(summary.remainingAmount);
  }

  async function handleSubmit() {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId,
        method,
        amount
      })
    });

    if (res.ok) {
      const { data } = await res.json();

      if (method === 'CARD') {
        window.open(data.paymentUrl, '_blank');
        pollPaymentStatus(data.payment.id);
      } else {
        toast.success('Cash payment recorded');
        await loadPaymentSummary();
      }
    }
  }

  if (!summary) return <div>Loading...</div>;
  if (summary.fullyPaid) return <div>Paid ✓</div>;

  return (
    <div>
      <p>Remaining: BHD {summary.remainingAmount}</p>

      <select value={method} onChange={e => setMethod(e.target.value)}>
        <option value="CASH">Cash</option>
        <option value="CARD">Card</option>
      </select>

      <input
        type="number"
        step="0.001"
        max={summary.remainingAmount}
        value={amount}
        onChange={e => setAmount(parseFloat(e.target.value))}
      />

      <button onClick={handleSubmit}>
        {method === 'CASH' ? 'Record Payment' : 'Pay with Card'}
      </button>
    </div>
  );
}
```

---

## Quick Links

- Full Documentation: [PAYMENT_SYSTEM_DESIGN.md](PAYMENT_SYSTEM_DESIGN.md)
- TAP Documentation: https://developers.tap.company/reference
- System Status: [SYSTEM_STATUS.md](SYSTEM_STATUS.md)
