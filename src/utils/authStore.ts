export type UserRole = 'agent'|'underwriter'|'manager'|'auditor'|'admin';
export type PortalUser = { id:string; username:string; name:string; email:string; role:UserRole; status:'active'|'pending'|'disabled'; createdAt:string; lastLogin?:string };
const USER_KEY='sil-auth-user-v2';
export function getCurrentUser(): PortalUser|null { try { const raw=localStorage.getItem(USER_KEY); return raw?JSON.parse(raw):null; } catch{return null;} }
export function setCurrentUser(user:PortalUser|null){ if(user)localStorage.setItem(USER_KEY,JSON.stringify(user)); else localStorage.removeItem(USER_KEY); window.dispatchEvent(new Event('sil-auth-changed')); }
export function can(user:PortalUser|null, permission:string){ if(!user||user.status!=='active')return false; const all=['dashboard','quotes','ai','audit','users','approvals','rules','templates','security','analytics','settings']; if(permission==='audit') return ['auditor','manager','admin'].includes(user.role); if(permission==='users'||permission==='approvals') return ['manager','admin'].includes(user.role); if(['rules','templates','security','settings'].includes(permission)) return user.role==='admin'; return all.includes(permission); }
