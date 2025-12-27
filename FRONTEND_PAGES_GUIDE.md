# POS Frontend Pages Guide

Complete guide for building the frontend pages for your multi-tenant POS system.

---

## 🔐 Authentication Pages

### 1. Login Page (`/login`)

**URL:** `/login`

**Components:**
```
┌─────────────────────────────────────┐
│         Your POS System             │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Email                        │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ email@example.com       │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  │  Password                     │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ ••••••••••              │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │      LOGIN              │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  │  Don't have an account?       │  │
│  │  Contact your administrator   │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**API Call:**
```javascript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response Handling:**
```javascript
// Success response
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ADMIN",
      "companyId": "company-uuid",
      "storeId": "store-uuid",
      "permissions": [
        { "permission": "VIEW_DASHBOARD" },
        { "permission": "MANAGE_STORES" },
        ...
      ]
    }
  }
}

// Store in localStorage/sessionStorage
localStorage.setItem('token', response.data.token);
localStorage.setItem('user', JSON.stringify(response.data.user));

// Extract permissions for UI rendering
const permissions = response.data.user.permissions.map(p => p.permission);
localStorage.setItem('permissions', JSON.stringify(permissions));

// Redirect based on role
if (role === 'SUPER_ADMIN') redirect('/admin/companies');
if (role === 'ADMIN') redirect('/admin/dashboard');
if (role === 'MANAGER') redirect('/manager/dashboard');
if (role === 'CASHIER') redirect('/pos');
```

**Features:**
- Email and password fields
- Remember me checkbox
- Forgot password link (future)
- Error messages for invalid credentials
- Loading state during login

**Note:** No public signup! Users are created by SUPER_ADMIN or ADMIN.

---

## 🏠 Home/Dashboard Pages (After Login)

The home page changes based on the user's role:

---

### 2. SUPER_ADMIN Dashboard (`/admin/companies`)

**URL:** `/admin/companies`

**Layout:**
```
┌────────────────────────────────────────────────────────┐
│  [Logo] Your POS System        [Profile] [Logout]      │
├────────────────────────────────────────────────────────┤
│  Sidebar          │  Main Content                      │
│                   │                                    │
│  📊 Dashboard     │  Companies Management              │
│  🏢 Companies     │  ┌──────────────────────────────┐  │
│  📈 Reports       │  │  + Create New Company       │  │
│  👥 Users         │  └──────────────────────────────┘  │
│  ⚙️  Settings     │                                    │
│                   │  ┌──────────────────────────────┐  │
│                   │  │ Coffee Shop Chain            │  │
│                   │  │ contact@coffeeshop.com       │  │
│                   │  │ 3 Stores | 12 Users          │  │
│                   │  │ [View] [Edit] [Delete]       │  │
│                   │  └──────────────────────────────┘  │
│                   │                                    │
│                   │  ┌──────────────────────────────┐  │
│                   │  │ Restaurant Group             │  │
│                   │  │ contact@restaurant.com       │  │
│                   │  │ 5 Stores | 25 Users          │  │
│                   │  │ [View] [Edit] [Delete]       │  │
│                   │  └──────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

**API Calls:**
```javascript
// Get all companies
GET /api/companies
Authorization: Bearer TOKEN

// Response
{
  "success": true,
  "data": [
    {
      "id": "company-uuid",
      "name": "Coffee Shop Chain",
      "email": "contact@coffeeshop.com",
      "_count": {
        "stores": 3,
        "users": 12
      },
      "stores": [...],
      "users": [...]
    }
  ]
}
```

**Features:**
- List all companies
- Create new company
- View company details
- Edit company info
- Delete company
- View stores per company
- View users per company
- Search and filter companies

**Sidebar Menu (SUPER_ADMIN):**
- 📊 Dashboard
- 🏢 Companies
- 📈 Reports (all companies)
- 👥 System Users
- ⚙️ Settings

---

### 3. ADMIN Dashboard (`/admin/dashboard`)

**URL:** `/admin/dashboard`

**Layout:**
```
┌────────────────────────────────────────────────────────┐
│  [Logo] Coffee Shop Chain      [Profile] [Logout]      │
├────────────────────────────────────────────────────────┤
│  Sidebar          │  Main Content                      │
│                   │                                    │
│  📊 Dashboard     │  Dashboard Overview                │
│  🏪 Stores        │  ┌──────┐ ┌──────┐ ┌──────┐      │
│  📦 Products      │  │ $1.2K│ │  45  │ │  3   │      │
│  📊 Stock         │  │ Sales│ │Orders│ │Stores│      │
│  👥 Users         │  └──────┘ └──────┘ └──────┘      │
│  📈 Reports       │                                    │
│  ⚙️  Settings     │  Recent Orders                     │
│                   │  ┌──────────────────────────────┐  │
│                   │  │ #001 | $25.50 | Downtown    │  │
│                   │  │ #002 | $42.00 | Airport     │  │
│                   │  │ #003 | $18.75 | Mall        │  │
│                   │  └──────────────────────────────┘  │
│                   │                                    │
│                   │  Store Performance                 │
│                   │  [Chart showing sales by store]    │
└────────────────────────────────────────────────────────┘
```

**API Calls:**
```javascript
// Get stores for company
GET /api/stores/company/{companyId}
Authorization: Bearer TOKEN

