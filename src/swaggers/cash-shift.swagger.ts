export const cashShiftSwagger = {
  '/api/shifts/open': {
    post: {
      tags: ['Cash Shift'],
      summary: 'Open cash shift',
      description: 'Open a new cash shift for a cashier at a store',
      operationId: 'openCashShift',
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
              required: ['storeId', 'openingBalance'],
              properties: {
                storeId: {
                  type: 'string',
                  example: 'cm4s8k8z10002v1aqzqzqzqzq'
                },
                openingBalance: {
                  type: 'number',
                  format: 'float',
                  example: 500.00,
                  description: 'Starting cash balance in drawer'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Cash shift opened successfully',
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
                    example: 'Cash shift opened successfully'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string'
                      },
                      status: {
                        $ref: '#/components/schemas/ShiftStatus'
                      },
                      openingBalance: {
                        type: 'number'
                      },
                      openedAt: {
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
          description: 'Shift already open or validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
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
  '/api/shifts/close': {
    post: {
      tags: ['Cash Shift'],
      summary: 'Close cash shift',
      description: 'Close the current open cash shift',
      operationId: 'closeCashShift',
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
              required: ['shiftId', 'closingBalance'],
              properties: {
                shiftId: {
                  type: 'string',
                  example: 'cm4s8k8z10050v1aqzqzqzqzq'
                },
                closingBalance: {
                  type: 'number',
                  format: 'float',
                  example: 1250.00,
                  description: 'Actual cash counted in drawer'
                },
                notes: {
                  type: 'string',
                  nullable: true,
                  example: 'Smooth shift, no issues'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Cash shift closed successfully',
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
                    example: 'Cash shift closed successfully'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string'
                      },
                      status: {
                        type: 'string',
                        example: 'CLOSED'
                      },
                      closingBalance: {
                        type: 'number'
                      },
                      expectedBalance: {
                        type: 'number',
                        description: 'Expected cash based on transactions'
                      },
                      difference: {
                        type: 'number',
                        description: 'Difference between expected and actual'
                      },
                      closedAt: {
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
        404: {
          $ref: '#/components/responses/NotFoundError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },
  '/api/shifts/current': {
    get: {
      tags: ['Cash Shift'],
      summary: 'Get current open shift',
      description: 'Retrieve the currently open cash shift for the authenticated user',
      operationId: 'getCurrentShift',
      security: [
        {
          BearerAuth: []
        }
      ],
      responses: {
        200: {
          description: 'Current shift retrieved',
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
                    nullable: true,
                    properties: {
                      id: {
                        type: 'string'
                      },
                      status: {
                        $ref: '#/components/schemas/ShiftStatus'
                      },
                      openingBalance: {
                        type: 'number'
                      },
                      openedAt: {
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
        401: {
          $ref: '#/components/responses/UnauthorizedError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },
  '/api/shifts/summary': {
    get: {
      tags: ['Cash Shift'],
      summary: 'Get shift summary',
      description: 'Get summary of transactions and cash flow for a shift',
      operationId: 'getShiftSummary',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'shiftId',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        200: {
          description: 'Shift summary retrieved',
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
                      totalCashSales: {
                        type: 'number'
                      },
                      totalCardSales: {
                        type: 'number'
                      },
                      totalOrders: {
                        type: 'integer'
                      },
                      expectedCash: {
                        type: 'number',
                        description: 'Opening balance + cash sales'
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
  }
};
