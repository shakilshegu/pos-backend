# POS Refund & Bill Adjustment System - Enterprise Design

## Overview

Enterprise-grade refund system following retail POS standards where **PAID bills remain immutable**. All refunds and adjustments are handled through new bills that reference the original.

---

## Core Principle

```
❌ NEVER edit PAID bills
✅ ALWAYS create new adjustment bills
✅ ALWAYS link to original bill
✅ ALWAYS maintain audit trail
```

---

## Bill Types

| Type | Purpose | Quantities | Status Flow |
|------|---------|------------|-------------|
| **SALE** | Normal sale | Positive | DRAFT → PENDING → PAID |
| **RETURN** | Product return (partial/full) | **Negative** | DRAFT → PENDING → PAID |
| **VOID** | Same-day cancellation | **Negative** | DRAFT → PENDING → PAID |
| **ADJUSTMENT** | Price correction (future) | Mixed | DRAFT → PENDING → PAID |

---

## Database Schema

### Order Model Updates

```prisma
model Order {
  id            String       @id @default(uuid())
  orderNumber   String       @unique

  // Bill Type & Parent Reference
  type          OrderType    @default(SALE)
  parentOrderId String?      // Link to original order
  parentOrder   Order?       @relation("OrderAdjustments")
  adjustments   Order[]      @relation("OrderAdjustments")

  // Amounts (can be NEGATIVE for RETURN/VOID)
  subtotal      Decimal      @db.Decimal(10, 2)
  totalAmount   Decimal      @db.Decimal(10, 2)

  // Return/Void tracking
  returnReason  String?
  voidedBy      String?
  voidedAt      DateTime?

  status        OrderStatus  @default(DRAFT)
  // ... other fields
}

enum OrderType {
  SALE
  RETURN
  VOID
  ADJUSTMENT
}
```

### OrderItem for Returns

```prisma
model OrderItem {
  id        String  @id
  orderId   String
  quantity  Float   // NEGATIVE for RETURN/VOID
  unitPrice Decimal
  subtotal  Decimal // NEGATIVE for RETURN/VOID

  // ... other fields
}
```

**Key Points:**
- Return/Void items have **negative quantities**
- Prices remain positive (same as original)
- Subtotal/total are negative (quantity × price)

---

## Return Bill Flow

### Use Case: Customer Returns 2 Items

**Step-by-Step:**

```
1. Cashier selects original PAID order
   └─> GET /api/orders/{orderId}
   └─> Shows: orderNumber, items, amounts

2. Cashier selects items to return
   └─> Customer returns 2 of 3 T-Shirts

3. Create RETURN bill
   └─> POST /api/orders/return
   {
     "originalOrderId": "order-uuid",
     "returnReason": "Customer changed mind",
     "items": [
       { "orderItemId": "item-uuid", "quantity": 2 }
     ]
   }

4. System creates new order:
   - type: RETURN
   - parentOrderId: original order ID
   - quantities: NEGATIVE (-2)
   - totalAmount: NEGATIVE (-59.98)
   - status: DRAFT

5. Confirm return
   └─> POST /api/orders/{returnOrderId}/confirm
   └─> Status: DRAFT → PENDING

6. Process refund
   └─> POST /api/payments
   {
     "orderId": "return-order-uuid",
     "method": "CASH",
     "amount": 59.98  // Positive amount
   }

7. System auto-restores inventory
   └─> When refund payment marked SUCCESS
   └─> Inventory += 2 (for returned items)
   └─> Return order status → PAID
```

---

## Void Bill Flow

### Use Case: Manager Voids Same-Day Order

**Step-by-Step:**

```
1. Manager selects PAID order (SAME DAY ONLY)
   └─> GET /api/orders/{orderId}

2. Manager voids order
   └─> POST /api/orders/{orderId}/void
   {
     "voidReason": "Billing error - wrong customer"
   }

3. System validates:
   ✅ User is MANAGER/ADMIN
   ✅ Original order is PAID
   ✅ Original order is SALE type
   ✅ Order created TODAY (same day validation)

4. System creates VOID bill:
   - type: VOID
   - parentOrderId: original order ID
   - ALL items with negative quantities
   - totalAmount: Full negation of original
   - voidedBy: manager user ID
   - status: DRAFT

5. Confirm void
   └─> POST /api/orders/{voidOrderId}/confirm
   └─> Status: DRAFT → PENDING

6. Process full refund
   └─> POST /api/payments
   {
     "orderId": "void-order-uuid",
     "method": "CARD",
     "amount": 150.00  // Full refund
   }

7. System auto-restores ALL inventory
   └─> When refund payment marked SUCCESS
   └─> Restore ALL item quantities
   └─> Void order status → PAID
```

---

## API Endpoints

### 1. Create Return Bill

**Endpoint:** `POST /api/orders/return`

**Access:** CASHIER, MANAGER, ADMIN (CREATE_ORDER permission)

