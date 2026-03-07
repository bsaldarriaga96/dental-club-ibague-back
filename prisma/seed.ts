import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";
import { UserRole } from "@prisma/client";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function main() {
  const adminEmail = normalizeEmail("dentalclubibagues@gmail.com");

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin12345*";
  const bcryptCost = Number(process.env.BCRYPT_COST || 12);
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
