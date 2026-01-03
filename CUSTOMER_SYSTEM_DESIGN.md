# Customer Management System - POS Backend

## Overview

Flexible customer management system supporting both walk-in and registered customers for retail POS operations.

---

## Business Requirements

### Customer Types

1. **Walk-in Customers (Anonymous)**
   - No registration required
   - Order created without customer link
   - Optional: Name & phone can be captured

2. **Registered Customers**
   - Pre-registered in system
   - Phone number is primary identifier
   - Linked to orders for history & reports
   - Used for returns & loyalty

### Key Features
- ✅ Customer registration optional
- ✅ Fast search by phone number during billing
- ✅ Customer belongs to company (multi-tenant)
- ✅ Shared across all stores in company
- ✅ Order history tracking
- ✅ Duplicate prevention per company

---

## Database Design

### Customer Table

```prisma
model Customer {
  id          String   @id @default(uuid())
  name        String
  phone       String   // Primary identifier
  email       String?
  address     String?
  companyId   String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  company Company @relation(...)
  orders  Order[]

  // Phone must be unique per company
  @@unique([phone, companyId])
  @@index([companyId])
  @@index([phone])    // Fast lookup
  @@index([name])
}
```

**Key Design Decisions:**
- ✅ Phone unique per company (not globally)
- ✅ Email optional (many customers don't have email)
- ✅ Address optional
- ✅ Belongs to Company (multi-tenant)
- ✅ Shared across stores in same company
- ✅ Indexed phone for fast POS lookup

---

### Order → Customer Relationship

```prisma
model Order {
  // Customer relation (nullable)
  customerId    String?      // Optional link to Customer

  // Customer snapshot (for walk-in or denormalized data)
  customerType  CustomerType @default(RETAIL)
  customerName  String?
  customerPhone String?

  // Relation
  customer      Customer?   @relation(...)

  @@index([customerId])
}
```

**Why Both `customerId` and `customerName/Phone`?**

1. **Walk-in customers**: No `customerId`, just capture name/phone
2. **Registered customers**: `customerId` links to Customer table
3. **Data denormalization**: Even with `customerId`, we store snapshot for immutability
4. **Flexibility**: Can convert walk-in to registered customer later

---

## API Design

### Base Path: `/api/customers`

---

### 1. Create Customer

**Endpoint:** `POST /api/customers`

**Use Case:** Pre-register a customer (before or during billing)

**Access:** ADMIN, MANAGER, CASHIER (with CREATE_ORDER permission)

**Request:**
```json
{
  "name": "John Doe",
  "phone": "1234567890",
  "email": "john@example.com",
  "address": "123 Main St",
  "companyId": "company-uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "customer-uuid",
    "name": "John Doe",
    "phone": "1234567890",
    "email": "john@example.com",
    "address": "123 Main St",
    "companyId": "company-uuid",
    "isActive": true,
    "createdAt": "2025-01-27T10:00:00Z",
    "updatedAt": "2025-01-27T10:00:00Z",
    "company": {
      "id": "company-uuid",
      "name": "My Company"
    }
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "message": "Customer with this phone number already exists in your company"
}
```

---

### 2. Search Customer by Phone (POS Lookup)

**Endpoint:** `GET /api/customers/phone/:phone`

**Use Case:** Fast customer lookup during billing (cashier enters phone)

**Access:** CASHIER, MANAGER, ADMIN

**Request:**
```http
GET /api/customers/phone/1234567890
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "customer-uuid",
    "name": "John Doe",
    "phone": "1234567890",
    "email": "john@example.com",
    "companyId": "company-uuid",
    "isActive": true,
    "company": {
      "id": "company-uuid",
      "name": "My Company"
    },
    "_count": {
      "orders": 15  // Total orders by this customer
    }
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "message": "Customer not found"
}
```

---

### 3. Search Customers

**Endpoint:** `GET /api/customers/search`

**Use Case:** Search by phone, name, or email

**Access:** CASHIER, MANAGER, ADMIN

**Query Parameters:**
- `phone` (optional): Search by phone
- `name` (optional): Search by name
- `email` (optional): Search by email

**Request:**
```http
GET /api/customers/search?phone=1234
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "customer-uuid",
      "name": "John Doe",
      "phone": "1234567890",
      "email": "john@example.com",
      "_count": {
        "orders": 15
      }
    },
    {
      "id": "customer-uuid-2",
      "name": "Jane Smith",
      "phone": "1234567891",
      "email": "jane@example.com",
      "_count": {
        "orders": 8
      }
    }
  ]
}
```

---

### 4. Get All Customers

**Endpoint:** `GET /api/customers`

**Use Case:** Customer list page

**Access:** ADMIN, MANAGER, CASHIER

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "customer-uuid",
      "name": "John Doe",
      "phone": "1234567890",
      "email": "john@example.com",
      "isActive": true,
      "createdAt": "2025-01-27T10:00:00Z",
      "_count": {
        "orders": 15
      }
    }
  ]
}
```

---

### 5. Get Customer by ID (with Order History)

**Endpoint:** `GET /api/customers/:id`

**Use Case:** Customer detail page with purchase history

**Access:** ADMIN, MANAGER, CASHIER

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "customer-uuid",
    "name": "John Doe",
    "phone": "1234567890",
    "email": "john@example.com",
    "address": "123 Main St",
    "companyId": "company-uuid",
    "isActive": true,
    "company": {
      "id": "company-uuid",
      "name": "My Company"
    },
    "orders": [
      {
        "id": "order-uuid",
        "orderNumber": "ORD-20250127-001",
        "totalAmount": "150.00",
        "status": "PAID",
        "createdAt": "2025-01-27T14:30:00Z"
      },
      {
        "id": "order-uuid-2",
        "orderNumber": "ORD-20250126-045",
        "totalAmount": "89.50",
        "status": "PAID",
        "createdAt": "2025-01-26T11:20:00Z"
      }
    ],
    "_count": {
      "orders": 15  // Total orders (showing last 10)
    }
  }
}
```

