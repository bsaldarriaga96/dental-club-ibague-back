import { Router } from "express";
import { adminOrdersRouter } from "./orders/adminOrders.router";
import { adminProductsRouter } from "./products/adminProducts.router";

export const adminRouter = Router();

adminRouter.use("/orders", adminOrdersRouter);
adminRouter.use("/products", adminProductsRouter);