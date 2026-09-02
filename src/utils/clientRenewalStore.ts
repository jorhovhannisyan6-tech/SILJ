export type ProductType = "casco" | "property" | "mortgage" | "health" | "travel" | "liability" | "cargo" | "accident";
export type LeadStatus = "pending" | "quote_sent" | "negotiation" | "closed" | "rejected";
export type VipTier = "Standard" | "Bronze" | "Silver" | "Gold" | "Platinum" | "VIP";
export type ChurnRisk = "low" | "medium" | "high";

export interface ClientRenewalLead {
  id: string;
  clientName: string;
  phone: string;
  email?: string;
  productType: ProductType;
  policyNumber: string;
  expiryDate: string;
  estimatedPremium: number;
  status: LeadStatus;
  lastContactedDate: string;
  notes?: string;
  vehicleOrPropertyDetails?: string;
  attachments?: { url: string; name: string; type: string }[];
  createdAt: string;
  leadScore?: number; // 1 - 100%
  priority?: "low" | "medium" | "high";
  assignedAgent?: string;
  lostReason?: string;
  channelSource?: "web_link" | "phone_call" | "office_visit" | "referral" | "b2b_fleet";
  crossSellRecommended?: string;
}

export interface ClientPolicy {
  id: string;
  clientId: string;
  policyNumber: string;
  productType: ProductType;
  status: "active" | "expiring_soon" | "expired" | "renewed";
  startDate: string;
  expiryDate: string;
  premium: number;
  sumInsured: number;
  assetDescription: string;
  paymentFrequency: "single" | "semi_annual" | "quarterly" | "monthly";
  nextPaymentDate?: string;
  nextPaymentAmount?: number;
  paymentStatus: "paid" | "due_soon" | "overdue";
}

export interface ClientClaim {
  id: string;
  clientId: string;
  policyNumber: string;
  incidentDate: string;
  reportDate: string;
  claimType: string;
  claimedAmount: number;
  paidAmount: number;
  status: "reported" | "in_review" | "approved" | "settled" | "rejected";
  description: string;
}

export interface ClientTask {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  dueDate: string;
  type: "call" | "meeting" | "email" | "document_request" | "renewal";
  priority: "low" | "medium" | "high";
  completed: boolean;
  notes?: string;
}

export interface ClientVaultDocument {
  id: string;
  clientId: string;
  name: string;
  type: "passport" | "tech_passport" | "driver_license" | "property_cert" | "contract" | "claim_act" | "other";
  fileUrl?: string;
  uploadDate: string;
  validUntil?: string;
  status: "valid" | "expiring" | "expired";
}

export interface ClientProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  clientType: "individual" | "legal_entity";
  taxIdOrSsn?: string; // ՀՎՀՀ կամ ՀԾՀ
  address: string;
  vipTier: VipTier;
  tags: string[];
  ltvAmount: number; // Lifetime Value in AMD
  policiesCount: number;
  churnRisk: ChurnRisk;
  crossSellRecommendations: string[];
  notes: string;
  createdAt: string;
  lastContactedAt: string;
  assignedAgent: string;
  familyOrFleetDetails?: string;
}

