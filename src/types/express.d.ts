import type { User } from "@prisma/client";
import "express";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: "CUSTOMER" | "ADMIN" };
    }
  }
}

export {};
