import { AppError } from "./errors";
import type { Role, SessionUser } from "./types";

const WRITERS = new Set<Role>(["CENTRAL_ADMIN", "SECTOR_MANAGER", "REGISTRAR"]);

export function isGlobal(user: SessionUser) {
  return user.role === "CENTRAL_ADMIN" || (user.role === "ANALYST" && !user.sectorId);
}

export function sectorWhere(user: SessionUser) {
  if (isGlobal(user)) return {};
  return { sectorId: user.sectorId ?? "___none___" };
}

export function assertSector(user: SessionUser, sectorId: string) {
  if (isGlobal(user)) return;
  if (user.sectorId !== sectorId) {
    throw new AppError("لا يمكنك الوصول إلى سجلات قطاع آخر", 403);
  }
}

export function canWrite(user: SessionUser) {
  return WRITERS.has(user.role);
}

export function assertWriter(user: SessionUser) {
  if (!canWrite(user)) {
    throw new AppError("ليس لديك صلاحية تسجيل المعاملات", 403);
  }
}

export function actingSector(user: SessionUser, requested?: string | null) {
  assertWriter(user);
  if (user.role === "CENTRAL_ADMIN") {
    if (!requested) throw new AppError("حدد القطاع الذي ستصدر عنه الوثيقة");
    return requested;
  }
  if (!user.sectorId) throw new AppError("الحساب غير مرتبط بقطاع");
  return user.sectorId;
}

export function canIssueIdentity(user: SessionUser) {
  return user.role === "CENTRAL_ADMIN" || user.role === "SECTOR_MANAGER";
}

export function assertIssuer(user: SessionUser) {
  if (!canIssueIdentity(user)) {
    throw new AppError("إصدار الهوية من صلاحية مدير القطاع أو الإدارة المركزية", 403);
  }
}

export function canManageUsers(user: SessionUser) {
  return user.role === "CENTRAL_ADMIN" || user.role === "SECTOR_MANAGER";
}

export function assertTransfer(user: SessionUser) {
  if (user.role !== "CENTRAL_ADMIN") {
    throw new AppError("نقل الإقامة من صلاحية الإدارة المركزية", 403);
  }
}

export function assertCentral(user: SessionUser) {
  if (user.role !== "CENTRAL_ADMIN") {
    throw new AppError("هذه العملية للإدارة المركزية فقط", 403);
  }
}
