# Image Upload System Design - AWS S3

## Overview
Multi-tenant POS system with AWS S3 image storage for:
- Company profile images
- Product images
- Product variant images

---

## 1️⃣ S3 Storage Structure

```
pos-system-bucket/
│
├── companies/
│   ├── {companyId}/
│   │   ├── profile/
│   │   │   └── logo.jpg
│   │   │
│   │   └── products/
│   │       ├── {productId}/
│   │       │   ├── main.jpg
│   │       │   └── variants/
│   │       │       ├── {sku}-1.jpg
│   │       │       ├── {sku}-2.jpg
│   │       │       └── {sku}-3.jpg
│   │       │
│   │       └── {productId}/
│   │           ├── main.jpg
│   │           └── variants/
│   │               └── {sku}.jpg
```

**Example Paths:**
```
companies/uuid-123/profile/logo.jpg
companies/uuid-123/products/prod-456/main.jpg
companies/uuid-123/products/prod-456/variants/SKU-001.jpg
```

---

## 2️⃣ Database Schema Updates

### Company Table
```prisma
model Company {
  id            String   @id @default(uuid())
  name          String
  email         String
  profileImageUrl String?  // NEW FIELD
  // ... existing fields
}
```

### Product Table
```prisma
model Product {
  id              String   @id @default(uuid())
  name            String
  mainImageUrl    String?  // NEW FIELD
  // ... existing fields
}
```

### ProductVariant Table
```prisma
model ProductVariant {
  id          String   @id @default(uuid())
  name        String
  sku         String?
  imageUrl    String?  // NEW FIELD
  // ... existing fields
}
```

---

## 3️⃣ API Design

### A. Generate Pre-signed Upload URL

**Endpoint:** `POST /api/uploads/presigned-url`

**Allowed Roles:** ADMIN, MANAGER

**Request Body:**
```json
{
  "fileType": "company-profile | product | variant",
  "fileName": "logo.jpg",
  "contentType": "image/jpeg",
  "productId": "uuid (required if fileType = product or variant)",
  "variantSku": "SKU-001 (required if fileType = variant)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/signed-url-here",
    "fileUrl": "https://s3.amazonaws.com/companies/uuid-123/products/prod-456/main.jpg",
    "expiresIn": 300
  }
}
```

**Logic:**
1. Validate user role (ADMIN/MANAGER)
2. Validate user belongs to company
3. Generate S3 path based on fileType
4. Create pre-signed URL (5 min expiry)
5. Return both uploadUrl (for upload) and fileUrl (to save in DB)

---

### B. Update Company Profile Image

**Endpoint:** `PATCH /api/companies/:id/profile-image`

**Allowed Roles:** ADMIN

**Request Body:**
```json
{
  "profileImageUrl": "https://s3.amazonaws.com/companies/uuid-123/profile/logo.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "profileImageUrl": "https://s3.amazonaws.com/..."
  }
}
```

---

### C. Create/Update Product (with image)

**Endpoint:** `POST /api/products`

**Allowed Roles:** ADMIN, MANAGER

**Request Body:**
```json
{
  "name": "T-Shirt",
  "mainImageUrl": "https://s3.amazonaws.com/companies/uuid-123/products/prod-456/main.jpg",
  "baseRetailPrice": 100,
  // ... other fields
}
```

**Response:** Standard product response

---

### D. Create/Update Product Variant (with image)

**Endpoint:** `POST /api/product-variants`

**Allowed Roles:** ADMIN, MANAGER

**Request Body:**
```json
{
  "name": "Small",
  "sku": "TS-SM-001",
  "imageUrl": "https://s3.amazonaws.com/companies/uuid-123/products/prod-456/variants/TS-SM-001.jpg",
  "retailPrice": 100,
  // ... other fields
}
```

**Response:** Standard variant response

---

## 4️⃣ Upload Flow (Step-by-Step)

### Flow A: Upload Company Profile Image

```
┌─────────────┐                  ┌─────────────┐                  ┌─────────────┐
│  Frontend   │                  │   Backend   │                  │   AWS S3    │
└──────┬──────┘                  └──────┬──────┘                  └──────┬──────┘
       │                                │                                │
       │  1. Request upload URL         │                                │
       │  POST /uploads/presigned-url   │                                │
       │  {fileType: "company-profile"} │                                │
       ├───────────────────────────────>│                                │
       │                                │                                │
       │                                │  2. Validate user role         │
       │                                │     & companyId                │
       │                                │                                │
       │                                │  3. Generate S3 path:          │
       │                                │     companies/{companyId}/     │
       │                                │     profile/logo.jpg           │
       │                                │                                │
       │                                │  4. Create pre-signed URL      │
       │                                ├───────────────────────────────>│
       │                                │                                │
       │                                │  5. Return signed URL          │
       │                                │<───────────────────────────────┤
       │                                │                                │
       │  6. Return URLs                │                                │
       │  {uploadUrl, fileUrl}          │                                │
       │<───────────────────────────────┤                                │
       │                                │                                │
       │  7. Upload image directly      │                                │
       │    PUT uploadUrl + file        │                                │
       ├────────────────────────────────┴───────────────────────────────>│
       │                                                                  │
       │  8. S3 upload success                                           │
       │<─────────────────────────────────────────────────────────────────┤
       │                                │                                │
       │  9. Update company             │                                │
       │  PATCH /companies/:id/         │                                │
       │  profile-image                 │                                │
       │  {profileImageUrl: fileUrl}    │                                │
       ├───────────────────────────────>│                                │
       │                                │                                │
       │                                │  10. Save URL in DB            │
       │                                │      (profileImageUrl)         │
       │                                │                                │
       │  11. Success response          │                                │
       │<───────────────────────────────┤                                │
       │                                │                                │
```

