export const ROLES = ["CENTRAL_ADMIN", "SECTOR_MANAGER", "REGISTRAR", "ANALYST"] as const;

export type Role = (typeof ROLES)[number];

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  sectorId: string | null;
  sectorName: string | null;
  sectorCode: string | null;
};
