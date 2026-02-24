import { Router } from "express";
import {
  registerController,
  loginController,
  logoutController,
  meController,
  claimOrdersController,
} from "./auth.controller";
import { requireUser } from "@/middlewares/requireUser";

export const authRouter = Router();

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
authRouter.post("/logout", logoutController);
authRouter.get("/me", meController);
authRouter.post("/claim-orders", requireUser, claimOrdersController);
