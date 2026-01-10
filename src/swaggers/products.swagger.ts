export const productsSwagger = {
  '/api/products': {
    post: {
      tags: ['Products'],
      summary: 'Create new product',
      description: 'Create a new product in the catalog. Requires MANAGE_PRODUCTS permission.',
      operationId: 'createProduct',
      security: [
        {
          BearerAuth: []
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'companyId'],
              properties: {
                name: {
                  type: 'string',
                  example: 'Wireless Mouse'
                },
                description: {
                  type: 'string',
                  nullable: true,
                  example: 'Ergonomic wireless mouse with USB receiver'
                },
                categoryId: {
                  type: 'string',
                  nullable: true,
                  example: 'cm4s8k8z10010v1aqzqzqzqzq'
                },
                companyId: {
                  type: 'string',
                  example: 'cm4s8k8z10001v1aqzqzqzqzq'
                },
                imageUrl: {
                  type: 'string',
                  nullable: true,
                  example: 'https://s3.amazonaws.com/bucket/product-image.jpg'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Product created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'Product created successfully'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        example: 'cm4s8k8z10020v1aqzqzqzqzq'
                      },
                      name: {
                        type: 'string',
                        example: 'Wireless Mouse'
                      },
                      description: {
                        type: 'string',
                        nullable: true
                      },
                      categoryId: {
                        type: 'string',
                        nullable: true
                      },
                      companyId: {
                        type: 'string'
                      },
                      imageUrl: {
                        type: 'string',
                        nullable: true
                      },
                      createdAt: {
                        type: 'string',
                        format: 'date-time'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/BadRequestError'
        },
        401: {
          $ref: '#/components/responses/UnauthorizedError'
        },
        403: {
          $ref: '#/components/responses/ForbiddenError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    },
    get: {
      tags: ['Products'],
      summary: 'Get all products',
      description: 'Retrieve all products for a company with pagination support',
      operationId: 'getAllProducts',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'companyId',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Company ID to filter products'
        },
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
            default: 1
          },
          description: 'Page number'
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
            default: 10
          },
          description: 'Number of items per page'
        }
      ],
      responses: {
        200: {
          description: 'Products retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'Products retrieved successfully'
                  },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string'
                        },
                        name: {
                          type: 'string'
                        },
                        description: {
                          type: 'string',
                          nullable: true
                        },
                        categoryId: {
                          type: 'string',
                          nullable: true
                        },
                        imageUrl: {
                          type: 'string',
                          nullable: true
                        },
                        variants: {
                          type: 'array',
                          items: {
                            type: 'object'
                          }
                        }
                      }
                    }
                  },
                  pagination: {
                    $ref: '#/components/schemas/Pagination'
                  }
                }
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/UnauthorizedError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },
  '/api/products/{id}': {
    get: {
      tags: ['Products'],
      summary: 'Get product by ID',
      description: 'Retrieve a single product with its variants',
      operationId: 'getProductById',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Product ID'
        }
      ],
      responses: {
        200: {
          description: 'Product retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'Product retrieved successfully'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string'
                      },
                      name: {
                        type: 'string'
                      },
                      description: {
                        type: 'string',
                        nullable: true
                      },
                      categoryId: {
                        type: 'string',
                        nullable: true
                      },
                      imageUrl: {
                        type: 'string',
                        nullable: true
                      },
                      variants: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: {
                              type: 'string'
                            },
                            sku: {
                              type: 'string'
                            },
                            barcode: {
                              type: 'string',
                              nullable: true
                            },
                            price: {
                              type: 'number',
                              format: 'float'
                            },
                            costPrice: {
                              type: 'number',
                              format: 'float'
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/UnauthorizedError'
        },
        404: {
          $ref: '#/components/responses/NotFoundError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    },
    put: {
      tags: ['Products'],
      summary: 'Update product',
      description: 'Update product information. Requires MANAGE_PRODUCTS permission.',
      operationId: 'updateProduct',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Product ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: 'Updated Product Name'
                },
                description: {
                  type: 'string',
                  nullable: true
                },
                categoryId: {
                  type: 'string',
                  nullable: true
                },
                imageUrl: {
                  type: 'string',
                  nullable: true
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Product updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'Product updated successfully'
                  },
                  data: {
                    type: 'object'
                  }
                }
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/BadRequestError'
        },
        401: {
          $ref: '#/components/responses/UnauthorizedError'
        },
        403: {
          $ref: '#/components/responses/ForbiddenError'
        },
        404: {
          $ref: '#/components/responses/NotFoundError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    },
    delete: {
      tags: ['Products'],
      summary: 'Delete product',
      description: 'Delete a product from the catalog. Requires MANAGE_PRODUCTS permission.',
      operationId: 'deleteProduct',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Product ID'
        }
      ],
      responses: {
        200: {
          description: 'Product deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'Product deleted successfully'
                  }
                }
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/UnauthorizedError'
        },
        403: {
          $ref: '#/components/responses/ForbiddenError'
        },
        404: {
          $ref: '#/components/responses/NotFoundError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },
  '/api/products/search': {
    get: {
      tags: ['Products'],
      summary: 'Search products',
      description: 'Search products by name or description',
      operationId: 'searchProducts',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'query',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Search query string'
        },
        {
          name: 'companyId',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Company ID to filter products'
        }
      ],
      responses: {
        200: {
          description: 'Search results retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'Search results retrieved successfully'
                  },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object'
                    }
                  }
                }
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/UnauthorizedError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },
  '/api/product-variants': {
    post: {
      tags: ['Product Variants'],
      summary: 'Create product variant',
      description: 'Create a new product variant with pricing and inventory details. Requires MANAGE_PRODUCTS permission.',
      operationId: 'createProductVariant',
      security: [
        {
          BearerAuth: []
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['productId', 'sku', 'price', 'costPrice'],
              properties: {
                productId: {
                  type: 'string',
                  example: 'cm4s8k8z10020v1aqzqzqzqzq'
                },
                sku: {
                  type: 'string',
                  example: 'WM-BLK-001',
                  description: 'Stock Keeping Unit - must be unique'
                },
                barcode: {
                  type: 'string',
                  nullable: true,
                  example: '1234567890123',
                  description: 'Product barcode (EAN/UPC)'
                },
                name: {
                  type: 'string',
                  nullable: true,
                  example: 'Black',
                  description: 'Variant name (e.g., color, size)'
                },
                price: {
                  type: 'number',
                  format: 'float',
                  example: 29.99
                },
                costPrice: {
                  type: 'number',
                  format: 'float',
                  example: 15.00
                },
                imageUrl: {
                  type: 'string',
                  nullable: true,
                  example: 'https://s3.amazonaws.com/bucket/variant-image.jpg'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Product variant created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'Product variant created successfully'
                  },
                  data: {
                    type: 'object'
                  }
                }
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/BadRequestError'
        },
        401: {
          $ref: '#/components/responses/UnauthorizedError'
        },
        403: {
          $ref: '#/components/responses/ForbiddenError'
        },
        409: {
          description: 'SKU or barcode already exists',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },
  '/api/product-variants/barcode/{barcode}': {
    get: {
      tags: ['Product Variants'],
      summary: 'Get variant by barcode',
      description: 'Retrieve product variant by scanning barcode',
      operationId: 'getVariantByBarcode',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'barcode',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Product barcode'
        }
      ],
      responses: {
        200: {
          description: 'Variant retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  data: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string'
                      },
                      sku: {
                        type: 'string'
                      },
                      barcode: {
                        type: 'string'
                      },
                      price: {
                        type: 'number'
                      },
                      product: {
                        type: 'object',
                        properties: {
                          name: {
                            type: 'string'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/UnauthorizedError'
        },
        404: {
          $ref: '#/components/responses/NotFoundError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },
  '/api/product-variants/sku/{sku}': {
    get: {
      tags: ['Product Variants'],
      summary: 'Get variant by SKU',
      description: 'Retrieve product variant by SKU',
      operationId: 'getVariantBySku',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'sku',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Product SKU'
        }
      ],
      responses: {
        200: {
          description: 'Variant retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  data: {
                    type: 'object'
                  }
                }
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/UnauthorizedError'
        },
        404: {
          $ref: '#/components/responses/NotFoundError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  }
};
