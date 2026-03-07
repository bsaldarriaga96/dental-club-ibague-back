import type { Request, Response } from "express";
import * as service from "./adminOrders.service";
import { OrderStatus } from "@prisma/client";

const ALL_STATUSES = new Set<OrderStatus>([
  "PENDING",
  "PAID",
  "FAILED",
  "CANCELLED",
  "SHIPPED",
  "DELIVERED",
]);

function asString(v: unknown) {
  return typeof v === "string" ? v : undefined;
}

function asInt(v: unknown, fallback: number) {
  const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function listOrders(req: Request, res: Response) {
  const statusRaw = asString(req.query.status);
  const status =
    statusRaw && ALL_STATUSES.has(statusRaw as OrderStatus)
      ? (statusRaw as OrderStatus)
      : undefined;

  const page = Math.max(1, asInt(req.query.page, 1));
  const limit = Math.min(100, Math.max(1, asInt(req.query.limit, 20)));
  const search = asString(req.query.search)?.trim() || undefined;

  const result = await service.listOrders({
    status,
    page,
    limit,
    search,
  });

  return res.json(result);
}

export async function getOrder(req: Request<{ id: string }>, res: Response) {
  const order = await service.getOrder(req.params.id);
  if (!order) return res.status(404).json({ message: "NOT_FOUND" });
  res.json({ order });
}

export async function updateStatus(
  req: Request<{ id: string }>,
  res: Response
) {
  const { status } = req.body;
  const order = await service.updateStatus(req.params.id, status);
  res.json({ order });
}

export async function createShipment(req: Request<{ id: string }>, res: Response) {
  const { carrier, trackingNumber } = req.body as { carrier: string; trackingNumber: string };
  
  if (!carrier?.trim() || !trackingNumber?.trim()) {
    return res.status(400).json({ error: "Carrier y tracking requeridos" });
  }

  const order = await service.createShipment(req.params.id, {
    carrier: carrier.trim(),
    trackingNumber: trackingNumber.trim(),
  });

  res.json({ 
    message: "Guía creada", 
    order 
  });
}
