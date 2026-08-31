import React, { useState } from "react";
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  FileCheck2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Loader2,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { SIL_PRODUCT_CONDITIONS, OfficialConditionInfo } from "../../data/productConditionsData";

interface ProductOfficialConditionsBlockProps {
  productId: string;
  onAiParsedData?: (data: any) => void;
}

export function ProductOfficialConditionsBlock({
  productId,
  onAiParsedData,
}: ProductOfficialConditionsBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"perils" | "exclusions" | "settlement">("perils");
  const [showAiModal, setShowAiModal] = useState(false);
  const [rawText, setRawText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseSuccessMsg, setParseSuccessMsg] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const conditionInfo: OfficialConditionInfo | undefined = SIL_PRODUCT_CONDITIONS[productId];

  if (!conditionInfo) return null;

  const handleAiParse = async (textToParse?: string) => {
    const content = textToParse || rawText;
    if (!content.trim()) return;

    setIsParsing(true);
    setParseError(null);
    setParseSuccessMsg(null);

    try {
      const res = await fetch("/api/gemini/parse-questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content, product: productId }),
      });

      if (!res.ok) {
        throw new Error("Սերվերի պատասխանը սխալ է");
      }

      const json = await res.json();
      if (json.data) {
        if (onAiParsedData) {
          onAiParsedData(json.data);
        }
        setParseSuccessMsg("Տվյալները հաջողությամբ վերլուծվեցին և լրացվեցին հաշվարկային ձևում։");
        setTimeout(() => {
          setShowAiModal(false);
          setParseSuccessMsg(null);
        }, 1200);
      } else {
        throw new Error("Տվյալներ չեն գտնվել");
      }
    } catch (err: any) {
      setParseError(err?.message || "Չհաջողվեց ավտոմատ վերլուծել տեքստը");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden mb-6">
      {/* Header Banner */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                SIL INSURANCE ՊԱՇՏՈՆԱԿԱՆ ՊԱՅՄԱՆՆԵՐ
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Հաստատված 2024
              </span>
            </div>
            <div className="text-sm font-black text-white">{conditionInfo.titleArm}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onAiParsedData && (
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Լրացում / Հարցաշար
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1 transition-all"
          >
            {isOpen ? (
              <>
                Փակել պայմանները <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Դիտել պայմանները <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-200">
            {conditionInfo.summary}
          </p>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("perils")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "perils"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Ծածկվող ռիսկեր ({conditionInfo.coveredPerils.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("exclusions")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "exclusions"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Պաշտոնական բացառություններ ({conditionInfo.exclusions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settlement")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "settlement"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Ֆրանշիզա և հատուցման կարգ
            </button>
          </div>

          {/* Tab 1: Perils */}
          {activeTab === "perils" && (
            <div className="grid sm:grid-cols-2 gap-2.5">
              {conditionInfo.coveredPerils.map((peril, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      {peril.name}
                      {peril.isCore && (
                        <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-md">
                          Հիմնական
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{peril.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Exclusions */}
          {activeTab === "exclusions" && (
            <div className="grid sm:grid-cols-2 gap-2.5">
              {conditionInfo.exclusions.map((ex, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-red-50/60 border border-red-200 flex items-start gap-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-red-950">{ex.name}</div>
                    <div className="text-[11px] text-red-700 mt-0.5">{ex.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Settlement & Franchise */}
          {activeTab === "settlement" && (
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Ֆրանշիզայի և Հատուցման Կանոններ
                </div>
                <div className="text-slate-700">
                  <span className="font-semibold">Տիպիկ ֆրանշիզա՝</span>{" "}
                  {conditionInfo.settlementAndFranchise.typicalFranchise}
                </div>
                <div className="text-slate-700">
                  <span className="font-semibold">Տեսակ՝</span>{" "}
                  {conditionInfo.settlementAndFranchise.franchiseType}
                </div>
                <div className="text-slate-700">
                  <span className="font-semibold">Ծանուցման ժամկետ՝</span>{" "}
                  {conditionInfo.settlementAndFranchise.noticePeriodHours} ժամվա ընթացքում
                </div>
                <div className="text-slate-700">
                  <span className="font-semibold">Հատուցման հիմք՝</span>{" "}
                  {conditionInfo.settlementAndFranchise.settlementBasis}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  Պահանջվող Փաստաթղթեր
                </div>
                <ul className="space-y-1 text-slate-700">
                  {conditionInfo.settlementAndFranchise.claimDocsRequired.map((doc, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-600 flex items-center justify-between pt-2 border-t border-slate-200">
            <span>Աղբյուր փաստաթուղթ՝ {conditionInfo.sourceDocName}</span>
            <span className="font-mono text-[10px] text-slate-600">{conditionInfo.sourceFile}</span>
          </div>
        </div>
      )}

      {/* AI Parse Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    AI Անդեռռայթինգ Օգնական
                  </div>
                  <div className="text-sm font-black text-white">
                    {conditionInfo.titleArm} — Ավտոմատ Լրացում
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600">
                Տեղադրեք հարցաշարի, հայտի, պայմանագրի, հաշիվ-ապրանքագրի կամ նամակի տեքստը, կամ
                ընտրեք օրինակային սցենարներից մեկը:
              </p>

              {/* Sample Scenarios */}
              {conditionInfo.sampleScenarios && conditionInfo.sampleScenarios.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700">Օրինակային սցենարներ՝</div>
                  <div className="flex flex-wrap gap-2">
                    {conditionInfo.sampleScenarios.map((sc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setRawText(sc.prompt);
                          handleAiParse(sc.prompt);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-xs font-semibold text-left transition-all"
                      >
                        ⚡ {sc.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Տեքստ / Հարցաշար / Հայտ
                </label>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Օրինակ՝ Ապահովադիր՝ Արմեն Կարապետյան, Հեռ․՝ +374 91 123456, Բեռ՝ Էլեկտրոնիկա Գերմանիայից..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs font-medium text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {parseSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {parseSuccessMsg}
                </div>
              )}

              {parseError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  {parseError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Չեղարկել
                </button>
                <button
                  type="button"
                  disabled={isParsing || !rawText.trim()}
                  onClick={() => handleAiParse()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Վերլուծվում է...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Վերլուծել և Լրացնել
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
