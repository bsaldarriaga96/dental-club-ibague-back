import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import syncRoutes from "./modules/siigo/sync";
import productsRoutes from "./modules/products/products.routes";
import { wompiRouter } from "./modules/payments/wompi/wompi.routes";
import { ordersRouter } from "./modules/orders/orders.routes";
import { wompiWebhookController } from "./modules/payments/wompi/wompi.webhook.controller";
export function createApp() {
  const app = express();

  app.use(cors());

  app.post(
    "/api/payments/wompi/webhook",
    express.raw({ type: "*/*" }),
    wompiWebhookController,
  );

  app.use(express.json());

  app.use((req, _res, next) => {
    next();
  });

  // Rutas
  app.use("/api", productsRoutes);
  app.use("/api/sync", syncRoutes);
  app.use("/api/payments/wompi", wompiRouter);
  app.use("/api/orders", ordersRouter);

  // 404
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: "Not found" });
  });

  // Error handler global (4 args)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err.statusCode || 500).json({
      message: err.message || "Internal server error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  });

  return app;
}
