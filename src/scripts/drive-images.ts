// scripts/drive-images.ts
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

async function main() {
  const auth = new GoogleAuth({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS!,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  const drive = google.drive({ version: 'v3', auth });
  const folderId = process.env.DRIVE_FOLDER_ID!;

  // Lista imgs JPG en carpeta
  const { data } = await drive.files.list({
    q: `'${folderId}' in parents and name contains '.jpg'`,
    fields: 'files(id,name)',
  });

  const skuToUrl: Record<string, string> = {};
  data.files?.forEach((file: any) => {
    const sku = file.name.replace(/\.jpg$/i, '').trim().toUpperCase();
    skuToUrl[sku] = `https://drive.google.com/uc?export=view&id=${file.id}`;
  });

  console.log(`${Object.keys(skuToUrl).length} imágenes encontradas`);

  // Actualiza productos por SKU
  const products = await prisma.product.findMany({
    where: { sku: { not: null } },
    select: { id: true, sku: true }
  });

  let updated = 0;
  for (const p of products) {
    const url = skuToUrl[p.sku!];
    if (url) {
      await prisma.product.update({
        where: { id: p.id },
        data: { imageUrl: url }
      });
      updated++;
    }
  }

  console.log(`✅ Actualizados ${updated}/${products.length} productos`);
}

main().catch(console.error);
