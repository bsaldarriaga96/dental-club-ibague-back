import { Router } from "express";
import { syncProductsFromSiigo } from "./siigo.sync.service";

const router = Router();

router.post("/siigo", async (_req, res) => {
  try {
    const result = await syncProductsFromSiigo();
    res.json({
      message: "Sincronización completada",
      ...result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error sincronizando Siigo" });
  }
});

export default router;
