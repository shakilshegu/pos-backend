import { Response } from 'express';
import { CashShiftService } from './cash-shift.service';
import { OpenShiftSchema, CloseShiftSchema, GetShiftsQuerySchema } from './cash-shift.dto';
import { ApiResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export class CashShiftController {
  private cashShiftService: CashShiftService;

  constructor() {
    this.cashShiftService = new CashShiftService();
  }

  /**
   * Open a new shift
   * POST /api/shifts/open
   */
  openShift = async (req: AuthRequest, res: Response) => {
    try {
      const validation = OpenShiftSchema.safeParse(req.body);

      if (!validation.success) {
        return ApiResponse.badRequest(res, 'Validation failed', validation.error.issues);
      }

      const userId = req.user!.userId;
      const companyId = req.user!.companyId;
      const storeId = req.user!.storeId;

      if (!storeId) {
        return ApiResponse.badRequest(res, 'User must be assigned to a store to open a shift');
      }

      if (!companyId) {
        return ApiResponse.badRequest(res, 'User must be assigned to a company to open a shift');
      }

      const shift = await this.cashShiftService.openShift(
        validation.data,
        userId,
        companyId,
        storeId
      );

      return ApiResponse.created(res, shift, 'Shift opened successfully');
    } catch (error: any) {
      console.error('Error opening shift:', error);
      return ApiResponse.error(res, error.message);
    }
  };

  /**
   * Close current shift
   * POST /api/shifts/close
   */
  closeShift = async (req: AuthRequest, res: Response) => {
    try {
      const validation = CloseShiftSchema.safeParse(req.body);

      if (!validation.success) {
        return ApiResponse.badRequest(res, 'Validation failed', validation.error.issues);
      }

      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const result = await this.cashShiftService.closeShift(validation.data, userId, userRole);

      return ApiResponse.success(res, result, 'Shift closed successfully');
    } catch (error: any) {
      console.error('Error closing shift:', error);
      return ApiResponse.error(res, error.message);
    }
  };

  /**
   * Get current active shift
   * GET /api/shifts/current
   */
  getCurrentShift = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const storeId = req.user!.storeId;

      if (!storeId) {
        return ApiResponse.badRequest(res, 'User must be assigned to a store');
      }

      const shift = await this.cashShiftService.getCurrentShift(userId, storeId);

      if (!shift) {
        return ApiResponse.success(res, null, 'No active shift found');
      }

      return ApiResponse.success(res, shift);
    } catch (error: any) {
      console.error('Error getting current shift:', error);
      return ApiResponse.error(res, error.message);
    }
  };

  /**
   * Get shift by ID
   * GET /api/shifts/:id
   */
  getShiftById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const shift = await this.cashShiftService.getShiftById(id);

      // Authorization check
      const user = req.user!;
      const canView =
        shift.userId === user.userId || // Own shift
        (user.role === 'MANAGER' && shift.storeId === user.storeId) || // Manager of same store
        (user.role === 'ADMIN' && shift.companyId === user.companyId) || // Admin of same company
        user.role === 'SUPER_ADMIN'; // Super admin

      if (!canView) {
        return ApiResponse.forbidden(res, 'You do not have permission to view this shift');
      }

      return ApiResponse.success(res, shift);
    } catch (error: any) {
      console.error('Error getting shift:', error);
      return ApiResponse.notFound(res, error.message);
    }
  };

  /**
   * Get shifts with filters
   * GET /api/shifts
   */
  getShifts = async (req: AuthRequest, res: Response) => {
    try {
      const validation = GetShiftsQuerySchema.safeParse(req.query);

      if (!validation.success) {
        return ApiResponse.badRequest(res, 'Invalid query parameters', validation.error.issues);
      }

      const user = req.user!;
      const filters: any = { ...validation.data };

      // Apply role-based filtering
      if (user.role === 'CASHIER') {
        // Cashiers can only see their own shifts
        filters.userId = user.userId;
      } else if (user.role === 'MANAGER') {
        // Managers can see shifts in their store
        filters.storeId = user.storeId;
      } else if (user.role === 'ADMIN') {
        // Admins can see shifts in their company
        filters.companyId = user.companyId;
      }
      // SUPER_ADMIN can see all shifts (no filter)

      const shifts = await this.cashShiftService.getShifts(filters);

      return ApiResponse.success(res, shifts);
    } catch (error: any) {
      console.error('Error getting shifts:', error);
      return ApiResponse.error(res, error.message);
    }
  };

  /**
   * Get shift summary (detailed report)
   * GET /api/shifts/:id/summary
   */
  getShiftSummary = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const summary = await this.cashShiftService.getShiftSummary(id);

      if (!summary) {
        return ApiResponse.notFound(res, 'Shift not found');
      }

      // Authorization check
      const user = req.user!;
      const shift = summary.shift;
      const canView =
        shift.userId === user.userId ||
        (user.role === 'MANAGER' && shift.storeId === user.storeId) ||
        (user.role === 'ADMIN' && shift.companyId === user.companyId) ||
        user.role === 'SUPER_ADMIN';

      if (!canView) {
        return ApiResponse.forbidden(res, 'You do not have permission to view this shift summary');
      }

      return ApiResponse.success(res, summary);
    } catch (error: any) {
      console.error('Error getting shift summary:', error);
      return ApiResponse.error(res, error.message);
    }
  };
}
