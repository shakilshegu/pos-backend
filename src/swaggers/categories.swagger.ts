export const categoriesSwagger = {
  '/api/categories': {
    post: {
      tags: ['Categories'],
      summary: 'Create product category',
      description: 'Create a new product category. Requires MANAGE_PRODUCTS permission.',
      operationId: 'createCategory',
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
                  example: 'Electronics'
                },
                description: {
                  type: 'string',
                  nullable: true,
                  example: 'Electronic devices and accessories'
                },
                companyId: {
                  type: 'string',
                  example: 'cm4s8k8z10001v1aqzqzqzqzq'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Category created successfully',
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
                    example: 'Category created successfully'
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
      tags: ['Categories'],
      summary: 'Get all categories',
      description: 'Retrieve all product categories for a company',
      operationId: 'getAllCategories',
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
          description: 'Company ID to filter categories'
        }
      ],
      responses: {
        200: {
          description: 'Categories retrieved successfully',
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
                    example: 'Categories retrieved successfully'
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
                        _count: {
                          type: 'object',
                          properties: {
                            products: {
                              type: 'integer',
                              description: 'Number of products in this category'
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
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  }
};
