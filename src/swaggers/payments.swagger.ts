export const paymentsSwagger = {
  '/api/payments': {
    post: {
      tags: ['Payments'],
      summary: 'Process payment',
      description: 'Process a payment for an order. Supports CASH, CARD (via TAP), and WALLET. Requires PROCESS_PAYMENT permission.',
      operationId: 'processPayment',
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
              required: ['orderId', 'amount', 'method'],
              properties: {
                orderId: {
                  type: 'string',
                  example: 'cm4s8k8z10040v1aqzqzqzqzq'
                },
                amount: {
                  type: 'number',
                  format: 'float',
                  example: 99.99,
                  description: 'Payment amount'
                },
                method: {
                  $ref: '#/components/schemas/PaymentMethod'
                },
                provider: {
                  $ref: '#/components/schemas/PaymentProvider'
                },
                cashShiftId: {
                  type: 'string',
                  nullable: true,
                  example: 'cm4s8k8z10050v1aqzqzqzqzq',
                  description: 'Required for CASH payments'
                },
                tapChargeId: {
                  type: 'string',
                  nullable: true,
                  example: 'chg_TS123456789',
                  description: 'TAP charge ID for CARD payments'
                },
                metadata: {
                  type: 'object',
                  nullable: true,
                  description: 'Additional payment metadata'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Payment processed successfully',
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
                    example: 'Payment processed successfully'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string'
                      },
                      amount: {
                        type: 'number'
                      },
                      method: {
                        $ref: '#/components/schemas/PaymentMethod'
                      },
                      status: {
                        $ref: '#/components/schemas/PaymentStatus'
                      },
                      transactionId: {
                        type: 'string',
                        description: 'Unique transaction identifier'
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
  },
  '/api/payments/refund': {
    post: {
      tags: ['Payments'],
      summary: 'Refund payment',
      description: 'Process a refund for a captured payment. Requires PROCESS_PAYMENT permission.',
      operationId: 'refundPayment',
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
              required: ['paymentId', 'amount', 'reason'],
              properties: {
                paymentId: {
                  type: 'string',
                  example: 'cm4s8k8z10060v1aqzqzqzqzq'
                },
                amount: {
                  type: 'number',
                  format: 'float',
                  example: 49.99,
                  description: 'Refund amount (can be partial)'
                },
                reason: {
                  type: 'string',
                  example: 'Customer returned product'
                },
                metadata: {
                  type: 'object',
                  nullable: true
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Refund processed successfully',
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
                    example: 'Refund processed successfully'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      refundId: {
                        type: 'string'
                      },
                      amount: {
                        type: 'number'
                      },
                      status: {
                        type: 'string',
                        example: 'REFUNDED'
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
  },
  '/api/payments/order/{orderId}': {
    get: {
      tags: ['Payments'],
      summary: 'Get payments by order',
      description: 'Retrieve all payments for a specific order',
      operationId: 'getPaymentsByOrder',
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
          description: 'Payments retrieved successfully',
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
                        amount: {
                          type: 'number'
                        },
                        method: {
                          $ref: '#/components/schemas/PaymentMethod'
                        },
                        status: {
                          $ref: '#/components/schemas/PaymentStatus'
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
  '/api/payments/statistics': {
    get: {
      tags: ['Payments'],
      summary: 'Get payment statistics',
      description: 'Retrieve payment statistics for a store or company',
      operationId: 'getPaymentStatistics',
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
          }
        },
        {
          name: 'startDate',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            format: 'date'
          }
        },
        {
          name: 'endDate',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            format: 'date'
          }
        }
      ],
      responses: {
        200: {
          description: 'Statistics retrieved successfully',
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
                      totalAmount: {
                        type: 'number'
                      },
                      totalTransactions: {
                        type: 'integer'
                      },
                      byMethod: {
                        type: 'object',
                        properties: {
                          CASH: {
                            type: 'number'
                          },
                          CARD: {
                            type: 'number'
                          },
                          WALLET: {
                            type: 'number'
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
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  }
};
