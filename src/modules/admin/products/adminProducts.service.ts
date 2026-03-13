import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import type { Express } from "express";
import { get } from "node:http";
import path from "node:path";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function uploadProductImages(
  productId: string,
  files: Express.Multer.File[]
) {
  if (!files?.length) {
    throw new Error("No images provided");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      sku: true,
      name: true,
      images: {
        select: { id: true, position: true, isPrimary: true, path: true },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!product) throw new Error("Producto no encontrado");
  if (!product.sku?.trim()) throw new Error("El producto no tiene SKU");

  const safeSku = product.sku.trim().replace(/[^\w-]/g, "_");
  const startPosition = product.images.length;

  const supabase = getSupabase();

  const createdImages: {
    url: string;
    path: string;
    position: number;
    isPrimary: boolean;
  }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    const originalExt = path.extname(file.originalname).toLowerCase();
    const ext =
      originalExt && originalExt !== "."
        ? originalExt
        : file.mimetype === "image/png"
          ? ".png"
          : file.mimetype === "image/webp"
            ? ".webp"
            : ".jpg";

    const position = startPosition + i;
    const filePath = `${safeSku}-${position + 1}${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("products").getPublicUrl(filePath);

    createdImages.push({
      url: publicUrl,
      path: filePath,
      position,
      isPrimary: product.images.length === 0 && i === 0,
    });
  }

  await prisma.$transaction(async (tx) => {
    if (createdImages.length > 0) {
      await tx.productImage.createMany({
        data: createdImages.map((img) => ({
          productId,
          url: img.url,
          path: img.path,
          position: img.position,
          isPrimary: img.isPrimary,
          alt: product.name,
        })),
      });
    }

    const primaryImage =
      createdImages.find((img) => img.isPrimary) ??
      (await tx.productImage.findFirst({
        where: { productId, isPrimary: true },
        orderBy: { position: "asc" },
      })) ??
      (await tx.productImage.findFirst({
        where: { productId },
        orderBy: { position: "asc" },
      }));

    await tx.product.update({
      where: { id: productId },
      data: {
        imageUrl: primaryImage?.url ?? null,
      },
    });
  });

  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { position: "asc" },
  });

  return {
    message: "Imágenes actualizadas correctamente",
    productId,
    images,
  };
}

export async function listProductImages(productId: string) {
  return prisma.productImage.findMany({
    where: { productId },
    orderBy: { position: "asc" },
  });
}

export async function setPrimaryProductImage(productId: string, imageId: string) {
  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId },
  });

  if (!image) {
    throw new Error("Imagen no encontrada");
  }

  await prisma.$transaction([
    prisma.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    }),
    prisma.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    }),
    prisma.product.update({
      where: { id: productId },
      data: { imageUrl: image.url },
    }),
  ]);

  return { message: "Imagen principal actualizada" };
}

export async function deleteProductImage(productId: string, imageId: string) {
  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId },
  });

  if (!image) {
    throw new Error("Imagen no encontrada");
  }

  const supabase = getSupabase();

  const { error } = await supabase.storage.from("products").remove([image.path]);

  if (error) {
    throw new Error(error.message);
  }

  await prisma.productImage.delete({
    where: { id: imageId },
  });

  const remaining = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { position: "asc" },
  });

  const newPrimary = remaining[0] ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    });

    if (newPrimary) {
      await tx.productImage.update({
        where: { id: newPrimary.id },
        data: { isPrimary: true },
      });
    }

    await tx.product.update({
      where: { id: productId },
      data: { imageUrl: newPrimary?.url ?? null },
    });
  });

  return {
    message: "Imagen eliminada",
    imageUrl: newPrimary?.url ?? null,
  };
}
