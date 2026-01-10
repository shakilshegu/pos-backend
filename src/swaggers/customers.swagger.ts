export const customersSwagger = {
  '/api/customers': {
    post: {
      tags: ['Customers'],
      summary: 'Create customer',
      description: 'Create a new customer profile',
      operationId: 'createCustomer',
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
              required: ['name', 'phone', 'companyId'],
              properties: {
                name: {
                  type: 'string',
                  example: 'John Customer'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  nullable: true,
                  example: 'customer@example.com'
                },
                phone: {
                  type: 'string',
                  example: '+1234567890'
                },
                type: {
                  $ref: '#/components/schemas/CustomerType'
                },
                companyId: {
                  type: 'string',
                  example: 'cm4s8k8z10001v1aqzqzqzqzq'
                },
                address: {
                  type: 'string',
                  nullable: true,
                  example: '123 Main St, City, Country'
                },
                taxId: {
                  type: 'string',
                  nullable: true,
                  example: 'TAX123456'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Customer created successfully',
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
                    example: 'Customer created successfully'
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
                      email: {
                        type: 'string',
                        nullable: true
                      },
                      phone: {
                        type: 'string'
                      },
                      type: {
                        $ref: '#/components/schemas/CustomerType'
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
        409: {
          description: 'Customer with this phone already exists',
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
    },
    get: {
      tags: ['Customers'],
      summary: 'Get all customers',
      description: 'Retrieve all customers with pagination',
      operationId: 'getAllCustomers',
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
            default: 10
          }
        }
      ],
      responses: {
        200: {
          description: 'Customers retrieved successfully',
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
  '/api/customers/{id}': {
    get: {
      tags: ['Customers'],
      summary: 'Get customer by ID',
      description: 'Retrieve customer details including order history',
      operationId: 'getCustomerById',
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
          }
        }
      ],
      responses: {
        200: {
          description: 'Customer retrieved successfully',
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
                      name: {
                        type: 'string'
                      },
                      email: {
                        type: 'string',
                        nullable: true
                      },
                      phone: {
                        type: 'string'
                      },
                      orders: {
                        type: 'array',
                        items: {
                          type: 'object'
                        }
                      },
                      totalSpent: {
                        type: 'number',
                        description: 'Total amount spent by customer'
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
  '/api/customers/phone/{phone}': {
    get: {
      tags: ['Customers'],
      summary: 'Get customer by phone',
      description: 'Look up customer by phone number',
      operationId: 'getCustomerByPhone',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'phone',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        200: {
          description: 'Customer retrieved successfully',
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
  },
  '/api/customers/search': {
    get: {
      tags: ['Customers'],
      summary: 'Search customers',
      description: 'Search customers by name, email, or phone',
      operationId: 'searchCustomers',
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
          description: 'Search query'
        },
        {
          name: 'companyId',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        200: {
          description: 'Search results retrieved',
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