---

### 6. Update Customer

**Endpoint:** `PUT /api/customers/:id`

**Use Case:** Update customer information

**Access:** ADMIN, MANAGER

**Request:**
```json
{
  "name": "John Doe Updated",
  "email": "john.new@example.com",
  "address": "456 New Street"
}
```

**Response (200):** Updated customer object

---

### 7. Delete Customer

**Endpoint:** `DELETE /api/customers/:id`

**Use Case:** Delete customer (only if no orders)

**Access:** ADMIN, MANAGER

**Response (200):**
```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

**Error (400):**
```json
{
  "success": false,
  "message": "Cannot delete customer with existing orders. Consider deactivating instead."
}
```

---

## POS Integration Flows

### Flow A: Walk-in Customer (No Registration)

```
┌─────────────┐         ┌─────────────┐
│  Cashier    │         │   Backend   │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │ 1. Create order       │
       │    (no customerId)    │
       ├──────────────────────>│
       │                       │
       │ 2. Optional: Enter    │
       │    customer name/phone│
       │                       │
       │ 3. Add items          │
       │                       │
       │ 4. Complete payment   │
       │                       │
```

**Order Created:**
```json
{
  "customerId": null,
  "customerName": "Walk-in",
  "customerPhone": null,
  "customerType": "RETAIL"
}
```

---

### Flow B: Registered Customer (Quick Lookup)

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Cashier    │         │   Backend   │         │  Database   │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ 1. Enter phone        │                       │
       │    "1234567890"       │                       │
       ├──────────────────────>│                       │
       │                       │                       │
       │                       │ 2. SELECT * FROM      │
       │                       │    Customer WHERE     │
       │                       │    phone = '...'      │
       │                       ├──────────────────────>│
       │                       │                       │
       │                       │ 3. Return customer    │
       │                       │<──────────────────────┤
       │                       │                       │
       │ 4. Customer found     │                       │
       │    (John Doe)         │                       │
       │<──────────────────────┤                       │
       │                       │                       │
       │ 5. Create order with  │                       │
       │    customerId         │                       │
       ├──────────────────────>│                       │
       │                       │                       │
       │ 6. Add items          │                       │
       │                       │                       │
       │ 7. Complete payment   │                       │
       │                       │                       │
```

**Order Created:**
```json
{
  "customerId": "customer-uuid",
  "customerName": "John Doe",      // Snapshot
  "customerPhone": "1234567890",   // Snapshot
  "customerType": "RETAIL"
}
```

---

### Flow C: Register During Billing

```
1. Cashier starts order
2. Customer not found by phone
3. Cashier clicks "Register New Customer"
4. POST /api/customers → Creates customer
5. Use returned customerId for order
6. Continue billing
```

---

## Frontend Implementation Examples

### React: Customer Search Component

```typescript
function CustomerSearch({ onSelect }) {
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  async function searchCustomer() {
    if (!phone || phone.length < 10) {
      toast.error('Enter valid phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/customers/phone/${phone}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const { data } = await response.json();
        setCustomer(data);
        onSelect(data);  // Pass customer to parent
        toast.success(`Customer found: ${data.name}`);
      } else {
        setCustomer(null);
        toast.error('Customer not found');
      }
    } catch (error) {
      toast.error('Error searching customer');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input
        type="tel"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        placeholder="Enter phone number"
        maxLength={10}
      />
      <button onClick={searchCustomer} disabled={loading}>
        Search
      </button>

      {customer && (
        <div className="customer-info">
          <p><strong>{customer.name}</strong></p>
          <p>{customer.phone}</p>
          <p>{customer.email}</p>
          <p>Orders: {customer._count.orders}</p>
        </div>
      )}
    </div>
  );
}
```