// Get dashboard stats
GET /api/dashboard/stats

// Get recent orders
GET /api/orders/recent
```

**Features:**
- Sales overview (today, this week, this month)
- Order count
- Number of stores
- Recent orders list
- Store performance charts
- Low stock alerts
- Quick actions (create product, add user, etc.)

**Sidebar Menu (ADMIN):**
- 📊 Dashboard
- 🏪 Stores (manage company stores)
- 📦 Products (all stores)
- 📊 Stock Management
- 👥 Users (company employees)
- 📈 Reports (company-wide)
- ⚙️ Settings

---

### 4. MANAGER Dashboard (`/manager/dashboard`)

**URL:** `/manager/dashboard`

**Layout:**
```
┌────────────────────────────────────────────────────────┐
│  [Logo] Downtown Branch        [Profile] [Logout]      │
├────────────────────────────────────────────────────────┤
│  Sidebar          │  Main Content                      │
│                   │                                    │
│  📊 Dashboard     │  Store Dashboard - Downtown        │
│  📦 Products      │  ┌──────┐ ┌──────┐ ┌──────┐      │
│  📊 Stock         │  │ $850 │ │  32  │ │  156 │      │
│  👥 Staff         │  │Sales │ │Orders│ │ Items│      │
│  📈 Reports       │  └──────┘ └──────┘ └──────┘      │
│                   │                                    │
│                   │  Low Stock Alerts                  │
│                   │  ┌──────────────────────────────┐  │
│                   │  │ ⚠️ Cappuccino (5 left)       │  │
│                   │  │ ⚠️ Croissant (8 left)        │  │
│                   │  └──────────────────────────────┘  │
│                   │                                    │
│                   │  Today's Sales                     │
│                   │  [Sales chart for this store]      │
└────────────────────────────────────────────────────────┘
```

**API Calls:**
```javascript
// Get store info
GET /api/stores/{storeId}
Authorization: Bearer TOKEN

// Get products for this store
GET /api/products/store/{storeId}

// Get stock levels
GET /api/stock/store/{storeId}
```

**Features:**
- Store-specific sales data
- Today's orders
- Product inventory
- Low stock alerts
- Staff management (create cashiers)
- Store performance reports

**Sidebar Menu (MANAGER):**
- 📊 Dashboard (this store only)
- 📦 Products (this store only)
- 📊 Stock Management (this store only)
- 👥 Staff (this store only)
- 📈 Reports (this store only)

---

### 5. CASHIER POS Interface (`/pos`)

**URL:** `/pos`

**Layout:**
```
┌────────────────────────────────────────────────────────┐
│  Downtown Branch - POS          [Logout]               │
├─────────────────────────────┬──────────────────────────┤
│  Products                   │  Current Order           │
│  ┌─────┐ ┌─────┐ ┌─────┐  │  Order #1234             │
│  │Capp │ │Late │ │Espr │  │                          │
│  │$4.99│ │$5.50│ │$3.99│  │  1x Cappuccino    $4.99  │
│  └─────┘ └─────┘ └─────┘  │  2x Latte         $11.00 │
│                             │  1x Croissant     $3.50  │
│  ┌─────┐ ┌─────┐ ┌─────┐  │                          │
│  │Croi │ │Sand │ │Cook │  │  ─────────────────────   │
│  │$3.50│ │$7.99│ │$2.50│  │  Subtotal:       $19.49  │
│  └─────┘ └─────┘ └─────┘  │  Tax (10%):       $1.95  │
│                             │  ─────────────────────   │
│  [Search products...]       │  TOTAL:          $21.44  │
│                             │                          │
│                             │  ┌────────────────────┐  │
│                             │  │  PROCESS PAYMENT  │  │
│                             │  └────────────────────┘  │
│                             │  [Cash] [Card] [Other]   │
└─────────────────────────────┴──────────────────────────┘
```

**API Calls:**
```javascript
// Get products for sale
GET /api/products/store/{storeId}

