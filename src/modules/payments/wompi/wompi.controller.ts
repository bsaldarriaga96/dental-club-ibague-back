import type { RequestHandler } from "express";
import { buildIntegritySignature } from "./wompi.service";
import { createOrder } from "../../orders/orders.service";

export const initCheckout: RequestHandler = async (req, res) => {
  try {
    const publicKey = process.env.WOMPI_PUBLIC_KEY;
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;

    if (!publicKey || publicKey.includes("xxx")) {
      return res.status(500).json({ message: "WOMPI_PUBLIC_KEY inválida (revisa .env y reinicia el server)" });
    }
    if (!integritySecret) {
      return res.status(500).json({ message: "Falta WOMPI_INTEGRITY_SECRET" });
    }

    // 1) Crear orden real en BD (guest por ahora)
    const order = await createOrder({
      userId: req.user?.id ?? null,
      ...req.body, // aquí van customer*, ship*, items[]
    });

    // 2) Datos widget
    const currency = "COP" as const;
    const reference = order.paymentReference!;
    const amountInCents = Math.round(Number(order.total) * 100);

    const signature = buildIntegritySignature({
      reference,
      amountInCents,
      currency,
      integritySecret,
    });

    // 3) Respuesta para el front
    return res.json({
      orderId: order.id,
      publicKey,
      currency,
      amountInCents,
      reference,
      signature,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Error iniciando checkout" });
  }
};
