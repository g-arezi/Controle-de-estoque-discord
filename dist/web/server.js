"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExpressApp = createExpressApp;
exports.startExpressServer = startExpressServer;
const express_1 = __importDefault(require("express"));
const env_1 = require("../config/env");
const logger_1 = require("../lib/logger");
const orderService = __importStar(require("../services/order.service"));
function createExpressApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    // Health check
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    // Endpoints de status
    app.get('/orders/:orderId', async (req, res) => {
        try {
            const { orderId } = req.params;
            const order = await orderService.getOrder(orderId);
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }
            res.json(order);
        }
        catch (error) {
            logger_1.logger.error('Erro ao buscar pedido', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    return app;
}
function startExpressServer(app) {
    const PORT = env_1.config.server.port;
    app.listen(PORT, () => {
        logger_1.logger.info(`Servidor Express iniciado na porta ${PORT}`);
    });
}
//# sourceMappingURL=server.js.map