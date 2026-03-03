import { prisma } from "../../lib/prisma";

type AddressInput = {
  label: string;
  address: string;
  neighborhood: string;
  city: string;
  department: string;
  notes?: string | null;
  isDefault?: boolean;
};

export async function listByUser(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function create(userId: string, data: AddressInput) {
  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.address.create({ data: { ...data, userId } });
  });
}

export async function update(userId: string, id: string, data: Partial<AddressInput>) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({ where: { id, userId } });
    if (!existing) throw new Error("NOT_FOUND");

    if (data.isDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.address.update({
      where: { id },
      data,
    });
  });
}

export async function remove(userId: string, id: string) {
  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("NOT_FOUND");
  await prisma.address.delete({ where: { id } });
}
