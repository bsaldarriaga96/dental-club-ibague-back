import { Request, Response } from "express";
import * as service from "./addresses.service";

export async function list(req: Request, res: Response) {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const data = await service.listByUser(userId);
  res.json(data);
}

export async function create(req: Request, res: Response) {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const created = await service.create(userId, req.body);
  res.status(201).json(created);
}

export async function update(req: Request, res: Response) {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const rawId = req.params.id;
  if (!rawId || Array.isArray(rawId)) {
    return res.status(400).json({ message: "Invalid address id" });
  }

  const updated = await service.update(userId, rawId, req.body);
  return res.json(updated);
}

export async function remove(req: Request, res: Response) {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const rawId = req.params.id;
  if (!rawId || Array.isArray(rawId)) {
    return res.status(400).json({ message: "Invalid address id" });
  }

  await service.remove(userId, rawId);
  return res.status(204).send();
}
