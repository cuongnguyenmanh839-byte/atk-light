// Since SQLite doesn't support enums, we define these as string literal types
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'VIEWER';
export type UserStatus = 'ACTIVE' | 'LOCKED' | 'DISABLED';
export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'ERROR';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export const ROLE_LEVEL: Record<Role, number> = {
  VIEWER: 1, OPERATOR: 2, ADMIN: 3, SUPER_ADMIN: 4,
};

export function hasRoleLevel(userRole: Role, minRole: Role): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[minRole];
}
