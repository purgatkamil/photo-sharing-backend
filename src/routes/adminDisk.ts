import { Router } from "express";
import { getDiskUsage } from "../services/diskMonitor.js";

const router = Router();

router.get("/disk", async (req, res) => {
  const q = typeof req.query.path === "string" ? req.query.path.trim() : "";
  const path =
    q ||
    process.env.DATA_DIR ||
    "./data";

  try {
    const stats = getDiskUsage(path);

    res.json({
      ok: true,
      path,
      total: { MB: stats.totalMB },
      used: { MB: stats.usedMB },
      free: { MB: stats.freeMB },
      usedPct: stats.percent,
      ts: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: "DISK_CHECK_FAILED",
      message: err?.message || "Nie udało się pobrać statystyk dysku.",
      path,
      ts: new Date().toISOString(),
    });
  }
});

export default router;
