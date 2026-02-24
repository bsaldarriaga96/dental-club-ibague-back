import { prisma } from "../../lib/prisma";
import { ORDER_CURRENCY } from "../../constants/order";
import { Prisma } from "@prisma/client";

type CreateOrderItemInput = { productId: string; quantity: number };

export const orderDetailSelect = {
  id: true,
  status: true,
  createdAt: true,

  currency: true,
  subtotal: true,
  shipping: true,
  total: true,

  paymentMethod: true,
  paymentReference: true,
  paymentStatusDetail: true,

  shipDepartment: true,
  shipCity: true,
  shipNeighborhood: true,
  shipAddress: true,
  shipNotes: true,

  items: {
    select: {
      productId: true,
      name: true,
      image: true,
      sku: true,
      unitPrice: true,
      quantity: true,
    },
  },
} satisfies Prisma.OrderSelect;

export type OrderDetail = Prisma.OrderGetPayload<{ select: typeof orderDetailSelect }>;

export async function createOrder(params: {
  userId?: string | null;
  customerName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerDocument?: string | null;
  shipDepartment: string;
  shipCity: string;
  shipNeighborhood: string;
  shipAddress: string;
  shipNotes?: string | null;
  items: CreateOrderItemInput[];
}) {
  const productIds = params.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  const byId = new Map(products.map((p) => [p.id, p]));
  const items = params.items.map((i) => {
    const p = byId.get(i.productId);
    if (!p) throw new Error(`Producto no existe o inactivo: ${i.productId}`);
    return {
      productId: p.id,
      name: p.name,
      sku: p.sku,
      unitPrice: p.price,
      quantity: i.quantity,
    };
  });

  const subtotal = items.reduce(
    (acc, it) => acc + Number(it.unitPrice) * it.quantity,
    0,
  );
  const shipping = 0;
  const total = subtotal + shipping;

  const paymentReference = `ORD-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return prisma.order.create({
    data: {
      status: "PENDING",
      userId: params.userId ?? null,

      customerName: params.customerName,
      customerLastName: params.customerLastName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      customerDocument: params.customerDocument ?? null,

      shipDepartment: params.shipDepartment,
      shipCity: params.shipCity,
      shipNeighborhood: params.shipNeighborhood,
      shipAddress: params.shipAddress,
      shipNotes: params.shipNotes ?? null,

      currency: ORDER_CURRENCY,
      subtotal,
      shipping,
      total,

      paymentReference,
      items: { create: items },
    },
    include: { items: true },
  });
}


export async function getMyOrderById(params: {
  userId: string;
  orderId: string;
}): Promise<OrderDetail | null> {
  return prisma.order.findFirst({
    where: { id: params.orderId, userId: params.userId },
    select: orderDetailSelect,
  });
}


export async function getMyOrders(userId: string): Promise<OrderDetail[]> {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: orderDetailSelect,
  });
}


export async function markOrderPaid(params: {
  paymentReference: string;
  wompiTransactionId?: string | null;
  detail?: string | null;
}) {
  const result = await prisma.order.updateMany({
    where: {
      paymentReference: params.paymentReference,
      status: "PENDING",
    },
    data: {
      status: "PAID",
      wompiTransactionId: params.wompiTransactionId ?? undefined,
      paymentStatusDetail: params.detail ?? undefined,
    },
  });

  return result;
}

export async function markOrderFailed(params: {
  paymentReference: string;
  wompiTransactionId?: string | null;
  detail?: string | null;
}) {
  const result = await prisma.order.updateMany({
    where: {
      paymentReference: params.paymentReference,
      status: "PENDING",
    },
    data: {
      status: "FAILED",
      wompiTransactionId: params.wompiTransactionId ?? undefined,
      paymentStatusDetail: params.detail ?? undefined,
    },
  });

  return result;
}
