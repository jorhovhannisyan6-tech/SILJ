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
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Filter,
  CheckSquare,
  Square,
  MessageCircle,
} from "lucide-react";
import { QuotationProposal } from "../../types";
import {
  getClientRenewals,
  fetchClientRenewals,
  updateClientRenewalStatus,
  updateClientRenewal,
  deleteClientRenewal,
  deleteMultipleClientRenewals,
  addClientRenewal,
  ClientRenewalLead,
} from "../../utils/clientRenewalStore";
import { LeadEditModal } from "./LeadEditModal";
import { LeadKanbanBoard } from "./LeadKanbanBoard";

const exportCSV = (filename: string, data: any[]) => {
  if (!data || !data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [
    keys.join(","),
    ...data.map((row) =>
      keys
        .map((k) => `"${String(row[k] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
};

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
    expiryDate: "2026-09-02",
    daysRemaining: 5,
    previousPremium: 380000,
    newCalculatedPremium: 342000,
    status: "critical",
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
    expiryDate: "2026-09-10",
    daysRemaining: 13,
    previousPremium: 1250000,
    newCalculatedPremium: 1125000,
    status: "urgent",
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
    daysRemaining: 25,
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
  const [activeTabSection, setActiveTabSection] = useState<"leads" | "renewals">("leads");
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [clientLeads, setClientLeads] = useState<ClientRenewalLead[]>([]);
  const [items, setItems] = useState<PolicyRenewalItem[]>(DEFAULT_RENEWAL_ITEMS);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemForSms, setSelectedItemForSms] = useState<{ name: string; phone: string; text: string } | null>(null);
  const [copiedSms, setCopiedSms] = useState(false);

  // Edit / Add Modal State
  const [editingLead, setEditingLead] = useState<ClientRenewalLead | null | undefined>(undefined); // undefined: modal closed, null: add new, object: edit existing
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  const loadLeadsFromStore = async () => {
    const leads = await fetchClientRenewals();
    setClientLeads(leads);
  };

  useEffect(() => {
    loadLeadsFromStore();

    const handleUpdate = () => {
      loadLeadsFromStore();
    };

    const interval = setInterval(() => {
      loadLeadsFromStore();
    }, 4000);

    if (typeof window !== "undefined") {
      window.addEventListener("sil-lead-updated", handleUpdate);
      window.addEventListener("storage", handleUpdate);
    }
    return () => {
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("sil-lead-updated", handleUpdate);
        window.removeEventListener("storage", handleUpdate);
      }
    };
  }, []);

  const pendingLeadsCount = clientLeads.filter((l) => l.status === "pending").length;
  const totalPipelineValue = clientLeads.reduce((sum, l) => sum + (l.estimatedPremium || 0), 0);
  const wonDealsCount = clientLeads.filter((l) => l.status === "closed").length;

  const filteredLeads = clientLeads.filter((lead) => {
    const matchesStatus = activeFilter === "all" || lead.status === activeFilter;
    const matchesProduct = productFilter === "all" || lead.productType === productFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      lead.clientName.toLowerCase().includes(query) ||
      lead.phone.includes(query) ||
      (lead.policyNumber && lead.policyNumber.toLowerCase().includes(query)) ||
      (lead.notes && lead.notes.toLowerCase().includes(query)) ||
      (lead.vehicleOrPropertyDetails && lead.vehicleOrPropertyDetails.toLowerCase().includes(query));
    return matchesStatus && matchesProduct && matchesSearch;
  });

  const filteredItems = items.filter((item) => {
    const matchesFilter = activeFilter === "all" || item.status === activeFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.clientName.toLowerCase().includes(query) ||
      item.policyNumber.toLowerCase().includes(query) ||
      item.phone.includes(query);
    return matchesFilter && matchesSearch;
  });

  const handleLeadStatusChange = async (id: string, newStatus: ClientRenewalLead["status"]) => {
    await updateClientRenewalStatus(id, newStatus);
    loadLeadsFromStore();
  };

  const handleSaveLead = async (leadData: Partial<ClientRenewalLead>) => {
    if (editingLead && editingLead.id) {
      // Update existing lead
      await updateClientRenewal(editingLead.id, leadData);
    } else {
      // Add new lead
      await addClientRenewal(leadData as any);
    }
    await loadLeadsFromStore();
    setEditingLead(undefined);
  };

  const handleDeleteLead = async (id: string) => {
    if (window.confirm("Վստա՞հ եք, որ ցանկանում եք ջնջել այս հայտը։ Գործողությունն անդառնալի է։")) {
      await deleteClientRenewal(id);
      setSelectedLeadIds((prev) => prev.filter((i) => i !== id));
      await loadLeadsFromStore();
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedLeadIds.length) return;
    if (window.confirm(`Վստա՞հ եք, որ ցանկանում եք ջնջել նշված ${selectedLeadIds.length} հայտերը։`)) {
      await deleteMultipleClientRenewals(selectedLeadIds);
      setSelectedLeadIds([]);
      await loadLeadsFromStore();
    }
  };

  const handleToggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllLeads = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const handleWhatsAppLead = (lead: ClientRenewalLead) => {
    const text = encodeURIComponent(
      `Բարև Ձեզ, հարգելի ${lead.clientName}։ Շնորհակալություն «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» դիմելու համար։ Ձեր ${lead.productType.toUpperCase()} ապահովագրության հայտը մշակվել է։ Ցանկանո՞ւմ եք ստանալ գնառաջարկը։`
    );
    const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  const generateProposalFromLead = (lead: ClientRenewalLead) => {
    const now = new Date();
    const validUntil = new Date(now.setDate(now.getDate() + 30)).toLocaleDateString("hy-AM");

    const proposal: QuotationProposal = {
      id: `lead-prop-${Date.now()}`,
      quotationNumber: `SIL-EXPRESS-${Date.now().toString().slice(-6)}`,
      type: lead.productType,
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

  const copySmsText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSms(true);
    setTimeout(() => setCopiedSms(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#061A40] to-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <Zap size={13} /> SIL Agent CRM Hub
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
            Օնլայն արագ հայտեր, Kanban Pipeline, խմբագրում, ջնջում և 1-Click գնառաջարկների գեներացում
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Որոնել հաճախորդ, հեռախոս, հայտ․․․"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-4 py-2 w-56 sm:w-64 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              exportCSV(
                activeTabSection === "leads" ? "sil_client_leads.csv" : "sil_client_renewals.csv",
                activeTabSection === "leads" ? filteredLeads : filteredItems
              )
            }
            className="p-2 rounded-xl bg-emerald-900/40 hover:bg-emerald-800 text-emerald-400 border border-emerald-700 transition cursor-pointer flex items-center gap-1.5 font-bold text-xs"
            title="Ներբեռնել Excel / CSV"
          >
            <Download size={15} /> <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            type="button"
            onClick={loadLeadsFromStore}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Թարմացնել ցանկը"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ընդհանուր Հայտեր</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{clientLeads.length}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Նոր / Չմշակված</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{pendingLeadsCount}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Pipeline Ծավալ</div>
          <div className="text-2xl font-black text-blue-900 mt-1">
            {(totalPipelineValue / 1000000).toFixed(1)}M ֏
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Կնքված Գործարքներ</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{wonDealsCount}</div>
        </div>
      </div>

      {/* Main Mode Tabs: Express Client Leads vs Policy Renewals */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveTabSection("leads");
              setActiveFilter("all");
            }}
            className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeTabSection === "leads"
                ? "bg-[#061A40] text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>⚡ Հաճախորդների Հայտեր (CRM Pipeline)</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-xs font-black">
              {clientLeads.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTabSection("renewals");
              setActiveFilter("all");
            }}
            className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeTabSection === "renewals"
                ? "bg-[#061A40] text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>🔄 Պայմանագրերի Երկարաձգում (Renewals)</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-700 text-white text-xs font-black">
              {items.length}
            </span>
          </button>
        </div>

        {activeTabSection === "leads" && (
          <div className="flex items-center gap-2">
            {/* View Switcher: Kanban vs Table */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === "kanban" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid size={14} />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <List size={14} />
                <span>Աղյուսակ</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setEditingLead(null)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Plus size={16} /> Ավելացնել Հայտ
            </button>
          </div>
        )}
      </div>

      {/* VIEW SECTION 1: CRM LEADS */}
      {activeTabSection === "leads" && (
        <div className="space-y-4">
          {/* Sub-Filters and Bulk Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Product Filter */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mr-2">
                <Filter size={14} className="text-slate-400" />
                <select
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none"
                >
                  <option value="all">Բոլոր Պրոդուկտները</option>
                  <option value="casco">ԿԱՍԿՈ</option>
                  <option value="property">Գույք</option>
                  <option value="mortgage">Հիփոթեք</option>
                  <option value="health">Առողջություն</option>
                  <option value="travel">Ճամփորդություն</option>
                </select>
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    activeFilter === "all"
                      ? "bg-slate-900 text-white border-slate-800 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Բոլորը ({clientLeads.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("pending")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
                    activeFilter === "pending"
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                      : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                  }`}
                >
                  🟡 Նոր ({clientLeads.filter((l) => l.status === "pending").length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("contacted")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    activeFilter === "contacted"
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                  }`}
                >
                  🔵 Կապ ({clientLeads.filter((l) => l.status === "contacted").length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("quote_sent")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    activeFilter === "quote_sent"
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100"
                  }`}
                >
                  🟣 Գնառաջարկ ({clientLeads.filter((l) => l.status === "quote_sent").length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("closed")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    activeFilter === "closed"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  🟢 Կնքված ({clientLeads.filter((l) => l.status === "closed").length})
                </button>
              </div>
            </div>

            {/* Bulk Action Controls */}
            {selectedLeadIds.length > 0 && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <span className="text-xs font-bold text-slate-700">
                  Նշված է՝ <strong>{selectedLeadIds.length}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Ջնջել նշվածները</span>
                </button>
              </div>
            )}
          </div>

          {filteredLeads.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3 shadow-xs">
              <Zap className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-black text-slate-800">Հայտեր չեն գտնվել</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Ուղարկեք «Արագ Հայտի Հղում»-ը Ձեր հաճախորդին կամ ավելացրեք հայտ ձեռքով «Ավելացնել Հայտ» կոճակով։
              </p>
              <button
                type="button"
                onClick={() => setEditingLead(null)}
                className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus size={15} /> Ստեղծել Առաջին Հայտը
              </button>
            </div>
          ) : viewMode === "kanban" ? (
            <LeadKanbanBoard
              leads={filteredLeads}
              onStatusChange={handleLeadStatusChange}
              onEdit={(l) => setEditingLead(l)}
              onDelete={handleDeleteLead}
              onGenerateQuote={generateProposalFromLead}
              onWhatsApp={handleWhatsAppLead}
            />
          ) : (
            /* Table View */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[11px]">
                      <th className="p-3.5 pl-4 w-8">
                        <button
                          type="button"
                          onClick={handleSelectAllLeads}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 ? (
                            <CheckSquare size={16} className="text-blue-600" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </th>
                      <th className="p-3.5">Կոդ / Պրոդուկտ</th>
                      <th className="p-3.5">Հաճախորդ</th>
                      <th className="p-3.5">Կոնտակտ</th>
                      <th className="p-3.5">Օբյեկտ / Տեղեկություն</th>
                      <th className="p-3.5 text-right">Կանխատեսվող Վճար</th>
                      <th className="p-3.5 text-center">Կարգավիճակ</th>
                      <th className="p-3.5 text-right pr-4">Գործողություններ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map((lead) => {
                      const isSelected = selectedLeadIds.includes(lead.id);
                      return (
                        <tr
                          key={lead.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isSelected ? "bg-blue-50/40" : ""
                          }`}
                        >
                          <td className="p-3.5 pl-4">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectLead(lead.id)}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare size={16} className="text-blue-600" />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          </td>

                          <td className="p-3.5 font-medium">
                            <div className="font-mono font-bold text-slate-800">
                              {lead.policyNumber || lead.id}
                            </div>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase">
                              {lead.productType}
                            </span>
                          </td>

                          <td className="p-3.5 font-bold text-slate-900">
                            {lead.clientName}
                          </td>

                          <td className="p-3.5">
                            <a
                              href={`tel:${lead.phone}`}
                              className="text-blue-700 font-bold hover:underline block"
                            >
                              {lead.phone}
                            </a>
                            {lead.email && (
                              <span className="text-[11px] text-slate-500 block truncate max-w-[140px]">
                                {lead.email}
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-slate-600 max-w-xs truncate">
                            {lead.vehicleOrPropertyDetails || lead.notes || "—"}
                          </td>

                          <td className="p-3.5 text-right font-black text-slate-900">
                            {lead.estimatedPremium ? `${lead.estimatedPremium.toLocaleString()} ֏` : "—"}
                          </td>

                          <td className="p-3.5 text-center">
                            <select
                              value={lead.status}
                              onChange={(e) =>
                                handleLeadStatusChange(lead.id, e.target.value as any)
                              }
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition cursor-pointer ${
                                lead.status === "pending"
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : lead.status === "contacted"
                                  ? "bg-blue-100 text-blue-900 border-blue-300"
                                  : lead.status === "quote_sent"
                                  ? "bg-purple-100 text-purple-900 border-purple-300"
                                  : "bg-emerald-100 text-emerald-900 border-emerald-300"
                              }`}
                            >
                              <option value="pending">🟡 Նոր Հայտ</option>
                              <option value="contacted">🔵 Կապ Հաստատված</option>
                              <option value="quote_sent">🟣 Գնառաջարկ Ուղարկված</option>
                              <option value="closed">🟢 Կնքված</option>
                            </select>
                          </td>

                          <td className="p-3.5 text-right pr-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleWhatsAppLead(lead)}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer"
                                title="WhatsApp"
                              >
                                <MessageCircle size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => generateProposalFromLead(lead)}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition cursor-pointer shadow-xs"
                                title="Գեներացնել Գնառաջարկ"
                              >
                                Գնառաջարկ
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingLead(lead)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition cursor-pointer"
                                title="Խմբագրել Հայտը"
                              >
                                <Edit2 size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteLead(lead.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                                title="Ջնջել Հայտը"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW SECTION 2: POLICY RENEWALS */}
      {activeTabSection === "renewals" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setActiveFilter("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeFilter === "all"
                  ? "bg-blue-600 text-white border-blue-500 shadow-md"
                  : "bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              Բոլորը ({items.length})
            </button>
            <button
              onClick={() => setActiveFilter("critical")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeFilter === "critical"
                  ? "bg-rose-600 text-white border-rose-500 shadow-md"
                  : "bg-slate-900/90 text-rose-400 border-rose-500/30 hover:bg-slate-800"
              }`}
            >
              <ShieldAlert size={15} /> 🚨 Կրիտիկական (1-7 օր) ({items.filter((i) => i.status === "critical").length})
            </button>
            <button
              onClick={() => setActiveFilter("urgent")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeFilter === "urgent"
                  ? "bg-amber-600 text-white border-amber-500 shadow-md"
                  : "bg-slate-900/90 text-amber-400 border-amber-500/30 hover:bg-slate-800"
              }`}
            >
              <AlertTriangle size={15} /> ⚠️ Հապճեպ (8-15 օր) ({items.filter((i) => i.status === "urgent").length})
            </button>
            <button
              onClick={() => setActiveFilter("upcoming")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeFilter === "upcoming"
                  ? "bg-blue-600 text-white border-blue-500 shadow-md"
                  : "bg-slate-900/90 text-blue-400 border-blue-500/30 hover:bg-slate-800"
              }`}
            >
              <Clock size={15} /> 🔔 Սպասվող (16-30 օր) ({items.filter((i) => i.status === "upcoming").length})
            </button>
            <button
              onClick={() => setActiveFilter("renewed")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeFilter === "renewed"
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                  : "bg-slate-900/90 text-emerald-400 border-emerald-500/30 hover:bg-slate-800"
              }`}
            >
              <CheckCircle2 size={15} /> ✅ Երկարաձգված ({items.filter((i) => i.status === "renewed").length})
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-2xl p-5 text-white shadow-xl flex flex-col justify-between transition-all hover:border-slate-700 ${
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
                      <p className="text-[11px] bg-slate-800/80 p-2 rounded-lg text-slate-300 border border-slate-700/60 mt-2">
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
                        setSelectedItemForSms({
                          name: item.clientName,
                          phone: item.phone,
                          text: `Հարգելի ${item.clientName}, «ՍԻԼ ԻՆՇՈՒՐԱՆՍ»-ը տեղեկացնում է, որ Ձեր № ${item.policyNumber} պայմանագրի ժամկետը ավարտվում է ${item.expiryDate}-ին։ Ձեզ համար պատրաստվել է երկարաձգման առաջարկ ${item.loyaltyDiscountPercent}% զեղչով՝ ընդամենը ${item.newCalculatedPremium.toLocaleString()} դրամ։`,
                        })
                      }
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Ուղարկել SMS / Viber ծանուցում"
                    >
                      <MessageSquare size={15} /> SMS
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

      {/* Edit / Add Lead Modal */}
      {editingLead !== undefined && (
        <LeadEditModal
          lead={editingLead}
          isOpen={true}
          onClose={() => setEditingLead(undefined)}
          onSave={handleSaveLead}
        />
      )}

      {/* SMS / Viber Modal */}
      {selectedItemForSms && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 text-white max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <MessageSquare className="text-emerald-400" size={18} />
                Ուղարկել Ծանուցում — {selectedItemForSms.name}
              </h3>
              <button
                onClick={() => setSelectedItemForSms(null)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Ծանուցման տեքստ (SMS / Viber / WhatsApp):</label>
              <textarea
                rows={5}
                readOnly
                value={selectedItemForSms.text}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-sans focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedItemForSms(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Փակել
              </button>
              <button
                onClick={() => copySmsText(selectedItemForSms.text)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-emerald-500 shadow-md cursor-pointer"
              >
                {copiedSms ? <Check size={16} /> : <Copy size={16} />}
                {copiedSms ? "Պատճենված է!" : "Պատճենել տեքստը"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
