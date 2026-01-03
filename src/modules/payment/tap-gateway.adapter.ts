import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

/**
 * TAP Payment Gateway Adapter
 *
 * Documentation: https://developers.tap.company/reference
 *
 * Environment variables required:
 * - TAP_SECRET_KEY: Your TAP secret key
 * - TAP_PUBLIC_KEY: Your TAP public key (optional, for frontend)
 * - TAP_WEBHOOK_SECRET: Webhook signature secret
 * - TAP_BASE_URL: TAP API base URL (default: https://api.tap.company/v2)
 */

interface TapChargeRequest {
  amount: number;
  currency: string;
  customer: {
    email?: string;
    phone?: {
      country_code: string;
      number: string;
    };
  };
  source: {
    id: string; // 'src_card' for card, 'src_kw.knet' for KNET, etc.
  };
  reference: {
    transaction: string; // Our payment ID
    order: string; // Our order ID
  };
  redirect: {
    url: string; // Success/failure redirect URL
  };
  post?: {
    url: string; // Webhook URL
  };
  description?: string;
  metadata?: Record<string, any>;
}

interface TapChargeResponse {
  id: string; // Charge ID (tap_chrg_xxx)
  object: string;
  live_mode: boolean;
  status: string; // INITIATED, CAPTURED, FAILED, etc.
  amount: number;
  currency: string;
  threeDSecure: boolean;
  transaction: {
    timezone: string;
    created: string;
    url: string; // Payment page URL
    expiry: {
      period: number;
      type: string;
    };
  };
  reference: {
    transaction: string;
    order: string;
  };
  response: {
    code: string;
    message: string;
  };
  receipt: {
    id: string;
    url: string;
  };
  customer: {
    id: string;
    email?: string;
    phone?: {
      country_code: string;
      number: string;
    };
  };
  source: any;
  redirect: {
    url: string;
  };
  post?: {
    url: string;
  };
}

interface TapRefundRequest {
  charge_id: string;
  amount: number;
  currency: string;
  reason?: string;
  reference?: {
    merchant: string;
  };
  metadata?: Record<string, any>;
}

interface TapRefundResponse {
  id: string; // Refund ID
  object: string;
  status: string; // PENDING, SUCCESS, FAILED
  amount: number;
  currency: string;
  charge: string; // Original charge ID
  created: string;
  reference?: {
    merchant: string;
  };
}

export class TapGatewayAdapter {
  private client: AxiosInstance;
  private secretKey: string;
  private webhookSecret: string;

  constructor() {
    this.secretKey = process.env.TAP_SECRET_KEY || '';
    this.webhookSecret = process.env.TAP_WEBHOOK_SECRET || '';

    if (!this.secretKey) {
      throw new Error('TAP_SECRET_KEY is not configured');
    }

    this.client = axios.create({
      baseURL: process.env.TAP_BASE_URL || 'https://api.tap.company/v2',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });
  }

  /**
   * Create a charge (payment request)
   *
   * @param amount - Amount in currency units (e.g., 10.500 BHD)
   * @param currency - Currency code (e.g., 'BHD')
   * @param paymentId - Our internal payment ID
   * @param orderId - Our internal order ID
   * @param customerPhone - Customer phone number
   * @param redirectUrl - URL to redirect after payment
   * @param webhookUrl - URL for payment webhooks
   * @returns TAP charge response with payment URL
   */
  async createCharge(
    amount: number,
    currency: string,
    paymentId: string,
    orderId: string,
    customerPhone: string,
    redirectUrl: string,
    webhookUrl: string
  ): Promise<TapChargeResponse> {
    try {
      const request: TapChargeRequest = {
        amount: Math.round(amount * 1000) / 1000, // Round to 3 decimal places for BHD
        currency: currency.toUpperCase(),
        customer: {
          phone: {
            country_code: '+973', // Bahrain country code
            number: customerPhone.replace(/\D/g, ''), // Remove non-digits
          },
        },
        source: {
          id: 'src_all', // Accept all payment sources (card, wallet, etc.)
        },
        reference: {
          transaction: paymentId,
          order: orderId,
        },
        redirect: {
          url: redirectUrl,
        },
        post: {
          url: webhookUrl,
        },
        description: `Payment for Order ${orderId}`,
        metadata: {
          paymentId,
          orderId,
        },
      };

      const response = await this.client.post<TapChargeResponse>('/charges', request);

      return response.data;
    } catch (error: any) {
      console.error('TAP Create Charge Error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        'Failed to create TAP charge'
      );
    }
  }

