import type { RequestHandler } from "express";

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
  return next();
};
