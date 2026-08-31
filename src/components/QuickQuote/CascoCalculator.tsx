import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, FileCheck2, Info, RotateCcw, ShieldCheck, XCircle, Car, Sparkles, Camera, X, Shield, Check, Zap, Award, Star, Layers } from "lucide-react";
import { CascoInsuranceData } from "../../types";
import { calculateCascoFromExcel, buildCascoProposal } from "../../utils/insuranceCalculator";
import { formatCurrency } from "../../utils/insuranceCalculator";
import { getCurrentCbaRates } from "../../utils/exchangeRates";
import { ListAmVehicleValuationCalculator } from "../Casco/ListAmVehicleValuationCalculator";
import { AiDocumentScanner } from "../AiDocumentScanner";

interface Props {
  onGenerateQuotation: (proposal: ReturnType<typeof buildCascoProposal>) => void;
  onBackToGeneric: () => void;
}

const initial: CascoInsuranceData = {
  clientName: "",
  phone: "",
  email: "",
  vehicleMake: "",
  vehicleModel: "",
  manufactureYear: new Date().getFullYear(),
  marketValue: 0,
  currency: "AMD",
  coverageType: "comprehensive",
  franchiseType: "percent",
  franchiseAmount: 0,
  driverMinAge: 0,
  driverMinExp: 0,
  isUnlimitedDrivers: true,
  includeGlassNoPolice: false,
  includeTowingAssistance: false,
  isPledged: false,
  baseTariff: 0,
  discount: 0,
  policyholderType: "Ֆիզիկական անձ",
  warrantyService: "չներառել",
  driverCountOption: "Անսահմանափակ",
  franchiseOption: "Ֆրանշիզան անփոփոխ",
  bonusMalus: "չընտրել",
  lossRatio: "չընտրել",
  paymentMethod: "Միանվագ",
  trafficRules: "չներառել",
  theftCoverage: "ներառել",
  theftExclusionPercent: 0,
  territory: "Միայն ՀՀ",
  electricVehicle: false,
  brokerCommissionPercent: 10,
  profitPercent: 10,
};

