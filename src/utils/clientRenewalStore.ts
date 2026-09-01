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

export function addClientRenewal(lead: Omit<ClientRenewalLead, "id" | "createdAt">): ClientRenewalLead {
  const current = getClientRenewals();
  const newLead: ClientRenewalLead = {
    ...lead,
    id: `lead-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newLead, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sil-lead-updated"));
  }
  return newLead;
}

export function updateClientRenewalStatus(id: string, status: ClientRenewalLead["status"]): void {
  const current = getClientRenewals();
  const updated = current.map((item) => (item.id === id ? { ...item, status } : item));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sil-lead-updated"));
  }
}
