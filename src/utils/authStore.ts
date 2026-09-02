export type UserRole = 'agent'|'underwriter'|'manager'|'auditor'|'admin';
export type PortalUser = { id:string; username:string; name:string; email:string; role:UserRole; status:'active'|'pending'|'disabled'; createdAt:string; lastLogin?:string };
const USER_KEY='sil-auth-user-v2';
export function getCurrentUser(): PortalUser|null { try { const raw=localStorage.getItem(USER_KEY); return raw?JSON.parse(raw):null; } catch{return null;} }
export function setCurrentUser(user:PortalUser|null){ if(user)localStorage.setItem(USER_KEY,JSON.stringify(user)); else localStorage.removeItem(USER_KEY); window.dispatchEvent(new Event('sil-auth-changed')); }
export function can(user: PortalUser | null, permission: string) {
  if (!user || user.status !== 'active') return false;

  // Admin has access to everything
  if (user.role === 'admin') return true;

  // Agent (Standard) permissions
  const agentPermissions = ['dashboard', 'quotes', 'ai'];
  
  // Underwriter permissions (approves quotes, views analytics)
  const underwriterPermissions = ['dashboard', 'quotes', 'approvals', 'analytics'];

  // Manager permissions
  const managerPermissions = ['dashboard', 'quotes', 'users', 'approvals', 'analytics', 'audit'];
  
  if (user.role === 'underwriter') return underwriterPermissions.includes(permission);
  if (user.role === 'manager') return managerPermissions.includes(permission);
  if (user.role === 'auditor') return ['audit', 'dashboard'].includes(permission);

  // Default to agent
  return agentPermissions.includes(permission);
}