const STORAGE_KEY_LEADS = "sil-express-client-leads";
const STORAGE_KEY_CLIENTS = "sil-crm-clients-360";
const STORAGE_KEY_POLICIES = "sil-crm-client-policies";
const STORAGE_KEY_CLAIMS = "sil-crm-client-claims";
const STORAGE_KEY_TASKS = "sil-crm-client-tasks";
const STORAGE_KEY_VAULT = "sil-crm-client-vault";

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
    notes: "✨ [Արագ Հայտ] Toyota RAV4 (2022թ.), Շուկայական՝ $24,000: Հետաքրքրված է 0% ֆրանշիզայով:",
    vehicleOrPropertyDetails: "Toyota RAV4 2022 (VIN: JTMB3REV80D)",
    createdAt: "2026-08-27T10:30:00Z",
    leadScore: 92,
    priority: "high",
    assignedAgent: "Աննա Գրիգորյան",
    channelSource: "web_link",
    crossSellRecommended: "ԱՊՊԱ + Դժբախտ Պատահարներ",
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
    status: "quote_sent",
    lastContactedDate: "2026-08-26",
    notes: "✨ [Արագ Հայտ] Բնակարան Կենտրոնում, 110 քմ, Լյուքս վերանորոգում:",
    vehicleOrPropertyDetails: "Բնակարան Կենտրոն, 110քմ, Տերյան փող.",
    createdAt: "2026-08-26T14:15:00Z",
    leadScore: 78,
    priority: "medium",
    assignedAgent: "Դավիթ Մանուկյան",
    channelSource: "phone_call",
    crossSellRecommended: "Քաղաքացիական Պատասխանատվություն (Ջրալցման Ռիսկ)",
  },
  {
    id: "lead-103",
    clientName: "«ԷԼԻՏ ՏՐԱՆՍ» ՍՊԸ",
    phone: "+374 10 55-66-77",
    email: "logistics@elitetrans.am",
    productType: "cargo",
    policyNumber: "CARGO-2026-112",
    expiryDate: "2026-09-28",
    estimatedPremium: 480000,
    status: "negotiation",
    lastContactedDate: "2026-09-01",
    notes: "Խոշոր բեռնափոխադրում Եվրոպայից Երևան ($150,000 ծավալ): Սպասում է կորպորատիվ սակագնի:",
    vehicleOrPropertyDetails: "Էլեկտրատեխնիկայի խմբաքանակ (Ֆրանսիա - Վրաստան - ՀՀ)",
    createdAt: "2026-09-01T09:00:00Z",
    leadScore: 96,
    priority: "high",
    assignedAgent: "Աննա Գրիգորյան",
    channelSource: "b2b_fleet",
    crossSellRecommended: "CMR Պատասխանատվություն + Ավտոպարկի ԿԱՍԿՈ",
  },
  {
    id: "lead-104",
    clientName: "Տիգրան Պետրոսյան",
    phone: "+374 94 88-99-00",
    email: "tigran.petrosyan@gmail.com",
    productType: "casco",
    policyNumber: "CASCO-2026-304",
    expiryDate: "2026-09-05",
    estimatedPremium: 310000,
    status: "closed",
    lastContactedDate: "2026-09-02",
    notes: "BMW X5 (2021) ԿԱՍԿՈ պայմանագիրը հաջողությամբ կնքվեց 1 տարով:",
    vehicleOrPropertyDetails: "BMW X5 G05 (2021), Շուկայական՝ $48,000",
    createdAt: "2026-08-20T11:20:00Z",
    leadScore: 100,
    priority: "high",
    assignedAgent: "Կարեն Ղազարյան",
    channelSource: "referral",
    crossSellRecommended: "Անձնական Ճամփորդություն (Annual Multi-Trip)",
  }
];

