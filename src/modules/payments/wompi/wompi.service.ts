import crypto from "crypto";

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

function getByPath(obj: any, path: string) {
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

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

  const computed = crypto.createHmac("sha256", webhookSecret).update(concatenated, "utf8").digest("hex");

  if (headerChecksum && headerChecksum !== checksumFromBody) {
    return { ok: false as const, reason: "Header checksum != body checksum" as const, computed, checksumFromBody };
  }

  if (computed !== checksumFromBody) {
    return { ok: false as const, reason: "Checksum mismatch" as const, computed, checksumFromBody };
  }

  return { ok: true as const };
}
