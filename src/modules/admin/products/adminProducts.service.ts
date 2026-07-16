import { prisma } from "@/lib/prisma";

export async function getProductDescription(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      sku: true,
      description: true,
    },
  });

  if (!product) {
    throw new Error("Producto no encontrado");
  }

  return product;
}

export async function updateProductDescription(
  productId: string,
  description: string | null
) {
  const normalizedDescription = description?.trim() || null;

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      description: normalizedDescription,
    },
    select: {
      id: true,
      name: true,
      description: true,
      updatedAt: true,
    },
  });

  return {
    message: normalizedDescription
      ? "Descripción actualizada correctamente"
      : "Descripción eliminada correctamente",
    product,
  };
}

export async function deleteProductDescription(productId: string) {
  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      description: null,
    },
    select: {
      id: true,
      name: true,
      description: true,
      updatedAt: true,
    },
  });

  return {
    message: "Descripción eliminada correctamente",
    product,
  };
}