export const INITIAL_CLIENTS: ClientProfile[] = [
  {
    id: "client-1",
    name: "Արմեն Կարապետյան",
    phone: "+374 91 405060",
    email: "armen.karapetyan@gmail.com",
    clientType: "individual",
    taxIdOrSsn: "2804820194",
    address: "ք․ Երևան, Արաբկիր, Կոմիտաս 26, բն․ 14",
    vipTier: "Gold",
    tags: ["VIP Հաճախորդ", "Ավտոսիրահար", "Լավ վճարող", "Առանց վթարների"],
    ltvAmount: 1850000,
    policiesCount: 3,
    churnRisk: "low",
    crossSellRecommendations: ["Բնակարանի Գույքային Ապահովագրություն (-15% զեղչ)", "Առողջության Անհատական Փաթեթ"],
    notes: "Պարտաճանաչ հաճախորդ է 2022 թվականից։ Ունի 2 ավտոմեքենա ընտանիքում։",
    createdAt: "2022-04-10T12:00:00Z",
    lastContactedAt: "2026-08-30T15:30:00Z",
    assignedAgent: "Աննա Գրիգորյան",
    familyOrFleetDetails: "Կինը՝ Լիլիթ Կարապետյան (Toyota Yaris, 2023թ.)",
  },
  {
    id: "client-2",
    name: "«ԷԼԻՏ ԳՐՈՒՊ» ՓԲԸ",
    phone: "+374 10 525354",
    email: "info@elitegroup.am",
    clientType: "legal_entity",
    taxIdOrSsn: "02549301",
    address: "ք․ Երևան, Էրեբունի, Խաղաղ Դոնի 40",
    vipTier: "Platinum",
    tags: ["Կորպորատիվ B2B", "Ավտոպարկ 15+ մեքենա", "Գույքային Փաթեթ", "Խոշոր Հաշիվ"],
    ltvAmount: 14200000,
    policiesCount: 8,
    churnRisk: "low",
    crossSellRecommendations: ["Աշխատակիցների Խմբային Բժշկական Ապահովագրություն (50+ անձ)", "Շինմոնտաժային Ռիսկեր (CAR/EAR)"],
    notes: "Խոշոր շինարարական և արտադրական հոլդինգ։ Կոնտակտային անձ՝ Տնօրեն Գագիկ Դավթյան։",
    createdAt: "2021-09-15T09:00:00Z",
    lastContactedAt: "2026-08-28T11:00:00Z",
    assignedAgent: "Դավիթ Մանուկյան",
    familyOrFleetDetails: "15 միավոր բեռնատար և հատուկ տեխնիկա (MAN, Volvo, JCB)",
  },
  {
    id: "client-3",
    name: "Գոռ Վարդանյան",
    phone: "+374 77 112233",
    email: "gor.vardanyan@mail.ru",
    clientType: "individual",
    taxIdOrSsn: "1908900441",
    address: "ք․ Երևան, Կենտրոն, Տերյան 18/2, բն․ 35",
    vipTier: "Silver",
    tags: ["Հիփոթեք Ամերիաբանկ", "Երիտասարդ Ընտանիք"],
    ltvAmount: 420000,
    policiesCount: 2,
    churnRisk: "medium",
    crossSellRecommendations: ["ԿԱՍԿՈ Ապահովագրություն (-10% զեղչ հիփոթեքառուի համար)", "Դժբախտ Պատահարներ"],
    notes: "Հիփոթեքային պայմանագրի գծով մնացորդը նվազել է, սակագինը վերանայվել է։",
    createdAt: "2024-03-01T10:00:00Z",
    lastContactedAt: "2026-08-22T14:20:00Z",
    assignedAgent: "Կարեն Ղազարյան",
  },
  {
    id: "client-4",
    name: "Սոնա Միքայելյան",
    phone: "+374 93 887766",
    email: "sona.m@gmail.com",
    clientType: "individual",
    taxIdOrSsn: "3105880092",
    address: "ք․ Երևան, Դավթաշեն, 2-րդ թաղ․ 12/4",
    vipTier: "VIP",
    tags: ["VIP Պրեմիում", "Mercedes ԿԱՍԿՈ", "Արտերկրյա Ճամփորդ"],
    ltvAmount: 2650000,
    policiesCount: 4,
    churnRisk: "low",
    crossSellRecommendations: ["Էքսկլյուզիվ Ոսկերչական Իրերի Ապահովագրություն", "Family Travel Worldwide"],
    notes: "2026թ․ երկարաձգումը կատարվել է առանց հապաղման։ Շատ գոհ է սպասարկման որակից։",
    createdAt: "2023-01-18T16:00:00Z",
    lastContactedAt: "2026-09-01T10:15:00Z",
    assignedAgent: "Աննա Գրիգորյան",
  }
];

