import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, FileText, RefreshCw, Route, ShieldAlert, Sparkles, Building2, Car, Upload, Check, ShieldCheck, HelpCircle, FileSearch, ArrowRight, Printer, AlertOctagon } from 'lucide-react';
import type { QuotationProposal } from '../types';
import { ListAmPropertyValuationCalculator } from './Property/ListAmPropertyValuationCalculator';
import { ListAmVehicleValuationCalculator } from './Casco/ListAmVehicleValuationCalculator';

type TabType = 'overview' | 'duplicates' | 'next' | 'renewals' | 'documents' | 'property-valuation' | 'vehicle-valuation' | 'compliance';

const PRODUCT_NAMES_ARM: Record<string, string> = {
  casco: "ԿԱՍԿՈ ապահովագրություն",
  property: "Գույքի ապահովագրություն",
  health: "Առողջության ապահովագրություն",
  travel: "Ճանապարհորդության ապահովագրություն",
  cargo: "Բեռների ապահովագրություն",
  mortgage: "Հիփոթեքային ապահովագրություն",
  liability: "Պատասխանատվության ապահովագրություն",
  construction: "Շինմոնտաժային ռիսկեր",
  accident: "Դժբախտ պատահարներ",
  agro: "Ագրոապահովագրություն",
  financial: "Ֆինանսական ռիսկեր",
  aviation: "Ավիացիոն ռիսկեր",
};

