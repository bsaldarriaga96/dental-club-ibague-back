import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import path from "node:path";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeSku(value: string) {
  return value.trim().replace(/[^\w-]/g, "_").toUpperCase();
}

async function listAllFiles(bucket: string) {
  const allFiles: { name: string }[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list("", {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) break;

    allFiles.push(...data.map((item) => ({ name: item.name })));

    if (data.length < limit) break;
    offset += limit;
  }

  return allFiles;
}

async function main() {
  const bucket = "products";

  const files = await listAllFiles(bucket);

  const fileMap = new Map<string, string>();

  for (const file of files) {
    const ext = path.extname(file.name);
    const baseName = path.basename(file.name, ext);
    const normalized = normalizeSku(baseName);

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(file.name);

    fileMap.set(normalized, publicUrl);
  }

  const products = await prisma.product.findMany({
    where: {
      sku: { not: null },
    },
    select: {
      id: true,
      sku: true,
      imageUrl: true,
    },
  });

  let updated = 0;
  let notFound = 0;

  for (const product of products) {
    if (!product.sku) continue;

    const normalizedSku = normalizeSku(product.sku);
    const publicUrl = fileMap.get(normalizedSku);

    if (!publicUrl) {
      notFound++;
      console.log(`Sin imagen: ${product.sku}`);
      continue;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        imageUrl: publicUrl,
      },
    });

    updated++;
    console.log(`OK ${product.sku} -> ${publicUrl}`);
  }

  console.log({
    totalFiles: files.length,
    totalProducts: products.length,
    updated,
    notFound,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
