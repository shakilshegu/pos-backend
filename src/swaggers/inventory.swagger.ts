export const inventorySwagger = {
  '/api/inventory': {
    post: {
      tags: ['Inventory'],
      summary: 'Create inventory record',
      description: 'Create initial inventory record for a product variant at a store. Requires MANAGE_STOCK permission.',
      operationId: 'createInventory',
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
              required: ['productVariantId', 'storeId', 'quantity'],
              properties: {
                productVariantId: {
                  type: 'string',
                  example: 'cm4s8k8z10025v1aqzqzqzqzq'
                },
                storeId: {
                  type: 'string',
                  example: 'cm4s8k8z10002v1aqzqzqzqzq'
                },
                quantity: {
                  type: 'integer',
                  minimum: 0,
                  example: 100
                },
                lowStockThreshold: {
                  type: 'integer',
                  nullable: true,
                  example: 10,
                  description: 'Alert threshold for low stock'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Inventory record created',
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
                    example: 'Inventory created successfully'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string'
                      },
                      quantity: {
                        type: 'integer'
                      },
                      lowStockThreshold: {
                        type: 'integer',
                        nullable: true
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
        409: {
          description: 'Inventory record already exists',
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
  '/api/inventory/store/{storeId}': {
    get: {
      tags: ['Inventory'],
      summary: 'Get inventory by store',
      description: 'Retrieve all inventory records for a specific store',
      operationId: 'getInventoryByStore',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'storeId',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'page',
          in: 'query',
          schema: {
            type: 'integer',
            default: 1
          }
        },
        {
          name: 'limit',
          in: 'query',
          schema: {
            type: 'integer',
            default: 50
          }
        }
      ],
      responses: {
        200: {
          description: 'Inventory retrieved successfully',
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
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string'
                        },
                        quantity: {
                          type: 'integer'
                        },
                        lowStockThreshold: {
                          type: 'integer',
                          nullable: true
                        },
                        productVariant: {
                          type: 'object',
                          properties: {
                            sku: {
                              type: 'string'
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
        404: {
          $ref: '#/components/responses/NotFoundError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },
  '/api/inventory/low-stock': {
    get: {
      tags: ['Inventory'],
      summary: 'Get low stock items',
      description: 'Retrieve items that are at or below their low stock threshold',
      operationId: 'getLowStockItems',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'storeId',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        200: {
          description: 'Low stock items retrieved',
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
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string'
                        },
                        quantity: {
                          type: 'integer'
                        },
                        lowStockThreshold: {
                          type: 'integer'
                        },
                        productVariant: {
                          type: 'object'
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
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },
  '/api/inventory/adjust': {
    post: {
      tags: ['Inventory'],
      summary: 'Adjust inventory quantity',
      description: 'Manually adjust inventory quantity (stock correction, damage, etc.). Requires MANAGE_STOCK permission.',
      operationId: 'adjustInventory',
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
              required: ['inventoryId', 'adjustment', 'reason'],
              properties: {
                inventoryId: {
                  type: 'string',
                  example: 'cm4s8k8z10070v1aqzqzqzqzq'
                },
                adjustment: {
                  type: 'integer',
                  example: -5,
                  description: 'Positive for stock increase, negative for decrease'
                },
                reason: {
                  type: 'string',
                  example: 'Damaged items removed from stock'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Inventory adjusted successfully',
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
                    example: 'Inventory adjusted successfully'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      newQuantity: {
                        type: 'integer'
                      },
                      adjustment: {
                        type: 'integer'
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
