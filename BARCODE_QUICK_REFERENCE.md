# Barcode System - Quick Reference

## For Frontend Developers

### API Endpoint

```
GET /api/product-variants/barcode/:barcode
```

### Example Request

```javascript
const response = await fetch(
  `/api/product-variants/barcode/1234567890123`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
);

const data = await response.json();
const product = data.data;
```

### Response Structure

```javascript
{
  success: true,
  data: {
    id: "uuid",
    name: "Small Red",
    barcode: "1234567890123",
    retailPrice: "29.99",        // Use this for RETAIL customers
    wholesalePrice: "24.99",     // Use this for WHOLESALE customers
    product: {
      name: "T-Shirt",
      taxPercent: "15.00",       // Apply this tax rate
    },
    inventory: [
      {
        storeId: "store-uuid",
        quantity: 50,              // Check stock before adding
      }
    ]
  }
}
```

### Complete POS Integration Code

```typescript
async function handleBarcodeScanned(barcode: string) {
  try {
    // 1. Fetch product
    const response = await fetch(
      `/api/product-variants/barcode/${barcode}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!response.ok) {
      toast.error('Product not found');
      return;
    }

    const { data: product } = await response.json();

    // 2. Check if active
    if (!product.isActive || !product.product.isActive) {
      toast.error('Product unavailable');
      return;
    }

    // 3. Check inventory for current store
    const inventory = product.inventory.find(
      inv => inv.storeId === currentStoreId
    );

    if (!inventory || inventory.quantity <= 0) {
      toast.error('Out of stock');
      return;
    }

    // 4. Calculate pricing
    const unitPrice = parseFloat(
      customerType === 'RETAIL'
        ? product.retailPrice
        : product.wholesalePrice
    );

    const taxRate = parseFloat(product.product.taxPercent) / 100;
    const taxAmount = unitPrice * taxRate;
    const totalPrice = unitPrice + taxAmount;

    // 5. Add to cart
    addItemToCart({
      variantId: product.id,
      name: `${product.product.name} - ${product.name}`,
      barcode: product.barcode,
      quantity: 1,
      unitPrice,
      taxRate,
      taxAmount,
      totalPrice,
    });

    toast.success('Added to cart');
  } catch (error) {
    toast.error('Error scanning barcode');
  }
}
```

### Barcode Input Component

```tsx
function BarcodeScanner({ onScan }) {
  const [barcode, setBarcode] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Keep input focused for scanning
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (barcode.trim()) {
      onScan(barcode.trim());
      setBarcode(''); // Clear for next scan
    }
  };

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

### Error Handling

```typescript
// 404 - Product not found
if (response.status === 404) {
  toast.error('Product not found');
}

// 401 - Not authenticated
if (response.status === 401) {
  router.push('/login');
}

// 403 - No permission
if (response.status === 403) {
  toast.error('You do not have permission to scan products');
}
```

---

## For Backend Developers

### Database Schema (Already Implemented)

```prisma
model ProductVariant {
  barcode String? @unique

  @@index([barcode])  // Fast lookup
}
```

### Creating Products with Barcodes

```typescript
// POST /api/product-variants
{
  "name": "Small Red",
  "sku": "TSHIRT-SM-RED",
  "barcode": "1234567890123",  // Must be unique
  "retailPrice": 29.99,
  "wholesalePrice": 24.99,
  "productId": "product-uuid",
  "initialStock": 100
}
```

### Performance

- ✅ Indexed lookup: ~1-5ms
- ✅ Single query (no N+1)
- ✅ Returns all needed data

### Validation Rules

- Barcode must be unique
- Cannot be changed after creation (to maintain history)
- Optional field (some products may not have barcodes)

---

## Common Issues

### Issue: Barcode not found
**Solution:** Check if variant exists with that barcode

### Issue: Slow response
**Solution:** Verify barcode field is indexed

### Issue: Wrong price displayed
**Solution:** Use backend-provided prices, don't calculate on frontend

### Issue: Can add out-of-stock items
**Solution:** Always check inventory before adding to cart

---

## Testing Checklist

- [ ] Scan valid barcode → Product added to cart
- [ ] Scan invalid barcode → Error message shown
- [ ] Scan same barcode twice → Quantity increases
- [ ] Scan when out of stock → Error shown
- [ ] Scan without permission → 403 error
- [ ] Scanner input stays focused
- [ ] Barcode input clears after scan

---

## Quick Links

- Full Documentation: [BARCODE_SYSTEM_DESIGN.md](BARCODE_SYSTEM_DESIGN.md)
- API Docs: [FRONTEND_API_DOCS.md](FRONTEND_API_DOCS.md)
- System Flow: [SYSTEM_FLOW_SUMMARY.md](SYSTEM_FLOW_SUMMARY.md)
