export const companySwagger = {
  '/api/companies': {
    post: {
      tags: ['Company'],
      summary: 'Create new company',
      description: 'Create a new company (tenant). Requires SUPER_ADMIN role.',
      operationId: 'createCompany',
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
              required: ['name', 'email', 'phone'],
              properties: {
                name: {
                  type: 'string',
                  example: 'ABC Retail Corp'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'contact@abcretail.com'
                },
                phone: {
                  type: 'string',
                  example: '+1234567890'
                },
                address: {
                  type: 'string',
                  nullable: true,
                  example: '123 Business St, City, Country'
                },
                taxId: {
                  type: 'string',
                  nullable: true,
                  example: 'TAX-123456'
                },
                website: {
                  type: 'string',
                  nullable: true,
                  example: 'https://abcretail.com'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Company created successfully',
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
                    example: 'Company created successfully'
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
                        type: 'string'
                      },
                      phone: {
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
    },
    get: {
      tags: ['Company'],
      summary: 'Get all companies',
      description: 'Retrieve all companies. SUPER_ADMIN sees all, others see their own.',
      operationId: 'getAllCompanies',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
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
          description: 'Companies retrieved successfully',
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
                        email: {
                          type: 'string'
                        },
                        isActive: {
                          type: 'boolean'
                        },
                        _count: {
                          type: 'object',
                          properties: {
                            stores: {
                              type: 'integer'
                            },
                            users: {
                              type: 'integer'
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
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },
  '/api/companies/{id}': {
    get: {
      tags: ['Company'],
      summary: 'Get company by ID',
      description: 'Retrieve company details',
      operationId: 'getCompanyById',
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
          description: 'Company retrieved successfully',
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
  '/api/companies/{id}/profile-image': {
    patch: {
      tags: ['Company'],
      summary: 'Update company profile image',
      description: 'Update the company logo/profile image. Requires MANAGE_COMPANY permission.',
      operationId: 'updateCompanyProfileImage',
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
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['profileImageUrl'],
              properties: {
                profileImageUrl: {
                  type: 'string',
                  example: 'https://s3.amazonaws.com/bucket/company-logo.png'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Profile image updated',
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
                    example: 'Profile image updated successfully'
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
