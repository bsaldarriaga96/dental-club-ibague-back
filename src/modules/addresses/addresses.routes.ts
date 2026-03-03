import { Router } from "express";
import * as Addresses from "./addresses.controller";
import { requireUser } from "@/middlewares/requireUser";

const addressesRouter = Router();

addressesRouter.get("/list", requireUser, Addresses.list);
addressesRouter.post("/create", requireUser, Addresses.create);
addressesRouter.patch("/update/:id", requireUser, Addresses.update);
addressesRouter.delete("/delete/:id", requireUser, Addresses.remove);

export default addressesRouter;