---

### Flow B: Upload Product Image

```
Step 1: Request Pre-signed URL
   Frontend → Backend
   POST /api/uploads/presigned-url
   {
     "fileType": "product",
     "fileName": "tshirt.jpg",
     "contentType": "image/jpeg",
     "productId": "prod-456"
   }

Step 2: Backend Validates
   - Check user role (ADMIN/MANAGER)
   - Check user.companyId matches product.companyId
   - Generate S3 path: companies/{companyId}/products/{productId}/main.jpg

Step 3: Backend Returns URLs
   Backend → Frontend
   {
     "uploadUrl": "https://s3.presigned-url...",
     "fileUrl": "https://s3.../companies/uuid-123/products/prod-456/main.jpg"
   }

Step 4: Frontend Uploads to S3
   Frontend → S3
   PUT uploadUrl
   Headers: { "Content-Type": "image/jpeg" }
   Body: <image-file>

Step 5: Frontend Updates Product
   Frontend → Backend
   PUT /api/products/prod-456
   {
     "mainImageUrl": "https://s3.../companies/uuid-123/products/prod-456/main.jpg"
   }

Step 6: Backend Saves URL
   - Update product.mainImageUrl in database
   - Return updated product
```

---

### Flow C: Upload Variant Image

```
Step 1: Request Pre-signed URL
   POST /api/uploads/presigned-url
   {
     "fileType": "variant",
     "fileName": "small-red.jpg",
     "contentType": "image/jpeg",
     "productId": "prod-456",
     "variantSku": "TS-SM-001"
   }

Step 2: Backend Generates Path
   companies/{companyId}/products/{productId}/variants/{sku}.jpg

Step 3: Frontend Uploads to S3
   PUT uploadUrl → S3

Step 4: Frontend Creates/Updates Variant
   POST /api/product-variants
   {
     "name": "Small Red",
     "sku": "TS-SM-001",
     "imageUrl": "https://s3.../variants/TS-SM-001.jpg",
     "productId": "prod-456"
   }
```

---

## 5️⃣ Security Rules

### S3 Bucket Configuration
```json
{
  "Bucket": "pos-system-bucket",
  "ACL": "private",
  "BlockPublicAccess": true,
  "CORS": [
    {
      "AllowedOrigins": ["https://your-frontend-domain.com"],
      "AllowedMethods": ["GET", "PUT"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### Pre-signed URL Rules
- **Expiry**: 5 minutes (300 seconds)
- **Max file size**: 5MB (enforced at application level)
- **Allowed types**: `image/jpeg`, `image/png`, `image/webp`
- **Private**: No public read access

### Access Control
```
┌─────────────────────┬──────────────────────────────┐
│ Role                │ Can Upload                   │
├─────────────────────┼──────────────────────────────┤
│ SUPER_ADMIN         │ All companies                │
│ ADMIN               │ Own company only             │
│ MANAGER             │ Own company only             │
│ CASHIER             │ ❌ Not allowed                │
└─────────────────────┴──────────────────────────────┘
```

### Validation Rules
1. **User belongs to company**: `user.companyId === company.id`
2. **File type allowed**: Only `jpg`, `png`, `webp`
3. **File size**: Max 5MB (check before upload)
4. **Path isolation**: Users can only upload to their company folder

---

## 6️⃣ Implementation Files

### A. Upload Controller (`src/modules/upload/upload.controller.ts`)

```typescript
import { Request, Response } from 'express';
import { uploadService } from './upload.service';
import { successResponse, errorResponse } from '@/utils/response';

