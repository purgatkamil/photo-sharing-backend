import "dotenv/config";
import express from "express";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "up" });
  } catch (e) {
    res.status(500).json({ status: "error", db: "down" });
  }
});

app.get("/tables", async (_req, res) => {
  const tables = await prisma.table.findMany({ include: { _count: { select: { uploads: true } } } });
  res.json(tables);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
