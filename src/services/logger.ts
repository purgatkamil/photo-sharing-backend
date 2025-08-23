import { prisma } from "./db.js";

export async function logEvent(
  type: string,
  data: Record<string, any>,
  tableId?: number
) {
  try {
    await prisma.eventLog.create({
      data: {
        type,
        data,
        ...(tableId ? { table: { connect: { id: tableId } } } : {}),
      },
    });
  } catch (e) {
    console.error("logEvent error", e);
  }
}