export function CascoCalculator({ onGenerateQuotation, onBackToGeneric }: Props) {
  const [data, setData] = useState<CascoInsuranceData>(() => {
    try {
      const saved = localStorage.getItem("sil-casco-excel-draft");
      return saved ? { ...initial, ...JSON.parse(saved) } : initial;
    } catch { return initial; }
  });
  const [checked, setChecked] = useState(false);
  const [showValuationModal, setShowValuationModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);

  useEffect(() => { const t = window.setTimeout(() => localStorage.setItem("sil-casco-excel-draft", JSON.stringify(data)), 250); return () => window.clearTimeout(t); }, [data]);

  const calc = useMemo(() => calculateCascoFromExcel(data), [data]);
  const set = <K extends keyof CascoInsuranceData>(key: K, value: CascoInsuranceData[K]) => {
    setData((v) => ({ ...v, [key]: value }));
    setChecked(false);
  };

  const save = () => localStorage.setItem("sil-casco-excel-draft", JSON.stringify(data));
  const reset = () => { setData(initial); setChecked(false); localStorage.removeItem("sil-casco-excel-draft"); };
  const proposal = calc.valid ? buildCascoProposal(data) : null;

  const tieredPackages = useMemo(() => {
    if (!calc.valid || data.marketValue <= 0) return null;

    // Standard Tier (ՃՏՊ Only)
    const stdData: CascoInsuranceData = {
      ...data,
      theftCoverage: "չներառել",
      theftExclusionPercent: 0,
      warrantyService: "չներառել",
      trafficRules: "չներառել",
    };
    const stdCalc = calculateCascoFromExcel(stdData);

    // Silver Tier (ՃՏՊ + Standard Risks)
    const silverData: CascoInsuranceData = {
      ...data,
      theftCoverage: "ներառել",
      warrantyService: "չներառել",
    };
    const silverCalc = calculateCascoFromExcel(silverData);

    // Gold Tier (VIP Full CASCO 0% Deductible)
    const goldData: CascoInsuranceData = {
      ...data,
      theftCoverage: "ներառել",
      franchiseOption: "Ֆրանշիզան անփոփոխ",
      franchiseAmount: 0,
      warrantyService: Number(data.manufactureYear) >= 2021 ? "ներառել" : "չներառել",
      trafficRules: "ներառել",
      includeGlassNoPolice: true,
      includeTowingAssistance: true,
    };
    const goldCalc = calculateCascoFromExcel(goldData);

    return [
      {
        id: "standard",
        title: "Standard (միայն ՃՏՊ)",
        badge: "Բազային",
        badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
        bgGradient: "bg-white border-slate-200",
        description: "Ճանապարհատրանսպորտային պատահարների բախման ռիսկեր",
        tariff: stdCalc.finalTariff,
        premium: stdCalc.annualPremium,
        data: stdData,
        proposal: buildCascoProposal(stdData),
        features: [
          { text: "ՃՏՊ բախումներ և վնասներ", inc: true },
          { text: "Ստանդարտ ֆրանշիզա", inc: true },
          { text: "Գողության ռիսկ", inc: false },
          { text: "Տարերային աղետներ / Հրդեհ", inc: false },
          { text: "0% Չհատուցվող գումար", inc: false },
        ],
      },
      {
        id: "silver",
        title: "Silver (ՃՏՊ + Ստանդարտ)",
        badge: "⭐ Ամենապահանջվածը",
        badgeColor: "bg-blue-600 text-white border-blue-600",
        bgGradient: "bg-gradient-to-b from-blue-50/60 to-white border-blue-300 shadow-md ring-2 ring-blue-500/20",
        description: "Համապարփակ ԿԱՍԿՈ ծածկույթ բոլոր հիմնական ռիսկերով",
        tariff: silverCalc.finalTariff,
        premium: silverCalc.annualPremium,
        data: silverData,
        proposal: buildCascoProposal(silverData),
        isPopular: true,
        features: [
          { text: "ՃՏՊ բախումներ և վնասներ", inc: true },
          { text: "Գողության ռիսկ (ներառված)", inc: true },
          { text: "Տարերային աղետներ / Հրդեհ / Վանդալիզմ", inc: true },
          { text: "Ստանդարտ ֆրանշիզա", inc: true },
          { text: "0% Չհատուցվող գումար", inc: false },
        ],
      },
      {
        id: "gold",
        title: "Gold (Լիակատար ԿԱՍԿՈ VIP)",
        badge: "👑 VIP 0% Ֆրանշիզա",
        badgeColor: "bg-amber-500 text-white border-amber-500",
        bgGradient: "bg-gradient-to-b from-amber-50/70 to-white border-amber-300 shadow-lg",
        description: "Առանց չհատուցվող գումարի (0% ֆրանշիզա) + VIP սպասարկում",
        tariff: goldCalc.finalTariff,
        premium: goldCalc.annualPremium,
        data: goldData,
        proposal: buildCascoProposal(goldData),
        features: [
          { text: "ՃՏՊ + Գողություն + Տարերային աղետներ", inc: true },
          { text: "0% Չհատուցվող գումար (Առանց ֆրանշիզայի)", inc: true },
          { text: "Ապակի առանց Ոստիկանության ակտի", inc: true },
          { text: "Անվճար Էվակուատոր / Ասիսթանս", inc: true },
          { text: "Երաշխիքային սպասարկում", inc: goldData.warrantyService === "ներառել" },
        ],
      },
    ];
  }, [data, calc.valid]);

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="rounded-[28px] bg-[#061A40] p-7 sm:p-10 text-white shadow-[0_18px_45px_rgba(6,26,64,0.18)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#65C8FF]">SIL Insurance • ԿԱՍԿՈ</div>
            <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold">ԿԱՍԿՈ հաշվիչ — Excel-ի իրական տրամաբանությամբ</h1>
            <p className="mt-2 max-w-4xl text-sm text-[#D9E8FF]">Հաշվարկի հիմքում դրված է քո տրամադրած «casco calculator 2024 - առանց ՃՈՈ.xlsx»-ի calculator / result 2 / վերապ տրամաբանությունը։ AI-ը չի որոշում սակագինը։</p>
          </div>
          <button onClick={onBackToGeneric} className="rounded-xl border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/10">Այլ պրոդուկտ</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_.65fr] gap-6">
        <section className="sil-card p-5 sm:p-7 space-y-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-extrabold text-lg text-slate-900">1. Հաճախորդ և ավտոմեքենա</h2>
              <button
                type="button"
                onClick={() => setShowOcrModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition cursor-pointer"
              >
                <Camera size={16} />
                <span>AI Տեխպասպորտի / Անձնագրի Scanner (Ավտոմատ լրացում)</span>
              </button>
            </div>

            {showOcrModal && (
              <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl text-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowOcrModal(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"
                  >
                    <X size={20} />
                  </button>
                  <AiDocumentScanner
                    onDataExtracted={(scanned) => {
                      setData((prev) => ({
                        ...prev,
                        clientName: scanned.ownerName || scanned.clientName || prev.clientName,
                        vehicleMake: scanned.vehicleMake || prev.vehicleMake,
                        vehicleModel: scanned.vehicleModel || prev.vehicleModel,
                        manufactureYear: scanned.manufactureYear || prev.manufactureYear,
                        phone: scanned.phone || prev.phone,
                      }));
                      setChecked(false);
                      setShowOcrModal(false);
                    }}
                  />
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Ապահովադիր"><input className="sil-input" value={data.clientName} onChange={e=>set("clientName",e.target.value)} /></Field>
              <Field label="Հեռախոս"><input className="sil-input" value={data.phone} onChange={e=>set("phone",e.target.value)} /></Field>
              <Field label="Էլ․ փոստ"><input className="sil-input" value={data.email} onChange={e=>set("email",e.target.value)} /></Field>
              <Field label="Մակնիշ"><input className="sil-input" value={data.vehicleMake} onChange={e=>set("vehicleMake",e.target.value)} /></Field>
              <Field label="Մոդել"><input className="sil-input" value={data.vehicleModel} onChange={e=>set("vehicleModel",e.target.value)} /></Field>
              <Field label="Արտադրման տարի"><input type="number" className="sil-input" value={data.manufactureYear || ""} onChange={e=>set("manufactureYear",Number(e.target.value))} /></Field>
              
              <div className="md:col-span-3 bg-gradient-to-r from-blue-50 to-indigo-50/70 p-4 rounded-2xl border border-blue-200/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-sm">
                    <Car size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">ԱԲ (Արհեստական Բանականություն) Միջին Շուկայական Գնահատում</div>
                    <div className="text-[11px] text-slate-600">Արհեստական Բանականությունը (Gemini AI) հաշվարկում է ավտոմեքենայի իրական միջին շուկայական գինը</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowValuationModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Sparkles size={14} className="text-cyan-200" />
                  <span>Որոշել միջին շուկայական գինը ԱԲ-ով</span>
                </button>
              </div>

              <Field label="Շուկայական / ապահովագրական արժեք"><input type="number" min="0" className="sil-input font-bold text-blue-900 text-base" value={data.marketValue || ""} onChange={e=>set("marketValue",Number(e.target.value))} /></Field>
              <Field label="Արժույթ">
                <select
                  className="sil-input"
                  value={data.currency}
                  onChange={(e) => {
                    const nextCurr = e.target.value as "AMD" | "USD";
                    if (nextCurr === data.currency) return;
                    const usdRate = getCurrentCbaRates().USD?.rateToAMD || 388.5;
                    setData((prev) => {
                      let nextMarketValue = prev.marketValue;
                      if (prev.marketValue > 0) {
                        if (nextCurr === "USD" && prev.currency === "AMD") {
                          nextMarketValue = Math.round(prev.marketValue / usdRate);
                        } else if (nextCurr === "AMD" && prev.currency === "USD") {
                          nextMarketValue = Math.round(prev.marketValue * usdRate);
                        }
                      }
                      return { ...prev, currency: nextCurr, marketValue: nextMarketValue };
                    });
                    setChecked(false);
                  }}
                >
                  <option value="AMD">AMD (֏)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </Field>
              <Field label="Ապահովադրի տեսակ"><select className="sil-input" value={data.policyholderType} onChange={e=>set("policyholderType",e.target.value as CascoInsuranceData["policyholderType"])}><option>Ֆիզիկական անձ</option><option>Իրավաբանական անձ</option><option>բանկային լիզինգ</option></select></Field>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h2 className="font-extrabold text-lg">2. Excel հաշվիչի պայմանները</h2>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <Field label="Երաշխիքային սպասարկում"><select className="sil-input" value={data.warrantyService} onChange={e=>set("warrantyService",e.target.value as CascoInsuranceData["warrantyService"])}><option>չներառել</option><option>ներառել</option></select></Field>
              <Field label="Վարորդների քանակ"><select className="sil-input" value={data.driverCountOption} onChange={e=>{const v=e.target.value as CascoInsuranceData["driverCountOption"]; setData(x=>({...x,driverCountOption:v,isUnlimitedDrivers:v==="Անսահմանափակ"})); setChecked(false);}}><option>Անսահմանափակ</option><option>Սահմանափակ</option></select></Field>
              <Field label="Ֆրանշիզայի տարբերակ"><select className="sil-input" value={data.franchiseOption} onChange={e=>set("franchiseOption",e.target.value as CascoInsuranceData["franchiseOption"])}><option>Ֆրանշիզան անփոփոխ</option><option>Ֆրանշիզայի կիսում</option><option>Մինիմալ ֆրանշիզա</option></select></Field>
              <Field label="Բոնուս Մալուս"><select className="sil-input" value={data.bonusMalus} onChange={e=>set("bonusMalus",e.target.value as CascoInsuranceData["bonusMalus"])}><option>չընտրել</option><option>&lt;=7</option><option>8-10</option><option>11-12</option><option>13-14</option></select></Field>
              <Field label="Վնասաբերություն"><select className="sil-input" value={data.lossRatio} onChange={e=>set("lossRatio",e.target.value as CascoInsuranceData["lossRatio"])}><option>չընտրել</option><option>Վնասաբերությունը  &gt;=  90% </option><option>Վնասաբերությունը  &lt; 90% </option></select></Field>
              <Field label="Վճարման ձև"><select className="sil-input" value={data.paymentMethod} onChange={e=>set("paymentMethod",e.target.value as CascoInsuranceData["paymentMethod"])}><option>Միանվագ</option><option>2 վճարում</option><option>4 վճարում</option><option>12 վճարում</option></select></Field>
              <Field label="ՃԵԿ կանոններ"><select className="sil-input" value={data.trafficRules} onChange={e=>set("trafficRules",e.target.value as CascoInsuranceData["trafficRules"])}><option>չներառել</option><option>ներառել</option></select></Field>
              <Field label="Գողության ռիսկ"><select className="sil-input" value={data.theftCoverage} onChange={e=>set("theftCoverage",e.target.value as CascoInsuranceData["theftCoverage"])}><option>ներառել</option><option>չներառել</option><option>ներառել միայն մանր դետալները</option></select></Field>
              {data.theftCoverage === "չներառել" && <Field label="Գողության չներառման չափ (%)"><input type="number" min="0" max="30" step="1" className="sil-input" value={data.theftExclusionPercent ? data.theftExclusionPercent*100 : ""} onChange={e=>set("theftExclusionPercent",Math.min(Number(e.target.value||0),30)/100)} /><span className="text-[11px] text-slate-500">Excel-ի մուտքային դաշտը սահմանափակված է 30%-ով։ Excel-ի հաշվարկում չներառման ճշգրտումը ֆիքսված է ըստ calculator-ի կանոնի։</span></Field>}
              <Field label="Տարածաշրջան"><select className="sil-input" value={data.territory} onChange={e=>set("territory",e.target.value as CascoInsuranceData["territory"])}><option>Միայն ՀՀ</option><option>ՀՀ և Վրաստան</option><option>ՀՀ, Վրաստան և ԱՊՀ երկրներ</option></select></Field>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold mt-6"><input type="checkbox" checked={Boolean(data.electricVehicle)} onChange={e=>set("electricVehicle",e.target.checked)} /> Էլեկտրոմոբիլ</label>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h2 className="font-extrabold text-lg">3. Կիրառվող ծախսային գործակիցներ</h2>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Field label="Միջնորդավճար (%)"><input type="number" min="0" max="100" step="0.1" className="sil-input" value={data.brokerCommissionPercent} onChange={e=>set("brokerCommissionPercent",Number(e.target.value))} /></Field>
              <Field label="Շահույթ (%)"><input type="number" min="0" max="100" step="0.1" className="sil-input" value={data.profitPercent} onChange={e=>set("profitPercent",Number(e.target.value))} /></Field>
              <Field label="Ֆրանշիզայի փաստացի գումար"><input type="number" min="0" className="sil-input" value={data.franchiseAmount || ""} onChange={e=>set("franchiseAmount",Number(e.target.value))} /><span className="text-[11px] text-slate-500">Այս դաշտը չի փոխում Excel-ի սակագնային ճշգրտումը․ օգտագործվում է գնառաջարկում։</span></Field>
              <Field label="Գրավ / շահառու"><input className="sil-input" placeholder="Բանկ, եթե կա" value={data.bankName || ""} onChange={e=>{set("bankName",e.target.value); set("isPledged",Boolean(e.target.value));}} /></Field>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={save} className="rounded-xl border border-slate-200 px-4 py-3 font-bold">Պահպանել</button>
            <button onClick={reset} className="rounded-xl border border-slate-200 px-4 py-3 font-bold flex items-center gap-2"><RotateCcw className="w-4 h-4"/>Մաքրել</button>
            <button onClick={()=>setChecked(true)} className="sil-primary text-white px-5 py-3 font-extrabold flex items-center gap-2"><ShieldCheck className="w-5 h-5"/>Ստուգել և հաշվարկել</button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="sil-card p-5 sticky top-4">
            <div className="flex items-center justify-between gap-3"><h2 className="font-extrabold text-lg">Հաշվարկի արդյունք</h2><span className="text-xs rounded-full bg-blue-50 text-blue-800 px-2 py-1 font-bold">Excel Engine</span></div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <Stat label="Տարիքային խումբ" value={calc.yearBand.replaceAll("_"," ")} />
              <Stat label="Գումարի խումբ" value={calc.amountBand === "under7" ? "< 7 մլն" : "≥ 7 մլն"} />
              <Stat label="Բազային մաքս." value={`${(calc.baseGrossMax*100).toFixed(4)}%`} />
              <Stat label="Նվազագույն" value={`${(calc.minimumTariff*100).toFixed(2)}%`} />
            </div>

            <div className="mt-5 rounded-2xl bg-[#061A40] text-white p-5">
              <div className="text-xs text-blue-200">Վերջնական սակագին</div>
              <div className="text-3xl font-black mt-1">{(calc.finalTariff*100).toFixed(4)}%</div>
              <div className="text-sm text-blue-100 mt-3">Տարեկան ապահովագրավճար</div>
              <div className="text-2xl font-black mt-1">{formatCurrency(calc.annualPremium,data.currency)}</div>
              {proposal && (
                <div className="mt-3 pt-3 border-t border-blue-900/60 text-xs text-blue-200">
                  <div className="text-[11px] text-blue-300 font-semibold">Ֆրանշիզա գնառաջարկում՝</div>
                  <div className="text-white font-medium mt-0.5">{proposal.franchiseDescription}</div>
                </div>
              )}
            </div>

            <div className="mt-5 space-y-2">
              <div className="font-extrabold text-sm">Կիրառված փոփոխություններ</div>
              {calc.adjustments.map((a,i)=><div key={i} className="flex justify-between gap-3 text-xs border-b border-slate-100 py-2"><span>{a.label}</span><b className={a.value<0?"text-emerald-700":"text-slate-800"}>{a.value>=0?"+":""}{(a.value*100).toFixed(4)}%</b></div>)}
            </div>

            {calc.errors.length>0 && <div className="mt-5 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800 space-y-2">{calc.errors.map((e,i)=><div key={i} className="flex gap-2"><XCircle className="w-4 h-4 shrink-0 mt-0.5"/>{e}</div>)}</div>}

            {checked && calc.valid && calc.errors.length===0 && <div className="mt-5 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800 flex gap-2"><CheckCircle2 className="w-5 h-5 shrink-0"/>Excel-ի բոլոր պարտադիր հաշվարկային պայմանները անցել են։</div>}
            {checked && !calc.valid && <div className="mt-5 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800 flex gap-2"><XCircle className="w-5 h-5 shrink-0"/>Գնառաջարկ ստեղծելուց առաջ ուղղեք սխալները։</div>}

            <div className="mt-5 rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-900 flex gap-2"><Info className="w-4 h-4 shrink-0"/>ԿԱՍԿՈ-ի հաշվարկը վերցված է քո տրամադրած Excel-ից։ Կառավարման բաժնում կարելի է փոխել editable մուտքային արժեքները, իսկ աղբյուր Excel-ը պահվում է նախագծում որպես audit source։</div>

            <button disabled={!calc.valid || calc.errors.length>0} onClick={()=>proposal && onGenerateQuotation(proposal)} className="mt-4 w-full rounded-xl bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-emerald-700 text-white py-3 font-extrabold flex items-center justify-center gap-2"><FileCheck2 className="w-4 h-4"/>Ստեղծել գնառաջարկ</button>
          </div>
        </aside>
      </div>

      {/* 3 Tiered Coverage Comparative Cards (Standard, Silver, Gold) */}
      {tieredPackages && tieredPackages.length === 3 && (
        <div className="mt-8 space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-600">
                <Layers className="w-4 h-4" />
                <span>Համեմատական Գնառաջարկի Փաթեթներ (Tiered Coverage)</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                Ընտրեք ԿԱՍԿՈ Ծածկույթի Օպտիմալ Փաթեթը
              </h3>
            </div>
            <div className="text-xs text-slate-500">
              Միաժամանակ համեմատեք 3 տարբեր ռիսկային փաթեթների ապահովագրավճարները
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tieredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`rounded-3xl p-6 relative flex flex-col justify-between transition-all duration-200 border ${pkg.bgGradient}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[11px] font-black px-3 py-1 rounded-full border ${pkg.badgeColor}`}>
                      {pkg.badge}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {(pkg.tariff * 100).toFixed(2)}% սակագին
                    </span>
                  </div>

                  <h4 className="text-lg font-black text-slate-900">{pkg.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{pkg.description}</p>

                  <div className="my-5 p-4 rounded-2xl bg-slate-900 text-white space-y-1">
                    <div className="text-[11px] text-slate-300">Տարեկան Ապահովագրավճար</div>
                    <div className="text-2xl font-black text-amber-400">
                      {formatCurrency(pkg.premium, pkg.data.currency)}
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Ծածկույթի Պայմաններ.
                    </div>
                    {pkg.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs">
                        {feat.inc ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                        )}
                        <span className={feat.inc ? "font-semibold text-slate-800" : "text-slate-400 line-through"}>
                          {feat.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => {
                      setData(pkg.data);
                      if (pkg.proposal) {
                        onGenerateQuotation(pkg.proposal);
                      }
                    }}
                    className={`w-full py-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
                      pkg.isPopular
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>Ընտրել «{pkg.title.split(" ")[0]}» Փաթեթը</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showValuationModal && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden relative border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-cyan-400" />
                <span className="font-extrabold text-sm">List.am Ավտոմեքենայի Շուկայական Գնահատիչ</span>
              </div>
              <button
                type="button"
                onClick={() => setShowValuationModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
              <ListAmVehicleValuationCalculator
                initialMake={data.vehicleMake || "Toyota"}
                initialModel={data.vehicleModel || "Camry"}
                initialYear={data.manufactureYear || 2020}
                onApplyToCasco={(applied) => {
                  setData((prev) => ({
                    ...prev,
                    vehicleMake: applied.make,
                    vehicleModel: applied.model,
                    manufactureYear: applied.year,
                    marketValue: prev.currency === "USD" ? applied.marketValueUSD : applied.marketValueAMD,
                  }));
                  setChecked(false);
                  setShowValuationModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({label,children}:{label:string;children:ReactNode}) { return <label className="text-sm font-semibold block">{label}{children}</label>; }
function Stat({label,value}:{label:string;value:string}) { return <div className="rounded-xl bg-slate-50 border border-slate-100 p-3"><div className="text-[10px] text-slate-500">{label}</div><div className="font-extrabold text-sm mt-1 truncate">{value}</div></div>; }
