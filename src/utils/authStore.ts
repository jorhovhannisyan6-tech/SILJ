export type UserRole = 'agent'|'underwriter'|'manager'|'auditor'|'admin';
export type PortalUser = { id:string; username:string; name:string; email:string; role:UserRole; status:'active'|'pending'|'disabled'; createdAt:string; lastLogin?:string };
const USER_KEY='sil-auth-user-v2';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Ադմին (Admin)',
  underwriter: 'Անդեռռայթեր (Underwriter)',
  manager: 'Մենեջեր (Manager)',
  agent: 'Գործակալ (Agent)',
  auditor: 'Աուդիտոր (Auditor)',
};

const DEFAULT_ADMIN: PortalUser = {
  id: 'usr-admin-01',
  username: 'Admin',
  name: 'Գլխավոր Ադմինիստրատոր',
  email: 'admin@sil.am',
  role: 'admin',
  status: 'active',
  createdAt: new Date().toISOString(),
};

export function getCurrentUser(): PortalUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.username || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: PortalUser | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('sil-auth-changed'));
}

export function can(user: PortalUser | null, permission: string) {
  if (!user || user.status !== 'active') return false;

  // Admin has access to everything
  if (user.role === 'admin') return true;

  // Agent (Standard) permissions
  const agentPermissions = ['dashboard', 'quotes', 'ai'];
  
  // Underwriter permissions (approves quotes, views analytics, approvals)
  const underwriterPermissions = ['dashboard', 'quotes', 'approvals', 'analytics', 'ai'];

  // Manager permissions
  const managerPermissions = ['dashboard', 'quotes', 'users', 'approvals', 'analytics', 'audit', 'ai'];
  
  if (user.role === 'underwriter') return underwriterPermissions.includes(permission);
  if (user.role === 'manager') return managerPermissions.includes(permission);
  if (user.role === 'auditor') return ['audit', 'dashboard'].includes(permission);

  // Default to agent
  return agentPermissions.includes(permission);
}

