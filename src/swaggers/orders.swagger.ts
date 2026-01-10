export const ordersSwagger = {
  '/api/orders': {
    post: {
      tags: ['Orders'],
      summary: 'Create new order',
      description: 'Create a new order (draft cart). Requires CREATE_ORDER permission.',
      operationId: 'createOrder',
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
              required: ['storeId', 'type'],
              properties: {
                storeId: {
                  type: 'string',
                  example: 'cm4s8k8z10002v1aqzqzqzqzq'
                },
                customerId: {
                  type: 'string',
                  nullable: true,
                  example: 'cm4s8k8z10030v1aqzqzqzqzq'
                },
                type: {
                  $ref: '#/components/schemas/OrderType'
                },
                notes: {
                  type: 'string',
                  nullable: true,
                  example: 'Customer requested gift wrapping'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Order created successfully',
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
                    example: 'Order created successfully'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        example: 'cm4s8k8z10040v1aqzqzqzqzq'
                      },
                      orderNumber: {
                        type: 'string',
                        example: 'ORD-20240101-0001'
                      },
                      status: {
                        $ref: '#/components/schemas/OrderStatus'
                      },
                      type: {
                        $ref: '#/components/schemas/OrderType'
                      },
                      subtotal: {
                        type: 'number',
                        example: 0
                      },
                      tax: {
                        type: 'number',
                        example: 0
                      },
                      discount: {
                        type: 'number',
                        example: 0
                      },
                      total: {
                        type: 'number',
                        example: 0
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
      tags: ['Orders'],
      summary: 'Get all orders',
      description: 'Retrieve all orders with filtering and pagination',
      operationId: 'getAllOrders',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'storeId',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          },
          description: 'Filter by store ID'
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            $ref: '#/components/schemas/OrderStatus'
          },
          description: 'Filter by order status'
        },
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
            default: 1
          }
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
            default: 10
          }
        }
      ],
      responses: {
        200: {
          description: 'Orders retrieved successfully',
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
                      type: 'object'
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
  '/api/orders/{orderId}/items': {
    post: {
      tags: ['Orders'],
      summary: 'Add item to order',
      description: 'Add a product variant to the order cart. Requires CREATE_ORDER permission.',
      operationId: 'addOrderItem',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'orderId',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['productVariantId', 'quantity'],
              properties: {
                productVariantId: {
                  type: 'string',
                  example: 'cm4s8k8z10025v1aqzqzqzqzq'
                },
                quantity: {
                  type: 'integer',
                  minimum: 1,
                  example: 2
                },
                notes: {
                  type: 'string',
                  nullable: true,
                  example: 'Extra warranty requested'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Item added to order',
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
                    example: 'Item added to order'
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
    }
  },
  '/api/orders/{orderId}/items/{itemId}': {
    put: {
      tags: ['Orders'],
      summary: 'Update order item',
      description: 'Update quantity or notes for an order item',
      operationId: 'updateOrderItem',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'orderId',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'itemId',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                quantity: {
                  type: 'integer',
                  minimum: 1
                },
                notes: {
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
          description: 'Order item updated',
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
                    example: 'Order item updated'
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
        404: {
          $ref: '#/components/responses/NotFoundError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    },
    delete: {
      tags: ['Orders'],
      summary: 'Remove item from order',
      description: 'Remove a product from the order cart',
      operationId: 'removeOrderItem',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'orderId',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'itemId',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        200: {
          description: 'Item removed from order',
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
                    example: 'Item removed from order'
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
  '/api/orders/{orderId}/confirm': {
    post: {
      tags: ['Orders'],
      summary: 'Confirm order',
      description: 'Confirm order and move from DRAFT to PENDING status',
      operationId: 'confirmOrder',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'orderId',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                tax: {
                  type: 'number',
                  example: 5.50
                },
                discount: {
                  type: 'number',
                  example: 10.00
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Order confirmed',
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
                    example: 'Order confirmed'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      status: {
                        type: 'string',
                        example: 'PENDING'
                      },
                      total: {
                        type: 'number'
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
        404: {
          $ref: '#/components/responses/NotFoundError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },
  '/api/orders/{orderId}/cancel': {
    post: {
      tags: ['Orders'],
      summary: 'Cancel order',
      description: 'Cancel an order and restore inventory',
      operationId: 'cancelOrder',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'orderId',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        200: {
          description: 'Order cancelled',
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
                    example: 'Order cancelled'
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
        404: {
          $ref: '#/components/responses/NotFoundError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },
  '/api/orders/{orderId}/void': {
    post: {
      tags: ['Orders'],
      summary: 'Void order',
      description: 'Void a paid order (must be done on same day)',
      operationId: 'voidOrder',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'orderId',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['reason'],
              properties: {
                reason: {
                  type: 'string',
                  example: 'Customer changed mind'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Order voided',
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
                    example: 'Order voided'
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
        404: {
          $ref: '#/components/responses/NotFoundError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },
  '/api/orders/{orderId}/return': {
    post: {
      tags: ['Orders'],
      summary: 'Process order return',
      description: 'Process a return for a paid order',
      operationId: 'returnOrder',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'orderId',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['reason'],
              properties: {
                reason: {
                  type: 'string',
                  example: 'Product defective'
                },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      orderItemId: {
                        type: 'string'
                      },
                      quantity: {
                        type: 'integer'
                      }
                    }
                  },
                  description: 'Specific items to return (optional, defaults to all items)'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Return processed',
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
                    example: 'Return processed'
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
