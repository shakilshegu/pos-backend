import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '@/config/database';
import { config } from '@/config/env';

const s3Client = new S3Client({
  region: config.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = config.AWS_S3_BUCKET || '';
const EXPIRATION = 300; // 5 minutes
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export const uploadService = {
  async generatePresignedUrl(data: {
    fileType: 'company-profile' | 'product' | 'variant';
    fileName: string;
    contentType: string;
    productId?: string;
    variantSku?: string;
    companyId: string;
    userId: string;
  }) {
    // Validate AWS configuration
    if (!BUCKET_NAME || !config.AWS_ACCESS_KEY_ID || !config.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS S3 configuration is missing. Please check environment variables.');
    }

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(data.contentType)) {
      throw new Error('Invalid file type. Only JPG, PNG, WEBP allowed');
    }

    // Generate S3 path based on file type
    let s3Path = '';
    const sanitizedFileName = data.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

    if (data.fileType === 'company-profile') {
      s3Path = `companies/${data.companyId}/profile/${sanitizedFileName}`;
    } else if (data.fileType === 'product') {
      if (!data.productId) {
        throw new Error('productId is required for product images');
      }

      // Validate product belongs to company
      const product = await prisma.product.findFirst({
        where: { id: data.productId, companyId: data.companyId },
      });

      if (!product) {
        throw new Error('Product not found or access denied');
      }

      const extension = sanitizedFileName.split('.').pop();
      s3Path = `companies/${data.companyId}/products/${data.productId}/main.${extension}`;
    } else if (data.fileType === 'variant') {
      if (!data.productId || !data.variantSku) {
        throw new Error('productId and variantSku are required for variant images');
      }

      // Validate product belongs to company
      const product = await prisma.product.findFirst({
        where: { id: data.productId, companyId: data.companyId },
      });

      if (!product) {
        throw new Error('Product not found or access denied');
      }

      const sanitizedSku = data.variantSku.replace(/[^a-zA-Z0-9-]/g, '_');
      const extension = sanitizedFileName.split('.').pop();
      s3Path = `companies/${data.companyId}/products/${data.productId}/variants/${sanitizedSku}.${extension}`;
    }

    // Generate pre-signed URL for upload
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Path,
      ContentType: data.contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: EXPIRATION,
    });

    const fileUrl = `https://${BUCKET_NAME}.s3.${config.AWS_REGION}.amazonaws.com/${s3Path}`;

    return {
      uploadUrl,
      fileUrl,
      expiresIn: EXPIRATION,
      maxFileSize: MAX_FILE_SIZE,
    };
  },
};