  /**
   * Retrieve a charge by ID
   *
   * @param chargeId - TAP charge ID
   * @returns Charge details
   */
  async retrieveCharge(chargeId: string): Promise<TapChargeResponse> {
    try {
      const response = await this.client.get<TapChargeResponse>(`/charges/${chargeId}`);
      return response.data;
    } catch (error: any) {
      console.error('TAP Retrieve Charge Error:', error.response?.data || error.message);
      throw new Error('Failed to retrieve TAP charge');
    }
  }

  /**
   * Create a refund for a charge
   *
   * @param chargeId - TAP charge ID to refund
   * @param amount - Amount to refund (full or partial)
   * @param currency - Currency code
   * @param reason - Refund reason
   * @param merchantRef - Our internal refund reference
   * @returns Refund response
   */
  async createRefund(
    chargeId: string,
    amount: number,
    currency: string,
    reason?: string,
    merchantRef?: string
  ): Promise<TapRefundResponse> {
    try {
      const request: TapRefundRequest = {
        charge_id: chargeId,
        amount: Math.round(amount * 1000) / 1000,
        currency: currency.toUpperCase(),
        reason,
        reference: merchantRef ? {
          merchant: merchantRef,
        } : undefined,
      };

      const response = await this.client.post<TapRefundResponse>('/refunds', request);

      return response.data;
    } catch (error: any) {
      console.error('TAP Create Refund Error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to create TAP refund'
      );
    }
  }

  /**
   * Retrieve a refund by ID
   *
   * @param refundId - TAP refund ID
   * @returns Refund details
   */
  async retrieveRefund(refundId: string): Promise<TapRefundResponse> {
    try {
      const response = await this.client.get<TapRefundResponse>(`/refunds/${refundId}`);
      return response.data;
    } catch (error: any) {
      console.error('TAP Retrieve Refund Error:', error.response?.data || error.message);
      throw new Error('Failed to retrieve TAP refund');
    }
  }

  /**
   * Verify webhook signature
   *
   * TAP uses HMAC-SHA256 signature verification
   *
   * @param payload - Raw webhook payload (as string)
   * @param signature - Signature from webhook header
   * @returns True if signature is valid
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('TAP_WEBHOOK_SECRET not configured, skipping signature verification');
      return true; // Allow in development, but log warning
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Map TAP status to our PaymentStatus enum
   *
   * TAP statuses: INITIATED, AUTHORIZED, CAPTURED, FAILED, CANCELLED, ABANDONED
   * Our statuses: INITIATED, SUCCESS, FAILED, REFUNDED
   *
   * @param tapStatus - TAP payment status
   * @returns Our payment status
   */
  mapTapStatus(tapStatus: string): 'INITIATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED' {
    const status = tapStatus.toUpperCase();

    switch (status) {
      case 'CAPTURED':
      case 'AUTHORIZED': // Sometimes TAP uses AUTHORIZED for successful payments
        return 'SUCCESS';

      case 'INITIATED':
        return 'INITIATED';

      case 'FAILED':
      case 'CANCELLED':
      case 'ABANDONED':
      case 'DECLINED':
        return 'FAILED';

      default:
        console.warn(`Unknown TAP status: ${status}, treating as FAILED`);
        return 'FAILED';
    }
  }

  /**
   * Get payment page URL from charge response
   *
   * @param charge - TAP charge response
   * @returns Payment page URL for customer
   */
  getPaymentUrl(charge: TapChargeResponse): string {
    return charge.transaction?.url || '';
  }
}
