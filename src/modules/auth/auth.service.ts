import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import { AUTH } from "../../constants/auth";

const BCRYPT_COST = AUTH.BCRYPT_COST;
const MAX_PASSWORD_LEN = AUTH.MAX_PASSWORD_LEN;

export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  documentType: string | null;
  documentNumber: string | null;
  createdAt: Date;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function registerUser(params: {
  email: string;
  password: string;
  name?: string | null;
  phone?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
}): Promise<PublicUser> {
  const emailNorm = normalizeEmail(params.email);

  if (!params.password) throw new Error("Password requerido");
  if (params.password.length > MAX_PASSWORD_LEN) throw new Error("Password demasiado largo");

  const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (existing) {
    const err: any = new Error("USER_EMAIL_EXISTS");
    err.code = "USER_EMAIL_EXISTS";
    throw err;
  }

  const passwordHash = await bcrypt.hash(params.password, BCRYPT_COST);
  const user = await prisma.user.create({
    data: {
      email: emailNorm,
      passwordHash,
      name: params.name?.trim() || null,
      phone: params.phone?.trim() || null,
      documentType: params.documentType?.trim() || null,
      documentNumber: params.documentNumber?.trim() || null,
    },
    select: { id: true, email: true, name: true, phone: true, documentType: true, documentNumber: true, createdAt: true },
  });
  return user;
}

export async function validateLogin(params: {
  email: string;
  password: string;
}): Promise<{ id: string; email: string; name: string | null }> {
  const emailNorm = normalizeEmail(params.email);

  

  const user = await prisma.user.findUnique({
    where: { email: emailNorm },
    select: { id: true, email: true, name: true, passwordHash: true },
  });

  if (!user) return null as any;

  const ok = await bcrypt.compare(params.password, user.passwordHash);
  if (!ok) return null as any;

  return { id: user.id, email: user.email, name: user.name };
}

export async function getPublicUserById(userId: string): Promise<PublicUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, phone: true, documentType: true, documentNumber: true, createdAt: true },
  });
}

export async function claimOrdersForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerified: true },
  });

  if (!user) {
    const err: any = new Error("USER_NOT_FOUND");
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  if (!user.emailVerified) {
    const err: any = new Error("EMAIL_NOT_VERIFIED");
    err.code = "EMAIL_NOT_VERIFIED";
    throw err;
  }

  const result = await prisma.order.updateMany({
    where: { userId: null, customerEmail: user.email },
    data: { userId: user.id },
  });

  return { claimed: result.count };
}