export const INITIAL_POLICIES: ClientPolicy[] = [
  {
    id: "pol-1",
    clientId: "client-1",
    policyNumber: "SIL-CAS-2025-0412",
    productType: "casco",
    status: "expiring_soon",
    startDate: "2025-09-02",
    expiryDate: "2026-09-15",
    premium: 342000,
    sumInsured: 9500000,
    assetDescription: "Toyota Camry 2.5 (2022 թ., VIN: JTD2022ARM948)",
    paymentFrequency: "semi_annual",
    nextPaymentDate: "2026-09-15",
    nextPaymentAmount: 171000,
    paymentStatus: "due_soon"
  },
  {
    id: "pol-2",
    clientId: "client-1",
    policyNumber: "SIL-MTPL-2026-1002",
    productType: "casco",
    status: "active",
    startDate: "2026-01-10",
    expiryDate: "2027-01-10",
    premium: 42000,
    sumInsured: 33000000,
    assetDescription: "Toyota Camry 2.5 (Պետհամարանիշ՝ 77 XX 777)",
    paymentFrequency: "single",
    paymentStatus: "paid"
  },
  {
    id: "pol-3",
    clientId: "client-2",
    policyNumber: "SIL-PR-2025-0891",
    productType: "property",
    status: "expiring_soon",
    startDate: "2025-09-10",
    expiryDate: "2026-09-20",
    premium: 1125000,
    sumInsured: 320000000,
    assetDescription: "Արտադրական տարածք և սարքավորումներ (ք. Երևան, Էրեբունի 40)",
    paymentFrequency: "quarterly",
    nextPaymentDate: "2026-09-20",
    nextPaymentAmount: 281250,
    paymentStatus: "due_soon"
  },
  {
    id: "pol-4",
    clientId: "client-3",
    policyNumber: "SIL-MRT-2025-1104",
    productType: "mortgage",
    status: "expiring_soon",
    startDate: "2025-09-22",
    expiryDate: "2026-09-22",
    premium: 79800,
    sumInsured: 38000000,
    assetDescription: "Բնակարան Հիփոթեքով (Ամերիաբանկ / Կենտրոն, Տերյան 18/2)",
    paymentFrequency: "single",
    paymentStatus: "paid"
  },
  {
    id: "pol-5",
    clientId: "client-4",
    policyNumber: "SIL-CAS-2025-0199",
    productType: "casco",
    status: "renewed",
    startDate: "2026-08-15",
    expiryDate: "2027-08-15",
    premium: 378000,
    sumInsured: 14000000,
    assetDescription: "Mercedes-Benz C250 (2021 թ., VIN: WDD205045)",
    paymentFrequency: "single",
    paymentStatus: "paid"
  }
];

export const INITIAL_CLAIMS: ClientClaim[] = [
  {
    id: "claim-1",
    clientId: "client-1",
    policyNumber: "SIL-CAS-2025-0412",
    incidentDate: "2026-02-14",
    reportDate: "2026-02-14",
    claimType: "ՃՏՊ (Կողային հարված)",
    claimedAmount: 280000,
    paidAmount: 280000,
    status: "settled",
    description: "Կայանված վիճակում աջ դռան քերծվածք։ Կարգավորվել է SIL ավտոտեխսպասարկման կենտրոնում 3 օրում։"
  },
  {
    id: "claim-2",
    clientId: "client-2",
    policyNumber: "SIL-PR-2025-0891",
    incidentDate: "2025-11-20",
    reportDate: "2025-11-21",
    claimType: "Ջրալցում (Խողովակի վթար)",
    claimedAmount: 650000,
    paidAmount: 620000,
    status: "settled",
    description: "Արտադրական պահեստի ջրատարի վթար։ Ապահովագրական հատուցումը վճարվել է ամբողջությամբ։"
  }
];

