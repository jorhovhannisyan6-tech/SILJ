import React, { useState, useEffect } from "react";
import {
  Users,
  Bell,
  Calendar,
  Phone,
  Mail,
  RefreshCw,
  Send,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Plus,
  Car,
  Building,
  ShieldAlert,
  MessageSquare,
  Copy,
  Check,
  Sparkles,
  Zap,
  ExternalLink,
  Tag,
  Home,
  HeartPulse,
  Plane,
  Download,
  Award,
  Layers,
  TrendingUp,
  UserPlus
} from "lucide-react";
import { QuotationProposal } from "../../types";
import {
  getClientRenewals,
  updateClientRenewalStatus,
  ClientRenewalLead,
  getClients360,
  ClientProfile,
  exportLeadsToCSV,
  getClientPolicies
} from "../../utils/clientRenewalStore";

import { KanbanBoard } from "./KanbanBoard";
import { CustomerProfileModal } from "./CustomerProfileModal";
import { QuickCommunicationModal } from "./QuickCommunicationModal";
import { NewLeadModal } from "./NewLeadModal";
import { SalesPerformanceStats } from "./SalesPerformanceStats";

export interface PolicyRenewalItem {
  id: string;
  policyNumber: string;
  clientName: string;
  phone: string;
  email: string;
  productType: "casco" | "property" | "mortgage" | "health" | "travel";
  assetDescription: string;
  startDate: string;
  expiryDate: string;
  daysRemaining: number;
  previousPremium: number;
  newCalculatedPremium: number;
  status: "critical" | "urgent" | "upcoming" | "renewed";
  notes?: string;
  loyaltyDiscountPercent: number;
}

interface Props {
  onGenerateRenewalQuote?: (proposal: QuotationProposal) => void;
}

const DEFAULT_RENEWAL_ITEMS: PolicyRenewalItem[] = [
  {
    id: "ren-1",
    policyNumber: "SIL-CAS-2025-0412",
    clientName: "Արմեն Կարապետյան",
    phone: "+374 91 405060",
    email: "armen.karapetyan@gmail.com",
    productType: "casco",
    assetDescription: "Toyota Camry 2.5 (2022 թ., VIN: JTD2022ARM948)",
    startDate: "2025-09-02",
    expiryDate: "2026-09-15",
    daysRemaining: 13,
    previousPremium: 380000,
    newCalculatedPremium: 342000,
    status: "urgent",
    loyaltyDiscountPercent: 10,
    notes: "Հաճախորդը ցանկանում է երկարաձգել ԿԱՍԿՈ-ն 10% զեղչով։",
  },
  {
    id: "ren-2",
    policyNumber: "SIL-PR-2025-0891",
    clientName: "«ԷԼԻՏ ԳՐՈՒՊ» ՍՊԸ",
    phone: "+374 10 525354",
    email: "info@elitegroup.am",
    productType: "property",
    assetDescription: "Արտադրական տարածք և սարքավորումներ (ք. Երևան, Էրեբունի 40)",
    startDate: "2025-09-10",
    expiryDate: "2026-09-20",
    daysRemaining: 18,
    previousPremium: 1250000,
    newCalculatedPremium: 1125000,
    status: "upcoming",
    loyaltyDiscountPercent: 10,
    notes: "Առաջարկվել է նաև աշխատակիցների դժբախտ պատահարների փաթեթ։",
  },
  {
    id: "ren-3",
    policyNumber: "SIL-MRT-2025-1104",
    clientName: "Գոռ Վարդանյան",
    phone: "+374 77 112233",
    email: "gor.vardanyan@mail.ru",
    productType: "mortgage",
    assetDescription: "Բնակարան Հիփոթեքով (Ամերիաբանկ / Կենտրոն, Տերյան 18/2)",
    startDate: "2025-09-22",
    expiryDate: "2026-09-22",
    daysRemaining: 20,
    previousPremium: 84000,
    newCalculatedPremium: 79800,
    status: "upcoming",
    loyaltyDiscountPercent: 5,
    notes: "Վարկի մնացորդը նվազել է, ապահովագրավճարը ճշգրտված է։",
  },
  {
    id: "ren-4",
    policyNumber: "SIL-CAS-2025-0199",
    clientName: "Սոնա Միքայելյան",
    phone: "+374 93 887766",
    email: "sona.m@gmail.com",
    productType: "casco",
    assetDescription: "Mercedes-Benz C250 (2021 թ.)",
    startDate: "2025-08-15",
    expiryDate: "2026-08-15",
    daysRemaining: 0,
    previousPremium: 420000,
    newCalculatedPremium: 378000,
    status: "renewed",
    loyaltyDiscountPercent: 10,
    notes: "Պայմանագիրը հաջողությամբ երկարաձգվել է 2026-2027թթ․ համար։",
  },
];

