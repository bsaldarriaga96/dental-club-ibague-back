import type { Request, Response } from "express";
import * as service from "./adminProducts.service";

export async function uploadProductImages(
  req: Request<{ productId: string }>,
  res: Response
) {
  try {
    const files = (req.files as Express.Multer.File[]) ?? [];
    const result = await service.uploadProductImage(req.params.productId, files);

    return res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";

    return res.status(400).json({ message });
  }
}