export const uploadController = {
  // Generate pre-signed URL
  async generatePresignedUrl(req: Request, res: Response) {
    try {
      const { fileType, fileName, contentType, productId, variantSku } = req.body;
      const user = req.user; // From auth middleware

      const result = await uploadService.generatePresignedUrl({
        fileType,
        fileName,
        contentType,
        productId,
        variantSku,
        companyId: user.companyId!,
        userId: user.id,
      });

      return successResponse(res, result, 'Pre-signed URL generated');
    } catch (error: any) {
      return errorResponse(res, error.message, 400);
    }
  },
};
```

---

### B. Upload Service (`src/modules/upload/upload.service.ts`)

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '@/config/database';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET!;
const EXPIRATION = 300; // 5 minutes

export const uploadService = {
  async generatePresignedUrl(data: {
    fileType: 'company-profile' | 'product' | 'variant';
    fileName: string;
    contentType: string;
    productId?: string;
    variantSku?: string;
    companyId: string;
    userId: string;
  }) {
    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(data.contentType)) {
      throw new Error('Invalid file type. Only JPG, PNG, WEBP allowed');
    }

    // Generate S3 path based on file type
    let s3Path = '';

    if (data.fileType === 'company-profile') {
      s3Path = `companies/${data.companyId}/profile/${data.fileName}`;
    }
    else if (data.fileType === 'product') {
      if (!data.productId) throw new Error('productId required for product images');

      // Validate product belongs to company
      const product = await prisma.product.findFirst({
        where: { id: data.productId, companyId: data.companyId },
      });
      if (!product) throw new Error('Product not found or access denied');

      s3Path = `companies/${data.companyId}/products/${data.productId}/main.jpg`;
    }
    else if (data.fileType === 'variant') {
      if (!data.productId || !data.variantSku) {
        throw new Error('productId and variantSku required for variant images');
      }

      // Validate product belongs to company
      const product = await prisma.product.findFirst({
        where: { id: data.productId, companyId: data.companyId },
      });
      if (!product) throw new Error('Product not found or access denied');

      s3Path = `companies/${data.companyId}/products/${data.productId}/variants/${data.variantSku}.jpg`;
    }

    // Generate pre-signed URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Path,
      ContentType: data.contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: EXPIRATION,
    });

    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Path}`;

    return {
      uploadUrl,
      fileUrl,
      expiresIn: EXPIRATION,
    };
  },
};
```

---

### C. Upload Routes (`src/modules/upload/upload.routes.ts`)

```typescript
import { Router } from 'express';
import { uploadController } from './upload.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { requirePermissions } from '@/middlewares/permission.middleware';

const router = Router();

router.post(
  '/presigned-url',
  authenticate,
  requirePermissions(['MANAGE_PRODUCTS', 'MANAGE_COMPANY']),
  uploadController.generatePresignedUrl
);

export default router;
```

---

### D. Upload DTO (`src/modules/upload/upload.dto.ts`)

```typescript
import { z } from 'zod';

export const generatePresignedUrlSchema = z.object({
  fileType: z.enum(['company-profile', 'product', 'variant']),
  fileName: z.string().min(1),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  productId: z.string().uuid().optional(),
  variantSku: z.string().optional(),
});

export type GeneratePresignedUrlDTO = z.infer<typeof generatePresignedUrlSchema>;
```

---

### E. Environment Variables (`.env`)

```bash
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=pos-system-bucket
```

---

### F. Update Company Controller

```typescript
// Add to src/modules/company/company.controller.ts

async updateProfileImage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { profileImageUrl } = req.body;
    const user = req.user;

    // Validate user owns company
    if (user.companyId !== id && user.role !== 'SUPER_ADMIN') {
      return errorResponse(res, 'Access denied', 403);
    }

    const company = await companyService.updateProfileImage(id, profileImageUrl);
    return successResponse(res, company, 'Profile image updated');
  } catch (error: any) {
    return errorResponse(res, error.message, 400);
  }
}
```

---

### G. Update Product/Variant DTOs

```typescript
// src/modules/product/product.dto.ts
export const createProductSchema = z.object({
  name: z.string().min(1),
  mainImageUrl: z.string().url().optional(), // NEW
  baseRetailPrice: z.number().positive(),
  // ... other fields
});

// src/modules/product-variant/product-variant.dto.ts
export const createProductVariantSchema = z.object({
  name: z.string().min(1),
  imageUrl: z.string().url().optional(), // NEW
  sku: z.string().optional(),
  // ... other fields
});
```

---

## 7️⃣ Frontend Integration Example

```typescript
// Frontend: Upload Product Image

async function uploadProductImage(productId: string, file: File) {
  // Step 1: Get pre-signed URL
  const { data } = await api.post('/api/uploads/presigned-url', {
    fileType: 'product',
    fileName: file.name,
    contentType: file.type,
    productId: productId,
  });

  const { uploadUrl, fileUrl } = data;

  // Step 2: Upload to S3
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  // Step 3: Update product with image URL
  await api.put(`/api/products/${productId}`, {
    mainImageUrl: fileUrl,
  });

  return fileUrl;
}
```

---

## 8️⃣ Database Migration

```prisma
-- Add image fields to tables

-- Company
ALTER TABLE "Company" ADD COLUMN "profileImageUrl" TEXT;

-- Product
ALTER TABLE "Product" ADD COLUMN "mainImageUrl" TEXT;

-- ProductVariant
ALTER TABLE "ProductVariant" ADD COLUMN "imageUrl" TEXT;
```

---

## Summary

✅ **S3 Structure**: Clean multi-tenant folder organization
✅ **Database**: Only store URLs (not files)
✅ **Security**: Private bucket + pre-signed URLs + role validation
✅ **APIs**: Simple upload flow (request URL → upload → save URL)
✅ **Access Control**: Company isolation enforced

**Key Points:**
- Frontend uploads directly to S3 (no backend file handling)
- Backend only generates secure upload URLs
- Images isolated by company (multi-tenant safe)
- Simple 3-step flow: Request → Upload → Save
