import { useState, useEffect } from "react";
import { QuotationProposal } from "../../types";
import {
  ContractGenerationData,
  compileContractFromProposal,
  generateContractHtml,
  contractTemplateCss,
  downloadContractAsWordDoc,
  downloadContractAsPdf,
  copyContractForWord,
} from "../../utils/contractTemplate";
import { formatCurrency } from "../../utils/insuranceCalculator";
import {
  X,
  FileCheck,
  Download,
  Printer,
  Copy,
  Sparkles,
  Check,
  Shield,
  Building,
  Calendar,
  User,
  CreditCard,
  FileText,
  AlertCircle,
  RefreshCw,
  Edit3,
  CheckCircle2,
} from "lucide-react";

interface Props {
  proposal: QuotationProposal;
  isOpen: boolean;
  onClose: () => void;
  onIssuePolicy?: (updatedProposal: QuotationProposal, contractData: ContractGenerationData) => void;
}

export function ContractGenerationModal({ proposal, isOpen, onClose, onIssuePolicy }: Props) {
  const [activeTab, setActiveTab] = useState<"edit" | "ai" | "preview">("edit");
  const [contractData, setContractData] = useState<ContractGenerationData>(() => compileContractFromProposal(proposal));
  const [copied, setCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // AI State
  const [aiPromptTopic, setAiPromptTopic] = useState("standard_terms");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestedClauses, setAiSuggestedClauses] = useState("");
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setContractData(compileContractFromProposal(proposal));
      setIsSaved(proposal.status === "policy_issued");
    }
  }, [proposal, isOpen]);

  if (!isOpen) return null;

  const handleFieldChange = (field: keyof ContractGenerationData, value: any) => {
    setContractData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegenerateNumbers = () => {
    const year = new Date().getFullYear();
    const randNum = Math.floor(10000 + Math.random() * 90000);
    const code = proposal.type.toUpperCase().slice(0, 4);
    handleFieldChange("policyNumber", `SIL-${code}-POL-${year}-${randNum}`);
    handleFieldChange("contractNumber", `SIL-CTR-${year}/${randNum}`);
  };

  const handleCopyWord = async () => {
    const success = await copyContractForWord(contractData);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleDownloadDoc = () => {
    downloadContractAsWordDoc(contractData);
  };

  const handlePrintPdf = async () => {
    setGeneratingPdf(true);
    setPdfError("");
    try {
      await downloadContractAsPdf(contractData);
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      setPdfError(err?.message || "Չհաջողվեց ստեղծել PDF ֆայլը։");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleAiDraftClauses = async () => {
    setAiGenerating(true);
    setAiError("");
    setAiSuggestedClauses("");

    try {
      const res = await fetch("/api/gemini/generate-proposal-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("sil-auth-token") ? { Authorization: `Bearer ${localStorage.getItem("sil-auth-token")}` } : {}),
        },
        body: JSON.stringify({
          quotationData: {
            ...proposal,
            contractData,
            requestType: "contract_legal_clauses",
            topic: aiPromptTopic,
          },
          type: proposal.type,
        }),
      });

      if (!res.ok) throw new Error("ԱԲ-ով դրույթների կազմումը ձախողվեց");
      const data = await res.json();
      if (data.analysis) {
        setAiSuggestedClauses(data.analysis);
      } else {
        throw new Error(data.error || "ԱԲ պատասխան չստացվեց");
      }
    } catch (err: any) {
      console.error("AI contract clauses error:", err);
      setAiError(err.message || "Սխալ ԱԲ դրույթների գեներացման ժամանակ");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleApplyAiClause = () => {
    if (!aiSuggestedClauses) return;
    const current = contractData.specialConditions ? `${contractData.specialConditions}\n\n` : "";
    handleFieldChange("specialConditions", `${current}${aiSuggestedClauses}`);
    setActiveTab("preview");
  };

  const handleSaveAndIssue = () => {
    const updated: QuotationProposal = {
      ...proposal,
      status: "policy_issued",
      policyNumber: contractData.policyNumber,
      issuedAt: new Date().toISOString(),
      specialConditions: contractData.specialConditions
        ? [contractData.specialConditions]
        : proposal.specialConditions,
      paymentTerms: contractData.paymentSchedule,
      beneficiaryDetails: contractData.beneficiaryDetails,
    };

    if (onIssuePolicy) {
      onIssuePolicy(updated, contractData);
    }
    setIsSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#00235B] text-white px-6 py-5 flex items-center justify-between border-b border-blue-900/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0066FF] to-cyan-400 flex items-center justify-center text-white shadow-md">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Ապահովագրության Պայմանագրի / Վկայագրի Պատրաստում
                </h2>
                {isSaved ? (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Պոլիսը Տրված Է
                  </span>
                ) : (
                  <span className="text-xs bg-blue-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-semibold">
                    Գնառաջարկ N {proposal.quotationNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                {proposal.productNameArm} • Ըստ պաշտոնական ձևանմուշի և քարտեզագրման
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("edit")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "edit"
                  ? "bg-[#003399] text-white shadow"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <Edit3 className="w-4 h-4" /> 1. Պայմանագրի Տվյալներ
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "ai"
                  ? "bg-[#003399] text-white shadow"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" /> 2. ԱԲ Պայմանագրային Օգնական
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "preview"
                  ? "bg-[#003399] text-white shadow"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <FileText className="w-4 h-4" /> 3. Պայմանագրի Տեսք & Ներբեռնում
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyWord}
              className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#003399] text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-200 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Պատճենված է" : "Պատճենել Word"}
            </button>
            <button
              onClick={handleDownloadDoc}
              className="inline-flex items-center gap-1.5 bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Ներբեռնել .doc
            </button>
            <button
              onClick={handlePrintPdf}
              disabled={generatingPdf}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow transition cursor-pointer disabled:opacity-60"
            >
              <Printer className={`w-3.5 h-3.5 ${generatingPdf ? "animate-pulse" : ""}`} />
              {generatingPdf ? "PDF..." : "Տպել / PDF"}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {pdfError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{pdfError}</span>
            </div>
          )}

          {/* TAB 1: EDIT CONTRACT DETAILS */}
          {activeTab === "edit" && (
            <div className="space-y-6">
              {/* Numbers and Dates */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#003399]" /> Պայմանագրի և Պոլիսի Համարներ
                  </h3>
                  <button
                    onClick={handleRegenerateNumbers}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Վերագեներացնել
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Պայմանագրի N
                    </label>
                    <input
                      type="text"
                      value={contractData.contractNumber}
                      onChange={(e) => handleFieldChange("contractNumber", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#003399]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Պոլիսի N
                    </label>
                    <input
                      type="text"
                      value={contractData.policyNumber}
                      onChange={(e) => handleFieldChange("policyNumber", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#003399]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Կնքման ամսաթիվ
                    </label>
                    <input
                      type="text"
                      value={contractData.signDate}
                      onChange={(e) => handleFieldChange("signDate", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#003399]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Գործողության ժամկետ
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={contractData.startDate}
                        onChange={(e) => handleFieldChange("startDate", e.target.value)}
                        placeholder="Սկիզբ"
                        className="w-1/2 bg-white border border-slate-300 rounded-xl px-2 py-2 text-[11px] text-center focus:outline-none focus:ring-2 focus:ring-[#003399]"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="text"
                        value={contractData.endDate}
                        onChange={(e) => handleFieldChange("endDate", e.target.value)}
                        placeholder="Ավարտ"
                        className="w-1/2 bg-white border border-slate-300 rounded-xl px-2 py-2 text-[11px] text-center focus:outline-none focus:ring-2 focus:ring-[#003399]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Client & Insured Object */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#003399]" /> Ապահովադիր և Ապահովագրության Օբյեկտ
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Ապահովադրի անվանում / Անուն Ազգանուն
                    </label>
                    <input
                      type="text"
                      value={contractData.clientName}
                      onChange={(e) => handleFieldChange("clientName", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#003399]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Անձնագիր / ՀԾՀ / ՀՎՀՀ
                    </label>
                    <input
                      type="text"
                      value={contractData.clientPassportOrTaxId}
                      onChange={(e) => handleFieldChange("clientPassportOrTaxId", e.target.value)}
                      placeholder="օր.՝ AT0541298, ՀԾՀ՝ 2408890123"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#003399]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Հասցե / Գրանցման վայր
                    </label>
                    <input
                      type="text"
                      value={contractData.clientAddress}
                      onChange={(e) => handleFieldChange("clientAddress", e.target.value)}
                      placeholder="ք. Երևան, փողոց, շենք"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#003399]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Հեռախոսահամար
                    </label>
                    <input
                      type="text"
                      value={contractData.clientPhone}
                      onChange={(e) => handleFieldChange("clientPhone", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#003399]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Էլ. փոստ
                    </label>
                    <input
                      type="email"
                      value={contractData.clientEmail}
                      onChange={(e) => handleFieldChange("clientEmail", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#003399]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Ապահովագրության օբյեկտ (Ավտոմեքենա / Գույք / Բեռ և այլն)
                  </label>
                  <input
                    type="text"
                    value={contractData.insuredObject}
                    onChange={(e) => handleFieldChange("insuredObject", e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#003399]"
                  />
                </div>
              </div>

              {/* Financials & Payment Terms */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#003399]" /> Ֆինանսական Պայմաններ և Գրաֆիկ
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Ապահովագրական գումար
                    </label>
                    <input
                      type="text"
                      value={contractData.totalSumInsured}
                      onChange={(e) => handleFieldChange("totalSumInsured", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-[#003399]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Արժույթ
                    </label>
                    <select
                      value={contractData.currency}
                      onChange={(e) => handleFieldChange("currency", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                    >
                      <option value="AMD">AMD (ՀՀ Դրամ)</option>
                      <option value="USD">USD (ԱՄՆ Դոլար)</option>
                      <option value="EUR">EUR (Եվրո)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Ապահովագրավճար (Պրեմիա)
                    </label>
                    <input
                      type="text"
                      value={contractData.annualPremium}
                      onChange={(e) => handleFieldChange("annualPremium", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Ֆրանշիզա
                    </label>
                    <input
                      type="text"
                      value={contractData.franchiseDescription}
                      onChange={(e) => handleFieldChange("franchiseDescription", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Վճարման կարգ և գրաֆիկ
                    </label>
                    <input
                      type="text"
                      value={contractData.paymentSchedule}
                      onChange={(e) => handleFieldChange("paymentSchedule", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Շահառու
                    </label>
                    <input
                      type="text"
                      value={contractData.beneficiaryDetails}
                      onChange={(e) => handleFieldChange("beneficiaryDetails", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Special Conditions */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  Հատուկ Պայմաններ և Դրույթներ
                </h3>
                <textarea
                  rows={3}
                  value={contractData.specialConditions}
                  onChange={(e) => handleFieldChange("specialConditions", e.target.value)}
                  placeholder="Նշեք հատուկ պայմանները կամ օգտագործեք ԱԲ Օգնականը դրանք ավտոմատ կազմելու համար..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#003399]"
                />
              </div>
            </div>
          )}

          {/* TAB 2: AI CONTRACT ASSISTANT */}
          {activeTab === "ai" && (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4" /> Gemini AI Contract Drafter
                </div>
                <h3 className="text-base font-black text-white">
                  Պայմանագրային Դրույթների Ավտոմատ Կարգավորում և Վերլուծություն
                </h3>
                <p className="text-xs text-blue-200 mt-1">
                  ԱԲ-ն ուսումնասիրում է տվյալ պրոդուկտի ռիսկերը և «ՍԻԼ ԻՆՇՈՒՐԱՆՍ»-ի կանոնները՝ առաջարկելով իրավաբանորեն անթերի հատուկ դրույթներ:
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Ընտրեք կազմվող դրույթի թեման կամ ուղղությունը.
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => setAiPromptTopic("standard_terms")}
                    className={`p-3 rounded-xl text-xs font-bold text-left border transition cursor-pointer ${
                      aiPromptTopic === "standard_terms"
                        ? "bg-blue-50 border-[#003399] text-[#003399] shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    🏛️ Ստանդարտ հատուկ պայմաններ
                  </button>
                  <button
                    onClick={() => setAiPromptTopic("bank_pledge")}
                    className={`p-3 rounded-xl text-xs font-bold text-left border transition cursor-pointer ${
                      aiPromptTopic === "bank_pledge"
                        ? "bg-blue-50 border-[#003399] text-[#003399] shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    🏦 Բանկային գրավի և շահառուի դրույթ
                  </button>
                  <button
                    onClick={() => setAiPromptTopic("claim_deductible")}
                    className={`p-3 rounded-xl text-xs font-bold text-left border transition cursor-pointer ${
                      aiPromptTopic === "claim_deductible"
                        ? "bg-blue-50 border-[#003399] text-[#003399] shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    🛡️ Հատուցման կարգ & ֆրանշիզայի դրույթ
                  </button>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleAiDraftClauses}
                    disabled={aiGenerating}
                    className="inline-flex items-center gap-2 bg-[#003399] hover:bg-[#00235B] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 ${aiGenerating ? "animate-spin" : ""}`} />
                    {aiGenerating ? "ԱԲ-ն մշակում է դրույթները..." : "Կազմել ԱԲ Դրույթներ"}
                  </button>
                </div>
              </div>

              {aiError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {aiError}
                </div>
              )}

              {aiSuggestedClauses && (
                <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-blue-900 uppercase">
                      ԱԲ Առաջարկած Պայմանագրային Դրույթները.
                    </h4>
                    <button
                      onClick={handleApplyAiClause}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Կցել Պայմանագրին
                    </button>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl text-xs text-slate-800 font-mono whitespace-pre-wrap border border-slate-200 max-h-60 overflow-y-auto">
                    {aiSuggestedClauses}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PREVIEW & EXPORT */}
          {activeTab === "preview" && (
            <div className="space-y-4">
              <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 overflow-x-auto shadow-inner">
                <style dangerouslySetInnerHTML={{ __html: contractTemplateCss() }} />
                <div
                  className="bg-white rounded-xl shadow-lg border border-slate-300"
                  dangerouslySetInnerHTML={{ __html: generateContractHtml(contractData) }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Պայմանագիր N <strong>{contractData.contractNumber}</strong> • Պոլիս N <strong>{contractData.policyNumber}</strong>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              Փակել
            </button>

            <button
              onClick={handleSaveAndIssue}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {isSaved ? "Պոլիսը Թարմացված է" : "Հաստատել և Տալ Պոլիսը"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