**Request:**
```json
{
  "originalOrderId": "order-uuid",
  "returnReason": "Defective product",
  "items": [
    {
      "orderItemId": "item-1-uuid",
      "quantity": 1
    },
    {
      "orderItemId": "item-2-uuid",
      "quantity": 2
    }
  ],
  "notes": "Product had manufacturing defect"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Return bill created successfully. Process refund to complete.",
  "data": {
    "id": "return-order-uuid",
    "orderNumber": "ORD-20250127-050",
    "type": "RETURN",
    "parentOrderId": "original-order-uuid",
    "status": "DRAFT",
    "subtotal": "-29.99",
    "taxAmount": "-4.50",
    "totalAmount": "-34.49",
    "returnReason": "Defective product",
    "items": [
      {
        "productName": "T-Shirt",
        "variantName": "Medium Blue",
        "quantity": -1,  // NEGATIVE
        "unitPrice": "29.99",
        "subtotal": "-29.99",
        "totalAmount": "-34.49"
      }
    ]
  }
}
```

**Errors:**
```json
// Original order not PAID
{
  "success": false,
  "message": "Only PAID orders can be returned"
}

// Return quantity exceeds original
{
  "success": false,
  "message": "Return quantity (5) cannot exceed original quantity (3) for T-Shirt"
}

// Trying to return a RETURN bill
{
  "success": false,
  "message": "Can only create returns for SALE orders"
}
```

---

### 2. Void Order

**Endpoint:** `POST /api/orders/:orderId/void`

**Access:** MANAGER, ADMIN, SUPER_ADMIN only (MANAGE_USERS permission)

**Request:**
```json
{
  "voidReason": "Incorrect pricing - customer dispute"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Order voided successfully. Process refund to complete.",
  "data": {
    "id": "void-order-uuid",
    "orderNumber": "ORD-20250127-051",
    "type": "VOID",
    "parentOrderId": "original-order-uuid",
    "status": "DRAFT",
    "subtotal": "-150.00",
    "totalAmount": "-172.50",
    "returnReason": "Incorrect pricing - customer dispute",
    "voidedBy": "manager-user-uuid",
    "voidedAt": "2025-01-27T15:30:00Z",
    "items": [
      // ALL items from original with negative quantities
    ]
  }
}
```

**Errors:**
```json
// Not manager/admin
{
  "success": false,
  "message": "Only managers and admins can void orders"
}

// Not same day
{
  "success": false,
  "message": "Orders can only be voided on the same day they were created"
}

// Order not PAID
{
  "success": false,
  "message": "Only PAID orders can be voided"
}
```

---

### 3. List Returns/Voids for Order

**Endpoint:** `GET /api/orders?parentOrderId={orderId}`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "return-1-uuid",
      "orderNumber": "ORD-20250127-050",
      "type": "RETURN",
      "parentOrderId": "original-order-uuid",
      "status": "PAID",
      "totalAmount": "-34.49",
      "returnReason": "Defective product",
      "createdAt": "2025-01-27T14:00:00Z"
    },
    {
      "id": "void-1-uuid",
      "orderNumber": "ORD-20250127-051",
      "type": "VOID",
      "parentOrderId": "original-order-uuid",
      "status": "PAID",
      "totalAmount": "-172.50",
      "returnReason": "Incorrect pricing",
      "voidedBy": "manager-uuid",
      "createdAt": "2025-01-27T15:30:00Z"
    }
  ]
}
```

---

## Business Rules

### Return Rules

✅ **Allowed:**
- Return PAID SALE orders
- Partial returns (some items, not all)
- Return less than original quantity
- Multiple returns for same order

❌ **Not Allowed:**
- Return DRAFT/PENDING/CANCELLED orders
- Return quantity > original quantity
- Return RETURN bills (no nested returns)
- Return VOID bills

### Void Rules

✅ **Allowed:**
- Void PAID SALE orders
- Same-day voids only
- Manager/Admin approval required
- Full reversal (all items)

❌ **Not Allowed:**
- Void orders from previous days
- Cashier cannot void (requires manager)
- Void DRAFT/PENDING orders (use cancel instead)
- Void RETURN/VOID bills

---

## Inventory Management

### SALE Order (PAID)
```typescript
// When payment SUCCESS:
for (item of order.items) {
  inventory.quantity -= item.quantity  // Deduct
}
```

### RETURN/VOID Order (PAID)
```typescript
// When refund payment SUCCESS:
for (item of order.items) {
  // item.quantity is NEGATIVE for returns
  inventory.quantity -= item.quantity  // Subtracting negative = Add back
}
```

**Example:**
```
Original Sale: quantity = 5
├─> Inventory: 100 - 5 = 95 ✓

Return: quantity = -2 (negative)
├─> Inventory: 95 - (-2) = 97 ✓

Result: Stock restored by 2 units
```

---

## Payment Integration

### Processing Refunds

**After creating RETURN/VOID bill:**

```typescript
// 1. Confirm return/void order
POST /api/orders/{returnOrderId}/confirm
// Status: DRAFT → PENDING

// 2. Process refund payment
POST /api/payments
{
  "orderId": "return-order-uuid",
  "method": "CASH",  // or CARD
  "amount": 59.98    // POSITIVE amount
}

