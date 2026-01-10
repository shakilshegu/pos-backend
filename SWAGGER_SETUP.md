# Swagger API Documentation Setup

## Overview

A centralized Swagger (OpenAPI 3.0) documentation system has been successfully implemented for the POS Backend API. The documentation is completely separated from controllers and routes, following a modular architecture.

## Features

- **Complete API Documentation** - All endpoints documented with request/response schemas
- **JWT Authentication Support** - Built-in Bearer token authentication in Swagger UI
- **Interactive Testing** - Try out API endpoints directly from the browser
- **Organized by Modules** - Each feature module has its own swagger file
- **Auto-generated UI** - Beautiful, filterable Swagger UI interface
- **Persistent Authorization** - JWT tokens persist across page refreshes

## Access Swagger UI

Once the server is running, access the Swagger documentation at:

```
http://localhost:3000/api-docs
```

## Project Structure

```
pos-backend/
├── src/
│   ├── swaggers/                    # Centralized Swagger documentation
│   │   ├── index.ts                 # Main swagger config (combines all modules)
│   │   ├── auth.swagger.ts          # Authentication endpoints
│   │   ├── products.swagger.ts      # Product management
│   │   ├── categories.swagger.ts    # Product categories
│   │   ├── orders.swagger.ts        # Order processing
│   │   ├── payments.swagger.ts      # Payment processing
│   │   ├── customers.swagger.ts     # Customer management
│   │   ├── inventory.swagger.ts     # Stock management
│   │   ├── reports.swagger.ts       # Analytics & reporting
│   │   ├── company.swagger.ts       # Company (tenant) management
│   │   ├── store.swagger.ts         # Store management
│   │   ├── cash-shift.swagger.ts    # Cashier shift management
│   │   └── upload.swagger.ts        # File upload to S3
│   └── app.ts                       # Swagger UI integrated here
```

## Documented Modules

### 1. **Authentication** (`auth.swagger.ts`)
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - Register new user
- POST `/api/auth/register-with-permissions` - Register with custom permissions
- GET `/api/auth/profile` - Get current user profile

### 2. **Company** (`company.swagger.ts`)
- POST `/api/companies` - Create company
- GET `/api/companies` - List all companies
- GET `/api/companies/{id}` - Get company details
- PATCH `/api/companies/{id}/profile-image` - Update company logo

### 3. **Store** (`store.swagger.ts`)
- POST `/api/stores` - Create new store
- GET `/api/stores/company/{companyId}` - Get stores by company
- GET `/api/stores/{id}` - Get store details

### 4. **Products** (`products.swagger.ts`)
- POST `/api/products` - Create product
- GET `/api/products` - List products with pagination
- GET `/api/products/{id}` - Get product details
- PUT `/api/products/{id}` - Update product
- DELETE `/api/products/{id}` - Delete product
- GET `/api/products/search` - Search products
- POST `/api/product-variants` - Create product variant
- GET `/api/product-variants/barcode/{barcode}` - Get variant by barcode
- GET `/api/product-variants/sku/{sku}` - Get variant by SKU

### 5. **Categories** (`categories.swagger.ts`)
- POST `/api/categories` - Create category
- GET `/api/categories` - List all categories

### 6. **Inventory** (`inventory.swagger.ts`)
- POST `/api/inventory` - Create inventory record
- GET `/api/inventory/store/{storeId}` - Get inventory by store
- GET `/api/inventory/low-stock` - Get low stock items
- POST `/api/inventory/adjust` - Manual stock adjustment

### 7. **Orders** (`orders.swagger.ts`)
- POST `/api/orders` - Create order (draft)
- GET `/api/orders` - List orders with filters
- POST `/api/orders/{orderId}/items` - Add item to order
- PUT `/api/orders/{orderId}/items/{itemId}` - Update order item
- DELETE `/api/orders/{orderId}/items/{itemId}` - Remove item
- POST `/api/orders/{orderId}/confirm` - Confirm order
- POST `/api/orders/{orderId}/cancel` - Cancel order
- POST `/api/orders/{orderId}/void` - Void order
- POST `/api/orders/{orderId}/return` - Process return

### 8. **Payments** (`payments.swagger.ts`)
- POST `/api/payments` - Process payment (CASH/CARD/WALLET)
- POST `/api/payments/refund` - Process refund
- GET `/api/payments/order/{orderId}` - Get payments by order
- GET `/api/payments/statistics` - Payment statistics

### 9. **Customers** (`customers.swagger.ts`)
- POST `/api/customers` - Create customer
- GET `/api/customers` - List customers with pagination
- GET `/api/customers/{id}` - Get customer details
- GET `/api/customers/phone/{phone}` - Lookup by phone
- GET `/api/customers/search` - Search customers

