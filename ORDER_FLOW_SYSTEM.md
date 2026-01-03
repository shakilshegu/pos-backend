# POS Order Creation Flow - Complete System Design

## Overview

Production-ready order management system for retail POS with barcode scanning, inventory validation, and real-time calculations.

---

## Order Status Flow

```
DRAFT → PENDING → PAID
  ↓
CANCELLED
```

**Status Definitions:**
- **DRAFT**: Order being created, items can be added/removed
- **PENDING**: Order confirmed, awaiting payment
- **PAID**: Payment completed, order finalized
- **CANCELLED**: Order cancelled (from DRAFT or PENDING)

---

## Database Schema

### Order Table

```prisma
model Order {
  id            String       @id @default(uuid())
  orderNumber   String       @unique  // ORD-20250127-001

  // Multi-tenant
  companyId     String
  storeId       String
  cashierId     String
  shiftId       String?

  // Customer (optional)
  customerId    String?
  customerType  CustomerType @default(RETAIL)
  customerName  String?
  customerPhone String?

  // Amounts (server-calculated)
  subtotal      Decimal  @db.Decimal(10, 2)
  taxAmount     Decimal  @db.Decimal(10, 2)
  discountAmount Decimal @db.Decimal(10, 2)
  totalAmount   Decimal  @db.Decimal(10, 2)

  // Status
  status        OrderStatus @default(DRAFT)

  // Relations
  items         OrderItem[]
  payments      Payment[]
}
```

### OrderItem Table

```prisma
model OrderItem {
  id               String  @id @default(uuid())
  orderId          String

  // Product references
  productId        String
  productVariantId String

  // Snapshots (immutable)
  productName      String
  variantName      String
  sku              String?

  // Pricing (snapshot at time of sale)
  unitPrice        Decimal @db.Decimal(10, 2)
  quantity         Float
  taxRate          Decimal @db.Decimal(5, 2)
  taxAmount        Decimal @db.Decimal(10, 2)
  discountAmount   Decimal @db.Decimal(10, 2)
  subtotal         Decimal @db.Decimal(10, 2)
  totalAmount      Decimal @db.Decimal(10, 2)
}
```

---

## Complete POS Flow

### Step-by-Step Process

```
1. Cashier opens POS screen
   └─> Create DRAFT order

2. Cashier scans product barcode
   └─> Add item by barcode
       ├─> Find product variant
       ├─> Check inventory
       ├─> Calculate pricing
       └─> Add to order OR increase quantity

3. Repeat Step 2 for all items

4. (Optional) Attach customer
   └─> Link registered customer

5. Confirm order
   └─> Status: DRAFT → PENDING

6. Process payment
   └─> Status: PENDING → PAID
   └─> Deduct inventory
```

---

## API Endpoints

### 1. Create Order (Draft)

**Endpoint:** `POST /api/orders`

**Use Case:** Create new order when POS screen opens

**Access:** CASHIER, MANAGER, ADMIN

**Request:**
```json
{
  "customerId": "customer-uuid",  // Optional
  "customerType": "RETAIL",       // Or WHOLESALE
  "customerName": "Walk-in",      // Optional
  "customerPhone": null,          // Optional
  "notes": "Special instructions" // Optional
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "order-uuid",
    "orderNumber": "ORD-20250127-001",
    "companyId": "company-uuid",
    "storeId": "store-uuid",
    "cashierId": "user-uuid",
    "customerType": "RETAIL",
    "status": "DRAFT",
    "subtotal": "0.00",
    "taxAmount": "0.00",
    "discountAmount": "0.00",
    "totalAmount": "0.00",
    "items": [],
    "createdAt": "2025-01-27T10:00:00Z"
  }
}
```

---

### 2. Add Item by Barcode ⭐ (PRIMARY POS METHOD)

**Endpoint:** `POST /api/orders/:orderId/items/barcode`

**Use Case:** Cashier scans product barcode during billing

**Access:** CASHIER, MANAGER, ADMIN

**Request:**
```json
{
  "barcode": "1234567890123",
  "quantity": 1,              // Optional, default: 1
  "discountAmount": 0         // Optional, default: 0
}
```

**Logic:**
1. Find product variant by barcode
2. Validate company & store ownership
3. Check inventory availability
4. If item exists in order → **Increase quantity**
5. If new item → **Add to order**
6. Recalculate order totals

**Response (201 - New Item):**
```json
{
  "success": true,
  "message": "Item added to order",
  "action": "added",
  "data": {
    "id": "item-uuid",
    "orderId": "order-uuid",
    "productId": "product-uuid",
    "productVariantId": "variant-uuid",
    "productName": "T-Shirt",
    "variantName": "Medium Blue",
    "sku": "TS-M-BLUE",
    "unitPrice": "29.99",
    "quantity": 1,
    "taxRate": "15.00",
    "taxAmount": "4.50",
    "discountAmount": "0.00",
    "subtotal": "29.99",
    "totalAmount": "34.49"
  }
}
```

