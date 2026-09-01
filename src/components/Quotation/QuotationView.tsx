import { useState } from "react";
import { QuotationProposal } from "../../types";
import { formatCurrency, formatPercent, calculateCascoFromExcel } from "../../utils/insuranceCalculator";
import {
  copyProposalForWord,
  downloadProposalAsWordDoc,
  downloadProposalAsPdf,
} from "../../utils/documentExport";
import { SilLogo } from "../SilLogo";
import { generateQuotationTemplateHtml, QuotationLanguage } from "../../utils/quotationTemplate";
import { saveScenario, getScenarios, QuoteScenario } from "../../utils/scenarioStore";
import { validateQuotationProposal } from "../../utils/quoteValidation";
import { TierComparisonModal } from "./TierComparisonModal";
import { RiskScoringPanel } from "./RiskScoringPanel";
import {
  Copy,
  Download,
  Printer,
  Sparkles,
  Check,
  Shield,
  FileCheck,
  Building,
  FileText,
  RefreshCw,
  Edit3,
  Car,
  HeartPulse,
  Plane,
  Package,
  HardHat,
  Scale,
  ShieldAlert,
  Sprout,
  Layers,
  ArrowLeft,
  Globe,
} from "lucide-react";

interface QuotationViewProps {
  proposal: QuotationProposal | null;
  onEdit: () => void;
  onUpdateProposal: (updated: QuotationProposal) => void;
  onBackToCatalog?: () => void;
}

export function QuotationView(props: QuotationViewProps) {
  if (!props.proposal) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#003399] flex items-center justify-center mx-auto mb-4 border border-blue-200">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Գնառաջարկը դեռ ձևավորված չէ</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">Ընտրեք ապահովագրատեսակը Ապրանքացանկից, Գույքի 13 բաժիններից կամ Հիփոթեքային հաշվիչից՝ պաշտոնական գնառաջարկ ստանալու համար:</p>
        <button onClick={props.onEdit} className="bg-gradient-to-r from-[#003399] to-[#0066FF] hover:from-[#002D72] hover:to-[#0052CC] text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition cursor-pointer">Անցնել Ապրանքացանկին / Հարցաշարին</button>
      </div>
    );
  }
  return <FilledQuotationView {...props} proposal={props.proposal} />;
}

