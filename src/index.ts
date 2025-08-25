import app from "./app.js";
import { startDiskMonitor } from "./services/diskMonitor.js";

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const DISK_CHECH_INTERVAL_MINUTES = 10;

startDiskMonitor("./data", DISK_CHECH_INTERVAL_MINUTES * 60 * 1000);