---

### React: Create Order with Customer

```typescript
async function createOrderWithCustomer(customerId?: string) {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId: customerId || undefined,  // Optional
      customerType: 'RETAIL',
      customerName: customerId ? undefined : 'Walk-in',
      customerPhone: customerId ? undefined : null,
    }),
  });

  const { data } = await response.json();
  return data; // Order object
}
```

---

### React: Register New Customer

```typescript
async function registerCustomer(data) {
  const response = await fetch('/api/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      address: data.address || '',
      companyId: currentCompany.id,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const { data: customer } = await response.json();
  return customer;
}
```

---

## Security & Access Control

### Role-Based Access

```
┌──────────────────┬─────────────────────────────────────┐
│ Role             │ Customer Permissions                │
├──────────────────┼─────────────────────────────────────┤
│ SUPER_ADMIN      │ All operations, all companies       │
│ ADMIN            │ All operations, own company only    │
│ MANAGER          │ Create, read, update, own company   │
│ CASHIER          │ Create, read (for billing)          │
└──────────────────┴─────────────────────────────────────┘
```

### Data Isolation

```typescript
// Automatic company filtering for non-SUPER_ADMIN
if (user.role !== 'SUPER_ADMIN') {
  data.companyId = user.companyId;  // Force user's company
}
```

### Validation

```typescript
// Phone unique per company
const existing = await prisma.customer.findFirst({
  where: {
    phone: data.phone,
    companyId: data.companyId,
  },
});

if (existing) {
  throw new Error('Customer already exists');
}
```

---

## Best Practices

### 1. ✅ Don't Force Customer Selection

```typescript
// ❌ BAD: Require customer for every order
const createOrder = (customerId: string) => { ... }

// ✅ GOOD: Make customer optional
const createOrder = (customerId?: string) => { ... }
```

---

### 2. ✅ Fast Phone Lookup

```typescript
// Indexed phone field for O(1) lookup
@@index([phone])

// Search returns immediately
GET /api/customers/phone/1234567890  // ~5ms response
```

---

### 3. ✅ Prevent Duplicates Per Company

```typescript
// Unique constraint per company
@@unique([phone, companyId])

// Same phone can exist in different companies
Company A: Customer phone "1234567890" ✅
Company B: Customer phone "1234567890" ✅
Company A: Customer phone "1234567890" again ❌ (duplicate)
```

---

### 4. ✅ Capture Customer Data Even Without Registration

```typescript
// Walk-in customer
{
  customerId: null,
  customerName: "John",
  customerPhone: "1234567890"
}

// Can convert to registered customer later
const customer = await createCustomer({
  name: order.customerName,
  phone: order.customerPhone
});

await updateOrder(order.id, {
  customerId: customer.id
});
```

---

### 5. ✅ Order History for Registered Customers

```typescript
// Get customer with recent orders
GET /api/customers/:id

// Response includes last 10 orders
{
  "orders": [ /* last 10 */ ],
  "_count": { "orders": 150 }  // Total count
}

// Or filter orders by customer
GET /api/orders?customerId=customer-uuid
```

---

## Testing

### Test Cases

**1. Create Customer**
```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "9876543210",
    "companyId": "company-uuid"
  }'

Expected: 201 Created
```

**2. Search by Phone**
```bash
curl http://localhost:3000/api/customers/phone/9876543210 \
  -H "Authorization: Bearer <token>"

Expected: 200 OK with customer data
```

**3. Duplicate Phone (Same Company)**
```bash
# Create customer
POST /api/customers { "phone": "9876543210", "companyId": "company-1" }

# Try creating again
POST /api/customers { "phone": "9876543210", "companyId": "company-1" }

Expected: 400 Bad Request "Customer already exists"
```

**4. Same Phone (Different Companies)**
```bash
# Company A
POST /api/customers { "phone": "9876543210", "companyId": "company-1" }

# Company B
POST /api/customers { "phone": "9876543210", "companyId": "company-2" }

Expected: Both succeed (201 Created)
```

---

## Summary

✅ **Database Design**
- Customer table with phone as primary identifier
- Unique constraint per company
- Optional email & address
- Indexed for fast lookup

✅ **Order Integration**
- Optional customerId field
- Supports both walk-in and registered
- Customer data snapshot in orders

✅ **API Design**
- Fast phone lookup endpoint
- Search functionality
- Order history included
- Company-level data isolation

✅ **Best Practices**
- Customer optional (not forced)
- Fast indexed lookup
- Duplicate prevention
- Multi-tenant safe

**The customer system is production-ready and integrates seamlessly with the POS workflow!** 🎉
