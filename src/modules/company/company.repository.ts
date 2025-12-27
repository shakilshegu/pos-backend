import prisma from '../../config/database';
import { CreateCompanyDto, UpdateCompanyDto } from './company.dto';

export class CompanyRepository {
  async create(data: CreateCompanyDto) {
    return await prisma.company.create({
      data,
      include: {
        stores: true,
      },
    });
  }

  async findAll() {
    return await prisma.company.findMany({
      include: {
        stores: true,
        _count: {
          select: {
            users: true,
            stores: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    return await prisma.company.findUnique({
      where: { id },
      include: {
        stores: true,
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

  async findByEmail(email: string) {
    return await prisma.company.findUnique({
      where: { email },
    });
  }

  async update(id: string, data: UpdateCompanyDto) {
    return await prisma.company.update({
      where: { id },
      data,
      include: {
        stores: true,
      },
    });
  }

  async delete(id: string) {
    return await prisma.company.delete({
      where: { id },
    });
  }
}