export const ClientRenewalCrm: React.FC<Props> = ({ onGenerateRenewalQuote }) => {
  const [activeTabSection, setActiveTabSection] = useState<"leads" | "clients360" | "renewals" | "sales">("leads");
  const [clientLeads, setClientLeads] = useState<ClientRenewalLead[]>([]);
  const [clients360, setClients360] = useState<ClientProfile[]>([]);
  const [items, setItems] = useState<PolicyRenewalItem[]>(DEFAULT_RENEWAL_ITEMS);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [selectedClientForModal, setSelectedClientForModal] = useState<ClientProfile | null>(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [selectedItemForComm, setSelectedItemForComm] = useState<{
    name: string;
    phone: string;
    email?: string;
    productType?: string;
    premium?: number;
    expiryDate?: string;
  } | null>(null);

  const loadData = () => {
    setClientLeads(getClientRenewals());
    setClients360(getClients360());
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("sil-lead-updated", handleUpdate);
      window.addEventListener("sil-clients-updated", handleUpdate);
      window.addEventListener("storage", handleUpdate);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("sil-lead-updated", handleUpdate);
        window.removeEventListener("sil-clients-updated", handleUpdate);
        window.removeEventListener("storage", handleUpdate);
      }
    };
  }, []);

  const pendingLeadsCount = clientLeads.filter((l) => l.status === "pending").length;

  const filteredLeads = clientLeads.filter((lead) => {
    const matchesFilter = activeFilter === "all" || lead.status === activeFilter;
    const matchesSearch =
      lead.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      (lead.notes && lead.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const filteredClients = clients360.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const filteredRenewals = items.filter((item) => {
    const matchesFilter = activeFilter === "all" || item.status === activeFilter;
    const matchesSearch =
      item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const generateProposalFromLead = (lead: ClientRenewalLead) => {
    const now = new Date();
    const validUntil = new Date(now.setDate(now.getDate() + 30)).toLocaleDateString("hy-AM");

    const proposal: QuotationProposal = {
      id: `lead-prop-${Date.now()}`,
      quotationNumber: `SIL-EXPRESS-${Date.now().toString().slice(-6)}`,
      type: (lead.productType as any) || "casco",
      productNameArm:
        lead.productType === "casco"
          ? "ԿԱՍԿՈ Արագ Գնառաջարկ"
          : lead.productType === "property"
          ? "Անշարժ Գույքի Գնառաջարկ"
          : lead.productType === "health"
          ? "Առողջության Ապահովագրություն"
          : "Ճանապարհորդության Ապահովագրություն",
      categoryNameArm: "Հաճախորդի Արագ Հայտ (Client Link)",
      date: new Date().toLocaleDateString("hy-AM"),
      validUntil,
      clientName: lead.clientName,
      contactInfo: `${lead.phone} | ${lead.email || "—"}`,
      objectDescription: lead.vehicleOrPropertyDetails || lead.notes || "Հաճախորդի ներկայացրած տվյալներ",
      totalSumInsured: lead.productType === "casco" ? 7000000 : 15000000,
      currency: "AMD",
      baseTariff: 2.5,
      discountBonus: 5,
      finalTariff: 2.37,
      annualPremium: lead.estimatedPremium > 0 ? lead.estimatedPremium : 165000,
      franchiseDescription: "0% ֆրանշիզա ՃՏՊ պատահարների համար",
      franchiseAmount: 0,
      paymentTerms: "Միանվագ կամ 2 հավասար մասով",
      beneficiaryDetails: "Անձամբ ապահովադիրը",
      coveredPerilsList: [
        "Ճանապարհատրանսպորտային պատահարներ (ՃՏՊ)",
        "Տարերային աղետներ, հրդեհ, պայթյուն",
        "Գողություն, ավազակային հարձակում",
        "Երրորդ անձանց չարամիտ գործողություններ (Վանդալիզմ)",
      ],
      specialConditions: ["Գնառաջարկը պատրաստված է հաճախորդի օնլայն արագ հայտի հիման վրա։"],
      status: "ready",
      version: 1,
      agentName: "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» CRM Agent",
      agentTitle: "Ավագ Ապահովագրական Խորհրդատու",
      agentPhone: "+374 60 54 00 00",
      agentEmail: "info@silinsurance.am",
    };

    if (onGenerateRenewalQuote) {
      onGenerateRenewalQuote(proposal);
    }
  };

  const generateRenewalProposal = (item: PolicyRenewalItem) => {
    const now = new Date();
    const validUntil = new Date(now.setDate(now.getDate() + 30)).toLocaleDateString("hy-AM");
    const quotationNumber = `SIL-RENEWAL-${item.policyNumber.replace(/SIL-/, "")}-2026`;

    const proposal: QuotationProposal = {
      id: `renewal-${Date.now()}`,
      quotationNumber,
      type: item.productType,
      productNameArm: item.productType === "casco" ? "ԿԱՍԿՈ Երկարաձգման Առաջարկ" : "Գույքի Երկարաձգման Առաջարկ",
      categoryNameArm: "Պայմանագրերի Երկարաձգում (Renewal)",
      date: new Date().toLocaleDateString("hy-AM"),
      validUntil,
      clientName: item.clientName,
      contactInfo: `${item.phone} | ${item.email}`,
      objectDescription: item.assetDescription,
      totalSumInsured: Math.round(item.previousPremium * 15),
      currency: "AMD",
      baseTariff: 2.5,
      discountBonus: item.loyaltyDiscountPercent,
      finalTariff: 2.25,
      annualPremium: item.newCalculatedPremium,
      franchiseDescription: "0.5% ֆիքսված ֆրանշիզա",
      franchiseAmount: Math.round(item.previousPremium * 0.05),
      paymentTerms: "Միանվագ կամ 2 հավասար մասով",
      beneficiaryDetails: "Չի կիրառվում",
      coveredPerilsList: [
        "Ճանապարհատրանսպորտային պատահարներ (ՃՏՊ)",
        "Հրդեհ, պայթյուն, կայծակի հարված",
        "Բնական աղետներ (կարկուտ, փոթորիկ, հեղեղում)",
        "Երրորդ անձանց չարամիտ գործողություններ (Վանդալիզմ)",
        "Գողություն, ավազակային հարձակում",
      ],
      specialConditions: [
        `Հաճախորդին տրամադրված է ${item.loyaltyDiscountPercent}% հավատարմության զեղչ (Loyalty Bonus):`,
        "Երկարաձգումն իրականացվում է առանց լրացուցիչ զննության requirement-ի։",
      ],
      status: "ready",
      version: 1,
      agentName: "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» CRM Agent",
      agentTitle: "Ավագ Ապահովագրական Խորհրդատու",
      agentPhone: "+374 60 54 00 00",
      agentEmail: "info@silinsurance.am",
    };

    if (onGenerateRenewalQuote) {
      onGenerateRenewalQuote(proposal);
    }
  };

  const handle1ClickQuoteFromClient = (clientName: string, productType: string, assetDetails?: string) => {
    const proposal: QuotationProposal = {
      id: `prop-360-${Date.now()}`,
      quotationNumber: `SIL-360-${Date.now().toString().slice(-6)}`,
      type: (productType as any) || "casco",
      productNameArm: "Անհատական Գնառաջարկ (Client 360°)",
      categoryNameArm: "Հաճախորդի Պրոֆիլից Գեներացված",
      date: new Date().toLocaleDateString("hy-AM"),
      validUntil: new Date(Date.now() + 30 * 86400000).toLocaleDateString("hy-AM"),
      clientName,
      contactInfo: "SIL Պորտալից",
      objectDescription: assetDetails || "Հաճախորդի տրանսպորտ / գույք",
      totalSumInsured: 8500000,
      currency: "AMD",
      baseTariff: 2.5,
      discountBonus: 10,
      finalTariff: 2.25,
      annualPremium: 191250,
      franchiseDescription: "0% ՃՏՊ ֆրանշիզա",
      franchiseAmount: 0,
      paymentTerms: "Միանվագ կամ 2 մասով",
      beneficiaryDetails: "Անձամբ ապահովադիրը",
      coveredPerilsList: ["ՃՏՊ", "Հրդեհ, պայթյուն", "Գողություն", "Երրորդ անձանց վնաս"],
      specialConditions: ["Գնառաջարկը ձևավորված է հաճախորդի 360° պրոֆիլի տվյալներով։"],
      status: "ready",
      version: 1,
      agentName: "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» CRM Agent",
      agentTitle: "Ավագ Ապահովագրական Խորհրդատու",
      agentPhone: "+374 60 54 00 00",
      agentEmail: "info@silinsurance.am",
    };

    if (onGenerateRenewalQuote) {
      onGenerateRenewalQuote(proposal);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#061A40] to-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <Zap size={13} /> SIL Agent CRM Hub 360°
            </span>
            {pendingLeadsCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[11px] animate-pulse">
                {pendingLeadsCount} Նոր Հայտ
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="text-cyan-400" size={26} />
            Հաճախորդների CRM և Հայտերի Կառավարման Համակարգ
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Խելացի Kanban ձագար, հաճախորդների 360° պրոֆիլներ, ավտոմատ երկարաձգումներ և վաճառքների պլանավորում
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Որոնել հաճախորդ, հեռախոս, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-4 py-2 w-56 sm:w-64 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowNewLeadModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <UserPlus size={15} />
            <span>+ Նոր Հայտ</span>
          </button>

          <button
            type="button"
            onClick={() => exportLeadsToCSV(clientLeads)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Արտահանել Excel / CSV"
          >
            <Download size={16} />
          </button>

          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Թարմացնել ցանկը"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Main Mode Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTabSection("leads");
              setActiveFilter("all");
            }}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTabSection === "leads"
                ? "bg-[#061A40] text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>⚡ Վաճառքի Ձագար (Kanban Leads)</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-xs font-black">
              {clientLeads.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTabSection("clients360");
              setActiveFilter("all");
            }}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTabSection === "clients360"
                ? "bg-[#061A40] text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>📇 Հաճախորդների Բազա 360°</span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-slate-900 text-xs font-black">
              {clients360.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTabSection("renewals");
              setActiveFilter("all");
            }}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTabSection === "renewals"
                ? "bg-[#061A40] text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>🔄 Երկարաձգումներ (Renewals)</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-700 text-white text-xs font-black">
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTabSection("sales");
            }}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTabSection === "sales"
                ? "bg-[#061A40] text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span>📈 Վաճառքների Պլան & Բոնուսներ</span>
          </button>
        </div>
      </div>

      {/* VIEW SECTION 1: KANBAN & LEADS */}
      {activeTabSection === "leads" && (
        <div className="space-y-5">
          <SalesPerformanceStats leads={clientLeads} />

          {filteredLeads.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <Zap className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-black text-slate-800">Հայտեր չեն գտնվել</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Սեղմեք «+ Նոր Հայտ» կոճակը կամ հաճախորդներին ուղարկեք Express Client Link-ը։
              </p>
            </div>
          ) : (
            <KanbanBoard
              leads={filteredLeads}
              onLeadClick={generateProposalFromLead}
              onLeadsUpdated={loadData}
            />
          )}
        </div>
      )}

      {/* VIEW SECTION 2: CLIENTS 360 DIRECTORY */}
      {activeTabSection === "clients360" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => setSelectedClientForModal(client)}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                      {client.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition">
                          {client.name}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                          ★ {client.vipTier}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-3">
                        <span>{client.phone}</span>
                        {client.email && <span>{client.email}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">LTV Ծավալ</span>
                    <strong className="text-emerald-600 font-black font-mono text-sm">
                      {client.ltvAmount.toLocaleString()} ֏
                    </strong>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {client.tags.map((tag, idx) => (
                    <span key={idx} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">{client.policiesCount} պոլիս</span>
                    <span>· Գործակալ՝ {client.assignedAgent}</span>
                  </div>

                  <span className="text-blue-600 font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Դիտել 360° Քարտը →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW SECTION 3: POLICY RENEWALS */}
      {activeTabSection === "renewals" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setActiveFilter("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                activeFilter === "all"
                  ? "bg-blue-600 text-white border-blue-500 shadow-md"
                  : "bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              Բոլորը ({items.length})
            </button>
            <button
              onClick={() => setActiveFilter("critical")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                activeFilter === "critical"
                  ? "bg-rose-600 text-white border-rose-500 shadow-md"
                  : "bg-slate-900/90 text-rose-400 border-rose-500/30 hover:bg-slate-800"
              }`}
            >
              <ShieldAlert size={15} /> 🚨 Կրիտիկական (1-7 օր) ({items.filter((i) => i.status === "critical").length})
            </button>
            <button
              onClick={() => setActiveFilter("urgent")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                activeFilter === "urgent"
                  ? "bg-amber-600 text-white border-amber-500 shadow-md"
                  : "bg-slate-900/90 text-amber-400 border-amber-500/30 hover:bg-slate-800"
              }`}
            >
              <AlertTriangle size={15} /> ⚠️ Հապճեպ (8-15 օր) ({items.filter((i) => i.status === "urgent").length})
            </button>
            <button
              onClick={() => setActiveFilter("upcoming")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                activeFilter === "upcoming"
                  ? "bg-blue-600 text-white border-blue-500 shadow-md"
                  : "bg-slate-900/90 text-blue-400 border-blue-500/30 hover:bg-slate-800"
              }`}
            >
              <Clock size={15} /> 🔔 Սպասվող (16-30 օր) ({items.filter((i) => i.status === "upcoming").length})
            </button>
            <button
              onClick={() => setActiveFilter("renewed")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                activeFilter === "renewed"
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                  : "bg-slate-900/90 text-emerald-400 border-emerald-500/30 hover:bg-slate-800"
              }`}
            >
              <CheckCircle2 size={15} /> ✅ Երկարաձգված ({items.filter((i) => i.status === "renewed").length})
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredRenewals.map((item) => (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-3xl p-5 text-white shadow-xl flex flex-col justify-between transition-all hover:border-slate-700 ${
                  item.status === "critical"
                    ? "border-rose-500/50 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/20"
                    : item.status === "urgent"
                    ? "border-amber-500/40"
                    : item.status === "renewed"
                    ? "border-emerald-500/40"
                    : "border-slate-800"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-blue-400 font-bold bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 rounded-lg">
                        {item.policyNumber}
                      </span>
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {item.productType}
                      </span>
                    </div>

                    {item.status === "critical" && (
                      <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1 animate-pulse">
                        <ShieldAlert size={12} /> Մնաց {item.daysRemaining} օր
                      </span>
                    )}
                    {item.status === "urgent" && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <AlertTriangle size={12} /> Մնաց {item.daysRemaining} օր
                      </span>
                    )}
                    {item.status === "upcoming" && (
                      <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <Clock size={12} /> Մնաց {item.daysRemaining} օր
                      </span>
                    )}
                    {item.status === "renewed" && (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Երկարաձգված է
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-base font-bold text-white">{item.clientName}</strong>
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                        -{item.loyaltyDiscountPercent}% Loyalty Bonus
                      </span>
                    </div>

                    <p className="text-slate-300 flex items-center gap-2">
                      <Car size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{item.assetDescription}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Phone size={12} /> {item.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail size={12} /> {item.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> Ավարտ՝ {item.expiryDate}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] bg-slate-800/80 p-2.5 rounded-xl text-slate-300 border border-slate-700/60 mt-2">
                        💬 {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Նախորդ vs Նոր Ապահովագրավճար</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-slate-400 line-through text-xs font-mono">
                        {item.previousPremium.toLocaleString()} ֏
                      </span>
                      <strong className="text-emerald-400 font-black text-base font-mono">
                        {item.newCalculatedPremium.toLocaleString()} ֏
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setSelectedItemForComm({
                          name: item.clientName,
                          phone: item.phone,
                          email: item.email,
                          productType: item.productType,
                          premium: item.newCalculatedPremium,
                          expiryDate: item.expiryDate,
                        })
                      }
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Ուղարկել SMS / Viber / WhatsApp ծանուցում"
                    >
                      <MessageSquare size={15} /> WhatsApp/SMS
                    </button>

                    <button
                      onClick={() => generateRenewalProposal(item)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <RefreshCw size={14} /> 1-Click Երկարաձգել
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW SECTION 4: SALES TARGET & GAMIFICATION */}
      {activeTabSection === "sales" && (
        <div className="space-y-5">
          <SalesPerformanceStats leads={clientLeads} />

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Award className="text-amber-500" size={20} /> Գործակալների Լիդերբորդ (Leaderboard)
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-amber-700 text-sm">🥇 1.</span>
                    <div>
                      <b className="text-slate-800">Աննա Գրիգորյան</b>
                      <span className="text-[10px] text-slate-500 block">12 կնքված պոլիս</span>
                    </div>
                  </div>
                  <strong className="text-emerald-700 font-mono font-black text-sm">3,450,000 ֏</strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-600 text-sm">🥈 2.</span>
                    <div>
                      <b className="text-slate-800">Դավիթ Մանուկյան</b>
                      <span className="text-[10px] text-slate-500 block">8 կնքված պոլիս</span>
                    </div>
                  </div>
                  <strong className="text-slate-800 font-mono font-black text-sm">2,180,000 ֏</strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-600 text-sm">🥉 3.</span>
                    <div>
                      <b className="text-slate-800">Կարեն Ղազարյան</b>
                      <span className="text-[10px] text-slate-500 block">5 կնքված պոլիս</span>
                    </div>
                  </div>
                  <strong className="text-slate-800 font-mono font-black text-sm">1,420,000 ֏</strong>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Sparkles className="text-blue-500" size={20} /> Ապահովագրատեսակների Բաշխվածություն
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>🚗 ԿԱՍԿՈ Ապահովագրություն</span>
                    <span className="text-blue-600 font-mono">55% (4,250,000 ֏)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: "55%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>🏢 Գույք & Բիզնես</span>
                    <span className="text-purple-600 font-mono">25% (1,920,000 ֏)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{ width: "25%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>📦 Բեռներ & Տրանսպորտ</span>
                    <span className="text-amber-600 font-mono">12% (950,000 ֏)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: "12%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>🩺 Առողջություն & Այլ</span>
                    <span className="text-emerald-600 font-mono">8% (620,000 ֏)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "8%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer 360 Profile Modal */}
      {selectedClientForModal && (
        <CustomerProfileModal
          client={selectedClientForModal}
          onClose={() => setSelectedClientForModal(null)}
          on1ClickQuote={handle1ClickQuoteFromClient}
          onClientUpdated={loadData}
        />
      )}

      {/* Quick Communication Modal Trigger */}
      {selectedItemForComm && (
        <QuickCommunicationModal
          clientName={selectedItemForComm.name}
          phone={selectedItemForComm.phone}
          email={selectedItemForComm.email}
          productType={selectedItemForComm.productType}
          premium={selectedItemForComm.premium}
          expiryDate={selectedItemForComm.expiryDate}
          onClose={() => setSelectedItemForComm(null)}
        />
      )}

      {/* New Lead Modal Trigger */}
      {showNewLeadModal && (
        <NewLeadModal
          onClose={() => setShowNewLeadModal(false)}
          onLeadCreated={loadData}
        />
      )}
    </div>
  );
};
