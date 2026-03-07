import { Router } from "express";
import { initCheckout } from "./wompi.controller";

export const wompiRouter = Router();

wompiRouter.post("/checkout", initCheckout);