export const INITIAL_TASKS: ClientTask[] = [
  {
    id: "task-1",
    clientId: "client-1",
    clientName: "Արմեն Կարապետյան",
    title: "Հեռախոսազանգ՝ ԿԱՍԿՈ երկարաձգման 10% հավատարմության առաջարկի քննարկում",
    dueDate: "2026-09-03T11:00:00Z",
    type: "call",
    priority: "high",
    completed: false,
    notes: "Հաճախորդը խնդրել էր զանգել առավոտյան 11-ից հետո:"
  },
  {
    id: "task-2",
    clientId: "client-2",
    clientName: "«ԷԼԻՏ ԳՐՈՒՊ» ՓԲԸ",
    title: "Հանդիպում ֆինանսական տնօրենի հետ՝ 2026-2027թթ․ գույքային պայմանագրի ստորագրում",
    dueDate: "2026-09-05T14:30:00Z",
    type: "meeting",
    priority: "high",
    completed: false,
    notes: "Ներկայացնել նաև խմբային բժշկականի փաթեթը:"
  },
  {
    id: "task-3",
    clientId: "client-3",
    clientName: "Գոռ Վարդանյան",
    title: "Ուղարկել հիփոթեքի վերահաշվարկված գնառաջարկը WhatsApp-ով",
    dueDate: "2026-09-04T10:00:00Z",
    type: "email",
    priority: "medium",
    completed: false,
  }
];

export const INITIAL_VAULT: ClientVaultDocument[] = [
  {
    id: "doc-1",
    clientId: "client-1",
    name: "Անձնագիր (Արմեն Կարապետյան)",
    type: "passport",
    uploadDate: "2025-09-01",
    validUntil: "2032-05-20",
    status: "valid"
  },
  {
    id: "doc-2",
    clientId: "client-1",
    name: "Տեխանձնագիր (Toyota Camry 77XX777)",
    type: "tech_passport",
    uploadDate: "2025-09-01",
    status: "valid"
  },
  {
    id: "doc-3",
    clientId: "client-2",
    name: "Պետ․ Ռեգիստրի Վկայական («ԷԼԻՏ ԳՐՈՒՊ»)",
    type: "other",
    uploadDate: "2024-08-10",
    status: "valid"
  },
  {
    id: "doc-4",
    clientId: "client-2",
    name: "Գույքի Սեփականության Վկայական (Էրեբունի 40)",
    type: "property_cert",
    uploadDate: "2024-08-10",
    status: "valid"
  }
];

// ----------------- STORAGE GETTERS & SETTERS -----------------

export function getClientRenewals(): ClientRenewalLead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEADS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(INITIAL_LEADS));
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
    leadScore: lead.leadScore || Math.floor(Math.random() * 25) + 75,
    priority: lead.priority || "medium",
  };
  const updated = [newLead, ...current];
  localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(updated));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sil-lead-updated"));
    window.dispatchEvent(new CustomEvent("sil-new-lead", { detail: newLead }));
  }
  return newLead;
}

export function updateClientRenewalStatus(
  id: string,
  status: ClientRenewalLead["status"],
  extra?: { lostReason?: string; notes?: string }
): void {
  const current = getClientRenewals();
  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status,
        lastContactedDate: new Date().toISOString().split("T")[0],
        ...(extra?.lostReason ? { lostReason: extra.lostReason } : {}),
        ...(extra?.notes ? { notes: extra.notes } : {}),
      };
    }
    return item;
  });
  localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(updated));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sil-lead-updated"));
  }
}

// ----------------- CLIENTS 360 STORAGE -----------------

export function getClients360(): ClientProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLIENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(INITIAL_CLIENTS));
      return INITIAL_CLIENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CLIENTS;
  }
}

export function saveClient360(client: ClientProfile): void {
  const current = getClients360();
  const idx = current.findIndex((c) => c.id === client.id);
  let updated: ClientProfile[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = client;
  } else {
    updated = [client, ...current];
  }
  localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(updated));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sil-clients-updated"));
  }
}

// ----------------- POLICIES STORAGE -----------------

export function getClientPolicies(clientId?: string): ClientPolicy[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POLICIES);
    const list: ClientPolicy[] = raw ? JSON.parse(raw) : INITIAL_POLICIES;
    if (!raw) localStorage.setItem(STORAGE_KEY_POLICIES, JSON.stringify(INITIAL_POLICIES));
    return clientId ? list.filter((p) => p.clientId === clientId) : list;
  } catch {
    return clientId ? INITIAL_POLICIES.filter((p) => p.clientId === clientId) : INITIAL_POLICIES;
  }
}

// ----------------- CLAIMS STORAGE -----------------

