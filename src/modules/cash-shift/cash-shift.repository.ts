import prisma from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';
import { ShiftStatus } from '@prisma/client';

export class CashShiftRepository {
  // Check if user has an open shift
  async findOpenShift(userId: string, storeId: string) {
    return await prisma.cashShift.findFirst({
      where: {
        userId,
        storeId,
        status: ShiftStatus.OPEN,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        store: true,
        company: true,
      },
    });
  }

  // Create a new shift
  async create(data: {
    userId: string;
    companyId: string;
    storeId: string;
    openingCash: number;
    openingNotes?: string;
  }) {
    return await prisma.cashShift.create({
      data: {
        userId: data.userId,
        companyId: data.companyId,
        storeId: data.storeId,
        openingCash: new Decimal(data.openingCash),
        openingNotes: data.openingNotes,
        status: ShiftStatus.OPEN,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        store: true,
        company: true,
      },
    });
  }

  // Find shift by ID
  async findById(id: string) {
    return await prisma.cashShift.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        store: true,
        company: true,
        payments: {
          where: {
            method: 'CASH',
          },
          include: {
            order: true,
          },
        },
      },
    });
  }

  // Calculate total cash payments for a shift
  async calculateTotalCashPayments(shiftId: string): Promise<number> {
    const result = await prisma.payment.aggregate({
      where: {
        shiftId,
        method: 'CASH',
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount ? Number(result._sum.amount) : 0;
  }

  // Close a shift
  async close(
    id: string,
    closingCash: number,
    expectedCash: number,
    difference: number,
    closingNotes?: string
  ) {
    return await prisma.cashShift.update({
      where: { id },
      data: {
        closingCash: new Decimal(closingCash),
        expectedCash: new Decimal(expectedCash),
        difference: new Decimal(difference),
        closingNotes,
        closedAt: new Date(),
        status: ShiftStatus.CLOSED,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        store: true,
        company: true,
      },
    });
  }

  // Get shifts with filters
  async findMany(filters: {
    status?: ShiftStatus;
    userId?: string;
    storeId?: string;
    companyId?: string;
    from?: Date;
    to?: Date;
  }) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.storeId) {
      where.storeId = filters.storeId;
    }

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.from || filters.to) {
      where.openedAt = {};
      if (filters.from) {
        where.openedAt.gte = filters.from;
      }
      if (filters.to) {
        where.openedAt.lte = filters.to;
      }
    }

    return await prisma.cashShift.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        store: true,
        company: true,
        _count: {
          select: {
            payments: true,
          },
        },
      },
      orderBy: {
        openedAt: 'desc',
      },
    });
  }

  // Get shift summary (for reporting)
  async getShiftSummary(shiftId: string) {
    const shift = await this.findById(shiftId);
    if (!shift) return null;

    const paymentSummary = await prisma.payment.groupBy({
      by: ['method'],
      where: {
        shiftId,
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    });

    return {
      shift,
      paymentSummary,
    };
  }
}
