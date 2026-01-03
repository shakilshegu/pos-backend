import prisma from '../../config/database';
import { CreateCustomerDto, UpdateCustomerDto } from './customer.dto';

export class CustomerRepository {
  async create(data: CreateCustomerDto) {
    return await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        companyId: data.companyId,
        isActive: data.isActive ?? true,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAll(companyId?: string) {
    return await prisma.customer.findMany({
      where: companyId ? { companyId } : {},
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    return await prisma.customer.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Last 10 orders
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });
  }

  async findByPhone(phone: string, companyId: string) {
    return await prisma.customer.findFirst({
      where: {
        phone,
        companyId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });
  }

  async search(params: {
    phone?: string;
    name?: string;
    email?: string;
    companyId?: string;
  }) {
    return await prisma.customer.findMany({
      where: {
        AND: [
          params.phone ? { phone: { contains: params.phone, mode: 'insensitive' } } : {},
          params.name ? { name: { contains: params.name, mode: 'insensitive' } } : {},
          params.email ? { email: { contains: params.email, mode: 'insensitive' } } : {},
          params.companyId ? { companyId: params.companyId } : {},
        ],
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Limit search results
    });
  }

  async update(id: string, data: UpdateCustomerDto) {
    return await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email === '' ? null : data.email,
        address: data.address,
        isActive: data.isActive,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return await prisma.customer.delete({
      where: { id },
    });
  }

  async findByCompany(companyId: string) {
    return await prisma.customer.findMany({
      where: { companyId },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
