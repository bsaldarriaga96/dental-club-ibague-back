import { sendAdminNewShipment, sendCustomerShipment } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";

export const allowedNext: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'FAILED', 'CANCELLED'],
  PAID: ['SHIPPED', 'CANCELLED'],
  FAILED: ['PAID', 'CANCELLED'],
  CANCELLED: [],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
};

export type ListParams = {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
};

export async function listOrders(params: ListParams) {
  const page = Math.max(1, Number(params.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(params.limit ?? 20)));
  const skip = (page - 1) * limit;

  const where: Prisma.OrderWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.search
      ? {
          OR: [
            { id: { contains: params.search, mode: "insensitive" } },
            { customerEmail: { contains: params.search, mode: "insensitive" } },
            { customerName: { contains: params.search, mode: "insensitive" } },
            { customerLastName: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: limit,
      select: {
        id: true,
        status: true,
        createdAt: true,
        total: true,
        currency: true,
        customerEmail: true,
        customerName: true,
        customerLastName: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map((o) => ({ ...o, itemCount: o._count.items })),
    total,
  };
}

export async function getOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { items: true, user: true },
  });
}

export async function updateStatus(id: string, status: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new Error("Order not found");

  if (!allowedNext[order.status]?.includes(status)) {
    throw new Error(`Invalid transition from ${order.status} to ${status}`);
  }

  return prisma.order.update({
    where: { id },
    data: { status },
    include: { items: true },
  });
}

export async function createShipment(
  id: string,
  data: { carrier: string; trackingNumber: string }
) {
  const order = await prisma.order.update({
    where: { id },
    data: {
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
      shippedAt: new Date(),
      status: "SHIPPED",
    },
    include: { 
      items: { 
        include: { product: true } 
      } 
    },
  });

  await Promise.all([
    sendCustomerShipment(order),
    sendAdminNewShipment(order)
  ]);

  return order;
}