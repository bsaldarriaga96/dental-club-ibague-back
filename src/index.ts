import "dotenv/config";
import { createApp } from "./app";

const app = createApp();

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
