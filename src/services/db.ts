import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

export async function findTableByToken(token: string) {
  return prisma.table.findFirst({ where: { token } });
}

export async function createUpload(data: {
  tableId: number;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
}) {
  return prisma.upload.create({ data });
}

export async function listUploadsByTableId(tableId: number, take = 200) {
  return prisma.upload.findMany({
    where: { tableId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
