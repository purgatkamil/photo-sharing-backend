import { prisma } from "../services/db.js";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";

const QR_DIR = path.resolve("data/qr");
fs.mkdirSync(QR_DIR, { recursive: true });

async function main() {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";

  const tableCount = Number(process.env.TABLE_COUNT || 5); // ile stołów tworzymy
  for (let i = 1; i <= tableCount; i++) {
    const token = `table-${i}`;

    // upewnij się, że rekord istnieje w DB
    let table = await prisma.table.findFirst({ where: { token } });
    if (!table) {
      table = await prisma.table.create({
        data: { name: `Stół ${i}`, token },
      });
      console.log(`Utworzono stół ${table.name}`);
    }

    // generujemy QR do uploadu
    const url = `${baseUrl}/upload/${token}`;
    const outPath = path.join(QR_DIR, `${token}.png`);
    await QRCode.toFile(outPath, url, { width: 300 });
    console.log(`Wygenerowano QR dla ${token}: ${outPath}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
