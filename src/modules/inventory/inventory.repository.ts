import prisma from '../../config/database';
import { CreateInventoryDto, UpdateInventoryDto } from './inventory.dto';

export class InventoryRepository {
  async create(data: CreateInventoryDto) {
    return await prisma.inventory.create({
      data,
      include: {
        productVariant: {
          include: {
            product: true,
          },
        },
        store: true,
      },
    });
  }

  async findAll(storeId?: string) {
    return await prisma.inventory.findMany({
      where: storeId ? { storeId } : {},
      include: {
        productVariant: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        store: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    return await prisma.inventory.findUnique({
      where: { id },
      include: {
        productVariant: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        store: true,
      },
    });
  }

  async findByVariantAndStore(productVariantId: string, storeId: string) {
    return await prisma.inventory.findUnique({
      where: {
        productVariantId_storeId: {
          productVariantId,
          storeId,
        },
      },
      include: {
        productVariant: {
          include: {
            product: true,
          },
        },
        store: true,
      },
    });
  }

  async update(id: string, data: UpdateInventoryDto) {
    return await prisma.inventory.update({
      where: { id },
      data,
      include: {
        productVariant: {
          include: {
            product: true,
          },
        },
        store: true,
      },
    });
  }

  async adjustQuantity(id: string, adjustment: number) {
    return await prisma.inventory.update({
      where: { id },
      data: {
        quantity: {
          increment: adjustment,
        },
      },
      include: {
        productVariant: {
          include: {
            product: true,
          },
        },
        store: true,
      },
    });
  }

  async delete(id: string) {
    return await prisma.inventory.delete({
      where: { id },
    });
  }

  // Get low stock items for a store
  async findLowStock(storeId: string) {
    // Note: Prisma doesn't support comparing columns directly in where clause
    // We need to fetch all and filter in JavaScript, or use raw SQL
    const allInventory = await prisma.inventory.findMany({
      where: { storeId },
      include: {
        productVariant: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        store: true,
      },
    });

    // Filter items where quantity <= reorderLevel
    return allInventory.filter((inv) => inv.quantity <= inv.reorderLevel);
  }

  // Get out of stock items for a store
  async findOutOfStock(storeId: string) {
    return await prisma.inventory.findMany({
      where: {
        storeId,
        quantity: 0,
      },
      include: {
        productVariant: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        store: true,
      },
    });
  }

  // Get inventory by product
  async findByProduct(productId: string) {
    return await prisma.inventory.findMany({
      where: {
        productVariant: {
          productId,
        },
      },
      include: {
        productVariant: true,
        store: true,
      },
    });
  }
}
