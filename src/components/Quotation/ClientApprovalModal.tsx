import { useState } from "react";
import {
  X,
  Send,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  Smartphone,
  ExternalLink,
  MessageSquare,
  FileCheck,
  ShieldCheck,
  ThumbsUp,
  AlertCircle
} from "lucide-react";
import { QuotationProposal } from "../../types";
import { formatCurrency } from "../../utils/insuranceCalculator";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  proposal: QuotationProposal;
  onProposalAccepted: (updated: QuotationProposal) => void;
}

export function ClientApprovalModal({ isOpen, onClose, proposal, onProposalAccepted }: Props) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeView, setActiveView] = useState<"link_generator" | "client_preview">("link_generator");
  const [clientFeedback, setClientFeedback] = useState("");
  const [clientSignatureName, setClientSignatureName] = useState(proposal.clientName || "");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [actionDoneMessage, setActionDoneMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const clientPortalUrl = `${window.location.origin}/#quote-approval-${proposal.quotationNumber}`;

  const shareText = `Հարգելի ${proposal.clientName || "հաճախորդ"},\n\nՁեր «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ապահովագրական գնառաջարկը (N ${proposal.quotationNumber}) պատրաստ է:\n\n` +
    `• Պրոդուկտ՝ ${proposal.productNameArm}\n` +
    `• Ապահովագրական գումար՝ ${formatCurrency(proposal.totalSumInsured, proposal.currency)}\n` +
    `• Տարեկան ապահովագրավճար՝ ${formatCurrency(proposal.annualPremium, proposal.currency)}\n` +
    `• Ֆրանշիզա՝ ${proposal.franchiseDescription}\n\n` +
    `Կարող եք ծանոթանալ մանրամասներին և հաստատել առաջարկը առցանց հետևյալ հղումով՝\n${clientPortalUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(clientPortalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  const handleSendTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(clientPortalUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  const handleClientAccept = () => {
    if (!termsAgreed) {
      alert("Հաստատման համար անհրաժեշտ է նշել համաձայնության վանդակը:");
      return;
    }
    const updated: QuotationProposal = {
      ...proposal,
      status: "accepted",
      internalNotes: `${proposal.internalNotes || ""}\n[Առցանց Հաստատում] Հաճախորդ ${clientSignatureName} կողմից հաստատվել է ${new Date().toLocaleString("hy-AM")}-ին:`,
      specialConditions: [
        ...(proposal.specialConditions || []),
        `Առցանց էլեկտրոնային հաստատում հաճախորդի կողմից (${new Date().toLocaleDateString("hy-AM")})`,
      ],
    };
    onProposalAccepted(updated);
    setActionDoneMessage("Շնորհակալություն: Գնառաջարկը հաջողությամբ հաստատվեց հաճախորդի կողմից:");
  };

  const handleClientRequestChanges = () => {
    if (!clientFeedback.trim()) {
      alert("Խնդրում ենք նշել փոփոխության կամ դիտողության մանրամասները:");
      return;
    }
    const updated: QuotationProposal = {
      ...proposal,
      internalNotes: `${proposal.internalNotes || ""}\n[Հաճախորդի փոփոխության պահանջ ${new Date().toLocaleString("hy-AM")}]: ${clientFeedback}`,
    };
    onProposalAccepted(updated);
    setActionDoneMessage("Ձեր առաջարկությունները փոխանցվեցին գործակալին/անդեռռայթերին:");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00235B] via-[#003399] to-[#0066FF] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Smartphone className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                Հաճախորդի Առցանց Հաստատում (Client Engagement Link)
              </h3>
              <p className="text-xs text-blue-100">
                Գնառաջարկ N {proposal.quotationNumber} · Ինտերակտիվ առցանց հաստատում
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* View Switcher */}
        <div className="bg-slate-100 p-2 flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveView("link_generator")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeView === "link_generator"
                ? "bg-white text-[#003399] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Send size={14} /> 1. Ուղարկել Հղումը Հաճախորդին
          </button>
          <button
            type="button"
            onClick={() => setActiveView("client_preview")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeView === "client_preview"
                ? "bg-white text-[#003399] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Smartphone size={14} /> 2. Ինտերակտիվ Դիտում (Client Interactive Portal)
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {actionDoneMessage ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="font-extrabold text-lg text-slate-900">{actionDoneMessage}</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Գնառաջարկի կարգավիճակը թարմացվել է համակարգում։ Կարող եք անցնել պայմանագրի և ապահովագրական վկայագրի կազմմանը։
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-[#003399] text-white font-bold text-xs rounded-xl shadow-md hover:bg-[#00235B] transition"
              >
                Վերադառնալ Գնառաջարկին
              </button>
            </div>
          ) : activeView === "link_generator" ? (
            <div className="space-y-6">
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 font-bold text-xs text-[#003399] mb-1">
                  <ShieldCheck size={16} /> Անվտանգ Անհատական Հղում
                </div>
                <p className="text-xs text-slate-600">
                  Հաճախորդը կարող է ցանկացած սարքից (հեռախոս, պլանշետ) դիտել առաջարկը և 1 սեղմումով հաստատել այն:
                </p>
              </div>

              {/* Link Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Հաճախորդի պորտալի հղումը (Quote URL)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={clientPortalUrl}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 bg-[#003399] hover:bg-[#00235B] text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {copiedLink ? <Check size={14} className="text-cyan-300" /> : <Copy size={14} />}
                    {copiedLink ? "Պատճենվեց" : "Պատճենել"}
                  </button>
                </div>
              </div>

              {/* Quick Channel Sharing */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Արագ ուղարկում մեսենջերով
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
                  >
                    <MessageSquare size={16} /> Ուղարկել WhatsApp-ով
                  </button>
                  <button
                    type="button"
                    onClick={handleSendTelegram}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition shadow-sm cursor-pointer"
                  >
                    <Send size={16} /> Ուղարկել Telegram-ով
                  </button>
                </div>
              </div>

              {/* Preview simulated button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Կարող եք փորձարկել հաճախորդի էջը անմիջապես այստեղ՝
                </span>
                <button
                  type="button"
                  onClick={() => setActiveView("client_preview")}
                  className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Բացել Ինտերակտիվ Դիտումը <ExternalLink size={12} />
                </button>
              </div>
            </div>
          ) : (
            /* Client Interactive Portal Preview */
            <div className="space-y-5 bg-slate-50 rounded-2xl p-5 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    Հաճախորդի Առցանց Պորտալ
                  </span>
                  <h4 className="font-extrabold text-base text-slate-900 mt-1">
                    «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՊԱՀՈՎԱԳՐԱԿԱՆ ԳՆԱՌԱՋԱՐԿ
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Գործող է մինչև</span>
                  <span className="text-xs font-bold text-slate-700">{proposal.validUntil}</span>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] text-slate-500 block">Ապահովադիր</span>
                  <strong className="text-xs text-slate-800 block truncate">{proposal.clientName}</strong>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] text-slate-500 block">Ապահովագրական Գումար</span>
                  <strong className="text-xs text-[#003399]">
                    {formatCurrency(proposal.totalSumInsured, proposal.currency)}
                  </strong>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-500 block">Տարեկան Վճար</span>
                  <strong className="text-xs text-emerald-600 font-bold">
                    {formatCurrency(proposal.annualPremium, proposal.currency)}
                  </strong>
                </div>
              </div>

              {/* Covered Perils Mini List */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" /> Ներառված ծածկույթներ և ռիսկեր
                </span>
                <ul className="text-xs text-slate-600 space-y-1 pl-1">
                  {proposal.coveredPerilsList.slice(0, 5).map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">✓</span> {risk}
                    </li>
                  ))}
                  {proposal.coveredPerilsList.length > 5 && (
                    <li className="text-[11px] text-slate-400 italic">
                      + ևս {proposal.coveredPerilsList.length - 5} ծածկույթ...
                    </li>
                  )}
                </ul>
              </div>

              {/* Franchise note */}
              <div className="text-xs text-slate-600 bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <strong>Ֆրանշիզա (Չհատուցվող գումար)՝</strong> {proposal.franchiseDescription}
              </div>

              {/* Interactive Agreement Checkbox */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="w-4 h-4 rounded text-[#003399] mt-0.5"
                  />
                  <span className="text-xs text-slate-700">
                    Ես ծանոթացել եմ «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ ապահովագրական պայմաններին և տալիս եմ իմ համաձայնությունը:
                  </span>
                </label>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Էլեկտրոնային Ստորագրություն (Հաստատող անձի Ա․Ա․)
                  </label>
                  <input
                    type="text"
                    value={clientSignatureName}
                    onChange={(e) => setClientSignatureName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 font-medium"
                    placeholder="Անուն Ազգանուն"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleClientAccept}
                    disabled={!termsAgreed}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ThumbsUp size={15} /> Հաստատել Առաջարկը (Accept Quote)
                  </button>
                </div>
              </div>

              {/* Request changes feedback accordion */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-amber-500" /> Ցանկանու՞մ եք փոփոխություն առաջարկում
                </span>
                <textarea
                  value={clientFeedback}
                  onChange={(e) => setClientFeedback(e.target.value)}
                  placeholder="Նշեք, եթե ցանկանում եք փոխել ապահովագրական գումարը, ֆրանշիզան կամ ավելացնել ծածկույթներ..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg h-16 resize-none"
                />
                <button
                  type="button"
                  onClick={handleClientRequestChanges}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                >
                  Ուղարկել Դիտողությունը Գործակալին
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
