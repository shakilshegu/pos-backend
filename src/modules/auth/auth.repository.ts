import prisma from '../../config/database';
import { Role } from '@prisma/client';

export class AuthRepository {
  async findUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
        store: true,
        permissions: true,
      },
    });
  }

  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    companyId?: string;  // Optional for SUPER_ADMIN
    storeId?: string;
    role?: Role;
  }) {
    return await prisma.user.create({
      data,
      include: {
        company: true,
        store: true,
      },
    });
  }

  async findUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        store: true,
        permissions: true,
      },
    });
  }
}
