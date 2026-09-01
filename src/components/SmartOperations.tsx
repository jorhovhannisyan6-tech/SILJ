import { useMemo, useState, useEffect } from 'react';
import { 
  AlertTriangle, CheckCircle2, Copy, FileText, RefreshCw, Route, ShieldAlert, Sparkles, 
  Building2, Car, Upload, Check, ShieldCheck, HelpCircle, FileSearch, ArrowRight, Printer, 
  AlertOctagon, Settings, Bot, Play, Save, Trash2, Cpu, FileJson, CheckSquare, Plus, FileEdit
} from 'lucide-react';
import type { QuotationProposal } from '../types';
import { ListAmPropertyValuationCalculator } from './Property/ListAmPropertyValuationCalculator';
import { ListAmVehicleValuationCalculator } from './Casco/ListAmVehicleValuationCalculator';

type TabType = 'overview' | 'compliance' | 'vehicle-valuation' | 'property-valuation' | 'duplicates' | 'next' | 'renewals' | 'documents' | 'rules-engine' | 'bot-playground' | 'template-mapper';

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

interface DynamicRule {
  id?: string;
  productType: string;
  ruleType: 'surcharge' | 'discount' | 'underwriting_trigger' | 'flag_review';
  condition: string;
  description: string;
  value: number | null;
  expressionDescription: string;
  isActive?: boolean;
  createdAt?: string;
}

interface ShadowTestResult {
  question: string;
  activeResponse: string;
  draftResponse: string;
  comparison: string;
  status: 'better' | 'equivalent' | 'worse' | 'needs_attention';
}

interface TemplateMapping {
  placeholder: string;
  systemField: string;
  label: string;
}