**Response (200 - Quantity Increased):**
```json
{
  "success": true,
  "message": "Quantity increased to 3",
  "action": "updated",
  "data": {
    "id": "item-uuid",
    "quantity": 3,
    "subtotal": "89.97",
    "taxAmount": "13.50",
    "totalAmount": "103.47"
  }
}
```

**Error (400 - Out of Stock):**
```json
{
  "success": false,
  "message": "Product \"T-Shirt - Medium Blue\" is out of stock"
}
```

**Error (400 - Insufficient Stock):**
```json
{
  "success": false,
  "message": "Insufficient stock. Available: 5, Total requested: 10"
}
```

---

### 3. Add Item Manually (by Variant ID)

**Endpoint:** `POST /api/orders/:orderId/items`

**Use Case:** Add item without barcode (manual selection)

**Request:**
```json
{
  "productVariantId": "variant-uuid",
  "quantity": 2,
  "discountAmount": 5.00
}
```

**Response:** Same as barcode method

---

### 4. Update Item Quantity

**Endpoint:** `PATCH /api/orders/:orderId/items/:itemId`

**Use Case:** Manually adjust quantity or discount

**Request:**
```json
{
  "quantity": 5,
  "discountAmount": 10.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order item updated successfully",
  "data": {
    "id": "item-uuid",
    "quantity": 5,
    "discountAmount": "10.00",
    "subtotal": "149.95",
    "taxAmount": "22.49",
    "totalAmount": "162.44"
  }
}
```

---

### 5. Remove Item

**Endpoint:** `DELETE /api/orders/:orderId/items/:itemId`

**Use Case:** Remove item from order

**Response:**
```json
{
  "success": true,
  "message": "Order item removed successfully"
}
```

---

### 6. Attach Customer

**Endpoint:** `PATCH /api/orders/:orderId`

**Use Case:** Link customer to order (after or during billing)

**Request:**
```json
{
  "customerId": "customer-uuid",
  "customerType": "WHOLESALE"
}
```

**Response:** Updated order object

---

### 7. Confirm Order

**Endpoint:** `POST /api/orders/:orderId/confirm`

**Use Case:** Finalize order before payment

**Request:** Empty body

**Response:**
```json
{
  "success": true,
  "message": "Order confirmed successfully",
  "data": {
    "id": "order-uuid",
    "status": "PENDING",
    "orderNumber": "ORD-20250127-001",
    "totalAmount": "456.78"
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "message": "Cannot confirm order with no items"
}
```

---

### 8. Cancel Order

**Endpoint:** `POST /api/orders/:orderId/cancel`

**Use Case:** Cancel order before payment

**Request:**
```json
{
  "cancelReason": "Customer changed mind"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "id": "order-uuid",
    "status": "CANCELLED",
    "cancelledAt": "2025-01-27T11:00:00Z",
    "cancelReason": "Customer changed mind"
  }
}
```

---

## Barcode Scanning Logic (Detailed)

### Flow Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Cashier   │         │   Backend   │         │  Database   │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ 1. Scan barcode       │                       │
       │    "1234567890"       │                       │
       ├──────────────────────>│                       │
       │                       │                       │
       │                       │ 2. Find variant by    │
       │                       │    barcode            │
       │                       ├──────────────────────>│
       │                       │                       │
       │                       │ 3. Validate:          │
       │                       │    - Active?          │
       │                       │    - Same company?    │
       │                       │    - Stock > 0?       │
       │                       │                       │
       │                       │ 4. Check if item      │
       │                       │    exists in order    │
       │                       ├──────────────────────>│
       │                       │                       │
       │                       │ 5a. EXISTS:           │
       │                       │    Increase quantity  │
       │                       │ 5b. NEW:              │
       │                       │    Add new item       │
       │                       │                       │
       │                       │ 6. Recalculate totals │
       │                       │    - subtotal         │
       │                       │    - taxAmount        │
       │                       │    - totalAmount      │
       │                       │                       │
       │ 7. Return result      │                       │
       │<──────────────────────┤                       │
       │                       │                       │
```

---

## Calculation Rules (Server-Side)

### Item Calculations

```typescript
// 1. Select price based on customer type
const unitPrice = customerType === 'WHOLESALE' && variant.wholesalePrice
  ? variant.wholesalePrice
  : variant.retailPrice;

// 2. Calculate subtotal
const subtotal = unitPrice × quantity;

// 3. Calculate tax
const taxAmount = (subtotal × taxRate) / 100;

