import { Router } from "express";
import multer from "multer";
import { uploadProductImages } from "./adminProducts.controller";

export const adminProductsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

adminProductsRouter.post(
  "/:productId/images",
  upload.array("images", 5),
  uploadProductImages
);
