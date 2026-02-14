import { Request, Response } from "express";
import { getProducts } from "./product.service";

export async function listProducts(req: Request, res: Response) {
  const {
    page = "1",
    pageSize = "24",
    search,
    category,
    brand,
    minPrice,
    maxPrice,
    isActive,
    sortBy,
  } = req.query;

  const pageNumber = Number(page);
  const pageSizeNumber = Number(pageSize);
  const minPriceNumber = minPrice ? Number(minPrice) : undefined;
  const maxPriceNumber = maxPrice ? Number(maxPrice) : undefined;

  if (isNaN(pageNumber) || pageNumber < 1) {
    return res.status(400).json({ message: "page debe ser un número válido" });
  }

  if (isNaN(pageSizeNumber) || pageSizeNumber < 1) {
    return res
      .status(400)
      .json({ message: "pageSize debe ser un número válido" });
  }

  if (minPrice !== undefined && isNaN(minPriceNumber!)) {
    return res
      .status(400)
      .json({ message: "minPrice debe ser un número" });
  }

  if (maxPrice !== undefined && isNaN(maxPriceNumber!)) {
    return res
      .status(400)
      .json({ message: "maxPrice debe ser un número" });
  }

  if (
    minPriceNumber !== undefined &&
    maxPriceNumber !== undefined &&
    minPriceNumber > maxPriceNumber
  ) {
    return res.status(400).json({
      message: "minPrice no puede ser mayor que maxPrice",
    });
  }


  const result = await getProducts({
    page: pageNumber,
    pageSize: pageSizeNumber,
    search: search as string,
    category: category as string,
    brand: brand as string,
    minPrice: minPriceNumber,
    maxPrice: maxPriceNumber,
    isActive:
      isActive !== undefined ? isActive === "true" : undefined,
    sortBy: sortBy as any,
  });

  res.json(result);
}
