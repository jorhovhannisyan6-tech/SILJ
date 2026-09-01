export type AuditEvent = {
  id: string;
  userId?: string;
  username?: string;
  at: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
};

const AUDIT_KEY = "sil-audit-log-v1";
const RULE_VERSION_KEY = "sil-rules-version-v1";

export function getAuditLog(): AuditEvent[] {
  try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]"); } catch { return []; }
}

export function addAuditEvent(event: Omit<AuditEvent, "id" | "at" | "userId" | "username">) {
  let actor:any=null; try { actor=JSON.parse(localStorage.getItem("sil-auth-user-v2")||"null"); } catch {}
  const next = [{ ...event, userId: actor?.id, username: actor?.username, id: crypto.randomUUID?.() || `audit-${Date.now()}-${Math.random()}`, at: new Date().toISOString() }, ...getAuditLog()].slice(0, 1000);
  localStorage.setItem(AUDIT_KEY, JSON.stringify(next));
  return next[0];
}

export function getRulesVersion() { return localStorage.getItem(RULE_VERSION_KEY) || "2026.08.1"; }

export function publishRules() {
  const current = getRulesVersion().split(".").map(Number);
  const next = `${current[0] || 2026}.${current[1] || 8}.${(current[2] || 0) + 1}`;
  localStorage.setItem(RULE_VERSION_KEY, next);
  addAuditEvent({ action: "rules.publish", entity: "quotation-rules", details: { version: next } });
  return next;
}