### 10. **Cash Shift** (`cash-shift.swagger.ts`)
- POST `/api/shifts/open` - Open cash shift
- POST `/api/shifts/close` - Close cash shift
- GET `/api/shifts/current` - Get current open shift
- GET `/api/shifts/summary` - Get shift summary

### 11. **Reports** (`reports.swagger.ts`)
- GET `/api/reports/sales` - Sales report
- GET `/api/reports/products` - Product performance report
- GET `/api/reports/inventory` - Inventory valuation report

### 12. **Upload** (`upload.swagger.ts`)
- POST `/api/uploads/presigned-url` - Generate S3 pre-signed URL

## How to Use Swagger UI

### 1. **Accessing Protected Endpoints**

Most endpoints require JWT authentication:

1. First, call `POST /api/auth/login` with valid credentials
2. Copy the `token` from the response
3. Click the **"Authorize"** button at the top of Swagger UI
4. Enter: `Bearer <your-token>` (replace `<your-token>` with actual token)
5. Click "Authorize" and then "Close"
6. All subsequent requests will include the JWT token

### 2. **Testing Endpoints**

1. Expand any endpoint section
2. Click **"Try it out"**
3. Fill in the required parameters
4. Click **"Execute"**
5. View the response below

### 3. **Filtering Endpoints**

Use the search/filter box at the top to quickly find specific endpoints.

## Schema Definitions

All common schemas are defined in [index.ts](src/swaggers/index.ts:345):

- **Role**: SUPER_ADMIN, ADMIN, MANAGER, CASHIER
- **Permission**: Granular permissions (11 types)
- **OrderStatus**: DRAFT, PENDING, PAID, CANCELLED, REFUNDED
- **OrderType**: SALE, RETURN, VOID, ADJUSTMENT
- **PaymentMethod**: CASH, CARD, WALLET
- **PaymentStatus**: PENDING, CAPTURED, FAILED, REFUNDED
- **CustomerType**: RETAIL, WHOLESALE
- **ShiftStatus**: OPEN, CLOSED

## Adding New Endpoints

To document a new endpoint:

1. Create or edit the appropriate swagger file in `src/swaggers/`
2. Add the endpoint path and documentation:

```typescript
export const myModuleSwagger = {
  '/api/my-endpoint': {
    post: {
      tags: ['My Module'],
      summary: 'Short description',
      description: 'Detailed description',
      operationId: 'myOperation',
      security: [{ BearerAuth: [] }], // If requires auth
      requestBody: {
        // Request schema
      },
      responses: {
        200: {
          // Response schema
        }
      }
    }
  }
};
```

3. Import and merge in [index.ts](src/swaggers/index.ts:345):

```typescript
import { myModuleSwagger } from './my-module.swagger';

const combinedPaths = {
  ...existingSwagger,
  ...myModuleSwagger
};
```

## Dependencies

The following packages were installed:

```json
{
  "dependencies": {
    "swagger-jsdoc": "^6.x.x",
    "swagger-ui-express": "^5.x.x"
  },
  "devDependencies": {
    "@types/swagger-jsdoc": "^6.x.x",
    "@types/swagger-ui-express": "^4.x.x"
  }
}
```

## Known Issues

1. **Upload Module** - Temporarily disabled due to path resolution issues with `@/` aliases
2. **Environment Variables** - Ensure `.env` file has all required variables (DATABASE_URL, JWT_SECRET, TAP_SECRET_KEY, etc.)

## Configuration

Swagger UI is configured in [app.ts](src/app.ts:32) with:

- **Custom CSS** - Hides top bar for cleaner look
- **Persistent Authorization** - Tokens saved in localStorage
- **Request Duration** - Shows API response times
- **Filter Enabled** - Quick search for endpoints
- **Try It Out** - All endpoints testable

## Benefits

✅ **Developer-Friendly** - Clear API contract for frontend developers
✅ **Self-Documenting** - No need for separate API documentation
✅ **Testing Tool** - Test APIs without Postman/cURL
✅ **Type Safety** - TypeScript interfaces match OpenAPI schemas
✅ **Maintainable** - Modular structure, easy to update
✅ **Production-Ready** - Can be disabled in production if needed

## Next Steps

To enable in production:
- Set `NODE_ENV=production` in environment
- Optionally restrict `/api-docs` to admin users only
- Consider rate limiting for public endpoints

---

**Documentation Generated:** January 2026
**Swagger Version:** OpenAPI 3.0.0
**Framework:** Express.js + TypeScript
