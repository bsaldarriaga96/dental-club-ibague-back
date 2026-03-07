import { Router } from "express";
import { adminOrdersRouter } from "./orders/adminOrders.router";

export const adminRouter = Router();

adminRouter.use("/orders", adminOrdersRouter);
