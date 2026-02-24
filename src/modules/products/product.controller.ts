import { NextFunction, Request, RequestHandler, Response } from "express";
import { getProductById, getProducts } from "./product.service";
import { prisma } from "@/lib/prisma";

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
    inStockOnly,
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
    return res.status(400).json({ message: "minPrice debe ser un número" });
  }

  if (maxPrice !== undefined && isNaN(maxPriceNumber!)) {
    return res.status(400).json({ message: "maxPrice debe ser un número" });
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
    isActive: isActive !== undefined ? isActive === "true" : undefined,
    inStockOnly: inStockOnly !== undefined ? inStockOnly === "true" : undefined,
    sortBy: sortBy as any,
  });

  res.json(result);
}

export async function getProductByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const productId = String(req.params.productId ?? "").trim();
    if (!productId)
      return res.status(400).json({ message: "productId es requerido" });

    const product = await getProductById(productId);
    if (!product)
      return res.status(404).json({ message: "Producto no encontrado" });

    return res.json(product);
  } catch (err) {
    next(err);
  }
}

export const getFeaturedProductsController: RequestHandler = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        reference: "Destacado",
        isActive: true,
        stock: { gt: 0 },
      },
      take: 8,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true, 
        price: true,
        //image: true,
        category: true,
        brand: true,
        sku: true,
        stock: true,
        isActive: true,
      },
    });

    return res.json({ products });
  } catch (err) {
    next(err);
  }
};

