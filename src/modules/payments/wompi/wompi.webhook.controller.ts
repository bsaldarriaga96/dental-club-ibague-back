import type { RequestHandler } from "express";
import { markOrderPaid, markOrderFailed } from "../../orders/orders.service";
import { prisma } from "../../../lib/prisma";

export const wompiWebhookController: RequestHandler = async (req, res) => {

  try {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body ?? {}));

    const payload = JSON.parse(rawBody.toString("utf8"));

    const tx = payload?.data?.transaction;
    const transactionId: string | undefined = tx?.id;
    const referenceFromEvent: string | undefined = tx?.reference;

    if (!transactionId)
      return res.status(400).json({ message: "Missing transaction.id" });
    if (!referenceFromEvent)
      return res.status(400).json({ message: "Missing transaction.reference" });

    // 1) Buscar orden por reference
    const order = await prisma.order.findUnique({
      where: { paymentReference: referenceFromEvent },
      select: {
        id: true,
        status: true,
        total: true,
        currency: true,
        wompiTransactionId: true,
      },
    });

    if (!order) {
      console.warn("Order not found for reference:", referenceFromEvent);
      return res.status(200).json({ ok: true });
    }

    // Idempotencia
    if (order.status === "PAID" || order.status === "FAILED") {
      return res.status(200).json({ ok: true });
    }

    // 2) Tomar datos del evento (ya vienen en el webhook)
    const status: string | undefined = tx?.status;
    const amountInCents: number | undefined = tx?.amount_in_cents;
    const currency: string | undefined = tx?.currency;
    const referenceFromApi: string | undefined = tx?.reference;

    // 3) Validaciones
    if (!status) {
      console.warn("[WH] Missing transaction.status", {
        referenceFromEvent,
        transactionId,
      });
      return res.status(200).json({ ok: true });
    }

    if (amountInCents == null) {
      console.warn("[WH] Missing transaction.amount_in_cents", {
        referenceFromEvent,
        transactionId,
      });
      return res.status(200).json({ ok: true });
    }

    if (referenceFromApi && referenceFromApi !== referenceFromEvent) {
      console.warn("[WH] Reference mismatch", {
        referenceFromEvent,
        referenceFromApi,
        transactionId,
      });
      return res.status(200).json({ ok: true });
    }

    const expectedAmountInCents = Math.round(Number(order.total) * 100);
    if (Number(amountInCents) !== expectedAmountInCents) {
      console.warn("[WH] Amount mismatch", {
        referenceFromEvent,
        amountInCents,
        expectedAmountInCents,
        orderTotal: order.total,
        transactionId,
      });
      return res.status(200).json({ ok: true });
    }

    if (currency && currency !== order.currency) {
      console.warn("[WH] Currency mismatch", {
        referenceFromEvent,
        currency,
        orderCurrency: order.currency,
        transactionId,
      });
      return res.status(200).json({ ok: true });
    }

    if (
      order.wompiTransactionId &&
      order.wompiTransactionId !== transactionId
    ) {
      console.warn("[WH] TransactionId mismatch for order", {
        referenceFromEvent,
        existing: order.wompiTransactionId,
        incoming: transactionId,
      });
      return res.status(200).json({ ok: true });
    }

    // 4) Update
    if (status === "APPROVED") {
      await markOrderPaid({
        paymentReference: referenceFromEvent,
        wompiTransactionId: transactionId,
        detail: status,
      });
    } else if (
      status === "DECLINED" ||
      status === "ERROR" ||
      status === "FAILED"
    ) {
      await markOrderFailed({
        paymentReference: referenceFromEvent,
        wompiTransactionId: transactionId,
        detail: status,
      });
    } else {
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(200).json({ ok: true });
  }
};
