export const storeSwagger = {
  '/api/stores': {
    post: {
      tags: ['Store'],
      summary: 'Create new store',
      description: 'Create a new store location. Requires MANAGE_STORES permission.',
      operationId: 'createStore',
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
                  example: 'Downtown Store'
                },
                companyId: {
                  type: 'string',
                  example: 'cm4s8k8z10001v1aqzqzqzqzq'
                },
                address: {
                  type: 'string',
                  nullable: true,
                  example: '456 Main St, City, Country'
                },
                phone: {
                  type: 'string',
                  nullable: true,
                  example: '+1234567890'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  nullable: true,
                  example: 'downtown@abcretail.com'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Store created successfully',
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
                    example: 'Store created successfully'
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
                      companyId: {
                        type: 'string'
                      },
                      isActive: {
                        type: 'boolean',
                        example: true
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
    }
  },
  '/api/stores/company/{companyId}': {
    get: {
      tags: ['Store'],
      summary: 'Get stores by company',
      description: 'Retrieve all stores for a specific company',
      operationId: 'getStoresByCompany',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'companyId',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        200: {
          description: 'Stores retrieved successfully',
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
                        name: {
                          type: 'string'
                        },
                        address: {
                          type: 'string',
                          nullable: true
                        },
                        phone: {
                          type: 'string',
                          nullable: true
                        },
                        isActive: {
                          type: 'boolean'
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
  '/api/stores/{id}': {
    get: {
      tags: ['Store'],
      summary: 'Get store by ID',
      description: 'Retrieve store details',
      operationId: 'getStoreById',
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
          description: 'Store retrieved successfully',
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