export function SmartOperations({ quotes }: { quotes: QuotationProposal[] }) {
  const [tab, setTab] = useState<TabType>('overview');
  
  // Compliance state
  const [selectedProduct, setSelectedProduct] = useState<string>('casco');
  const [contractText, setContractText] = useState<string>('');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<any | null>(null);
  const [auditError, setAuditError] = useState<string>('');

  // Rules Engine state
  const [ruleText, setRuleText] = useState<string>('');
  const [ruleProduct, setRuleProduct] = useState<string>('casco');
  const [isInterpreting, setIsInterpreting] = useState<boolean>(false);
  const [interpretedRule, setInterpretedRule] = useState<DynamicRule | null>(null);
  const [rulesList, setRulesList] = useState<DynamicRule[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState<boolean>(false);
  const [rulesError, setRulesError] = useState<string>('');

  // Bot Playground state
  const [systemInstruction, setSystemInstruction] = useState<string>('');
  const [isLoadingBot, setIsLoadingBot] = useState<boolean>(false);
  const [isSavingBot, setIsSavingBot] = useState<boolean>(false);
  const [isTestingBot, setIsTestingBot] = useState<boolean>(false);
  const [shadowResults, setShadowResults] = useState<ShadowTestResult[]>([]);
  const [botMessage, setBotMessage] = useState<string>('');

  // Template Mapper state
  const [mappings, setMappings] = useState<TemplateMapping[]>([]);
  const [isLoadingMappings, setIsLoadingMappings] = useState<boolean>(false);
  const [isSavingMappings, setIsSavingMappings] = useState<boolean>(false);
  const [mappingMessage, setMappingMessage] = useState<string>('');

  const token = localStorage.getItem("sil-auth-token") || localStorage.getItem("sil_token") || "";

  // Fetch rules and bot config when tab changes or component mounts
  useEffect(() => {
    if (tab === 'rules-engine') {
      fetchRules();
    } else if (tab === 'bot-playground') {
      fetchBotConfig();
    } else if (tab === 'template-mapper') {
      fetchMappings();
    }
  }, [tab]);

  // Dynamic Rules endpoints fetchers
  const fetchRules = async () => {
    setIsLoadingRules(true);
    setRulesError('');
    try {
      const res = await fetch("/api/admin/dynamic-rules", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRulesList(data.rules || []);
      } else {
        setRulesError("Չհաջողվեց բեռնել կանոնների ցանկը։");
      }
    } catch {
      setRulesError("Կապի սխալ կանոնները բեռնելիս։");
    } finally {
      setIsLoadingRules(false);
    }
  };

  const handleInterpretRule = async () => {
    if (!ruleText.trim()) return;
    setIsInterpreting(true);
    setInterpretedRule(null);
    try {
      const res = await fetch("/api/ai/interpret-rule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ruleText,
          productType: ruleProduct
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "ok" && data.rule) {
          setInterpretedRule(data.rule);
        } else {
          alert("ԱԲ-ը չկարողացավ կառուցվածքավորված կանոն ստեղծել։");
        }
      } else {
        alert("Սերվերի սխալ կանոնը մեկնաբանելիս։");
      }
    } catch {
      alert("Կապի սխալ ԱԲ կանոնների թարգմանչի հետ։");
    } finally {
      setIsInterpreting(false);
    }
  };

  const handleSaveRule = async () => {
    if (!interpretedRule) return;
    try {
      const res = await fetch("/api/admin/dynamic-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(interpretedRule)
      });
      if (res.ok) {
        setInterpretedRule(null);
        setRuleText('');
        fetchRules();
        alert("Կանոնը հաջողությամբ պահպանվեց Firestore-ում և ակտիվացվեց։");
      } else {
        alert("Չհաջողվեց պահպանել կանոնը։");
      }
    } catch {
      alert("Կապի սխալ կանոնը պահպանելիս։");
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm("Վստա՞հ եք, որ ցանկանում եք ջնջել այս ակտիվ կանոնը։")) return;
    try {
      const res = await fetch(`/api/admin/dynamic-rules/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
      if (res.ok) {
        fetchRules();
      } else {
        alert("Չհաջողվեց ջնջել կանոնը։");
      }
    } catch {
      alert("Կապի սխալ կանոնը ջնջելիս։");
    }
  };

  // Bot Config fetchers
  const fetchBotConfig = async () => {
    setIsLoadingBot(true);
    setBotMessage('');
    try {
      const res = await fetch("/api/admin/bot-config", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSystemInstruction(data.systemInstruction || '');
      }
    } catch {
      console.error("Failed to fetch bot config");
    } finally {
      setIsLoadingBot(false);
    }
  };

  const handleSaveBotConfig = async () => {
    setIsSavingBot(true);
    setBotMessage('');
    try {
      const res = await fetch("/api/admin/bot-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ systemInstruction })
      });
      if (res.ok) {
        const data = await res.json();
        setBotMessage("✅ " + (data.message || "Պահպանվեց։"));
      } else {
        const err = await res.json();
        setBotMessage("❌ " + (err.error || "Չհաջողվեց պահպանել։"));
      }
    } catch {
      setBotMessage("❌ Կապի սխալ պահպանելիս։");
    } finally {
      setIsSavingBot(false);
    }
  };

  const handleRunShadowEvaluation = async () => {
    if (!systemInstruction.trim()) return;
    setIsTestingBot(true);
    setShadowResults([]);
    try {
      const res = await fetch("/api/ai/test-bot-behavior", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ systemInstruction })
      });
      if (res.ok) {
        const data = await res.json();
        setShadowResults(data.results || []);
      } else {
        alert("Չհաջողվեց գործարկել ավտոմատ գնահատման թեստը։");
      }
    } catch {
      alert("Կապի սխալ թեստավորման ժամանակ։");
    } finally {
      setIsTestingBot(false);
    }
  };

  // Mappings fetchers
  const fetchMappings = async () => {
    setIsLoadingMappings(true);
    setMappingMessage('');
    try {
      const res = await fetch("/api/admin/template-mappings", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMappings(data.mappings || []);
      }
    } catch {
      console.error("Failed to fetch mappings");
    } finally {
      setIsLoadingMappings(false);
    }
  };

  const handleSaveMappings = async () => {
    setIsSavingMappings(true);
    setMappingMessage('');
    try {
      const res = await fetch("/api/admin/template-mappings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ mappings })
      });
      if (res.ok) {
        const data = await res.json();
        setMappingMessage("✅ " + (data.message || "Քարտեզագրումները պահպանվեցին Firestore-ում։"));
      } else {
        setMappingMessage("❌ Չհաջողվեց պահպանել քարտեզագրումները։");
      }
    } catch {
      setMappingMessage("❌ Կապի սխալ։");
    } finally {
      setIsSavingMappings(false);
    }
  };

  const handleMappingChange = (index: number, value: string) => {
    const updated = [...mappings];
    updated[index].systemField = value;
    setMappings(updated);
  };

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
      ? 'Լրացնել բացակայող փաստาթղթերը'
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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
        <div className="text-cyan-200 text-xs font-black tracking-[.18em]">ENTERPRISE AI PORTAL</div>
        <h1 className="text-3xl font-black mt-2">ԱԲ Կանոնների և Գործառնությունների Կառավարման Կենտրոն</h1>
        <p className="text-blue-100 text-sm mt-2">
          Լիարժեք AI-ով ղեկավարվող ապահովագրական պորտալ՝ դինամիկ կանոնների թարգմանիչ, չատբոտի sandbox սիմուլյատոր և DOCX ձևանմուշների ավտոմատ քարտեզագրում։
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl border">
        {[
          ['overview', '🏠 Գլխավոր պատուհան'],
          ['rules-engine', '⚙️ AI Կանոնների Շարժիչ'],
          ['bot-playground', '💬 Չատբոտի Սանդբոքս'],
          ['template-mapper', '📝 Ձևանմուշի Քարտեզագրում'],
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
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Metric icon={Copy} title="Հնարավոր կրկնվող հայտեր" value={duplicates.length} />
            <Metric icon={Route} title="Ակտիվ գնառաջարկներ" value={quotes.filter(q => q.status !== 'locked').length} />
            <Metric icon={ShieldAlert} title="Սպասող Underwriting" value={quotes.filter(q => q.underwriting?.status === 'manual_review').length} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="sil-card p-6 space-y-4">
              <h3 className="text-md font-black text-slate-900 flex items-center gap-2">
                <Cpu size={18} className="text-[#075bd5]" /> AI Շարժիչի Ակտիվ Կարգավիճակ
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Դինամիկ Կանոններ</span>
                  <span className="font-bold text-emerald-600">Ակտիվ (Firestore-ի հիմքով)</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Չատբոտի Ինստրուկցիաներ</span>
                  <span className="font-bold text-blue-600">Անհատական (Sandbox)</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-slate-500">Template Mappings</span>
                  <span className="font-bold text-indigo-600">Հրապարակված</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Բոլոր փոփոխությունները պահպանվում են իրական ժամանակում Cloud Firestore-ում և անմիջապես ազդում են գործակալների աշխատանքի վրա։
              </p>
            </div>

            <div className="sil-card p-6 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-md font-black text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-[#075bd5]" /> Արագ Գործողություններ
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Դուք կարող եք կազմաձևել և փոխել ապահովագրական պոլիսների սակագնային գործակիցները, զեղչերը կամ ավտոմատ անդերռայթինգի կանոնները հայերեն բնական լեզվով։
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setTab('rules-engine')} className="flex-1 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition">
                  Կառավարել Կանոնները
                </button>
                <button onClick={() => setTab('bot-playground')} className="flex-1 py-2 rounded-xl bg-[#075bd5] text-white font-bold text-xs hover:bg-blue-600 transition">
                  Չատբոտի Սանդբոքս
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. RULES ENGINE VIEW */}
      {tab === 'rules-engine' && (
        <div className="grid lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Rules Editor Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sil-card p-6 space-y-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Cpu size={20} className="text-[#075bd5]" /> AI Կանոնների Մեկնաբանիչ
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Մուտքագրեք ցանկացած ապահովագրական կանոն հայերենով, և AI-ը այն կվերածի ավտոմատ գնահատման JSON կոդի։
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Ապահովագրատեսակ</label>
                <select
                  value={ruleProduct}
                  onChange={e => setRuleProduct(e.target.value)}
                  className="sil-input text-xs"
                >
                  {Object.entries(PRODUCT_NAMES_ARM).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Կանոնի հրահանգը հայերենով</label>
                <textarea
                  value={ruleText}
                  onChange={e => setRuleText(e.target.value)}
                  placeholder="Օրինակ՝ ԿԱՍԿՈ-ի դեպքում եթե ավտոմեքենայի արժեքը մեծ է 25,000,000 դրամից կամ արտադրության տարեթիվը ցածր է 2011-ից, ավելացնել 12% հավելավճար:"
                  rows={4}
                  className="sil-input text-xs"
                />
              </div>

              <button
                onClick={handleInterpretRule}
                disabled={isInterpreting || !ruleText.trim()}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {isInterpreting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    ԱԲ-ն մեկնաբանում է կանոնը...
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    Թարգմանել ԱԲ-ով
                  </>
                )}
              </button>

              {interpretedRule && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-black text-xs">
                    <CheckSquare size={14} /> Կազմված Կոդային Կանոն
                  </div>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div><b>Տեսակ՝</b> {interpretedRule.ruleType}</div>
                    <div><b>Նկարագրություն՝</b> {interpretedRule.description}</div>
                    <div><b>Expression՝</b> <code className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">{interpretedRule.condition}</code></div>
                    <div><b>Մեկնաբանություն՝</b> {interpretedRule.expressionDescription}</div>
                    {interpretedRule.value !== null && <div><b>Արժեք (Percent)՝</b> {interpretedRule.value}%</div>}
                  </div>
                  <button
                    onClick={handleSaveRule}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Ակտիվացնել և Պահպանել (Live Firestore)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Rules List Panel */}
          <div className="lg:col-span-7 space-y-4">
            <div className="sil-card p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="text-md font-black text-slate-900">Ակտիվ Դինամիկ Կանոններ (Firestore)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Այս կանոնները ստուգվում են գործակալների կողմից հայտ ներկայացնելիս։</p>
                </div>
                <button onClick={fetchRules} disabled={isLoadingRules} className="p-2 border rounded-xl hover:bg-slate-50 transition">
                  <RefreshCw size={13} className={isLoadingRules ? "animate-spin" : ""} />
                </button>
              </div>

              {rulesError && <div className="text-xs text-red-600 font-bold">{rulesError}</div>}

              {isLoadingRules ? (
                <div className="text-center py-10 text-xs text-slate-500">Բեռնվում են կանոնները...</div>
              ) : rulesList.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-2xl bg-slate-50/50 text-xs text-slate-400">
                  Դինամիկ կանոններ դեռ չկան։ Օգտագործեք AI թարգմանիչը նոր կանոն ավելացնելու համար։
                </div>
              ) : (
                <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                  {rulesList.map((rule) => (
                    <div key={rule.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2 flex justify-between items-start gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold uppercase">{rule.productType}</span>
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-100 uppercase">{rule.ruleType}</span>
                          {rule.value !== null && <span className="text-xs font-black text-[#075bd5]">{rule.value}%</span>}
                        </div>
                        <p className="text-xs font-bold text-slate-800">{rule.description}</p>
                        <div className="text-[10px] text-slate-500 font-mono bg-slate-50 p-1.5 rounded border">
                          Condition: <span className="font-bold text-indigo-700">{rule.condition}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">🔍 {rule.expressionDescription}</p>
                      </div>
                      <button
                        onClick={() => rule.id && handleDeleteRule(rule.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition cursor-pointer self-center shrink-0"
                        title="Ջնջել կանոնը"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. BOT PLAYGROUND VIEW */}
      {tab === 'bot-playground' && (
        <div className="grid lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Settings Left Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sil-card p-6 space-y-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Bot size={20} className="text-[#075bd5]" /> AI Չատբոտի Կարգավորումներ
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Փոփոխեք և թեստավորեք ապահովագրական AI խորհրդատուի համակարգային հրահանգները (systemInstructions) Firestore-ում։
                </p>
              </div>

              {isLoadingBot ? (
                <div className="text-center py-6 text-xs text-slate-400">Բեռնվում են տվյալները...</div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">System Prompt (Համակարգային Հրահանգ)</label>
                    <textarea
                      value={systemInstruction}
                      onChange={e => setSystemInstruction(e.target.value)}
                      rows={14}
                      className="sil-input text-xs font-mono font-bold leading-relaxed min-h-[350px]"
                    />
                  </div>

                  {botMessage && (
                    <div className="p-3 text-xs font-bold rounded-xl border bg-slate-50 text-slate-800">
                      {botMessage}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveBotConfig}
                      disabled={isSavingBot}
                      className="flex-1 py-2.5 rounded-xl bg-[#075bd5] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Save size={14} /> {isSavingBot ? "Պահպանվում է..." : "Պահպանել Live"}
                    </button>
                    <button
                      onClick={handleRunShadowEvaluation}
                      disabled={isTestingBot}
                      className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      {isTestingBot ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Գնահատվում է...
                        </>
                      ) : (
                        <>
                          <Play size={14} />
                          Գործարկել Թեստը
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Test Sandbox and Comparison Right Panel */}
          <div className="lg:col-span-7 space-y-4">
            <div className="sil-card p-6 space-y-4">
              <div>
                <h3 className="text-md font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-600" /> ԱԲ Շադոու Գնահատման Լաբորատորիա (Shadow Test Suite)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ավտոմատ թեստային գնահատում։ Համակարգը կատարում է 4 պատմական թեստային հարցումներ և համեմատում է նոր ու հին պատասխանները կողք կողքի։
                </p>
              </div>

              {isTestingBot && (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50 border border-dashed rounded-2xl animate-pulse">
                  <RefreshCw size={36} className="text-[#075bd5] animate-spin" />
                  <h4 className="text-sm font-bold text-slate-700">Գնահատումը ընթացքի մեջ է...</h4>
                  <p className="text-xs text-slate-400 max-w-xs">AI-ը թեստավորում է նոր prompt-ի ճշգրտությունը և համեմատում նախորդ վարկածի հետ։</p>
                </div>
              )}

              {!isTestingBot && shadowResults.length === 0 && (
                <div className="py-24 border border-dashed rounded-2xl text-center bg-slate-50/50 text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Play size={24} className="text-slate-300 animate-bounce" />
                  Սեղմեք «Գործարկել Թեստը»՝ նոր համակարգային prompt-ի ավտոմատ սիմուլյացիան սկսելու համար։
                </div>
              )}

              {!isTestingBot && shadowResults.length > 0 && (
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-1">
                  {shadowResults.map((res, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-xs font-black text-[#075bd5]">Հարց #{idx + 1}․ {res.question}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          res.status === 'better'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : res.status === 'equivalent'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                          {res.status === 'better' ? 'Բարելավված' : res.status === 'equivalent' ? 'Համարժեք' : 'Ուշադրություն'}
                        </span>
                      </div>

                      <div className="text-[11px] text-indigo-800 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100 leading-relaxed font-bold">
                        🔬 <b>ԱԲ Վերլուծություն՝</b> {res.comparison}
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 text-xs leading-relaxed">
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Գործող պատասխան (Active)</div>
                          <div className="p-3 bg-slate-50 rounded-xl border max-h-[140px] overflow-y-auto text-slate-600 text-[11px] whitespace-pre-line">
                            {res.activeResponse}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Նոր պատասխան (Draft Project)</div>
                          <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 max-h-[140px] overflow-y-auto text-slate-800 text-[11px] whitespace-pre-line font-medium">
                            {res.draftResponse}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. TEMPLATE MAPPER VIEW */}
      {tab === 'template-mapper' && (
        <div className="sil-card p-6 space-y-6 animate-fade-in max-w-4xl mx-auto">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileEdit size={20} className="text-[#075bd5]" /> DOCX Ձևանմուշի Փոփոխականների Քարտեզագրում (DOCX Mapper)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Կազմաձևեք Word փաստաթղթի (`quotation-template-source.docx`) փոփոխականների կապը համակարգային տվյալների հետ։
            </p>
          </div>

          {isLoadingMappings ? (
            <div className="text-center py-10 text-xs text-slate-400">Բեռնվում է քարտեզագիրը...</div>
          ) : (
            <div className="space-y-5">
              <div className="border rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 font-bold text-slate-700 border-b">
                    <tr>
                      <th className="p-3">DOCX Փոփոխական (Placeholder)</th>
                      <th className="p-3">Համակարգային Դաշտ (Firestore Link)</th>
                      <th className="p-3">Նկարագրություն / Պիտակ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-800">
                    {mappings.map((map, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 font-mono font-bold text-indigo-700">{`{{${map.placeholder}}}`}</td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={map.systemField}
                            onChange={e => handleMappingChange(idx, e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-3 font-bold text-slate-600">{map.label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {mappingMessage && (
                <div className="p-3 text-xs font-bold border rounded-xl bg-slate-50">
                  {mappingMessage}
                </div>
              )}

              <button
                onClick={handleSaveMappings}
                disabled={isSavingMappings}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Save size={14} /> {isSavingMappings ? "Պահպանվում է..." : "Պահպանել DOCX Քարտեզագրումները"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. COMPLIANCE VIEW */}
      {tab === 'compliance' && (
        <div className="grid lg:grid-cols-12 gap-6 animate-fade-in">
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
          <div className="lg:col-span-7 animate-fade-in">
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
