import express, { Express, Request, Response } from 'express';

import { config } from '../config/env';
import { logger } from '../lib/logger';
import * as orderService from '../services/order.service';

export function createExpressApp(): Express {
  const app = express();

  app.use(express.json());

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Endpoints de status
  app.get('/orders/:orderId', async (req: Request, res: Response): Promise<any> => {
    try {
      const { orderId } = req.params;
      const order = await orderService.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      logger.error('Erro ao buscar pedido', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return app;
}

export function startExpressServer(app: Express): void {
  const PORT = config.server.port;

  app.listen(PORT, () => {
    logger.info(`Servidor Express iniciado na porta ${PORT}`);
  });
}