export function SmartOperations({ quotes }: { quotes: QuotationProposal[] }) {
  const [tab, setTab] = useState<TabType>('overview');
  
  // Compliance state
  const [selectedProduct, setSelectedProduct] = useState<string>('casco');
  const [contractText, setContractText] = useState<string>('');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<any | null>(null);
  const [auditError, setAuditError] = useState<string>('');

  const duplicates = useMemo(() => {
    const m = new Map<string, QuotationProposal[]>();
    quotes.forEach(q => {
      const k = [q.clientName, q.type, (q as any).vin || '', q.totalSumInsured].join('|').toLowerCase();
      m.set(k, [...(m.get(k) || []), q]);
    });
    return [...m.values()].filter(x => x.length > 1);
  }, [quotes]);

  const next = (q: QuotationProposal) =>
    q.underwriting?.status === 'manual_review'
      ? 'Ուղարկել Underwriter-ի ստուգման'
      : q.status === 'locked'
      ? 'Պատրաստ է ուղարկման/արխիվացման'
      : (q as any).documentsMissing?.length
      ? 'Լրացնել բացակայող փաստաթղթերը'
      : 'Ստուգել և ուղարկել գնառաջարկը';

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      setContractText(text);
    } catch (err) {
      console.error(err);
      alert("Ֆայլը կարդալիս սխալ է տեղի ունեցել:");
    }
  };

  const handleRunComplianceAudit = async () => {
    if (!contractText.trim()) {
      setAuditError("Խնդրում ենք տեղադրել կամ վերբեռնել պայմանագրի / գնառաջարկի տեքստը:");
      return;
    }
    setIsAuditing(true);
    setAuditError("");
    setAuditResult(null);

    try {
      const res = await fetch("/api/ai/check-compliance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("sil-auth-token") ? { Authorization: `Bearer ${localStorage.getItem("sil-auth-token")}` } : {}),
        },
        body: JSON.stringify({
          productId: selectedProduct,
          contractText: contractText,
        }),
      });

      if (!res.ok) throw new Error("Չհաջողվեց կապ հաստատել ԱԲ-ի հետ");
      const data = await res.json();
      if (data.status === "ok" && data.compliance) {
        setAuditResult(data.compliance);
      } else {
        throw new Error(data.error || "Անհայտ սխալ");
      }
    } catch (err: any) {
      setAuditError(err.message || "Համապատասխանության ստուգման ժամանակ սխալ տեղի ունեցավ:");
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-5">
      <div className="rounded-[28px] bg-gradient-to-r from-[#061A40] to-[#075bd5] text-white p-7 shadow-lg">
        <div className="text-cyan-200 text-xs font-black tracking-[.18em]">SMART OPERATIONS</div>
        <h1 className="text-3xl font-black mt-2">Խելացի աշխատանքային կենտրոն</h1>
        <p className="text-blue-100 text-sm mt-2">
          ԱԲ պայմանագրերի ավտոմատ ստուգում (Compliance), կրկնվող հայտերի հայտնաբերում, List.am շուկայական գնահատում և փաստաթղթերի վերահսկում։
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl border">
        {[
          ['overview', '🏠 Գլխավոր պատուհան'],
          ['compliance', '🔍 ԱԲ Պայմանագրերի Աուդիտ'],
          ['vehicle-valuation', '🚗 List.am ԿԱՍԿՈ Գնահատիչ'],
          ['property-valuation', '🏢 List.am Գույքի Գնահատիչ'],
          ['duplicates', '👥 Կրկնվող հայտեր'],
          ['next', '⚡ Խելացի գործողություններ'],
          ['renewals', '📅 Երկարաձգումներ'],
          ['documents', '📂 Փաստաթղթերի կենտրոն']
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as TabType)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
              tab === id ? 'bg-[#075bd5] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid md:grid-cols-3 gap-4">
          <Metric icon={Copy} title="Հնարավոր կրկնվող հայտեր" value={duplicates.length} />
          <Metric icon={Route} title="Ակտիվ գնառաջարկներ" value={quotes.filter(q => q.status !== 'locked').length} />
          <Metric icon={ShieldAlert} title="Սպասող Underwriting" value={quotes.filter(q => q.underwriting?.status === 'manual_review').length} />
        </div>
      )}

      {tab === 'compliance' && (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left panel: Inputs */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sil-card p-6 space-y-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Պայմանագրի / Գնառաջարկի Ստուգում ԱԲ-ով</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Վերբեռնեք ցանկացած կազմված պայմանագիր կամ գնառաջարկ, և ԱԲ-ն այն կհամեմատի մեր պաշտոնական Ապահովագրական Պայմանների (Knowledge Base) հետ:
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Ապահովագրատեսակ (Կանոններ)</label>
                <select
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                  className="sil-input text-xs"
                >
                  {Object.entries(PRODUCT_NAMES_ARM).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Drag and Drop area */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center bg-slate-50 hover:bg-slate-100/80 transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".txt,.docx,.doc,.json"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
                  <Upload size={22} className="text-[#075bd5] animate-pulse" />
                  <span className="text-xs font-bold text-slate-700">Քաշեք և գցեք կամ ընտրեք պայմանագրի ֆայլը</span>
                  <span className="text-[10px] text-slate-400">Ընդունվում է .txt, .json և այլ տեքստային ֆայլեր</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Պայմանագրի / Գնառաջարկի Տեքստը</label>
                <textarea
                  value={contractText}
                  onChange={e => setContractText(e.target.value)}
                  placeholder="Այստեղ տեղադրեք ստուգվող պայմանագրի կամ առաջարկի ամբողջական տեքստը կամ պայմանները..."
                  rows={12}
                  className="sil-input text-xs font-sans leading-relaxed min-h-[250px]"
                />
              </div>

              {auditError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                  ⚠️ {auditError}
                </div>
              )}

              <button
                onClick={handleRunComplianceAudit}
                disabled={isAuditing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#003399] to-[#075bd5] hover:from-[#002570] hover:to-[#004bbd] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition cursor-pointer"
              >
                {isAuditing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Կատարվում է ԱԲ ստուգում...
                  </>
                ) : (
                  <>
                    <FileSearch size={14} />
                    Ստուգել համապատասխանությունը
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right panel: Audit Report */}
          <div className="lg:col-span-7">
            {isAuditing && (
              <div className="sil-card p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
                <RefreshCw size={44} className="text-[#075bd5] animate-spin" style={{ animationDuration: '4s' }} />
                <h3 className="text-md font-black text-slate-900">ԱԲ-ն իրականացնում է համապատասխանության ստուգում...</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Մենք վերլուծում ենք պայմանագրի տեքստը և համեմատում այն «ՍԻԼ ԻՆՇՈՒՐԱՆՍ»-ի պաշտոնական պայմանների, սակագների ու բացառությունների հետ։
                </p>
              </div>
            )}

            {!isAuditing && !auditResult && (
              <div className="sil-card p-12 flex flex-col items-center justify-center text-center space-y-3 min-h-[400px] bg-slate-50 border border-dashed">
                <ShieldCheck size={44} className="text-slate-300" />
                <h3 className="text-md font-bold text-slate-700">Աուդիտի արդյունքները պատրաստ չեն</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Ձախ կողմում տեղադրեք կամ վերբեռնեք պայմանագիրը և սեղմեք «Ստուգել»՝ ԱԲ-ի վերլուծությունը ստանալու համար։
                </p>
              </div>
            )}

            {!isAuditing && auditResult && (
              <div className="sil-card p-6 space-y-6 bg-white animate-fade-in relative border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 tracking-wider">COMPLIANCE REPORT</span>
                    <h2 className="text-xl font-black text-slate-900">ԱԲ Համապատասխանության Եզրակացություն</h2>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => window.print()} className="p-2 border rounded-xl hover:bg-slate-50 transition print:hidden" title="Տպել զեկույցը">
                      <Printer size={15} />
                    </button>
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                      auditResult.status === 'green'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : auditResult.status === 'yellow'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {auditResult.status === 'green' ? <Check size={14} /> : <AlertOctagon size={14} />}
                      {auditResult.statusLabel || "Պատրաստ է"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Գործադիր Ամփոփագիր</h3>
                  <div className="p-4 bg-slate-50 rounded-2xl text-xs leading-relaxed text-slate-700 border">
                    {auditResult.summary}
                  </div>
                </div>

                {auditResult.findings && auditResult.findings.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Հայտնաբերված շեղումներ և փաստեր</h3>
                    <div className="overflow-x-auto border rounded-2xl">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 font-bold text-slate-700 border-b">
                          <tr>
                            <th className="p-3">Տեսակ</th>
                            <th className="p-3">Խնդիր / Նկարագրություն</th>
                            <th className="p-3">Լրջություն</th>
                            <th className="p-3">Աղբյուր հղում</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-slate-800">
                          {auditResult.findings.map((f: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition">
                              <td className="p-3 font-bold text-slate-900">{f.type}</td>
                              <td className="p-3 leading-relaxed">{f.description}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                                  f.severity === 'danger'
                                    ? 'bg-red-50 text-red-700 border border-red-100'
                                    : f.severity === 'warning'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}>
                                  {f.severity === 'danger' ? 'Լուրջ' : f.severity === 'warning' ? 'Միջին' : 'Տեղեկատվական'}
                                </span>
                              </td>
                              <td className="p-3 text-[11px] text-slate-500 font-medium font-mono">{f.reference || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {auditResult.recommendations && auditResult.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Առաջարկվող ուղղումներ</h3>
                    <ul className="space-y-1.5">
                      {auditResult.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="flex gap-2 text-xs text-slate-700">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 font-medium text-center pt-4 border-t">
                  Այս աուդիտը գեներացվել է ավտոմատ կերպով «ՍԻԼ ԻՆՇՈՒՐԱՆՍ»-ի ԱԲ համակարգի կողմից՝ հիմնվելով ներբեռնված գիտելիքների բազայի վրա։
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'vehicle-valuation' && <div className="sil-card p-6"><ListAmVehicleValuationCalculator /></div>}
      {tab === 'property-valuation' && <div className="sil-card p-6"><ListAmPropertyValuationCalculator /></div>}

      {tab === 'duplicates' && (
        <div className="sil-card p-6">
          <h2 className="text-xl font-black mb-4">Կրկնվող գնառաջարկների հայտնաբերում</h2>
          {duplicates.map((group, i) => (
            <div key={i} className="border rounded-2xl p-4 mb-3">
              <div className="flex gap-2 items-center font-black text-amber-700">
                <AlertTriangle size={17} /> Հնարավոր կրկնվող հայտ
              </div>
              {group.map(q => (
                <div key={q.id} className="mt-2 text-sm">
                  {q.quotationNumber} · {q.clientName} · {q.productNameArm}
                </div>
              ))}
            </div>
          ))}
          {!duplicates.length && <Empty text="Կրկնվող գնառաջարկ չի հայտնաբերվել։" />}
        </div>
      )}

      {tab === 'next' && (
        <div className="sil-card p-6">
          <h2 className="text-xl font-black mb-4">Խելացի հաջորդ քայլեր</h2>
          {quotes.slice(0, 30).map(q => (
            <div key={q.id} className="flex flex-wrap justify-between gap-3 p-3 border-b">
              <div>
                <b>{q.quotationNumber}</b>
                <div className="text-xs text-slate-500">{q.clientName} · {q.productNameArm}</div>
              </div>
              <span className="text-sm font-bold text-[#075bd5]">{next(q)}</span>
            </div>
          ))}
          {!quotes.length && <Empty text="Գնառաջարկներ դեռ չկան։" />}
        </div>
      )}

      {tab === 'renewals' && (
        <div className="sil-card p-6">
          <h2 className="text-xl font-black mb-4">Պայմանագրերի երկարաձգում (Renewals)</h2>
          <p className="text-sm text-slate-500 mb-4">
            Պայմանագրերի ժամկետները կարող են միացվել այստեղ՝ renewal workflow-ի համար։
          </p>
          {quotes.slice(0, 20).map(q => (
            <div key={q.id} className="p-3 border-b text-sm">
              <b>{q.quotationNumber}</b> · {q.clientName}
              <span className="ml-2 text-xs text-slate-500">Երկարաձգման ամսաթիվ՝ տվյալ չկա</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'documents' && (
        <div className="sil-card p-6">
          <h2 className="text-xl font-black mb-4">Փաստաթղթերի կենտրոն</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {quotes.slice(0, 15).map(q => (
              <div key={q.id} className="rounded-2xl border p-4">
                <FileText className="text-[#075bd5]" />
                <b className="block mt-3">{q.quotationNumber}</b>
                <span className="text-xs text-slate-500">{q.sourceDocuments?.length || 0} սկզբնաղբյուր փաստաթուղթ</span>
                <div className="mt-3 text-xs font-bold text-emerald-700">
                  <CheckCircle2 size={13} className="inline mr-1" /> Գնառաջարկի ֆայլը պատրաստ է
                </div>
              </div>
            ))}
          </div>
          {!quotes.length && <Empty text="Փաստաթղթեր դիտելու համար նախ ստեղծեք գնառաջարկ։" />}
        </div>
      )}
    </div>
  );
}

function Metric({ icon: Icon, title, value }: { icon: any; title: string; value: number }) {
  return (
    <div className="sil-card p-6">
      <Icon className="text-[#075bd5]" />
      <div className="text-3xl font-black mt-4">{value}</div>
      <div className="text-xs text-slate-500 font-bold">{title}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="p-5 rounded-2xl bg-slate-50 text-sm text-slate-500">{text}</div>;
}
