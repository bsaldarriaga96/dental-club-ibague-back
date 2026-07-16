import type { Request, Response, NextFunction } from "express";
import * as service from "./adminProducts.service";

type ProductParams = {
  productId: string;
};

type UpdateDescriptionBody = {
  description: string | null;
};

export async function getDescription(
  req: Request<ProductParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await service.getProductDescription(
      req.params.productId
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateDescription(
  req: Request<ProductParams, unknown, UpdateDescriptionBody>,
  res: Response,
  next: NextFunction
) {
  try {
    const { description } = req.body;

    if (description !== null && typeof description !== "string") {
      return res.status(400).json({
        message: "La descripción debe ser texto o null",
      });
    }

    const result = await service.updateProductDescription(
      req.params.productId,
      description
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteDescription(
  req: Request<ProductParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await service.deleteProductDescription(
      req.params.productId
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}