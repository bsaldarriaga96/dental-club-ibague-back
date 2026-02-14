import { Router } from "express";
import { listProducts } from "./product.controller";

const router = Router();

router.get("/products", listProducts);

export default router;
