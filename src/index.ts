import "dotenv/config";
import { createApp } from "./app";

const app = createApp();

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend corriendo en puerto ${PORT}`);
});
