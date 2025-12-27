import { Request, Response } from 'express';
import { uploadService } from './upload.service';
import { generatePresignedUrlSchema } from './upload.dto';
import { successResponse, errorResponse } from '@/utils/response';

export const uploadController = {
  async generatePresignedUrl(req: Request, res: Response) {
    try {
      // Validate request body
      const validatedData = generatePresignedUrlSchema.parse(req.body);

      const user = req.user!; // From auth middleware

      // Validate user has companyId
      if (!user.companyId) {
        return errorResponse(res, 'User must belong to a company to upload files', 403);
      }

      const result = await uploadService.generatePresignedUrl({
        fileType: validatedData.fileType,
        fileName: validatedData.fileName,
        contentType: validatedData.contentType,
        productId: validatedData.productId,
        variantSku: validatedData.variantSku,
        companyId: user.companyId,
        userId: user.id,
      });

      return successResponse(res, result, 'Pre-signed URL generated successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return errorResponse(res, 'Validation error', 400, error.errors);
      }
      return errorResponse(res, error.message, 400);
    }
  },
};
