export const authSwagger = {
  '/api/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'User login',
      description: 'Authenticate user with email and password. Returns JWT token for subsequent requests.',
      operationId: 'login',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'admin@example.com',
                  description: 'User email address'
                },
                password: {
                  type: 'string',
                  format: 'password',
                  example: 'SecurePassword123!',
                  description: 'User password'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Login successful',
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
                    example: 'Login successful'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      token: {
                        type: 'string',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        description: 'JWT authentication token'
                      },
                      user: {
                        type: 'object',
                        properties: {
                          id: {
                            type: 'string',
                            example: 'cm4s8k8z10000v1aqzqzqzqzq'
                          },
                          email: {
                            type: 'string',
                            example: 'admin@example.com'
                          },
                          name: {
                            type: 'string',
                            example: 'John Doe'
                          },
                          role: {
                            $ref: '#/components/schemas/Role'
                          },
                          companyId: {
                            type: 'string',
                            nullable: true,
                            example: 'cm4s8k8z10001v1aqzqzqzqzq'
                          },
                          storeId: {
                            type: 'string',
                            nullable: true,
                            example: 'cm4s8k8z10002v1aqzqzqzqzq'
                          },
                          permissions: {
                            type: 'array',
                            items: {
                              $ref: '#/components/schemas/Permission'
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
        400: {
          $ref: '#/components/responses/BadRequestError'
        },
        401: {
          description: 'Invalid credentials',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Invalid email or password'
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
  '/api/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Register new user',
      description: 'Create a new user account with basic information',
      operationId: 'register',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password', 'name', 'role', 'companyId'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'newuser@example.com'
                },
                password: {
                  type: 'string',
                  format: 'password',
                  minLength: 8,
                  example: 'SecurePassword123!'
                },
                name: {
                  type: 'string',
                  example: 'Jane Smith'
                },
                role: {
                  $ref: '#/components/schemas/Role'
                },
                companyId: {
                  type: 'string',
                  example: 'cm4s8k8z10001v1aqzqzqzqzq'
                },
                storeId: {
                  type: 'string',
                  nullable: true,
                  example: 'cm4s8k8z10002v1aqzqzqzqzq',
                  description: 'Required for MANAGER and CASHIER roles'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'User created successfully',
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
                    example: 'User created successfully'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        example: 'cm4s8k8z10003v1aqzqzqzqzq'
                      },
                      email: {
                        type: 'string',
                        example: 'newuser@example.com'
                      },
                      name: {
                        type: 'string',
                        example: 'Jane Smith'
                      },
                      role: {
                        $ref: '#/components/schemas/Role'
                      },
                      companyId: {
                        type: 'string',
                        example: 'cm4s8k8z10001v1aqzqzqzqzq'
                      },
                      storeId: {
                        type: 'string',
                        nullable: true,
                        example: 'cm4s8k8z10002v1aqzqzqzqzq'
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
        409: {
          description: 'User already exists',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'User with this email already exists'
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
  '/api/auth/register-with-permissions': {
    post: {
      tags: ['Authentication'],
      summary: 'Register user with custom permissions',
      description: 'Create a new user account with granular permission control',
      operationId: 'registerWithPermissions',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password', 'name', 'role', 'companyId', 'permissions'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'manager@example.com'
                },
                password: {
                  type: 'string',
                  format: 'password',
                  minLength: 8,
                  example: 'SecurePassword123!'
                },
                name: {
                  type: 'string',
                  example: 'John Manager'
                },
                role: {
                  $ref: '#/components/schemas/Role'
                },
                companyId: {
                  type: 'string',
                  example: 'cm4s8k8z10001v1aqzqzqzqzq'
                },
                storeId: {
                  type: 'string',
                  nullable: true,
                  example: 'cm4s8k8z10002v1aqzqzqzqzq'
                },
                permissions: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Permission'
                  },
                  example: ['MANAGE_PRODUCTS', 'MANAGE_STOCK', 'CREATE_ORDER']
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'User created successfully with custom permissions',
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
                    example: 'User created successfully'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        example: 'cm4s8k8z10004v1aqzqzqzqzq'
                      },
                      email: {
                        type: 'string',
                        example: 'manager@example.com'
                      },
                      name: {
                        type: 'string',
                        example: 'John Manager'
                      },
                      role: {
                        $ref: '#/components/schemas/Role'
                      },
                      permissions: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Permission'
                        }
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
        409: {
          description: 'User already exists',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'User with this email already exists'
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
  '/api/auth/profile': {
    get: {
      tags: ['Authentication'],
      summary: 'Get current user profile',
      description: 'Retrieve the authenticated user profile information',
      operationId: 'getProfile',
      security: [
        {
          BearerAuth: []
        }
      ],
      responses: {
        200: {
          description: 'Profile retrieved successfully',
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
                    example: 'Profile retrieved successfully'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        example: 'cm4s8k8z10000v1aqzqzqzqzq'
                      },
                      email: {
                        type: 'string',
                        example: 'admin@example.com'
                      },
                      name: {
                        type: 'string',
                        example: 'John Doe'
                      },
                      role: {
                        $ref: '#/components/schemas/Role'
                      },
                      companyId: {
                        type: 'string',
                        nullable: true,
                        example: 'cm4s8k8z10001v1aqzqzqzqzq'
                      },
                      storeId: {
                        type: 'string',
                        nullable: true,
                        example: 'cm4s8k8z10002v1aqzqzqzqzq'
                      },
                      permissions: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Permission'
                        }
                      },
                      company: {
                        type: 'object',
                        nullable: true,
                        properties: {
                          id: {
                            type: 'string'
                          },
                          name: {
                            type: 'string'
                          }
                        }
                      },
                      store: {
                        type: 'object',
                        nullable: true,
                        properties: {
                          id: {
                            type: 'string'
                          },
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
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  }
};
