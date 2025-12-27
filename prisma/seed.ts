import { PrismaClient, Role, Permission } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Define role-permission mappings based on requirements
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

async function seed() {
  console.log('Starting seed...');

  // Create a demo company
  const company = await prisma.company.upsert({
    where: { email: 'demo@company.com' },
    update: {},
    create: {
      name: 'Demo Company',
      email: 'demo@company.com',
      phone: '+1234567890',
      address: '123 Demo Street, Demo City',
      isActive: true,
    },
  });
  console.log('Created demo company:', company.name);

  // Create demo stores
  const store1 = await prisma.store.upsert({
    where: { id: 'store-1-demo' },
    update: {},
    create: {
      id: 'store-1-demo',
      name: 'Main Store',
      address: '456 Main Street',
      phone: '+1234567891',
      companyId: company.id,
      isActive: true,
    },
  });

  const store2 = await prisma.store.upsert({
    where: { id: 'store-2-demo' },
    update: {},
    create: {
      id: 'store-2-demo',
      name: 'Branch Store',
      address: '789 Branch Avenue',
      phone: '+1234567892',
      companyId: company.id,
      isActive: true,
    },
  });
  console.log('Created demo stores');

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create users for each role
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@demo.com' },
    update: {},
    create: {
      email: 'superadmin@demo.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+1234567893',
      role: Role.SUPER_ADMIN,
      companyId: company.id,
      isActive: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567894',
      role: Role.ADMIN,
      companyId: company.id,
      storeId: store1.id,
      isActive: true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo.com' },
    update: {},
    create: {
      email: 'manager@demo.com',
      password: hashedPassword,
      firstName: 'Manager',
      lastName: 'User',
      phone: '+1234567895',
      role: Role.MANAGER,
      companyId: company.id,
      storeId: store1.id,
      isActive: true,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@demo.com' },
    update: {},
    create: {
      email: 'cashier@demo.com',
      password: hashedPassword,
      firstName: 'Cashier',
      lastName: 'User',
      phone: '+1234567896',
      role: Role.CASHIER,
      companyId: company.id,
      storeId: store1.id,
      isActive: true,
    },
  });

  console.log('Created demo users');

  // Assign permissions to users based on their roles
  const users = [
    { user: superAdmin, role: Role.SUPER_ADMIN },
    { user: admin, role: Role.ADMIN },
    { user: manager, role: Role.MANAGER },
    { user: cashier, role: Role.CASHIER },
  ];

  for (const { user, role } of users) {
    // Delete existing permissions for the user
    await prisma.userPermission.deleteMany({
      where: { userId: user.id },
    });

    // Assign new permissions based on role
    const permissions = rolePermissions[role];
    for (const permission of permissions) {
      await prisma.userPermission.create({
        data: {
          userId: user.id,
          permission,
        },
      });
    }
    console.log(`Assigned ${permissions.length} permissions to ${user.email}`);
  }

  // Create demo products
  const products = [
    {
      name: 'Coffee - Espresso',
      description: 'Premium espresso blend',
      sku: 'COFFEE-ESP-001',
      barcode: '1234567890001',
      price: 3.99,
      cost: 1.50,
      storeId: store1.id,
    },
    {
      name: 'Sandwich - Club',
      description: 'Classic club sandwich',
      sku: 'FOOD-SAND-001',
      barcode: '1234567890002',
      price: 8.99,
      cost: 4.00,
      storeId: store1.id,
    },
    {
      name: 'Water - Bottled',
      description: 'Pure spring water',
      sku: 'DRINK-WAT-001',
      barcode: '1234567890003',
      price: 1.99,
      cost: 0.50,
      storeId: store1.id,
    },
  ];

  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {},
      create: productData,
    });

    // Create stock for each product
    await prisma.stock.upsert({
      where: {
        productId_storeId: {
          productId: product.id,
          storeId: store1.id,
        },
      },
      update: {},
      create: {
        productId: product.id,
        storeId: store1.id,
        quantity: 100,
        minStock: 10,
      },
    });
  }

  console.log('Created demo products and stock');

  console.log('\n========================================');
  console.log('Seed completed successfully!');
  console.log('========================================');
  console.log('\nDemo Users Created:');
  console.log('-------------------');
  console.log('SUPER_ADMIN:');
  console.log('  Email: superadmin@demo.com');
  console.log('  Password: password123');
  console.log('  Permissions:', rolePermissions.SUPER_ADMIN.join(', '));
  console.log('\nADMIN:');
  console.log('  Email: admin@demo.com');
  console.log('  Password: password123');
  console.log('  Permissions:', rolePermissions.ADMIN.join(', '));
  console.log('\nMANAGER:');
  console.log('  Email: manager@demo.com');
  console.log('  Password: password123');
  console.log('  Permissions:', rolePermissions.MANAGER.join(', '));
  console.log('\nCASHIER:');
  console.log('  Email: cashier@demo.com');
  console.log('  Password: password123');
  console.log('  Permissions:', rolePermissions.CASHIER.join(', '));
  console.log('========================================\n');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
