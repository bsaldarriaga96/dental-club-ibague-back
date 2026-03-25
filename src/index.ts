import "dotenv/config";
import { createApp } from "./app";
import { prisma } from "./lib/prisma";
import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function seedIfNeeded() {
  const emailUser = process.env.EMAIL_USER;
  if (!emailUser) throw new Error("EMAIL_USER no está definido");

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) throw new Error("SEED_ADMIN_PASSWORD no está definido");

  const bcryptCost = Number(process.env.BCRYPT_COST) || 10;
  const passwordHash = await bcrypt.hash(adminPassword, bcryptCost);

  await prisma.user.upsert({
    where: { email: normalizeEmail(emailUser) },
    create: {
      email: normalizeEmail(emailUser),
      passwordHash,
      role: UserRole.ADMIN,
      emailVerified: true,
      verifiedAt: new Date(),
      name: "Admin",
      phone: null,
      documentType: null,
      documentNumber: null,
    },
    update: { role: UserRole.ADMIN },
  });

  console.log("Seed completado");
}

async function main() {
  await seedIfNeeded();

  const app = createApp();
  const PORT = Number(process.env.PORT) || 3001;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend corriendo en puerto ${PORT}`);
  });
}

main().catch((e) => {
  console.error("Error al arrancar:", e);
  process.exit(1);
});