// Create order
POST /api/orders
{
  "storeId": "store-uuid",
  "items": [
    { "productId": "product-uuid", "quantity": 1, "price": 4.99 },
    { "productId": "product-uuid", "quantity": 2, "price": 5.50 }
  ],
  "subtotal": 19.49,
  "tax": 1.95,
  "total": 21.44
}

// Process payment
POST /api/payments
{
  "orderId": "order-uuid",
  "amount": 21.44,
  "method": "CASH"
}

// Print receipt
POST /api/receipts/print
{
  "orderId": "order-uuid"
}
```

**Features:**
- Product grid with search
- Add items to order
- Adjust quantities
- Remove items
- Calculate tax automatically
- Process payment (cash/card/other)
- Print receipt
- Start new order
- View order history (today)
- Quick keyboard shortcuts

**No Sidebar - Full screen POS interface**

---

## 🎯 Permission-Based UI Rendering

**Example: Conditional Rendering Based on Permissions**

```javascript
// Get permissions from localStorage
const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');

// Helper function
function hasPermission(permission) {
  return permissions.includes(permission);
}

// Conditional rendering
{hasPermission('MANAGE_STORES') && (
  <MenuItem href="/admin/stores">
    🏪 Stores
  </MenuItem>
)}

{hasPermission('MANAGE_PRODUCTS') && (
  <MenuItem href="/admin/products">
    📦 Products
  </MenuItem>
)}

{hasPermission('MANAGE_USERS') && (
  <MenuItem href="/admin/users">
    👥 Users
  </MenuItem>
)}

{hasPermission('VIEW_REPORTS') && (
  <MenuItem href="/admin/reports">
    📈 Reports
  </MenuItem>
)}

{hasPermission('CREATE_ORDER') && (
  <MenuItem href="/pos">
    💳 POS
  </MenuItem>
)}
```

---

## 📱 Responsive Design Notes

### Desktop (1024px+)
- Full sidebar navigation
- Multi-column layouts
- Data tables with full info

### Tablet (768px - 1023px)
- Collapsible sidebar
- 2-column layouts
- Simplified tables

### Mobile (< 768px)
- Bottom navigation bar
- Single column
- Cards instead of tables
- Touch-optimized buttons

---

## 🎨 Design System Recommendations

### Colors
```css
--primary: #2563eb;      /* Blue for actions */
--success: #10b981;      /* Green for positive */
--warning: #f59e0b;      /* Orange for warnings */
--danger: #ef4444;       /* Red for delete/errors */
--dark: #1f2937;         /* Dark backgrounds */
--light: #f9fafb;        /* Light backgrounds */
```

### Typography
- Headings: Inter, SF Pro, or Poppins
- Body: Inter or Roboto
- Monospace (numbers): JetBrains Mono or Fira Code

### Components
- Cards with shadows
- Rounded corners (8px)
- Clear button states
- Loading spinners
- Toast notifications

---

## 🔒 Route Protection

```javascript
// Protected Route Component
function ProtectedRoute({ children, requiredPermission }) {
  const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');

  if (!permissions.includes(requiredPermission)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}

// Usage
<Route
  path="/admin/stores"
  element={
    <ProtectedRoute requiredPermission="MANAGE_STORES">
      <StoresPage />
    </ProtectedRoute>
  }
/>
```

---

## 📊 Key Features by Page

| Page | Key Features | Required Permission |
|------|--------------|---------------------|
| Login | Email/Password, Remember Me | None |
| SUPER_ADMIN Dashboard | All companies, System stats | MANAGE_COMPANY |
| ADMIN Dashboard | Company overview, Multi-store stats | VIEW_DASHBOARD |
| MANAGER Dashboard | Single store stats, Inventory | VIEW_DASHBOARD |
| CASHIER POS | Product grid, Order processing | CREATE_ORDER |
| Stores Page | CRUD stores | MANAGE_STORES |
| Products Page | CRUD products | MANAGE_PRODUCTS |
| Users Page | CRUD users | MANAGE_USERS |
| Reports Page | Sales analytics | VIEW_REPORTS |

---

## 🚀 Next Steps

1. Build login page
2. Implement role-based routing
3. Create dashboards for each role
4. Add product management
5. Build POS interface
6. Implement reports
7. Add real-time updates (WebSockets)

---

This guide provides the complete frontend structure for your multi-tenant POS system! 🎉
