import type { Role } from "./types";

export const roleLabel: Record<Role, string> = {
  CENTRAL_ADMIN: "مدير مركزي",
  SECTOR_MANAGER: "مدير قطاع",
  REGISTRAR: "موظف سجل",
  ANALYST: "محلل",
};

export function genderText(gender: string) {
  return gender === "FEMALE" ? "أنثى" : "ذكر";
}

export function lifeText(status: string, gender: string) {
  const female = gender === "FEMALE";
  if (status === "DECEASED") return female ? "متوفاة" : "متوفى";
  return female ? "حية" : "حي";
}

export function maritalText(status: string, gender: string) {
  const female = gender === "FEMALE";
  const labels: Record<string, [string, string]> = {
    SINGLE: ["أعزب", "عزباء"],
    MARRIED: ["متزوج", "متزوجة"],
    DIVORCED: ["مطلق", "مطلقة"],
    WIDOWED: ["أرمل", "أرملة"],
  };
  const pair = labels[status] ?? [status, status];
  return female ? pair[1] : pair[0];
}

export function relationText(relation: string, gender: string) {
  if (relation === "HEAD") return "رب الأسرة";
  if (relation === "SPOUSE") return gender === "FEMALE" ? "زوجة" : "زوج";
  if (relation === "CHILD") return gender === "FEMALE" ? "ابنة" : "ابن";
  return relation;
}

export function marriageStatusText(status: string) {
  if (status === "ACTIVE") return "قائم";
  if (status === "DIVORCED") return "منتهٍ بالطلاق";
  if (status === "WIDOWED") return "منتهٍ بالوفاة";
  return status;
}

export function cardStatusText(status: string) {
  return status === "ACTIVE" ? "سارية" : "ملغاة";
}

export function cancelReasonText(reason: string | null) {
  if (reason === "DEATH") return "وفاة";
  if (reason === "RENEWAL") return "تجديد";
  if (reason === "MANUAL") return "إلغاء إداري";
  return "—";
}
