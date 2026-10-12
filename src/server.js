import { fileURLToPath } from "node:url";
import express from "express";
import { add } from "./calc.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/add", (req, res) => {
  const a = Number(req.query.a);
  const b = Number(req.query.b);

  if (Number.isNaN(a) || Number.isNaN(b)) {
    res.status(400).json({ error: "Parameter a dan b harus angka" });
    return;
  }

  res.json({ result: add(a, b) });
});

export { app };

// Hanya listen saat dijalankan langsung (npm start), bukan saat di-import test.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`Server jalan di http://localhost:${PORT}`);
  });
}
