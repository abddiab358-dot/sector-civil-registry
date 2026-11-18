import { prisma } from "./prisma";
import type { SessionUser } from "./types";

export async function writeAudit(entry: {
  user: SessionUser;
  sectorId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
}) {
  await prisma.auditLog.create({
    data: {
      userId: entry.user.id,
      sectorId: entry.sectorId ?? entry.user.sectorId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      summary: entry.summary,
    },
  });
}
