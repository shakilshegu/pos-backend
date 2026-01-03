# Customer System - Quick Reference

## For Frontend Developers

### Customer Types

1. **Walk-in** - No registration, order created without customer link
2. **Registered** - Pre-registered, linked to orders

---

## Key API Endpoints

### 1. Fast Phone Lookup (Most Important for POS)

```javascript
// Search customer by phone during billing
const response = await fetch(
  `/api/customers/phone/1234567890`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);

const { data: customer } = await response.json();

// Use customer.id when creating order
```

---

### 2. Create Customer

```javascript
const response = await fetch('/api/customers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: "John Doe",
    phone: "1234567890",
    email: "john@example.com",  // Optional
    address: "123 Main St",      // Optional
    companyId: currentCompany.id
  })
});
```

---

### 3. Search Customers

```javascript
// Search by phone, name, or email
const response = await fetch(
  `/api/customers/search?phone=1234`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);

const { data: customers } = await response.json();
```

---

## POS Integration

### Complete Customer Lookup Flow

```typescript
function CustomerLookup({ onSelect }) {
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState(null);

  async function searchCustomer() {
    try {
      const res = await fetch(`/api/customers/phone/${phone}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const { data } = await res.json();
        setCustomer(data);
        onSelect(data.id);  // Pass customer ID to order
      } else {
        setCustomer(null);
        // Show "Customer not found, create new?"
      }
    } catch (error) {
      console.error('Search failed', error);
    }
  }

  return (
    <div>
      <input
        type="tel"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        placeholder="Phone number"
      />
      <button onClick={searchCustomer}>Search</button>

      {customer && (
        <div>
          <p>Name: {customer.name}</p>
          <p>Phone: {customer.phone}</p>
          <p>Orders: {customer._count.orders}</p>
        </div>
      )}
    </div>
  );
}
```

---

### Create Order with Customer

```typescript
// Option 1: With registered customer
await fetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify({
    customerId: "customer-uuid",  // Link to customer
    customerType: "RETAIL"
  })
});

// Option 2: Walk-in customer (no registration)
await fetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify({
    // No customerId
    customerName: "Walk-in",     // Optional
    customerPhone: null,         // Optional
    customerType: "RETAIL"
  })
});
```

---

## Response Structures

### Customer Object

```javascript
{
  id: "uuid",
  name: "John Doe",
  phone: "1234567890",
  email: "john@example.com",
  address: "123 Main St",
  companyId: "company-uuid",
  isActive: true,
  createdAt: "2025-01-27T10:00:00Z",
  company: {
    id: "uuid",
    name: "My Company"
  },
  _count: {
    orders: 15  // Total orders
  }
}
```

### Customer with Order History

```javascript
{
  ...customerFields,
  orders: [
    {
      id: "order-uuid",
      orderNumber: "ORD-20250127-001",
      totalAmount: "150.00",
      status: "PAID",
      createdAt: "2025-01-27T14:30:00Z"
    }
  ]
}
```

---

## Common Use Cases

### Case 1: Billing with Known Customer

```typescript
1. Cashier asks for phone number
2. Search: GET /api/customers/phone/:phone
3. If found:
   - Show customer info
   - Create order with customerId
4. If not found:
   - Ask "Register new customer?"
   - If yes: POST /api/customers
   - If no: Continue as walk-in
```

---

### Case 2: Walk-in Customer

```typescript
1. Create order without customerId
2. Optionally capture name/phone
3. Complete billing
4. Order stored with customer snapshot
```

---

### Case 3: Customer Registration During Billing

```typescript
async function registerAndCreateOrder(customerData) {
  // 1. Register customer
  const customerRes = await fetch('/api/customers', {
    method: 'POST',
    body: JSON.stringify(customerData)
  });
  const { data: customer } = await customerRes.json();

  // 2. Create order with customer link
  const orderRes = await fetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      customerId: customer.id,
      customerType: 'RETAIL'
    })
  });

  return orderRes.json();
}
```

---

## Error Handling

```typescript
// Customer not found
if (response.status === 404) {
  toast.info('Customer not found. Register?');
}

// Duplicate phone
if (response.status === 400) {
  toast.error('Customer already exists');
}

// No permission
if (response.status === 403) {
  toast.error('Access denied');
}
```

---

## Best Practices

### ✅ DO

- Make customer selection optional
- Auto-focus phone input for fast scanning
- Show order count for registered customers
- Clear search after selection
- Allow walk-in customers (no registration)

### ❌ DON'T

- Force customer registration for every order
- Search by partial phone (use minimum 10 digits)
- Create duplicate customers
- Allow editing phone after creation (breaks uniqueness)

---

## Testing Checklist

- [ ] Search by phone → Customer found
- [ ] Search by invalid phone → Not found
- [ ] Create order without customer → Success (walk-in)
- [ ] Create order with customer → Success (registered)
- [ ] Register duplicate phone → Error
- [ ] View customer order history → Shows orders
- [ ] Delete customer with orders → Error

---

## Quick Links

- Full Documentation: [CUSTOMER_SYSTEM_DESIGN.md](CUSTOMER_SYSTEM_DESIGN.md)
- API Docs: [FRONTEND_API_DOCS.md](FRONTEND_API_DOCS.md)
- System Status: [SYSTEM_STATUS.md](SYSTEM_STATUS.md)
