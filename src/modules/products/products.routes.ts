import { Router } from "express";
import { getFeaturedProductsController, getProductByIdController, listProducts } from "./product.controller";

const router = Router();

router.get("/products", listProducts);
router.get("/products/featured", getFeaturedProductsController);
router.get("/products/:productId", getProductByIdController);

export default router;
