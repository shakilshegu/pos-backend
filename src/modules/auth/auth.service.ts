import bcrypt from 'bcryptjs';
import { AuthRepository } from './auth.repository';
import { LoginDto, RegisterDto } from './auth.dto';
import { JwtUtil } from '../../utils/jwt';
import { AppError } from '../../middlewares/error.middleware';
import { Role, Permission } from '@prisma/client';
import prisma from '../../config/database';

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async login(data: LoginDto) {
    const user = await this.authRepository.findUserByEmail(data.email);

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Extract permissions from user
    const permissions = user.permissions.map(p => p.permission);

    const token = JwtUtil.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId || undefined,  // Optional for SUPER_ADMIN
      storeId: user.storeId || undefined,
      permissions,
    });

    const { password, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  }

  async register(data: RegisterDto) {
    const existingUser = await this.authRepository.findUserByEmail(data.email);

    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.authRepository.createUser({
      ...data,
      password: hashedPassword,
      role: data.role || 'CASHIER',
    });

    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async getProfile(userId: string) {
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  /**
   * Register user with automatic permission assignment based on role
   */
  async registerWithPermissions(data: RegisterDto) {
    const existingUser = await this.authRepository.findUserByEmail(data.email);

    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.authRepository.createUser({
      ...data,
      password: hashedPassword,
      role: data.role || 'CASHIER',
    });

    // Define role-permission mappings
    const rolePermissions: Record<Role, Permission[]> = {
      SUPER_ADMIN: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_REPORTS,
        Permission.MANAGE_COMPANY,
        Permission.MANAGE_SUBSCRIPTION,
        Permission.MANAGE_USERS,
      ],
      ADMIN: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_REPORTS,
        Permission.MANAGE_STORES,
        Permission.MANAGE_USERS,
        Permission.MANAGE_PRODUCTS,
        Permission.MANAGE_STOCK,
      ],
      MANAGER: [
        Permission.VIEW_DASHBOARD,
        Permission.MANAGE_PRODUCTS,
        Permission.MANAGE_STOCK,
        Permission.VIEW_REPORTS,
      ],
      CASHIER: [
        Permission.CREATE_ORDER,
        Permission.PROCESS_PAYMENT,
        Permission.PRINT_RECEIPT,
      ],
    };

    // Assign permissions based on role
    const permissions = rolePermissions[user.role];
    for (const permission of permissions) {
      await prisma.userPermission.create({
        data: {
          userId: user.id,
          permission,
        },
      });
    }

    const { password, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      permissionsAssigned: permissions,
    };
  }
}
