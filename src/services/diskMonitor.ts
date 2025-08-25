import { logEvent } from "./logger.js";
import os from "os";
import { execSync } from "child_process";

export function getDiskUsage(path = ".") {
  const out: string[] = execSync(`df -k ${path}`)
    .toString()
    .trim()
    .split("\n");

  if (out.length < 2) {
    throw new Error("Unexpected df output: " + out.join("\n"));
  }

  const line = out[1];
  if (!line) {
    throw new Error("No disk usage line found in df output");
  }

  const parts = line.split(/\s+/);
  if (parts.length < 5) {
    throw new Error("Unexpected df line: " + line);
  }

  const totalKB = parts[1] ? parseInt(parts[1], 10) : 0;
  const usedKB = parts[2] ? parseInt(parts[2], 10) : 0;
  const freeKB = parts[3] ? parseInt(parts[3], 10) : 0;
  const percent = parts[4]
    ? parseInt(parts[4].replace("%", ""), 10)
    : 0;

  return {
    totalMB: Math.round(totalKB / 1024),
    usedMB: Math.round(usedKB / 1024),
    freeMB: Math.round(freeKB / 1024),
    percent,
  };
}

export function startDiskMonitor(path = "./data", intervalMs = 10 * 60 * 1000) {
  setInterval(async () => {
    try {
      const stats = getDiskUsage(path);

      if (stats.percent >= 90 || stats.freeMB < 1024) {
        await logEvent("low_disk_space", stats);
        console.warn("⚠️ Low disk space:", stats);
      }
    } catch (e) {
      console.error("disk monitor error", e);
    }
  }, intervalMs);
}
