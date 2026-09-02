import React, { useState, useEffect } from "react";
import {
  ClientProfile,
  ClientPolicy,
  ClientClaim,
  ClientTask,
  ClientVaultDocument,
  getClientPolicies,
  getClientClaims,
  getClientTasks,
  getClientVault,
  addClientTask,
  toggleTaskCompleted,
  addVaultDocument,
  addClientClaim,
  saveClient360,
  VipTier
} from "../../utils/clientRenewalStore";
import {
  User,
  Shield,
  FileText,
  AlertTriangle,
  CreditCard,
  FolderLock,
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  Tag,
  Plus,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Car,
  Home,
  HeartPulse,
  Plane,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  FileCheck
} from "lucide-react";
import { QuickCommunicationModal } from "./QuickCommunicationModal";

interface CustomerProfileModalProps {
  client: ClientProfile;
  onClose: () => void;
  on1ClickQuote?: (clientName: string, productType: string, assetDetails?: string) => void;
  onClientUpdated?: () => void;
}

type TabType = "overview" | "policies" | "claims" | "billing" | "vault" | "tasks";

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  client,
  onClose,
  on1ClickQuote,
  onClientUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [policies, setPolicies] = useState<ClientPolicy[]>([]);
  const [claims, setClaims] = useState<ClientClaim[]>([]);
  const [tasks, setTasks] = useState<ClientTask[]>([]);
  const [vaultDocs, setVaultDocs] = useState<ClientVaultDocument[]>([]);
  const [showCommModal, setShowCommModal] = useState(false);

  // New task form state
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState<ClientTask["type"]>("call");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<ClientTask["priority"]>("medium");

  // New claim modal state
  const [showNewClaimForm, setShowNewClaimForm] = useState(false);
  const [claimType, setClaimType] = useState("ՃՏՊ");
  const [claimAmount, setClaimAmount] = useState(250000);
  const [claimDesc, setClaimDesc] = useState("");

  // New Doc state
  const [showNewDocForm, setShowNewDocForm] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState<ClientVaultDocument["type"]>("passport");

  const loadData = () => {
    setPolicies(getClientPolicies(client.id));
    setClaims(getClientClaims(client.id));
    setTasks(getClientTasks(client.id));
    setVaultDocs(getClientVault(client.id));
  };

  useEffect(() => {
    loadData();
  }, [client.id]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    addClientTask({
      clientId: client.id,
      clientName: client.name,
      title: taskTitle.trim(),
      dueDate: taskDueDate || new Date(Date.now() + 86400000 * 2).toISOString(),
      type: taskType,
      priority: taskPriority,
    });
    setTaskTitle("");
    setShowNewTaskForm(false);
    loadData();
  };

  const handleCreateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    addClientClaim({
      clientId: client.id,
      policyNumber: policies[0]?.policyNumber || "SIL-2026-CLAIM",
      incidentDate: new Date().toISOString().split("T")[0],
      reportDate: new Date().toISOString().split("T")[0],
      claimType,
      claimedAmount: Number(claimAmount),
      paidAmount: 0,
      status: "in_review",
      description: claimDesc || "Հաճախորդի առաջնային հայտ",
    });
    setShowNewClaimForm(false);
    setClaimDesc("");
    loadData();
  };

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;
    addVaultDocument({
      clientId: client.id,
      name: docName.trim(),
      type: docType,
      status: "valid",
    });
    setDocName("");
    setShowNewDocForm(false);
    loadData();
  };

  const handleToggleTask = (taskId: string) => {
    toggleTaskCompleted(taskId);
    loadData();
  };

  const getTierColor = (tier: VipTier) => {
    switch (tier) {
      case "VIP":
      case "Platinum":
        return "bg-gradient-to-r from-amber-400 to-yellow-600 text-slate-950 font-black";
      case "Gold":
        return "bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold";
      case "Silver":
        return "bg-slate-300/20 text-slate-200 border border-slate-400/40 font-bold";
      default:
        return "bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold";
    }
  };

  const getChurnRiskBadge = () => {
    if (client.churnRisk === "high") {
      return <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold">🔴 Բարձր Ռիսկ (Churn Risk)</span>;
    }
    if (client.churnRisk === "medium") {
      return <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">🟡 Միջին Ռիսկ</span>;
    }
    return <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">🟢 Կայուն (Low Risk)</span>;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl text-white max-w-5xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-[#0a2352] to-slate-900 p-6 border-b border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                {client.name.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${getTierColor(client.vipTier)}`}>
                    ★ {client.vipTier} Կարգավիճակ
                  </span>
                  {getChurnRiskBadge()}
                  <span className="text-xs text-slate-400">
                    Հաճախորդ ID: <strong className="text-slate-300 font-mono">{client.id}</strong>
                  </span>
                </div>

                <h2 className="text-2xl font-black text-white">{client.name}</h2>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-1">
                  <span className="flex items-center gap-1">
                    <Phone size={13} className="text-cyan-400" /> {client.phone}
                  </span>
                  {client.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={13} className="text-cyan-400" /> {client.email}
                    </span>
                  )}
                  {client.address && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-cyan-400" /> {client.address}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowCommModal(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                <MessageSquare size={15} />
                <span>WhatsApp / SMS</span>
              </button>

              <button
                onClick={() => {
                  if (on1ClickQuote) {
                    on1ClickQuote(client.name, "casco", client.familyOrFleetDetails);
                    onClose();
                  }
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
              >
                <Sparkles size={15} />
                <span>1-Click Գնառաջարկ</span>
              </button>

              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80 text-xs">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Ընդհանուր Ծավալ (LTV)</span>
              <strong className="text-emerald-400 text-sm font-black font-mono">
                {client.ltvAmount.toLocaleString()} ֏
              </strong>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Գործող Պայմանագրեր</span>
              <strong className="text-cyan-400 text-sm font-black font-mono">
                {policies.length} պոլիս
              </strong>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Պատահարներ / Claims</span>
              <strong className="text-amber-400 text-sm font-black font-mono">
                {claims.length} գրանցված
              </strong>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Պատասխանատու Գործակալ</span>
              <strong className="text-slate-200 text-xs font-bold truncate block">
                {client.assignedAgent || "SIL CRM Team"}
              </strong>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-800 bg-slate-900/90 overflow-x-auto no-scrollbar py-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "overview" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles size={14} /> Ընդհանուր & AI Խորհրդատու
          </button>

          <button
            onClick={() => setActiveTab("policies")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "policies" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Shield size={14} /> Պայմանագրեր ({policies.length})
          </button>

          <button
            onClick={() => setActiveTab("claims")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "claims" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <AlertTriangle size={14} /> Պատահարներ ({claims.length})
          </button>

          <button
            onClick={() => setActiveTab("billing")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "billing" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <CreditCard size={14} /> Վճարումներ & Գրաֆիկ
          </button>

          <button
            onClick={() => setActiveTab("vault")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "vault" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <FolderLock size={14} /> Թվային Պահոց ({vaultDocs.length})
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "tasks" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar size={14} /> Զանգեր & Առաջադրանքներ ({tasks.filter((t) => !t.completed).length})
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: OVERVIEW & AI */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* AI Cross-Sell Recommendations Banner */}
              <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-500/30 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2 text-purple-400">
                  <Sparkles size={18} />
                  <h4 className="font-black text-sm uppercase tracking-wider">AI Խաչաձև Վաճառքի (Cross-Sell) Առաջարկներ</h4>
                </div>
                <p className="text-xs text-slate-300 mb-3">
                  Հիմնվելով հաճախորդի ապահովագրական պորտֆելի վրա՝ համակարգը խորհուրդ է տալիս առաջարկել․
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {client.crossSellRecommendations.map((rec, idx) => (
                    <div key={idx} className="bg-slate-800/90 border border-purple-500/20 p-3 rounded-xl flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">✨ {rec}</span>
                      <button
                        onClick={() => {
                          if (on1ClickQuote) {
                            on1ClickQuote(client.name, "bundle", rec);
                            onClose();
                          }
                        }}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-[10px] transition cursor-pointer"
                      >
                        Հաշվարկել
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags & Fleet / Family */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Tag size={14} className="text-cyan-400" /> Հաճախորդի Պիտակներ (Tags)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {client.tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-full bg-slate-700/80 border border-slate-600 text-slate-200 text-xs font-semibold">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {client.familyOrFleetDetails && (
                    <div className="mt-4 pt-3 border-t border-slate-700/60">
                      <span className="text-[11px] text-slate-400 block mb-1 font-bold">Կապակցված Ավտոպարկ / Ընտանիք՝</span>
                      <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                        {client.familyOrFleetDetails}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <FileText size={14} className="text-cyan-400" /> Գործակալի Նշումներ (Notes)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    {client.notes || "Հատուկ նշումներ չկան։"}
                  </p>
                  <div className="text-[11px] text-slate-400">
                    Գրանցված է՝ <strong>{new Date(client.createdAt).toLocaleDateString("hy-AM")}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: POLICIES */}
          {activeTab === "policies" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-300">Բոլոր Պայմանագրերը ({policies.length})</h4>
                <button
                  onClick={() => {
                    if (on1ClickQuote) {
                      on1ClickQuote(client.name, "casco");
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Նոր Պայմանագիր
                </button>
              </div>

              <div className="space-y-3">
                {policies.map((p) => (
                  <div key={p.id} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded">
                          {p.policyNumber}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                          {p.productType}
                        </span>
                        {p.status === "expiring_soon" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                            Շուտով ավարտվում է
                          </span>
                        )}
                        {p.status === "renewed" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                            Երկարաձգված
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-200 font-bold">{p.assetDescription}</p>
                      <div className="text-[11px] text-slate-400">
                        Ժամկետ՝ {p.startDate} — {p.expiryDate}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Ապահովագրավճար</span>
                        <strong className="text-emerald-400 font-black font-mono text-sm">
                          {p.premium.toLocaleString()} ֏
                        </strong>
                      </div>

                      <button
                        onClick={() => {
                          if (on1ClickQuote) {
                            on1ClickQuote(client.name, p.productType, p.assetDescription);
                            onClose();
                          }
                        }}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        Երկարաձգել
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CLAIMS */}
          {activeTab === "claims" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-300">Ապահովագրական Պատահարներ</h4>
                  <p className="text-xs text-slate-400">Վնասաբերության և հատուցումների պատմություն</p>
                </div>
                <button
                  onClick={() => setShowNewClaimForm(!showNewClaimForm)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Գրանցել Պատահար (Claim)
                </button>
              </div>

              {showNewClaimForm && (
                <form onSubmit={handleCreateClaim} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3 animate-fadeIn">
                  <h5 className="text-xs font-bold text-slate-200">Նոր Ապահովագրական Պատահարի Գրանցում</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Պատահարի տեսակ</label>
                      <input
                        type="text"
                        value={claimType}
                        onChange={(e) => setClaimType(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Պահանջվող գումար (AMD)</label>
                      <input
                        type="number"
                        value={claimAmount}
                        onChange={(e) => setClaimAmount(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Նկարագրություն</label>
                    <textarea
                      rows={2}
                      value={claimDesc}
                      onChange={(e) => setClaimDesc(e.target.value)}
                      placeholder="Մանրամասներ վթարի/վնասի մասին..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewClaimForm(false)}
                      className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs"
                    >
                      Չեղարկել
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold"
                    >
                      Պահպանել Պահանջը
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {claims.map((c) => (
                  <div key={c.id} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-200">{c.claimType}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          {c.status === "settled" ? "Հատուցված է ✓" : "Ընթացքի մեջ"}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">Ամսաթիվ՝ {c.incidentDate}</span>
                    </div>

                    <p className="text-xs text-slate-300">{c.description}</p>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-700/60 font-mono">
                      <span className="text-slate-400">
                        Պահանջ՝ <strong>{c.claimedAmount.toLocaleString()} ֏</strong>
                      </span>
                      <span className="text-emerald-400 font-bold">
                        Վճարված հատուցում՝ {c.paidAmount.toLocaleString()} ֏
                      </span>
                    </div>
                  </div>
                ))}
                {claims.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">Գրանցված պատահարներ չկան (Անվթար հաճախորդ)։</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BILLING & INSTALLMENTS */}
          {activeTab === "billing" && (
            <div className="space-y-4">
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <CreditCard className="text-emerald-400" size={16} /> Տարաժամկետ Վճարումների Հսկողություն
                </h4>
                <p className="text-xs text-slate-400">
                  Հաճախորդի պայմանագրերի հերթական մարումները և առցանց վճարման հղումների գեներացիա։
                </p>

                <div className="space-y-2">
                  {policies.map((p) => (
                    <div key={p.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <b className="text-slate-200 font-mono">{p.policyNumber}</b> ({p.productType})
                        <div className="text-[11px] text-slate-400">
                          Հերթական մարում՝ {p.nextPaymentDate || p.expiryDate}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 font-mono font-bold">
                          {(p.nextPaymentAmount || p.premium).toLocaleString()} ֏
                        </span>
                        <button
                          onClick={() => setShowCommModal(true)}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold"
                        >
                          Վճարման Հղում (SMS)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DIGITAL VAULT */}
          {activeTab === "vault" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-300">Թվային Փաստաթղթերի Պահոց</h4>
                  <p className="text-xs text-slate-400">Անձնագիր, տեխանձնագիր, սեփականության վկայականներ</p>
                </div>
                <button
                  onClick={() => setShowNewDocForm(!showNewDocForm)}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Ավելացնել Փաստաթուղթ
                </button>
              </div>

              {showNewDocForm && (
                <form onSubmit={handleCreateDoc} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
                  <h5 className="text-xs font-bold text-slate-200">Նոր Փաստաթղթի Գրանցում</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Փաստաթղթի Անվանում</label>
                      <input
                        type="text"
                        placeholder="Օր․՝ Վարորդական Իրավունք"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Տեսակ</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      >
                        <option value="passport">Անձնագիր / ID Card</option>
                        <option value="tech_passport">Տեխանձնագիր</option>
                        <option value="driver_license">Վարորդական Իրավունք</option>
                        <option value="property_cert">Սեփականության Վկայական</option>
                        <option value="contract">Կնքված Պայմանագիր</option>
                        <option value="other">Այլ Փաստաթուղթ</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewDocForm(false)}
                      className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs"
                    >
                      Չեղարկել
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold"
                    >
                      Կցել Պահոցին
                    </button>
                  </div>
                </form>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                {vaultDocs.map((doc) => (
                  <div key={doc.id} className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <FileCheck size={18} />
                      </div>
                      <div>
                        <strong className="text-xs text-slate-200 block">{doc.name}</strong>
                        <span className="text-[10px] text-slate-400">Կցված է՝ {doc.uploadDate}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      Ակտիվ ✓
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: TASKS & CALLS */}
          {activeTab === "tasks" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-300">Առաջադրանքներ & Հետադարձ Կապ</h4>
                  <p className="text-xs text-slate-400">Զանգերի, հանդիպումների և հիշեցումների օրացույց</p>
                </div>
                <button
                  onClick={() => setShowNewTaskForm(!showNewTaskForm)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Նոր Հիշեցում / Զանգ
                </button>
              </div>

              {showNewTaskForm && (
                <form onSubmit={handleCreateTask} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
                  <h5 className="text-xs font-bold text-slate-200">Նոր Առաջադրանքի Պլանավորում</h5>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Առաջադրանքի նկարագրություն</label>
                    <input
                      type="text"
                      placeholder="Օր․՝ Զանգահարել հաճախորդին ԿԱՍԿՈ պայմանագրի երկարաձգման հարցով"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Տեսակ</label>
                      <select
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      >
                        <option value="call">Հեռախոսազանգ</option>
                        <option value="meeting">Հանդիպում</option>
                        <option value="email">Նամակ / Գնառաջարկ</option>
                        <option value="renewal">Երկարաձգում</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Ամսաթիվ</label>
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Առաջնահերթություն</label>
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      >
                        <option value="high">Բարձր (High)</option>
                        <option value="medium">Միջին (Medium)</option>
                        <option value="low">Ցածր (Low)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewTaskForm(false)}
                      className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs"
                    >
                      Չեղարկել
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                    >
                      Պահպանել
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                      task.completed
                        ? "bg-slate-900/40 border-slate-800 text-slate-500 line-through"
                        : "bg-slate-800/80 border-slate-700 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id)}
                        className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                      />
                      <div>
                        <span className="font-semibold block">{task.title}</span>
                        <span className="text-[10px] text-slate-400">
                          Ժամկետ՝ {new Date(task.dueDate).toLocaleDateString("hy-AM")} · {task.type}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        task.priority === "high"
                          ? "bg-rose-500/20 text-rose-300"
                          : task.priority === "medium"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {task.priority === "high" ? "High Priority" : "Normal"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Communication Modal Trigger */}
      {showCommModal && (
        <QuickCommunicationModal
          clientName={client.name}
          phone={client.phone}
          email={client.email}
          onClose={() => setShowCommModal(false)}
        />
      )}
    </div>
  );
};
