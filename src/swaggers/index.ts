import swaggerJsdoc = require('swagger-jsdoc');
import { authSwagger } from './auth.swagger';
import { productsSwagger } from './products.swagger';
import { categoriesSwagger } from './categories.swagger';
import { ordersSwagger } from './orders.swagger';
import { paymentsSwagger } from './payments.swagger';
import { customersSwagger } from './customers.swagger';
import { inventorySwagger } from './inventory.swagger';
import { reportsSwagger } from './reports.swagger';
import { companySwagger } from './company.swagger';
import { storeSwagger } from './store.swagger';
import { cashShiftSwagger } from './cash-shift.swagger';
import { uploadSwagger } from './upload.swagger';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'POS Backend API Documentation',
    version: '1.0.0',
    description: `
      Complete REST API documentation for the Point of Sale (POS) Backend System.

      ## Features
      - Multi-tenant support (Companies & Stores)
      - Role-based access control (SUPER_ADMIN, ADMIN, MANAGER, CASHIER)
      - Permission-based authorization
      - JWT authentication
      - Product management with variants and barcodes
      - Inventory tracking across stores
      - Order processing with multiple payment methods
      - TAP Payment Gateway integration
      - Customer management
      - Cash shift management
      - Reporting and analytics

      ## Authentication
      Most endpoints require JWT authentication. Include the token in the Authorization header:
      \`Authorization: Bearer <your-jwt-token>\`

      To get a token, use the \`POST /api/auth/login\` endpoint.
    `,
    contact: {
      name: 'API Support',
      email: 'support@pos-backend.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://api.yourdomain.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token in the format: Bearer <token>'
      }
    },
    schemas: {
      // Common schemas used across multiple endpoints
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Error message'
          },
          errors: {
            type: 'array',
            items: {
              type: 'object'
            }
          }
        }
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Operation successful'
          },
          data: {
            type: 'object'
          }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            example: 1
          },
          limit: {
            type: 'integer',
            example: 10
          },
          total: {
            type: 'integer',
            example: 100
          },
          totalPages: {
            type: 'integer',
            example: 10
          }
        }
      },
      Role: {
        type: 'string',
        enum: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER'],
        description: 'User role in the system'
      },
      Permission: {
        type: 'string',
        enum: [
          'VIEW_DASHBOARD',
          'VIEW_REPORTS',
          'MANAGE_COMPANY',
          'MANAGE_SUBSCRIPTION',
          'MANAGE_STORES',
          'MANAGE_USERS',
          'MANAGE_PRODUCTS',
          'MANAGE_STOCK',
          'CREATE_ORDER',
          'PROCESS_PAYMENT',
          'PRINT_RECEIPT'
        ],
        description: 'Granular permission for specific actions'
      },
      OrderStatus: {
        type: 'string',
        enum: ['DRAFT', 'PENDING', 'PAID', 'CANCELLED', 'REFUNDED'],
        description: 'Current status of an order'
      },
      OrderType: {
        type: 'string',
        enum: ['SALE', 'RETURN', 'VOID', 'ADJUSTMENT'],
        description: 'Type of order transaction'
      },
      PaymentMethod: {
        type: 'string',
        enum: ['CASH', 'CARD', 'WALLET'],
        description: 'Payment method used'
      },
      PaymentProvider: {
        type: 'string',
        enum: ['INTERNAL', 'TAP'],
        description: 'Payment processing provider'
      },
      PaymentStatus: {
        type: 'string',
        enum: ['PENDING', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
        description: 'Status of payment transaction'
      },
      CustomerType: {
        type: 'string',
        enum: ['RETAIL', 'WHOLESALE'],
        description: 'Type of customer'
      },
      ShiftStatus: {
        type: 'string',
        enum: ['OPEN', 'CLOSED'],
        description: 'Status of cash shift'
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication token is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              message: 'Unauthorized - Invalid or missing token'
            }
          }
        }
      },
      ForbiddenError: {
        description: 'User does not have permission to access this resource',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              message: 'Forbidden - Insufficient permissions'
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              message: 'Resource not found'
            }
          }
        }
      },
      BadRequestError: {
        description: 'Invalid request data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              message: 'Validation failed',
              errors: [
                {
                  field: 'email',
                  message: 'Invalid email format'
                }
              ]
            }
          }
        }
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              message: 'Internal server error'
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and registration endpoints'
    },
    {
      name: 'Company',
      description: 'Company management (multi-tenant organization)'
    },
    {
      name: 'Store',
      description: 'Store management within companies'
    },
    {
      name: 'Products',
      description: 'Product catalog management'
    },
    {
      name: 'Product Variants',
      description: 'Product variants with barcode and SKU management'
    },
    {
      name: 'Categories',
      description: 'Product category management'
    },
    {
      name: 'Inventory',
      description: 'Stock tracking and management'
    },
    {
      name: 'Orders',
      description: 'Order processing and management'
    },
    {
      name: 'Payments',
      description: 'Payment processing and refunds'
    },
    {
      name: 'Customers',
      description: 'Customer profile management'
    },
    {
      name: 'Cash Shift',
      description: 'Cashier shift management'
    },
    {
      name: 'Upload',
      description: 'File upload to AWS S3'
    },
    {
      name: 'Reports',
      description: 'Analytics and reporting'
    }
  ],
  paths: {}
};

// Merge all module-specific swagger paths
const combinedPaths = {
  ...authSwagger,
  ...productsSwagger,
  ...categoriesSwagger,
  ...ordersSwagger,
  ...paymentsSwagger,
  ...customersSwagger,
  ...inventorySwagger,
  ...reportsSwagger,
  ...companySwagger,
  ...storeSwagger,
  ...cashShiftSwagger,
  ...uploadSwagger
};

swaggerDefinition.paths = combinedPaths;

const swaggerOptions: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: [] // We're not using file-based annotations, all paths are defined in modules
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
