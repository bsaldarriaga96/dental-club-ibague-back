import axios from "axios";

const WOMPI_BASE = process.env.WOMPI_ENV === "production"
  ? "https://production.wompi.co/v1"
  : "https://api-sandbox.wompi.co/v1";

export async function getWompiTransactionById(transactionId: string) {
  const privateKey = process.env.WOMPI_PRIVATE_KEY;
  if (!privateKey) throw new Error("Falta WOMPI_PRIVATE_KEY");

  // Wompi API suele autenticarse con Bearer <privateKey> (si tu cuenta exige OAuth, lo ajustamos)
  const { data } = await axios.get(`${WOMPI_BASE}/transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${privateKey}` },
  });

  return data;
}
