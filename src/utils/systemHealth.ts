export type HealthCheck = { key: string; label: string; status: "ok" | "warn" | "error"; detail: string };

export async function runSystemHealthCheck(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];
  const add = (key: string, label: string, status: HealthCheck["status"], detail: string) => checks.push({ key, label, status, detail });

  try {
    const raw = localStorage.getItem("sil-quote-history");
    JSON.parse(raw || "[]");
    add("storage", "Տեղային տվյալների պահպանում", "ok", "localStorage-ը հասանելի է և JSON տվյալները ընթեռնելի են։");
  } catch {
    add("storage", "Տեղային տվյալների պահպանում", "error", "localStorage/JSON տվյալների ստուգումը ձախողվեց։");
  }

  try {
    const res = await fetch("/api/health", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    add("api", "Backend API", "ok", `API հասանելի է։ Knowledge base՝ ${data.knowledgeBaseDocuments ?? 0} փաստաթուղթ։`);
    add("gemini", "Gemini Agent", Array.isArray(data.geminiModels) && (data.geminiModels.includes("gemini-3.5-flash-lite") || data.geminiModels.includes("gemini-3.6-flash")) ? "ok" : "warn", Array.isArray(data.geminiModels) ? data.geminiModels.join(", ") : "Մոդելի տվյալը հասանելի չէ։");
  } catch {
    add("api", "Backend API", "error", "Backend API-ն հասանելի չէ։ Ստուգեք server/deployment կարգավորումները։");
    add("gemini", "Gemini Agent", "warn", "Gemini-ի կապը հնարավոր չէ ստուգել, քանի դեռ backend-ը հասանելի չէ։");
  }

  const current = localStorage.getItem("sil-rules-version-v1") || "2026.08.1";
  add("rules", "Production rules", "ok", `Գործող կանոնների version՝ ${current}։`);

  const draft = localStorage.getItem("sil-quotation-rules-draft-v3");
  add("draft", "TEST/DRAFT rules", draft ? "ok" : "warn", draft ? "Կա պահպանված draft տարբերակ։" : "Draft դեռ պահպանված չէ։");

  const lastUiError = localStorage.getItem("sil-last-ui-error");
  add("ui-error", "Վերջին UI սխալ", lastUiError ? "warn" : "ok", lastUiError ? "Հայտնաբերվել է վերջին runtime սխալի գրառում։" : "Վերջին UI սխալ չի գրանցվել։");

  return checks;
}
