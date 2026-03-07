import { Router } from "express";
import { listOrders, getOrder, updateStatus, createShipment } from "./adminOrders.controller";

export const adminOrdersRouter = Router();

adminOrdersRouter.get("/", listOrders);
adminOrdersRouter.get("/:id", getOrder);
adminOrdersRouter.patch("/:id/status", updateStatus);
adminOrdersRouter.post("/:id/shipment", createShipment);
