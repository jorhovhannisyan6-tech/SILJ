export interface ClientRenewalLead {
  id: string;
  clientName: string;
  phone: string;
  email?: string;
  productType: "casco" | "property" | "mortgage" | "health" | "travel";
  policyNumber: string;
  expiryDate: string;
  estimatedPremium: number;
  status: "pending" | "contacted" | "quote_sent" | "closed";
  lastContactedDate: string;
  notes?: string;
  vehicleOrPropertyDetails?: string;
  createdAt: string;
}

const STORAGE_KEY = "sil-express-client-leads";

export const INITIAL_LEADS: ClientRenewalLead[] = [
  {
    id: "lead-101",
    clientName: "Արթուր Հարությունյան",
    phone: "+374 91 44-55-66",
    email: "artur@gmail.com",
    productType: "casco",
    policyNumber: "CASCO-2026-901",
    expiryDate: "2026-09-15",
    estimatedPremium: 220000,
    status: "pending",
    lastContactedDate: "2026-08-27",
    notes: "✨ [Արագ Հայտ] Toyota RAV4 (2022թ.), Շուկայական՝ $24,000",
    vehicleOrPropertyDetails: "Toyota RAV4 2022",
    createdAt: "2026-08-27T10:30:00Z",
  },
  {
    id: "lead-102",
    clientName: "Աննա Սարգսյան",
    phone: "+374 77 12-34-56",
    email: "anna.s@mail.ru",
    productType: "property",
    policyNumber: "PROP-2026-442",
    expiryDate: "2026-09-20",
    estimatedPremium: 145000,
    status: "contacted",
    lastContactedDate: "2026-08-26",
    notes: "✨ [Արագ Հայտ] Բնակարան Կենտրոնում, 110 քմ, Լյուքս",
    vehicleOrPropertyDetails: "Բնակարան Կենտրոն, 110քմ",
    createdAt: "2026-08-26T14:15:00Z",
  },
];

export async function fetchClientRenewals(): Promise<ClientRenewalLead[]> {
  try {
    const res = await fetch("/api/leads");
    if (res.ok) {
      const data = await res.json();
      if (data.leads && Array.isArray(data.leads)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.leads));
        return data.leads;
      }
    }
  } catch (err) {
    // fallback to localStorage
  }
  return getClientRenewals();
}

export function getClientRenewals(): ClientRenewalLead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LEADS));
      return INITIAL_LEADS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_LEADS;
  }
}

export async function addClientRenewal(lead: Omit<ClientRenewalLead, "id" | "createdAt">): Promise<ClientRenewalLead> {
  const newLeadData = {
    ...lead,
    id: `lead-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.lead) {
        const current = getClientRenewals();
        const updated = [data.lead, ...current.filter(item => item.id !== data.lead.id)];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("sil-lead-updated"));
        }
        return data.lead;
      }
    }
  } catch (err) {
    // fallback local
  }

  const current = getClientRenewals();
  const newLead: ClientRenewalLead = newLeadData;
  const updated = [newLead, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sil-lead-updated"));
  }
  return newLead;
}

export async function updateClientRenewalStatus(id: string, status: ClientRenewalLead["status"]): Promise<void> {
  try {
    await fetch(`/api/leads/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  } catch (err) {
    // ignore
  }

  const current = getClientRenewals();
  const updated = current.map((item) => (item.id === id ? { ...item, status } : item));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sil-lead-updated"));
  }
}

export async function updateClientRenewal(id: string, updatedData: Partial<ClientRenewalLead>): Promise<ClientRenewalLead | null> {
  try {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.lead) {
        const current = getClientRenewals();
        const updated = current.map((item) => (item.id === id ? data.lead : item));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("sil-lead-updated"));
        }
        return data.lead;
      }
    }
  } catch (err) {
    // ignore
  }

  const current = getClientRenewals();
  let resultLead: ClientRenewalLead | null = null;
  const updated = current.map((item) => {
    if (item.id === id) {
      resultLead = { ...item, ...updatedData };
      return resultLead;
    }
    return item;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sil-lead-updated"));
  }
  return resultLead;
}

export async function deleteClientRenewal(id: string): Promise<void> {
  try {
    await fetch(`/api/leads/${id}`, {
      method: "DELETE",
    });
  } catch (err) {
    // ignore
  }

  const current = getClientRenewals();
  const updated = current.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sil-lead-updated"));
  }
}

export async function deleteMultipleClientRenewals(ids: string[]): Promise<void> {
  for (const id of ids) {
    try {
      await fetch(`/api/leads/${id}`, { method: "DELETE" });
    } catch {
      // ignore
    }
  }
  const current = getClientRenewals();
  const idSet = new Set(ids);
  const updated = current.filter((item) => !idSet.has(item.id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sil-lead-updated"));
  }
}

