import axios from "axios";

let token: string | null = null;
let tokenExpiresAt: number | null = null;

export async function getSiigoToken(): Promise<string> {
  if (token && tokenExpiresAt && tokenExpiresAt > Date.now()) {
    return token;
  }

  const { data } = await axios.post(
    "https://api.siigo.com/auth",
    {
      username: process.env.SIIGO_USERNAME,
      access_key: process.env.SIIGO_ACCESS_KEY,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Partner-Id": process.env.SIIGO_PARTNER_ID!,
      },
    }
  );

  token = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  return token!;
}
