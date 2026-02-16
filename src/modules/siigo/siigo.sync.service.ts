import { EXCLUDED_SKUS } from "@/constants/sku";
import { getProducts } from "./siigo.service";
import { prisma } from "@/lib/prisma";

export async function syncProductsFromSiigo() {
  let page = 1;
  let totalSynced = 0;

  while (true) {
    const { products, pagination } = await getProducts(page, 50);

    if (!products.length) break;

    for (const product of products) {
      if (!product.siigoId) {
        console.warn("Producto sin siigoId:", product);
        continue;
      }

      const sku = product.sku?.trim();
      if (sku && EXCLUDED_SKUS.includes(sku as (typeof EXCLUDED_SKUS)[number])) {
        continue;
      }

      await prisma.product.upsert({
        where: { siigoId: product.siigoId },
        update: {
          name: product.name,
          sku: product.sku,
          price: product.price,
          stock: product.stock,
          reference: product.reference,
          brand: product.brand,
          description: product.description,
          isActive: product.isActive,
        },
        create: {
          siigoId: product.siigoId,
          name: product.name,
          sku: product.sku,
          price: product.price,
          stock: product.stock,
          reference: product.reference,
          brand: product.brand,
          description: product.description,
          isActive: product.isActive,
        },
      });

      totalSynced++;
    }

    if (page * pagination.page_size >= pagination.total_results) break;
    page++;
  }

  return { totalSynced };
}
