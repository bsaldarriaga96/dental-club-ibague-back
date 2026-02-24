import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import syncRoutes from "./modules/siigo/sync";
import productsRoutes from "./modules/products/products.routes";
import { wompiRouter } from "./modules/payments/wompi/wompi.routes";
import { ordersRouter } from "./modules/orders/orders.routes";
import { wompiWebhookController } from "./modules/payments/wompi/wompi.webhook.controller";
import { syncProductsFromSiigo } from "./modules/siigo/siigo.sync.service";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { authRouter } from "./modules/auth/auth.routes";
import cookieParser from "cookie-parser";

const allowlist = [
  "https://www.dentalclubibague.com",
  "https://dentalclubibague.com",
  "http://localhost:5173",
  "http://localhost:8080",
];

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        if (allowlist.includes(origin)) return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
      },
      credentials: true,
    }),
  );

  app.use(cookieParser()); // opcional, útil pero no suficiente

  const PgSession = connectPgSimple(session);

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
  });

  app.set("trust proxy", 1);

  app.use(
    session({
      store: new PgSession({ pool, createTableIfMissing: true }),
      name: "sid",
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    }),
  );

  app.post(
    "/api/payments/wompi/webhook",
    express.raw({ type: "*/*" }),
    wompiWebhookController,
  );

  app.use(express.json());

  app.post("/api/internal/sync/siigo-products", async (req, res) => {
    const token = req.header("x-cron-token");
    if (!token || token !== process.env.CRON_TOKEN) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const result = await syncProductsFromSiigo();
      return res.json(result);
    } catch (err) {
      console.error("Siigo sync failed:", err);
      return res.status(500).json({ error: "Error sincronizando Siigo" });
    }
  });

  app.use((req, _res, next) => {
    next();
  });

  // Rutas
  app.use("/api", productsRoutes);
  app.use("/api/auth", authRouter);
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
