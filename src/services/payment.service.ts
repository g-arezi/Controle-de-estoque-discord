import axios from 'axios';
import { config } from '../config/env';
import { logger } from '../lib/logger';

interface CreatePaymentInput {
  orderId: string;
  amount: number;
  description: string;
}

interface PaymentResponse {
  id: string;
  status: string;
  payment_url?: string;
  pix_key?: string;
  qr_code?: string;
}

export async function createPayment(data: CreatePaymentInput): Promise<PaymentResponse> {
  if (!config.payment.infinitePayKey || !config.payment.infinitePayUrl) {
    logger.warn('InfinitePay não configurado');
    return {
      id: `dummy_${data.orderId}`,
      status: 'pending',
      payment_url: 'https://payment.example.com',
    };
  }

  try {
    const response = await axios.post(
      `${config.payment.infinitePayUrl}/payments`,
      {
        order_id: data.orderId,
        amount: data.amount,
        description: data.description,
        type: 'pix',
      },
      {
        headers: {
          Authorization: `Bearer ${config.payment.infinitePayKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    logger.info('Pagamento criado via InfinitePay', {
      orderId: data.orderId,
      paymentId: response.data.id,
    });

    return response.data;
  } catch (error) {
    logger.error('Erro ao criar pagamento', error);
    throw error;
  }
}

export async function getPaymentStatus(paymentId: string): Promise<string> {
  if (!config.payment.infinitePayKey || !config.payment.infinitePayUrl) {
    return 'pending';
  }

  try {
    const response = await axios.get(
      `${config.payment.infinitePayUrl}/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${config.payment.infinitePayKey}`,
        },
        timeout: 10000,
      }
    );

    return response.data.status;
  } catch (error) {
    logger.error('Erro ao buscar status do pagamento', error);
    throw error;
  }
}

export async function verifyWebhook(
  signature: string,
  payload: string
): Promise<boolean> {
  if (!config.payment.webhookSecret) {
    return false;
  }

  try {
    // Implementar verificação de HMAC conforme documentação da InfinitePay
    // Este é um exemplo básico
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha256', config.payment.webhookSecret)
      .update(payload)
      .digest('hex');

    return hash === signature;
  } catch (error) {
    logger.error('Erro ao verificar webhook', error);
    return false;
  }
}