function FilledQuotationView({
  proposal,
  onEdit,
  onUpdateProposal,
  onBackToCatalog,
}: QuotationViewProps & { proposal: QuotationProposal }) {
  const [selectedLang, setSelectedLang] = useState<QuotationLanguage>("hy");
  const [copied, setCopied] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [scenarios, setScenarios] = useState<QuoteScenario[]>(() => getScenarios().filter(s => s.proposalId === proposal.id));
  const locked = proposal.status === "locked";
  const validationIssues = validateQuotationProposal(proposal);
  const validationErrors = validationIssues.filter(i => i.severity === "error");

  const [translatedProposals, setTranslatedProposals] = useState<Record<QuotationLanguage, QuotationProposal | null>>({
    hy: proposal,
    en: null,
    ru: null,
  });
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState("");

  const currentProposal = translatedProposals[selectedLang] || proposal;

  const handleLanguageChange = async (lang: QuotationLanguage) => {
    if (lang === "hy") {
      setSelectedLang("hy");
      return;
    }
    if (translatedProposals[lang]) {
      setSelectedLang(lang);
      return;
    }

    setTranslating(true);
    setTranslationError("");
    try {
      const res = await fetch("/api/ai/translate-proposal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("sil-auth-token") ? { Authorization: `Bearer ${localStorage.getItem("sil-auth-token")}` } : {}),
        },
        body: JSON.stringify({
          proposal,
          targetLang: lang,
        }),
      });
      if (!res.ok) throw new Error("Թարգմանությունը ձախողվեց");
      const data = await res.json();
      if (data.proposal) {
        setTranslatedProposals(prev => ({ ...prev, [lang]: data.proposal }));
        setSelectedLang(lang);
      } else {
        throw new Error(data.error || "Անհայտ սխալ");
      }
    } catch (err: any) {
      console.error("Translation error:", err);
      setTranslationError("Չհաջողվեց կատարել ավտոմատ թարգմանություն։ Ցուցադրվում է բազային տարբերակը։");
      setSelectedLang(lang);
    } finally {
      setTranslating(false);
    }
  };

  const handleCopyWord = async () => {
    const success = await copyProposalForWord(currentProposal, selectedLang);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleDownloadDoc = () => {
    downloadProposalAsWordDoc(currentProposal, selectedLang);
  };

  const handlePrint = async () => {
    setGeneratingPdf(true);
    setPdfError("");
    try {
      await downloadProposalAsPdf(currentProposal);
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      setPdfError(err?.message || "Չհաջողվեց ստեղծել PDF ֆայլը։");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSaveScenario = () => {
    const name = window.prompt("Տարբերակի անվանումը", `Տարբերակ ${scenarios.length + 1}`);
    if (name === null) return;
    const saved = saveScenario(currentProposal, name, { product: currentProposal.productNameArm, sourceVersion: currentProposal.sourceVersion || currentProposal.rulesVersion || "" });
    setScenarios(prev => [saved, ...prev]);
  };

  const handleGenerateAiAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisError("");

    try {
      const res = await fetch("/api/gemini/generate-proposal-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(localStorage.getItem("sil-auth-token") ? { Authorization: `Bearer ${localStorage.getItem("sil-auth-token")}` } : {}) },
        body: JSON.stringify({
          quotationData: proposal,
          type: proposal.type,
        }),
      });

      if (!res.ok) throw new Error("Չհաջողվեց կազմել AI վերլուծությունը");
      const data = await res.json();
      if (data.analysis) {
        onUpdateProposal({
          ...proposal,
          aiAnalysisText: data.analysis,
        });
      }
    } catch (err: any) {
      setAnalysisError(err.message || "Սխալ AI վերլուծության ժամանակ");
    } finally {
      setAnalyzing(false);
    }
  };

  const getProductIcon = (type: string) => {
    switch (type) {
      case "casco":
        return Car;
      case "health":
        return HeartPulse;
      case "travel":
        return Plane;
      case "cargo":
        return Package;
      case "construction":
        return HardHat;
      case "liability":
        return Scale;
      case "accident":
        return ShieldAlert;
      case "agro":
        return Sprout;
      case "bundle":
        return Layers;
      default:
        return Building;
    }
  };

  const shareSummary = `«SIL Insurance» Պաշտոնական Գնառաջարկ N ${proposal.quotationNumber}\n` +
    `Հաճախորդ՝ ${proposal.clientName}\n` +
    `Պրոդուկտ՝ ${proposal.productNameArm}\n` +
    `Ապահովագրական գումար՝ ${proposal.totalSumInsured.toLocaleString()} ${proposal.currency}\n` +
    `Վճարման ենթակա պրեմիա՝ ${proposal.annualPremium.toLocaleString()} ${proposal.currency}\n` +
    `Ֆրանշիզա՝ ${proposal.franchiseDescription}\n` +
    `Ակտիվ է մինչև՝ ${proposal.validUntil}`;

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareSummary)}`;
    window.open(url, "_blank");
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareSummary)}`;
    window.open(url, "_blank");
  };

  const handleShareEmail = () => {
    const url = `mailto:${proposal.contactInfo || ''}?subject=${encodeURIComponent(`SIL Insurance Գնառաջարկ N ${proposal.quotationNumber}`)}&body=${encodeURIComponent(shareSummary)}`;
    window.location.href = url;
  };

  const [copiedSummary, setCopiedSummary] = useState(false);
  const handleCopySummary = () => {
    navigator.clipboard.writeText(shareSummary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const ProductIcon = getProductIcon(proposal.type);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Action Ribbon */}
      <div className="bg-[#00235B] text-white rounded-2xl p-4 shadow-lg mb-6 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden border border-blue-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0066FF] flex items-center justify-center text-white flex-shrink-0 shadow-md">
            <ProductIcon className="w-5 h-5 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-white">
                Պաշտոնական Գնառաջարկ N {proposal.quotationNumber}
              </span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                Պատրաստ է
              </span>
            </div>
            <p className="text-xs text-blue-200">
              {proposal.productNameArm} • MS Word (.doc) և PDF
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onBackToCatalog && (
            <button
              onClick={onBackToCatalog}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer border border-white/20"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Ապրանքացանկ
            </button>
          )}

          <button
            onClick={handleCopyWord}
            id="copy-word-btn"
            className="inline-flex items-center gap-1.5 bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition cursor-pointer active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-cyan-200" />
                Պատճենված է!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-cyan-200" />
                Պատճենել Word
              </>
            )}
          </button>

          <button
            onClick={handleDownloadDoc}
            id="download-doc-btn"
            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer border border-white/20"
          >
            <Download className="w-4 h-4 text-white" />
            Ներբեռնել .doc
          </button>

          <button
            onClick={handlePrint}
            disabled={generatingPdf}
            id="print-pdf-btn"
            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium px-3 py-2 rounded-xl border border-white/20 transition cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          >
            <Printer className={`w-4 h-4 ${generatingPdf ? "animate-pulse" : ""}`} />
            {generatingPdf ? "PDF-ը պատրաստվում է..." : "Տպել / PDF"}
          </button>

          <button
            onClick={onEdit}
            disabled={locked}
            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium px-3 py-2 rounded-xl border border-white/20 transition cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            {locked ? "Փակված է" : "Խմբագրել"}
          </button>

          {!locked && (
            <button
              disabled={validationErrors.length > 0}
              onClick={() => onUpdateProposal({ ...proposal, status: "locked", lockedAt: new Date().toISOString(), lockedBy: proposal.agentName })}
              className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-500 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-2 rounded-xl transition"
            >
              <Check className="w-4 h-4" />
              Հաստատել և փակել
            </button>
          )}

          <button onClick={handleSaveScenario} className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/20">
            <Copy className="w-4 h-4" /> Պահպանել որպես տարբերակ
          </button>

          <button onClick={() => setTierModalOpen(true)} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md">
            <Sparkles className="w-4 h-4" /> Համեմատել փաթեթները
          </button>
        </div>
      </div>

      {/* Quick Share to Client Bar */}
      <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-3.5 mb-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Globe className="text-emerald-400" size={18} />
          <span className="text-xs font-bold text-slate-200">
            Ուղարկել Հաճախորդին (Quick Client Sharing):
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
          >
            💬 WhatsApp
          </button>
          <button
            onClick={handleShareTelegram}
            className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
          >
            ✈️ Telegram
          </button>
          <button
            onClick={handleShareEmail}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            ✉️ Email
          </button>
          <button
            onClick={handleCopySummary}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            {copiedSummary ? "✓ Պատճենված է" : "📋 Պատճենել SMS / Text"}
          </button>
        </div>
      </div>

      <div className="mb-6 print:hidden">
        <RiskScoringPanel productType={proposal.type} quotationData={proposal} annualPremium={proposal.annualPremium} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4 print:hidden">
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 font-semibold">Կարգավիճակ՝ {locked ? "Փակված" : proposal.status === "sent" ? "Ուղարկված" : "Պատրաստ"}</span>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 font-semibold">Տարբերակ՝ v{proposal.version || 1}</span>
        {proposal.rulesVersion && <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 font-semibold">Կանոններ՝ {proposal.rulesVersion}</span>}
        {proposal.calculatorVersion && <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 font-semibold">Հաշվիչ՝ {proposal.calculatorVersion}</span>}
      </div>

      {validationIssues.length > 0 && (
        <div className={`rounded-2xl border p-4 mb-4 print:hidden ${validationErrors.length ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
          <div className="font-black text-sm mb-2">Գնառաջարկի ստուգման checklist</div>
          <div className="space-y-1.5 text-xs">
            {validationIssues.map((issue, i) => <div key={i} className={issue.severity === "error" ? "text-red-800" : "text-amber-800"}>{issue.severity === "error" ? "✕" : "⚠"} {issue.message}</div>)}
          </div>
        </div>
      )}

      {copied && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-medium px-4 py-2.5 rounded-xl mb-4 flex items-center justify-between shadow-xs print:hidden animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>
              Գնառաջարկի ամբողջական կառուցվածքը աղյուսակներով և ոճավորմամբ պատճենվեց: Բացեք Microsoft Word և սեղմեք <strong>Ctrl + V</strong>:
            </span>
          </div>
        </div>
      )}

      {scenarios.length > 0 && (
        <div className="sil-card p-4 mb-6 print:hidden">
          <div className="flex items-center justify-between gap-3"><div><h3 className="font-black text-sm">Պահպանված սցենարներ</h3><p className="text-[11px] text-slate-500">Սցենարները չեն փոխում հիմնական գնառաջարկը։</p></div><span className="text-xs font-bold text-slate-500">{scenarios.length} տարբերակ</span></div>
          <div className="grid md:grid-cols-3 gap-2 mt-3">
            {scenarios.map(s => <div key={s.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50"><div className="font-bold text-xs truncate">{s.name}</div><div className="text-[11px] text-slate-600 mt-1">{formatCurrency(s.premium, proposal.currency)} · {formatPercent(s.tariff)}</div></div>)}
          </div>
        </div>
      )}

      {/* AI Underwriting Analysis Request Banner */}
      {!proposal.aiAnalysisText && (
        <div className="bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-slate-100 border border-blue-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#003399] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-[#0066FF]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Ավելացնել AI Անդեռռայթինգային & Ռիսկերի Փորձագիտական Եզրակացություն
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600">
                Gemini AI-ը կվերլուծի տվյալները և կգեներացնի պաշտոնական հիմնավորում ղեկավարության կամ գործընկեր բանկի համար:
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateAiAnalysis}
            disabled={analyzing}
            className="inline-flex items-center gap-1.5 bg-[#003399] hover:bg-[#002D72] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50 flex-shrink-0"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Վերլուծվում է...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                Գեներացնել AI Եզրակացություն
              </>
            )}
          </button>
        </div>
      )}

      {analysisError && (
        <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl mb-4 border border-red-200 print:hidden">
          {analysisError}
        </div>
      )}

      {pdfError && (
        <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl mb-4 border border-red-200 print:hidden flex items-center justify-between gap-3">
          <span>{pdfError}</span>
          <button
            type="button"
            onClick={() => setPdfError("")}
            className="font-bold underline"
          >
            Փակել
          </button>
        </div>
      )}

      {/* Language Switcher Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 mb-4 text-white flex flex-wrap items-center justify-between gap-3 print:hidden shadow-lg">
        <div className="flex items-center gap-2">
          <Globe className="text-blue-400" size={18} />
          <span className="text-xs font-bold text-slate-200">
            Փաստաթղթի Լեզուն (Multi-Language Quotation):
          </span>
          {translating && (
            <span className="text-[11px] font-semibold text-cyan-300 animate-pulse flex items-center gap-1.5 ml-2">
              <RefreshCw size={12} className="animate-spin" />
              Կատարվում է ԱԲ պրոֆեսիոնալ թարգմանություն...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => handleLanguageChange("hy")}
            disabled={translating}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedLang === "hy"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-white disabled:opacity-50"
            }`}
          >
            🇦🇲 Հայերեն
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange("en")}
            disabled={translating}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedLang === "en"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-white disabled:opacity-50"
            }`}
          >
            🇬🇧 English
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange("ru")}
            disabled={translating}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedLang === "ru"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-white disabled:opacity-50"
            }`}
          >
            🇷🇺 Русский
          </button>
        </div>
      </div>

      {translationError && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl mb-4 border border-red-200">
          ⚠️ {translationError}
        </div>
      )}

      {/* THE OFFICIAL DOCUMENT PAPER CANVAS */}
      <div
        id="quotation-document"
        className="bg-white border border-slate-300 shadow-xl rounded-2xl overflow-hidden text-slate-900 print:border-none print:shadow-none print:rounded-none relative"
      >
        {translating && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
            <RefreshCw size={36} className="text-[#075bd5] animate-spin" />
            <b className="text-sm text-slate-800">ԱԲ-ն թարգմանում է գնառաջարկի ամբողջական տեքստը...</b>
            <span className="text-xs text-slate-500">Սա կարող է տևել մի քանի վայրկյան</span>
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: generateQuotationTemplateHtml(currentProposal, selectedLang) }} />
      </div>

      <TierComparisonModal
        isOpen={tierModalOpen}
        onClose={() => setTierModalOpen(false)}
        productName={proposal.productNameArm}
        onSelectTier={(tierId) => {
          if (proposal.type === "casco") {
            // Recompute deterministically using CASCO Excel rules based on tier configuration
            const cascoData = {
              clientName: proposal.clientName,
              phone: proposal.contactInfo,
              email: "",
              vehicleMake: proposal.productSpecificDetails?.makeModel?.split(" ")[0] || "Toyota",
              vehicleModel: proposal.productSpecificDetails?.makeModel?.split(" ").slice(1).join(" ") || "RAV4",
              manufactureYear: Number(proposal.productSpecificDetails?.year || 2022),
              marketValue: proposal.totalSumInsured,
              currency: proposal.currency as any,
              policyholderType: "Ֆիզիկական անձ" as const,
              coverageType: "comprehensive" as const,
              franchiseType: "fixed" as const,
              driverMinAge: 25,
              driverMinExp: 3,
              franchiseOption: tierId === "platinum" ? "Մինիմալ ֆրանշիզա" as const : tierId === "comfort" ? "Ֆրանշիզայի կիսում" as const : "Ֆրանշիզան անփոփոխ" as const,
              franchiseAmount: tierId === "platinum" ? 0 : tierId === "comfort" ? 25000 : 50000,
              warrantyService: tierId === "platinum" ? "ներառել" as const : "չներառել" as const,
              driverCountOption: "Անսահմանափակ" as const,
              bonusMalus: "<=7" as const,
              lossRatio: "չընտրել" as const,
              paymentMethod: "Միանվագ" as const,
              trafficRules: tierId === "platinum" ? "ներառել" as const : "չներառել" as const,
              theftCoverage: "ներառել" as const,
              territory: "Միայն ՀՀ" as const,
              electricVehicle: false,
              isPledged: false,
              isUnlimitedDrivers: true,
              includeGlassNoPolice: tierId !== "standard",
              includeTowingAssistance: tierId !== "standard",
              baseTariff: 3.5,
              discount: 0,
            };
            const calc = calculateCascoFromExcel(cascoData);
            onUpdateProposal({
              ...proposal,
              finalTariff: calc.finalTariff * 100,
              annualPremium: calc.annualPremium,
              internalNotes: `${proposal.internalNotes || ""}\nԿարգավորված է ըստ ${tierId} ֆիքսված ապահովագրական պայմանների (Excel հաշվիչի հիման վրա)`,
              specialConditions: [...(proposal.specialConditions || []), `Ընտրված ապահովագրական փաթեթ՝ ${tierId} (Հաշվարկված է ըստ Excel ավտոմատ կանոնների)`],
            });
          } else {
            // For other products, keep fixed authoritative formula rules
            const multiplier = tierId === "platinum" ? 1.35 : tierId === "comfort" ? 1.15 : 1.0;
            const newPremium = Math.round(proposal.annualPremium * multiplier);
            onUpdateProposal({
              ...proposal,
              annualPremium: newPremium,
              internalNotes: `${proposal.internalNotes || ""}\nԸնտրված փաթեթ՝ ${tierId}`,
              specialConditions: [...(proposal.specialConditions || []), `Ընտրված ապահովագրական փաթեթ՝ ${tierId}`],
            });
          }
        }}
      />

    </div>
  );
}
