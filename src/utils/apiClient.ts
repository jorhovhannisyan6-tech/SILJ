/**
 * Safe JSON fetch utility for SIL Insurance Quotation Portal.
 * Prevents "Unexpected token '<', '<!doctype '... is not valid JSON" errors
 * by validating response content-type before parsing and gracefully handling HTML error pages.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        const data = await res.json();
        if (res.ok) {
          return { ok: true, status: res.status, data, error: null };
        }
        const errMsg = data?.error || data?.message || `HTTP ${res.status}`;
        return { ok: false, status: res.status, data, error: errMsg };
      } catch (parseErr: any) {
        console.warn(`JSON parse error from ${String(input)}:`, parseErr);
        return { ok: false, status: res.status, data: null, error: "Անվավեր JSON պատասխան սերվերից" };
      }
    }

    // Response is not JSON (e.g. HTML 502/404/500 or plain text)
    const text = await res.text().catch(() => "");
    const cleanError = text.trim().startsWith("<")
      ? `Սերվերի սխալ (HTTP ${res.status})`
      : text.slice(0, 200) || `HTTP ${res.status}`;

    return {
      ok: res.ok,
      status: res.status,
      data: null,
      error: res.ok ? null : cleanError,
    };
  } catch (err: any) {
    console.warn(`Fetch error for ${String(input)}:`, err);
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || "Ցանցային միացման սխալ",
    };
  }
}

/**
 * Safely parse JSON with fallback without throwing syntax errors.
 */
export function safeJsonParse<T = any>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch (err) {
    console.warn("safeJsonParse failed to parse string:", err);
    return fallback;
  }
}
