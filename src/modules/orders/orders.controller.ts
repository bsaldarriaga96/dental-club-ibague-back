import type { RequestHandler } from "express";
import { createOrder, getMyOrderById, getMyOrders } from "./orders.service";
import { prisma } from "../../lib/prisma";

export const createOrderController: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id ?? null;
    const order = await createOrder({ userId, ...req.body });
    return res.json(order);
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err.message ?? "Error creando orden" });
  }
};

export const getOrderByReferenceController: RequestHandler = async (
  req,
  res,
) => {
  const reference = String(req.params.reference ?? "");
  if (!reference)
    return res.status(400).json({ message: "reference es requerido" });

  const order = await prisma.order.findUnique({
    where: { paymentReference: reference },
    select: {
      id: true,
      status: true,
      paymentStatusDetail: true,
      total: true,
      currency: true,
      createdAt: true,
    },
  });

  if (!order) return res.status(404).json({ message: "Order not found" });
  return res.json(order);
};


export const listOrdersController: RequestHandler = async (req, res) => {
  const customerEmail = String(req.query.customerEmail ?? "")
    .trim()
    .toLowerCase();
  if (!customerEmail) {
    return res.status(400).json({ message: "customerEmail es requerido" });
  }

  const orders = await prisma.order.findMany({
    where: { customerEmail },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      total: true,
      currency: true,
      items: {
        select: { productId: true, name: true, image: true },
      },
    },
  });

  return res.json(
    orders.map((o) => ({
      id: o.id,
      status: o.status,
      createdAt: o.createdAt,
      total: String(o.total),
      currency: o.currency,
      items: o.items.map((it) => ({
        productId: it.productId,
        name: it.name,
        image: it.image ?? null,
      })),
    })),
  );
};

export const getMyOrdersController: RequestHandler = async (req, res) => {
  try {
    const userId = req.session.userId!;
    const orders = await getMyOrders(userId);
    return res.json({ orders });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message ?? "Error cargando pedidos" });
  }
};

export const getMyOrderByIdController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.session.userId!;
    const orderId = String(req.params.orderId ?? "").trim();
    if (!orderId) return res.status(400).json({ message: "orderId es requerido" });

    const order = await getMyOrderById({ userId, orderId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    return res.json({ order });
  } catch (err) {
    next(err);
  }
};
