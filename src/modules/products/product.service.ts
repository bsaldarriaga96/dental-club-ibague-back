import { EXCLUDED_SKUS } from "@/constants/sku";
import { prisma } from "@/lib/prisma";

interface ProductFilters {
  page: number;
  pageSize: number;
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  sortBy?: "name" | "price-asc" | "price-desc" | "newest";
}

export async function getProducts({
  page,
  pageSize,
  search,
  category,
  brand,
  minPrice,
  maxPrice,
  isActive,
  sortBy,
}: ProductFilters) {
  const where: any = {
    sku: { notIn: [...EXCLUDED_SKUS], not: null },
  };

  if (search?.trim()) {
    const terms = search.trim().split(/\s+/);

    where.AND = terms.map((term) => ({
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { sku: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
      ],
    }));
  }

  if (category) where.category = category;
  if (brand) where.brand = brand;
  if (isActive !== undefined) where.isActive = isActive;

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  let orderBy: any = { name: "asc" };
  switch (sortBy) {
    case "price-asc":
      orderBy = { price: "asc" };
      break;
    case "price-desc":
      orderBy = { price: "desc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
    products,
  };
}
