import prisma from '../../config/database';
import { CreateStoreDto, UpdateStoreDto } from './store.dto';

export class StoreRepository {
  async create(data: CreateStoreDto) {
    return await prisma.store.create({
      data,
      include: {
        company: true,
      },
    });
  }

  async findByCompany(companyId: string) {
    return await prisma.store.findMany({
      where: { companyId },
      include: {
        company: true,
        _count: {
          select: {
            users: true,
            products: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    return await prisma.store.findUnique({
      where: { id },
      include: {
        company: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateStoreDto) {
    return await prisma.store.update({
      where: { id },
      data,
      include: {
        company: true,
      },
    });
  }

  async delete(id: string) {
    return await prisma.store.delete({
      where: { id },
    });
  }
}