// 3. System automatically:
// - Marks payment as SUCCESS
// - Marks return/void order as PAID
// - Restores inventory
```

**Payment Service Logic:**
```typescript
if (order.type === OrderType.SALE) {
  // Deduct inventory (for sales)
} else if (order.type === OrderType.RETURN || order.type === OrderType.VOID) {
  // Restore inventory (for returns/voids)
  await orderService.restoreInventoryForReturn(orderId);
}
```

---

## Validation Logic

### Return Validation

```typescript
// Check original order
✓ Must be PAID status
✓ Must be SALE type
✓ Must belong to same company/store

// Check return items
✓ Items must exist in original order
✓ Return quantity ≤ original quantity
✓ At least 1 item required

// Access control
✓ User must have CREATE_ORDER permission
✓ Order must belong to user's company/store
```

### Void Validation

```typescript
// Check permissions
✓ User must be MANAGER, ADMIN, or SUPER_ADMIN

// Check original order
✓ Must be PAID status
✓ Must be SALE type
✓ Must be same day (created today)
✓ Must belong to same company/store

// Date validation
const orderDate = new Date(order.createdAt)
const today = new Date()
orderDate.setHours(0, 0, 0, 0)
today.setHours(0, 0, 0, 0)

✓ orderDate === today
```

---

## Audit Trail

### Complete Transaction History

```sql
-- Get original order
SELECT * FROM orders WHERE id = 'order-uuid';

-- Get all returns/voids for this order
SELECT * FROM orders
WHERE parentOrderId = 'order-uuid'
AND type IN ('RETURN', 'VOID');

-- Get complete audit trail
SELECT
  o.orderNumber,
  o.type,
  o.status,
  o.totalAmount,
  o.returnReason,
  o.voidedBy,
  o.createdAt,
  u.firstName || ' ' || u.lastName AS processedBy
FROM orders o
LEFT JOIN users u ON o.cashierId = u.id
WHERE o.id = 'order-uuid' OR o.parentOrderId = 'order-uuid'
ORDER BY o.createdAt;
```

**Result:**
```
orderNumber         type    status  totalAmount  processedBy      createdAt
ORD-20250127-001   SALE    PAID    150.00       John Doe         2025-01-27 10:00
ORD-20250127-050   RETURN  PAID    -34.49       John Doe         2025-01-27 14:00
ORD-20250127-051   VOID    PAID    -172.50      Manager Smith    2025-01-27 15:30
```

---

## Security & Compliance

### Why Immutable Bills?

✅ **Audit Compliance:**
- Tax authorities require immutable records
- Cannot alter historical transactions
- Complete audit trail always available

✅ **Fraud Prevention:**
- No backdating or editing sales
- All changes tracked with timestamps
- Manager approval for voids

✅ **Dispute Resolution:**
- Original bill always preserved
- Returns linked to original
- Clear reason for every adjustment

✅ **Financial Accuracy:**
- Reconciliation always accurate
- Daily reports remain unchanged
- Historical data integrity maintained

---

## Testing Checklist

### Return Flow
- [ ] Create return for PAID SALE order → Success
- [ ] Create return for DRAFT order → Error
- [ ] Return quantity > original → Error
- [ ] Return with valid items → Creates negative bill
- [ ] Process refund → Inventory restored
- [ ] Return payment CASH → Immediate success
- [ ] Return payment CARD → TAP refund flow

### Void Flow
- [ ] Manager voids same-day order → Success
- [ ] Cashier attempts void → Error (permission denied)
- [ ] Void yesterday's order → Error (not same day)
- [ ] Void creates negative bill for all items → Success
- [ ] Process full refund → Inventory fully restored
- [ ] Void non-SALE order → Error

### Audit Trail
- [ ] Original order shows adjustments list
- [ ] Return/void links to parent order
- [ ] All reasons captured
- [ ] Timestamps accurate
- [ ] User tracking correct

---

## Best Practices

### ✅ DO

- Always create new adjustment bills
- Link returns/voids to original order
- Require reason for every return/void
- Validate same-day for voids
- Restore inventory automatically
- Use negative quantities for returns
- Process refund payments properly
- Maintain complete audit trail

### ❌ DON'T

- Edit PAID bills directly
- Allow voids after same day
- Skip manager approval for voids
- Allow cashiers to void orders
- Forget to restore inventory
- Allow returns without reasons
- Process refunds before bill confirmation
- Delete original bills

---

## Summary

✅ **Enterprise-Grade Design:**
- Immutable PAID bills
- Full audit trail
- Manager approval for voids
- Same-day void restriction
- Automatic inventory restoration

✅ **Complete POS Flow:**
- SALE → RETURN → VOID cycle
- Negative quantity handling
- Payment integration
- Multi-bill support

✅ **Security & Compliance:**
- Role-based access control
- Reason tracking
- Timestamp auditing
- Financial accuracy

**The refund system is production-ready for enterprise retail POS operations!** 🚀
