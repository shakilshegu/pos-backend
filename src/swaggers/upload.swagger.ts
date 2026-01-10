export const uploadSwagger = {
  '/api/uploads/presigned-url': {
    post: {
      tags: ['Upload'],
      summary: 'Generate pre-signed URL for S3 upload',
      description: 'Generate a pre-signed URL for direct file upload to AWS S3',
      operationId: 'generatePresignedUrl',
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
              required: ['fileName', 'fileType'],
              properties: {
                fileName: {
                  type: 'string',
                  example: 'product-image.jpg',
                  description: 'Name of the file to upload'
                },
                fileType: {
                  type: 'string',
                  example: 'image/jpeg',
                  description: 'MIME type of the file'
                },
                folder: {
                  type: 'string',
                  example: 'products',
                  description: 'Optional folder path in S3 bucket'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Pre-signed URL generated successfully',
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
                    example: 'Pre-signed URL generated successfully'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      uploadUrl: {
                        type: 'string',
                        example: 'https://s3.amazonaws.com/bucket/products/product-image.jpg?X-Amz-Algorithm=...',
                        description: 'Pre-signed URL for uploading (valid for 5 minutes)'
                      },
                      fileUrl: {
                        type: 'string',
                        example: 'https://s3.amazonaws.com/bucket/products/product-image.jpg',
                        description: 'Public URL of the file after upload'
                      },
                      key: {
                        type: 'string',
                        example: 'products/product-image.jpg',
                        description: 'S3 object key'
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
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  }
};
