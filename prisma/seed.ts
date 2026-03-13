import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";
import { UserRole } from "@prisma/client";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function main() {
  const emailUser = process.env.EMAIL_USER;
  if (!emailUser) {
    throw new Error("EMAIL_USER environment variable is not set");
  }
  const adminEmail = normalizeEmail(emailUser);

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("SEED_ADMIN_PASSWORD environment variable is not set");
  }
  const bcryptCost = Number(process.env.BCRYPT_COST);
  const passwordHash = await bcrypt.hash(adminPassword, bcryptCost);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      emailVerified: true,
      verifiedAt: new Date(),
      name: "Admin",
      phone: null,
      documentType: null,
      documentNumber: null,
    },
    update: {
      role: UserRole.ADMIN,
    },
    select: { id: true, email: true, role: true, createdAt: true },
  });

}

main()
  .catch((e) => {
    console.error("Seed FAILED:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