export function getClientClaims(clientId?: string): ClientClaim[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLAIMS);
    const list: ClientClaim[] = raw ? JSON.parse(raw) : INITIAL_CLAIMS;
    if (!raw) localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(INITIAL_CLAIMS));
    return clientId ? list.filter((c) => c.clientId === clientId) : list;
  } catch {
    return clientId ? INITIAL_CLAIMS.filter((c) => c.clientId === clientId) : INITIAL_CLAIMS;
  }
}

export function addClientClaim(claim: Omit<ClientClaim, "id">): ClientClaim {
  const current = getClientClaims();
  const newClaim: ClientClaim = {
    ...claim,
    id: `claim-${Date.now()}`,
  };
  const updated = [newClaim, ...current];
  localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(updated));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sil-claims-updated"));
  }
  return newClaim;
}

// ----------------- TASKS STORAGE -----------------

export function getClientTasks(clientId?: string): ClientTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASKS);
    const list: ClientTask[] = raw ? JSON.parse(raw) : INITIAL_TASKS;
    if (!raw) localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(INITIAL_TASKS));
    return clientId ? list.filter((t) => t.clientId === clientId) : list;
  } catch {
    return clientId ? INITIAL_TASKS.filter((t) => t.clientId === clientId) : INITIAL_TASKS;
  }
}

export function addClientTask(task: Omit<ClientTask, "id" | "completed">): ClientTask {
  const current = getClientTasks();
  const newTask: ClientTask = {
    ...task,
    id: `task-${Date.now()}`,
    completed: false,
  };
  const updated = [newTask, ...current];
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updated));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sil-tasks-updated"));
  }
  return newTask;
}

export function toggleTaskCompleted(taskId: string): void {
  const current = getClientTasks();
  const updated = current.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updated));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sil-tasks-updated"));
  }
}

// ----------------- VAULT STORAGE -----------------

export function getClientVault(clientId?: string): ClientVaultDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VAULT);
    const list: ClientVaultDocument[] = raw ? JSON.parse(raw) : INITIAL_VAULT;
    if (!raw) localStorage.setItem(STORAGE_KEY_VAULT, JSON.stringify(INITIAL_VAULT));
    return clientId ? list.filter((d) => d.clientId === clientId) : list;
  } catch {
    return clientId ? INITIAL_VAULT.filter((d) => d.clientId === clientId) : INITIAL_VAULT;
  }
}

export function addVaultDocument(doc: Omit<ClientVaultDocument, "id" | "uploadDate">): ClientVaultDocument {
  const current = getClientVault();
  const newDoc: ClientVaultDocument = {
    ...doc,
    id: `doc-${Date.now()}`,
    uploadDate: new Date().toISOString().split("T")[0],
  };
  const updated = [newDoc, ...current];
  localStorage.setItem(STORAGE_KEY_VAULT, JSON.stringify(updated));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sil-vault-updated"));
  }
  return newDoc;
}

// ----------------- EXPORT TO CSV -----------------

export function exportLeadsToCSV(leads: ClientRenewalLead[]): void {
  const headers = [
    "Հայտի ID",
    "Հաճախորդ",
    "Հեռախոս",
    "Էլ․ Փոստ",
    "Ապահովագրատեսակ",
    "Կարգավիճակ",
    "Գնահատված Վճար (AMD)",
    "Գնահատական (Score)",
    "Առաջնահերթություն",
    "Պատասխանատու Գործակալ",
    "Ամսաթիվ"
  ];

  const rows = leads.map((l) => [
    l.id,
    `"${l.clientName.replace(/"/g, '""')}"`,
    `"${l.phone}"`,
    `"${l.email || ""}"`,
    `"${l.productType.toUpperCase()}"`,
    `"${l.status}"`,
    l.estimatedPremium || 0,
    `${l.leadScore || 80}%`,
    `"${l.priority || "medium"}"`,
    `"${l.assignedAgent || ""}"`,
    `"${new Date(l.createdAt).toLocaleDateString("hy-AM")}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `SIL_CRM_Leads_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
