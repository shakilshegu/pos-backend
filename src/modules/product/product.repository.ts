import prisma from '../../config/database';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { Decimal } from '@prisma/client/runtime/library';

export class ProductRepository {
  async create(data: CreateProductDto) {
    return await prisma.product.create({
      data: {
        ...data,
        baseRetailPrice: new Decimal(data.baseRetailPrice || data.price || 0),
        baseWholesalePrice: data.baseWholesalePrice ? new Decimal(data.baseWholesalePrice) : null,
        baseCost: data.baseCost || data.cost ? new Decimal(data.baseCost || data.cost || 0) : null,
        taxPercent: data.taxPercent ? new Decimal(data.taxPercent) : new Decimal(0),
      },
      include: {
        category: true,
        company: true,
        store: true,
      },
    });
  }

  async findById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        company: true,
        store: true,
        variants: {
          include: {
            inventory: true,
          },
        },
      },
    });
  }

  async findByStoreId(storeId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { storeId },
        include: {
          category: true,
          variants: {
            include: {
              inventory: {
                where: { storeId },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where: { storeId } }),
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySku(sku: string) {
    return await prisma.product.findUnique({
      where: { sku },
      include: {
        variants: true,
      },
    });
  }

  async update(id: string, data: UpdateProductDto) {
    return await prisma.product.update({
      where: { id },
      data: {
        ...data,
        baseRetailPrice: data.baseRetailPrice ? new Decimal(data.baseRetailPrice) : undefined,
        baseWholesalePrice: data.baseWholesalePrice ? new Decimal(data.baseWholesalePrice) : undefined,
        baseCost: data.baseCost ? new Decimal(data.baseCost) : undefined,
        taxPercent: data.taxPercent ? new Decimal(data.taxPercent) : undefined,
      },
      include: {
        category: true,
        store: true,
        variants: {
          include: {
            inventory: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return await prisma.product.delete({
      where: { id },
    });
  }

  async search(storeId: string, query: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          storeId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          category: true,
          variants: {
            include: {
              inventory: {
                where: { storeId },
              },
            },
          },
        },
        skip,
        take: limit,
      }),
      prisma.product.count({
        where: {
          storeId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get products by company
  async findByCompanyId(companyId: string) {
    return await prisma.product.findMany({
      where: { companyId },
      include: {
        category: true,
        store: true,
        variants: {
          include: {
            inventory: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
