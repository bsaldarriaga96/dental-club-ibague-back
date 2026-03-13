import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import type { Express } from "express";
import path from "node:path";

export async function uploadProductImage(
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
    },
  });

  if (!product) {
    throw new Error("Producto no encontrado");
  }

  if (!product.sku?.trim()) {
    throw new Error("El producto no tiene SKU");
  }

  const file = files[0];

  const originalExt = path.extname(file.originalname).toLowerCase();
  const ext =
    originalExt && originalExt !== "."
      ? originalExt
      : file.mimetype === "image/png"
        ? ".png"
        : file.mimetype === "image/webp"
          ? ".webp"
          : ".jpg";

  const safeSku = product.sku.trim().replace(/[^\w-]/g, "_");
  const filePath = `${safeSku}${ext}`;

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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

  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: { imageUrl: publicUrl },
    select: {
      id: true,
      sku: true,
      imageUrl: true,
    },
  });

  return {
    message: "Imagen actualizada correctamente",
    product: updatedProduct,
  };
}
