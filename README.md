# POS Backend - Scalable Multi-Tenant Point of Sale System

A production-ready POS backend built with Node.js, Express, TypeScript, PostgreSQL, and Prisma ORM. Features multi-tenant architecture with role-based access control (RBAC).

## 🏗️ Architecture

- **Layered Architecture**: Controller → Service → Repository
- **Modular Design**: Each feature is self-contained
- **Multi-Tenant**: Supports multiple companies and stores
- **RBAC**: Role and permission-based access control

## 🔑 Features

- ✅ JWT Authentication
- ✅ Multi-tenant support (Companies & Stores)
- ✅ Role-based access (SUPER_ADMIN, ADMIN, MANAGER, CASHIER)
- ✅ Permission-based authorization
- ✅ Product management with stock tracking
- ✅ Order & Payment processing
- ✅ AWS S3 image upload for products, variants, and company profiles
- ✅ Clean separation of concerns
- ✅ Centralized error handling

## 📁 Project Structure

```
pos-backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Migration files
│
├── src/
│   ├── modules/
│   │   ├── auth/             # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.dto.ts
│   │   │
│   │   ├── product/          # Product module
│   │   │   ├── product.controller.ts
│   │   │   ├── product.service.ts
│   │   │   ├── product.repository.ts
│   │   │   ├── product.routes.ts
│   │   │   └── product.dto.ts
│   │   │
│   │   ├── company/          # Company module (to be implemented)
│   │   ├── store/            # Store module (to be implemented)
│   │   ├── user/             # User module (to be implemented)
│   │   ├── stock/            # Stock module (to be implemented)
│   │   ├── order/            # Order module (to be implemented)
│   │   ├── payment/          # Payment module (to be implemented)
│   │   └── report/           # Report module (to be implemented)
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts      # JWT authentication
│   │   ├── role.middleware.ts      # RBAC middleware
│   │   └── error.middleware.ts     # Error handling
│   │
│   ├── config/
│   │   ├── env.ts                  # Environment config
│   │   └── database.ts             # Prisma client
│   │
│   ├── utils/
│   │   ├── response.ts             # API response helper
│   │   └── jwt.ts                  # JWT utility
│   │
│   ├── app.ts                      # Express app setup
│   └── server.ts                   # Server entry point
│
├── .env                            # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Installation

1. **Clone and navigate to the project**
   ```bash
   cd pos-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` and update with your configuration:
   ```bash
   cp .env.example .env
   ```

   Update the `.env` file:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/pos_db?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   JWT_EXPIRES_IN="7d"
   PORT=3000
   NODE_ENV="development"

   # AWS S3 (for image uploads)
   AWS_REGION="us-east-1"
   AWS_ACCESS_KEY_ID="your-aws-access-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
   AWS_S3_BUCKET="pos-system-bucket"
   ```

4. **Setup database**

   Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

   Run migrations:
   ```bash
   npm run prisma:migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Server will start on `http://localhost:3000`

## 📝 Available Scripts

```bash
npm run dev              # Start development server with hot reload
npm run build            # Build for production
npm start                # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
```

## 🔐 Authentication & Authorization

### Roles

- **SUPER_ADMIN**: Full system access
- **ADMIN**: Company-level access
- **MANAGER**: Store-level access
- **CASHIER**: Basic POS operations

### Permissions

The system uses granular permissions for each module:
- `CREATE_PRODUCT`, `READ_PRODUCT`, `UPDATE_PRODUCT`, `DELETE_PRODUCT`
- `CREATE_ORDER`, `READ_ORDER`, `UPDATE_ORDER`, `DELETE_ORDER`
- `PROCESS_PAYMENT`, `READ_PAYMENT`, `REFUND_PAYMENT`
- And more...

### Usage Example

**Protected Route with Role:**
```typescript
router.post('/products',
  authenticate,
  requireRole('ADMIN', 'MANAGER'),
  productController.create
);
```

**Protected Route with Permission:**
```typescript
router.post('/products',
  authenticate,
  requirePermission(Permission.CREATE_PRODUCT),
  productController.create
);
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile (protected)

### Products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/store/:storeId` - Get all products by store
- `GET /api/products/store/:storeId/search?q=query` - Search products
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

## 🗄️ Database Schema

### Core Models

- **Company**: Multi-tenant company entity
- **Store**: Multiple stores per company
- **User**: Users with roles and permissions
- **Product**: Products with SKU and barcode
- **Stock**: Stock management per store
- **Order**: Customer orders
- **Payment**: Payment processing

## 🛡️ Security Best Practices

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Environment-based configuration
- ✅ Input validation with Zod
- ✅ SQL injection protection (Prisma ORM)
- ✅ CORS enabled
- ✅ Error handling without stack trace leaks

## 📦 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Zod
- **Password Hashing**: bcryptjs

## 🔨 Development Guidelines

### Adding a New Module

1. Create folder in `src/modules/[module-name]/`
2. Create files:
   - `[module].dto.ts` - Data validation schemas
   - `[module].repository.ts` - Database operations
   - `[module].service.ts` - Business logic
   - `[module].controller.ts` - Request handling
   - `[module].routes.ts` - Route definitions
3. Register routes in `src/app.ts`

### Code Organization Rules

- **Controllers**: Handle HTTP requests/responses only
- **Services**: Contain all business logic
- **Repositories**: Handle database operations only
- **DTOs**: Define validation schemas
- **Routes**: Define endpoints and middleware

## 🚧 To Do

The following modules need to be implemented:
- [ ] Company module (CRUD operations)
- [ ] Store module (CRUD operations)
- [ ] User module (user management)
- [ ] Stock module (inventory management)
- [ ] Order module (order processing)
- [ ] Payment module (payment processing)
- [ ] Report module (analytics and reports)

## 📄 License

ISC

## 👨‍💻 Author

Your Name

---

**Note**: This is a backend API. You'll need to build a frontend application to interact with these endpoints.
