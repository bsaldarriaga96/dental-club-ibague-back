import { Router } from "express";
import multer from "multer";
import {
  uploadProductImagesController,
  listProductImagesController,
  setPrimaryProductImageController,
  deleteProductImageController,
} from "./adminProductImages.controller";
import * as adminProductsController from "./adminProducts.controller";

export const adminProductsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

adminProductsRouter.get("/:productId/images", listProductImagesController);
adminProductsRouter.post(
  "/:productId/images",
  upload.array("images", 10),
  uploadProductImagesController
);
adminProductsRouter.patch(
  "/:productId/images/:imageId/primary",
  setPrimaryProductImageController
);
adminProductsRouter.delete(
  "/:productId/images/:imageId",
  deleteProductImageController
);
adminProductsRouter.get("/:productId/description", adminProductsController.getDescription);
adminProductsRouter.patch("/:productId/description", adminProductsController.updateDescription);
adminProductsRouter.delete("/:productId/description", adminProductsController.deleteDescription);