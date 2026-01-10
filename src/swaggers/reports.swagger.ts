export const reportsSwagger = {
  '/api/reports/sales': {
    get: {
      tags: ['Reports'],
      summary: 'Get sales report',
      description: 'Generate sales report for a date range. Requires VIEW_REPORTS permission.',
      operationId: 'getSalesReport',
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
          description: 'Filter by store (optional)'
        },
        {
          name: 'startDate',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
            format: 'date'
          },
          example: '2024-01-01'
        },
        {
          name: 'endDate',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
            format: 'date'
          },
          example: '2024-01-31'
        }
      ],
      responses: {
        200: {
          description: 'Sales report generated',
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
                      totalSales: {
                        type: 'number',
                        example: 15000.50
                      },
                      totalOrders: {
                        type: 'integer',
                        example: 120
                      },
                      averageOrderValue: {
                        type: 'number',
                        example: 125.00
                      },
                      salesByDay: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            date: {
                              type: 'string',
                              format: 'date'
                            },
                            sales: {
                              type: 'number'
                            },
                            orders: {
                              type: 'integer'
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
        403: {
          $ref: '#/components/responses/ForbiddenError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },
  '/api/reports/products': {
    get: {
      tags: ['Reports'],
      summary: 'Get product performance report',
      description: 'Analyze top-selling and underperforming products. Requires VIEW_REPORTS permission.',
      operationId: 'getProductReport',
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
          required: true,
          schema: {
            type: 'string',
            format: 'date'
          }
        },
        {
          name: 'endDate',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
            format: 'date'
          }
        },
        {
          name: 'limit',
          in: 'query',
          schema: {
            type: 'integer',
            default: 10
          },
          description: 'Number of top products to return'
        }
      ],
      responses: {
        200: {
          description: 'Product report generated',
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
                      topProducts: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            productName: {
                              type: 'string'
                            },
                            quantitySold: {
                              type: 'integer'
                            },
                            revenue: {
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
          }
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
    }
  },
  '/api/reports/inventory': {
    get: {
      tags: ['Reports'],
      summary: 'Get inventory report',
      description: 'Generate inventory valuation and stock movement report. Requires VIEW_REPORTS permission.',
      operationId: 'getInventoryReport',
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
        }
      ],
      responses: {
        200: {
          description: 'Inventory report generated',
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
                      totalValue: {
                        type: 'number',
                        description: 'Total inventory value at cost'
                      },
                      totalItems: {
                        type: 'integer'
                      },
                      lowStockItems: {
                        type: 'integer'
                      },
                      outOfStockItems: {
                        type: 'integer'
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
        403: {
          $ref: '#/components/responses/ForbiddenError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  }
};
