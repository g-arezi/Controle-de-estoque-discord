"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = createPayment;
exports.getPaymentStatus = getPaymentStatus;
exports.verifyWebhook = verifyWebhook;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const logger_1 = require("../lib/logger");
async function createPayment(data) {
    if (!env_1.config.payment.infinitePayKey || !env_1.config.payment.infinitePayUrl) {
        logger_1.logger.warn('InfinitePay não configurado');
        return {
            id: `dummy_${data.orderId}`,
            status: 'pending',
            payment_url: 'https://payment.example.com',
        };
    }
    try {
        const response = await axios_1.default.post(`${env_1.config.payment.infinitePayUrl}/payments`, {
            order_id: data.orderId,
            amount: data.amount,
            description: data.description,
            type: 'pix',
        }, {
            headers: {
                Authorization: `Bearer ${env_1.config.payment.infinitePayKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });
        logger_1.logger.info('Pagamento criado via InfinitePay', {
            orderId: data.orderId,
            paymentId: response.data.id,
        });
        return response.data;
    }
    catch (error) {
        logger_1.logger.error('Erro ao criar pagamento', error);
        throw error;
    }
}
async function getPaymentStatus(paymentId) {
    if (!env_1.config.payment.infinitePayKey || !env_1.config.payment.infinitePayUrl) {
        return 'pending';
    }
    try {
        const response = await axios_1.default.get(`${env_1.config.payment.infinitePayUrl}/payments/${paymentId}`, {
            headers: {
                Authorization: `Bearer ${env_1.config.payment.infinitePayKey}`,
            },
            timeout: 10000,
        });
        return response.data.status;
    }
    catch (error) {
        logger_1.logger.error('Erro ao buscar status do pagamento', error);
        throw error;
    }
}
async function verifyWebhook(signature, payload) {
    if (!env_1.config.payment.webhookSecret) {
        return false;
    }
    try {
        // Implementar verificação de HMAC conforme documentação da InfinitePay
        // Este é um exemplo básico
        const crypto = require('crypto');
        const hash = crypto
            .createHmac('sha256', env_1.config.payment.webhookSecret)
            .update(payload)
            .digest('hex');
        return hash === signature;
    }
    catch (error) {
        logger_1.logger.error('Erro ao verificar webhook', error);
        return false;
    }
}
//# sourceMappingURL=payment.service.js.map