import type { RequestHandler } from "express";
import { prisma } from "@/lib/prisma";

export const requireUser: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Unauthorized" });
    }

    (req as any).user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};