// 4. Calculate total
const totalAmount = subtotal + taxAmount - discountAmount;
```

### Order Totals

```typescript
// Sum all items
const orderSubtotal = sum(items.map(i => i.subtotal));
const orderTaxAmount = sum(items.map(i => i.taxAmount));
const orderDiscountAmount = sum(items.map(i => i.discountAmount));
const orderTotalAmount = orderSubtotal + orderTaxAmount - orderDiscountAmount;
```

**✅ All calculations done on backend (never trust frontend)**

---

## Inventory Validation

### Stock Check (Before Adding Item)

```typescript
1. Get inventory for variant at current store
2. If quantity === 0 → Error: "Out of stock"
3. If requested > available → Error: "Insufficient stock"
4. If item exists in order:
   - Check: (existingQty + newQty) <= available
5. Proceed if validation passes
```

**Note:** Inventory is NOT deducted when adding to order.
**Inventory is deducted ONLY after payment is completed.**

---

## Frontend Integration

### Complete POS Flow Example

```typescript
// 1. Create order when POS opens
async function startNewOrder() {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customerType: 'RETAIL'
    })
  });

  const { data: order } = await response.json();
  setCurrentOrder(order);
}

// 2. Scan barcode and add item
async function scanBarcode(barcode: string) {
  const response = await fetch(
    `/api/orders/${currentOrder.id}/items/barcode`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ barcode })
    }
  );

  if (response.ok) {
    const { data, action, message } = await response.json();

    if (action === 'added') {
      toast.success('Item added to cart');
    } else if (action === 'updated') {
      toast.success(message); // "Quantity increased to 3"
    }

    // Refresh order to get updated totals
    await refreshOrder();
  } else {
    const error = await response.json();
    toast.error(error.message);
  }
}

// 3. Refresh order (get latest totals)
async function refreshOrder() {
  const response = await fetch(
    `/api/orders/${currentOrder.id}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  const { data } = await response.json();
  setCurrentOrder(data);
}

// 4. Confirm order
async function confirmOrder() {
  const response = await fetch(
    `/api/orders/${currentOrder.id}/confirm`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

  const { data } = await response.json();
  // Proceed to payment screen
  router.push(`/payment/${data.id}`);
}
```

---

### Barcode Scanner Component

```tsx
function BarcodeScanner({ orderId, onItemAdded }) {
  const [barcode, setBarcode] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Keep input focused for continuous scanning
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!barcode) return;

    try {
      const res = await fetch(`/api/orders/${orderId}/items/barcode`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ barcode })
      });

      if (res.ok) {
        const { action, message, data } = await res.json();
        toast.success(message);
        onItemAdded(data, action);
      } else {
        const error = await res.json();
        toast.error(error.message);
      }
    } catch (error) {
      toast.error('Scan failed');
    } finally {
      setBarcode(''); // Clear for next scan
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="text"
        value={barcode}
        onChange={e => setBarcode(e.target.value)}
        onBlur={e => e.target.focus()} // Auto re-focus
        placeholder="Scan barcode..."
        autoFocus
        autoComplete="off"
      />
    </form>
  );
}
```

---

## Security & Validation

### Access Control

```
┌──────────────┬─────────────────────────────────┐
│ Role         │ Order Permissions               │
├──────────────┼─────────────────────────────────┤
│ SUPER_ADMIN  │ All orders, all companies       │
│ ADMIN        │ All orders in company           │
│ MANAGER      │ All orders in store             │
│ CASHIER      │ Own orders only                 │
└──────────────┴─────────────────────────────────┘
```

### Validations

**Before Adding Item:**
- ✅ Order must be DRAFT status
- ✅ Order must belong to user's company/store
- ✅ Product must be active
- ✅ Product must belong to same company
- ✅ Stock must be available
- ✅ Barcode must exist

**Before Confirming:**
- ✅ Order must be DRAFT status
- ✅ Order must have at least 1 item

**Before Cancelling:**
- ✅ Order must be DRAFT or PENDING
- ✅ Cancel reason required

---

## Best Practices

### ✅ DO

- Use barcode endpoint for POS scanning
- Let backend calculate all pricing
- Check order totals after every item add/remove
- Keep barcode input focused
- Auto-increment quantity on duplicate scan
- Validate stock before adding items
- Use DRAFT status for active cart
- Confirm before payment

### ❌ DON'T

- Calculate prices on frontend
- Trust frontend-provided prices
- Modify PENDING or PAID orders
- Skip stock validation
- Deduct inventory before payment
- Allow negative quantities
- Bypass order confirmation

---

## Summary

✅ **Database Design**
- Order with DRAFT → PENDING → PAID flow
- OrderItem with price snapshots
- Multi-tenant safe
- Customer optional

✅ **Barcode Scanning**
- Fast indexed lookup
- Auto quantity increment
- Inventory validation
- Company/store isolation

✅ **Calculations**
- Server-side only
- Retail vs Wholesale pricing
- Tax calculated per item
- Order totals auto-recalculated

✅ **Security**
- Role-based access
- Owner validation
- Status-based permissions
- Stock validation

**The order system is production-ready and optimized for real-world POS operations!** 🚀
