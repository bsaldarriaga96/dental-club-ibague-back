import { Router } from "express";
import {
  createOrderController,
  getOrderByReferenceController,
  getOrderByIdController,
  listOrdersController,
} from "./orders.controller";

export const ordersRouter = Router();

ordersRouter.post("/", createOrderController);
ordersRouter.get("/by-reference/:reference", getOrderByReferenceController);
ordersRouter.get("/", listOrdersController);
ordersRouter.get("/:orderId", getOrderByIdController);
