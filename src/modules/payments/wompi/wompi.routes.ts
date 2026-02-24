import { Router } from "express";
import { initCheckout } from "./wompi.controller";
import { requireUser } from "@/middlewares/requireUser";

export const wompiRouter = Router();

wompiRouter.post("/checkout", requireUser, initCheckout);
