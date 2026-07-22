import { app } from "./app.js";
import { ensureDefaultCampus } from "./bootstrap/ensureDefaultCampus.js";
const PORT = process.env.PORT || 4000;

async function startServer() {
  await ensureDefaultCampus();

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
