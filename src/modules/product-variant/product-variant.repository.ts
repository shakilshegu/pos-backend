import prisma from '../../config/database';
import { CreateProductVariantDto, UpdateProductVariantDto } from './product-variant.dto';
import { Decimal } from '@prisma/client/runtime/library';

export class ProductVariantRepository {
  async create(data: CreateProductVariantDto, storeId: string) {
    const { initialStock, reorderLevel, ...variantData } = data;

    // Create variant
    const variant = await prisma.productVariant.create({
      data: {
        ...variantData,
        retailPrice: new Decimal(data.retailPrice),
        wholesalePrice: data.wholesalePrice ? new Decimal(data.wholesalePrice) : null,
        cost: data.cost ? new Decimal(data.cost) : null,
        attributes: data.attributes ? (data.attributes as any) : null,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    // Create initial inventory for this variant
    if (initialStock !== undefined) {
      await prisma.inventory.create({
        data: {
          quantity: initialStock,
          reorderLevel: reorderLevel || 10,
          productVariantId: variant.id,
          storeId,
        },
      });
    }

    return variant;
  }

  async findAll(productId?: string) {
    return await prisma.productVariant.findMany({
      where: productId ? { productId } : {},
      include: {
        product: {
          include: {
            category: true,
          },
        },
        inventory: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    return await prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            category: true,
            company: true,
            store: true,
          },
        },
        inventory: {
          include: {
            store: true,
          },
        },
      },
    });
  }

  async findBySku(sku: string) {
    return await prisma.productVariant.findUnique({
      where: { sku },
      include: {
        product: true,
        inventory: true,
      },
    });
  }

  async findByBarcode(barcode: string) {
    return await prisma.productVariant.findUnique({
      where: { barcode },
      include: {
        product: true,
        inventory: true,
      },
    });
  }

  async update(id: string, data: UpdateProductVariantDto) {
    return await prisma.productVariant.update({
      where: { id },
      data: {
        ...data,
        retailPrice: data.retailPrice ? new Decimal(data.retailPrice) : undefined,
        wholesalePrice: data.wholesalePrice ? new Decimal(data.wholesalePrice) : undefined,
        cost: data.cost ? new Decimal(data.cost) : undefined,
        attributes: data.attributes ? (data.attributes as any) : undefined,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        inventory: true,
      },
    });
  }

  async delete(id: string) {
    return await prisma.productVariant.delete({
      where: { id },
    });
  }

  // Get variants by store (through product relation)
  async findByStore(storeId: string) {
    return await prisma.productVariant.findMany({
      where: {
        product: {
          storeId,
        },
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        inventory: {
          where: {
            storeId,
          },
        },
      },
    });
  }

  // Get low stock variants for a store
  async findLowStock(storeId: string) {
    return await prisma.productVariant.findMany({
      where: {
        inventory: {
          some: {
            storeId,
            quantity: {
              lte: prisma.inventory.fields.reorderLevel,
            },
          },
        },
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        inventory: {
          where: {
            storeId,
          },
        },
      },
    });
  }
}
