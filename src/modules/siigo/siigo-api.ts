import axios from "axios";
import { getSiigoToken } from "./siigo-auth";

export const siigoApi = axios.create({
  baseURL: "https://api.siigo.com/v1",
  headers: {
    "Content-Type": "application/json",
    "Partner-Id": process.env.SIIGO_PARTNER_ID!,
  },
});


siigoApi.interceptors.request.use(async (config) => {
  const token = await getSiigoToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
