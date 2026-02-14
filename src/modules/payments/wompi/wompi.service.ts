import crypto from "crypto";

// ----- Widget integrity (frontend widget) -----
// sha256(reference + amountInCents + currency + integritySecret) [webhook no usa esto] [web:473]
export function buildIntegritySignature(params: {
  reference: string;
  amountInCents: number;
  currency: "COP";
  integritySecret: string;
}) {
  const { reference, amountInCents, currency, integritySecret } = params;
  const raw = `${reference}${amountInCents}${currency}${integritySecret}`;
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}

// ----- Webhook checksum (eventos) -----
function getByPath(obj: any, path: string) {
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

// Valida x-event-checksum usando payload.signature.properties y WOMPI_WEBHOOK_SECRET [web:382]
export function validateWompiEventChecksum(payload: any, webhookSecret: string, headerChecksum?: string) {
  const checksumFromBody: string | undefined = payload?.signature?.checksum;
  const props: string[] | undefined = payload?.signature?.properties;

  if (!checksumFromBody || !Array.isArray(props) || props.length === 0) {
    return { ok: false as const, reason: "Missing signature fields" as const };
  }

  const values = props.map((p) => {
    const v = getByPath(payload, `data.${p}`);
    return v === undefined || v === null ? "" : String(v);
  });

  const concatenated = values.join("");

  console.log("Wompi props:", props);
console.log("Wompi values:", values);
console.log("Wompi concatenated:", concatenated);
console.log("Header checksum:", headerChecksum);
console.log("Body checksum:", checksumFromBody);

  const computed = crypto.createHmac("sha256", webhookSecret).update(concatenated, "utf8").digest("hex");

  if (headerChecksum && headerChecksum !== checksumFromBody) {
    return { ok: false as const, reason: "Header checksum != body checksum" as const, computed, checksumFromBody };
  }

  if (computed !== checksumFromBody) {
    return { ok: false as const, reason: "Checksum mismatch" as const, computed, checksumFromBody };
  }

  return { ok: true as const };
}
