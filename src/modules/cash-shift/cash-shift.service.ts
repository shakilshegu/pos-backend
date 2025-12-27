import { CashShiftRepository } from './cash-shift.repository';
import { OpenShiftDto, CloseShiftDto } from './cash-shift.dto';
import { ShiftStatus } from '@prisma/client';

export class CashShiftService {
  private cashShiftRepository: CashShiftRepository;

  constructor() {
    this.cashShiftRepository = new CashShiftRepository();
  }

  /**
   * Open a new shift for a cashier
   * Business Rules:
   * - Only one OPEN shift allowed per cashier per store
   * - Must provide opening cash amount
   */
  async openShift(data: OpenShiftDto, userId: string, companyId: string, storeId: string) {
    // Check if user already has an open shift
    const existingShift = await this.cashShiftRepository.findOpenShift(userId, storeId);

    if (existingShift) {
      throw new Error(
        `You already have an open shift (Shift #${existingShift.id.substring(0, 8)}). Please close it before opening a new one.`
      );
    }

    // Create new shift
    const shift = await this.cashShiftRepository.create({
      userId,
      companyId,
      storeId,
      openingCash: data.openingCash,
      openingNotes: data.openingNotes,
    });

    return shift;
  }

  /**
   * Close an active shift
   * Business Rules:
   * - Only the owner can close their shift (unless MANAGER/ADMIN)
   * - Must provide closing cash amount
   * - System calculates expected cash = opening cash + total cash payments
   * - System calculates difference = closing cash - expected cash
   */
  async closeShift(data: CloseShiftDto, userId: string, userRole: string) {
    // Find user's open shift
    const shift = await this.cashShiftRepository.findOpenShift(userId, ''); // Will get any open shift for user

    if (!shift) {
      throw new Error('No open shift found. You must open a shift first.');
    }

    // Verify ownership (cashier can only close their own shift)
    if (shift.userId !== userId && !['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      throw new Error('You can only close your own shift.');
    }

    // Calculate total cash payments for this shift
    const totalCashPayments = await this.cashShiftRepository.calculateTotalCashPayments(shift.id);

    // Calculate expected cash
    const openingCash = Number(shift.openingCash);
    const expectedCash = openingCash + totalCashPayments;

    // Calculate difference
    const difference = data.closingCash - expectedCash;

    // Close the shift
    const closedShift = await this.cashShiftRepository.close(
      shift.id,
      data.closingCash,
      expectedCash,
      difference,
      data.closingNotes
    );

    return {
      ...closedShift,
      totalCashPayments,
      summary: {
        openingCash,
        totalCashPayments,
        expectedCash,
        closingCash: data.closingCash,
        difference,
        status: difference === 0 ? 'BALANCED' : difference > 0 ? 'EXCESS' : 'SHORT',
      },
    };
  }

  /**
   * Get current active shift for a user
   */
  async getCurrentShift(userId: string, storeId: string) {
    const shift = await this.cashShiftRepository.findOpenShift(userId, storeId);

    if (!shift) {
      return null;
    }

    // Calculate current cash collected
    const totalCashPayments = await this.cashShiftRepository.calculateTotalCashPayments(shift.id);
    const openingCash = Number(shift.openingCash);
    const currentExpectedCash = openingCash + totalCashPayments;

    return {
      ...shift,
      totalCashPayments,
      currentExpectedCash,
    };
  }

  /**
   * Get shift by ID
   */
  async getShiftById(id: string) {
    const shift = await this.cashShiftRepository.findById(id);

    if (!shift) {
      throw new Error('Shift not found');
    }

    // Calculate totals
    const totalCashPayments = await this.cashShiftRepository.calculateTotalCashPayments(id);

    return {
      ...shift,
      totalCashPayments,
    };
  }

  /**
   * Get shifts with filters (for managers/admins)
   */
  async getShifts(filters: {
    status?: ShiftStatus;
    userId?: string;
    storeId?: string;
    companyId?: string;
    from?: string;
    to?: string;
  }) {
    const parsedFilters: any = { ...filters };

    // Parse dates
    if (filters.from) {
      parsedFilters.from = new Date(filters.from);
    }
    if (filters.to) {
      parsedFilters.to = new Date(filters.to);
    }

    return await this.cashShiftRepository.findMany(parsedFilters);
  }

  /**
   * Get detailed shift summary (for reporting)
   */
  async getShiftSummary(id: string) {
    return await this.cashShiftRepository.getShiftSummary(id);
  }

  /**
   * Validate that a CASH payment can be processed
   * Business Rule: CASH payments require an active shift
   */
  async validateCashPayment(userId: string, storeId: string): Promise<string> {
    const shift = await this.cashShiftRepository.findOpenShift(userId, storeId);

    if (!shift) {
      throw new Error(
        'You must open a cash shift before processing cash payments. Use POST /api/shifts/open to start your shift.'
      );
    }

    return shift.id; // Return shift ID to link payment
  }
}
