export type UserRole = 'agent'|'underwriter'|'manager'|'auditor'|'admin';
export type PortalUser = { id:string; username:string; name:string; email:string; role:UserRole; status:'active'|'pending'|'disabled'; createdAt:string; lastLogin?:string };
const USER_KEY='sil-auth-user-v2';

const DEFAULT_USER: PortalUser = {
  id: 'usr-agent-01',
  username: 'agent.sil',
  name: 'Արմեն Ղազարյան',
  email: 'a.ghazaryan@silinsurance.am',
  role: 'agent',
  status: 'active',
  createdAt: new Date().toISOString(),
};

export function getCurrentUser(): PortalUser {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      localStorage.setItem(USER_KEY, JSON.stringify(DEFAULT_USER));
      return DEFAULT_USER;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USER;
  }
}

export function setCurrentUser(user: PortalUser | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('sil-auth-changed'));
}

export function switchRole(role: UserRole) {
  const current = getCurrentUser();
  const updated: PortalUser = {
    ...current,
    role,
    name: role === 'underwriter' ? 'Վահրամ Սարգսյան (Գլխավոր Անդեռռայթեր)' : role === 'admin' ? 'Ադմինիստրատոր (System Admin)' : 'Արմեն Ղազարյան (Ապահովագրական Գործակալ)',
  };
  setCurrentUser(updated);
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

