import rateLimit from "express-rate-limit";
import type { Request } from "express";

export const ipUploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many uploads, please wait a moment" },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip || "unknown",
});

export const tokenUploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many uploads for this table, please wait a moment" },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => (req.params as { token?: string }).token || "unknown",
});
