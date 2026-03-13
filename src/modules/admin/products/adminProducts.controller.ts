import type { Request, Response } from "express";
import * as service from "./adminProducts.service";

export async function uploadProductImagesController(
  req: Request<{ productId: string }>,
  res: Response
) {
  try {
    const files = (req.files as Express.Multer.File[]) ?? [];
    const result = await service.uploadProductImages(req.params.productId, files);
    return res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    return res.status(400).json({ message });
  }
}

export async function listProductImagesController(
  req: Request<{ productId: string }>,
  res: Response
) {
  try {
    const images = await service.listProductImages(req.params.productId);
    return res.json({ images });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    return res.status(400).json({ message });
  }
}

export async function setPrimaryProductImageController(
  req: Request<{ productId: string; imageId: string }>,
  res: Response
) {
  try {
    const result = await service.setPrimaryProductImage(
      req.params.productId,
      req.params.imageId
    );
    return res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    return res.status(400).json({ message });
  }
}

export async function deleteProductImageController(
  req: Request<{ productId: string; imageId: string }>,
  res: Response
) {
  try {
    const result = await service.deleteProductImage(
      req.params.productId,
      req.params.imageId
    );
    return res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    return res.status(400).json({ message });
  }
}
