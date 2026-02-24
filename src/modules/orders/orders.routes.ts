import { Router } from "express";
import {
  createOrderController,
  getMyOrderByIdController,
  getOrderByReferenceController,
  listOrdersController,
} from "./orders.controller";
import { requireUser } from "../../middlewares/requireUser";
import { getMyOrdersController } from "./orders.controller";



export const ordersRouter = Router();

ordersRouter.post("/", createOrderController);
ordersRouter.get("/by-reference/:reference", getOrderByReferenceController);
ordersRouter.get("/", listOrdersController);
ordersRouter.get("/mine", requireUser, getMyOrdersController);
ordersRouter.get("/:orderId", requireUser, getMyOrderByIdController);
