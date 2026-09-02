import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  FileCheck2,
  Info,
  RotateCcw,
  ShieldCheck,
  XCircle,
  Car,
  Sparkles,
  Camera,
  X,
  Shield,
  Check,
  Zap,
  Award,
  Star,
  Layers,
  FileText,
  UserCheck,
  AlertTriangle,
  HelpCircle,
  Activity,
  CreditCard,
  Settings,
  Truck,
  FileSpreadsheet
} from "lucide-react";
import { CascoInsuranceData, CascoSectionOption, CascoUsagePurpose, CascoFranchiseDeductibleType, CascoFranchiseBasis } from "../../types";
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
  driverMinAge: 25,
  driverMinExp: 3,
  isUnlimitedDrivers: true,
  includeGlassNoPolice: true,
  includeTowingAssistance: true,
  isPledged: false,
  baseTariff: 0,
  discount: 0,
  policyholderType: "Ֆիզիկական անձ",
  warrantyService: "չներառել",
  driverCountOption: "Անսահմանափակ",
  franchiseOption: "Ֆրանշիզան անփոփոխ",
  bonusMalus: "8-10",
  lossRatio: "չընտրել",
  paymentMethod: "Միանվագ",
  trafficRules: "չներառել",
  theftCoverage: "ներառել",
  theftExclusionPercent: 0,
  territory: "Միայն ՀՀ",
  electricVehicle: false,
  brokerCommissionPercent: 10,
  profitPercent: 10,

  // Casco.txt grounded fields
  sectionOption: "physical_and_theft",
  includeDriverPassengerAccident: false,
  accidentSeatsCount: 5,
  accidentSumPerSeat: 1000000,
  accidentRisks: { death: true, disability: true, firstAidExpenses: true },
  includeVoluntaryTpl: false,
  voluntaryTplLimit: 5000000,
  includeAdditionalEquipment: false,
  additionalEquipmentDetails: "",
  additionalEquipmentValue: 0,

  franchiseDeductibleType: "unconditional",
  franchiseCalculationBasis: "fixed_amount",
  franchisePercentValue: 1,
  driverAgeExpMultiplier: 1,
  authorizedDriversList: "",

  vehicleVin: "",
  licensePlate: "",
  registrationDocNumber: "",
  enginePowerHp: undefined,
  engineVolumeCc: undefined,
  transmissionType: "automatic",
  fuelType: "petrol",
  vehicleUsagePurpose: "personal",
  noPoliceGlassAnnualLimit: 300000,
  officialDealerRepair: false,
  roadsideAssistanceIncluded: true,
  loanContractNumber: "",
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
  const [activeTab, setActiveTab] = useState<"vehicle" | "sections" | "franchise" | "services" | "rules">("vehicle");

  useEffect(() => {
    const t = window.setTimeout(() => localStorage.setItem("sil-casco-excel-draft", JSON.stringify(data)), 250);
    return () => window.clearTimeout(t);
  }, [data]);

  // Compute driver age/experience multiplier per Casco.txt clauses 7.4 & 7.5
  useEffect(() => {
    let multiplier = 1;
    if (data.driverMinExp < 1 && data.driverMinExp > 0) {
      multiplier = 3; // Section 7.5: experience < 1 year => 3x
    } else if (data.driverMinAge < 21 || (data.driverMinExp >= 1 && data.driverMinExp < 3)) {
      multiplier = 2; // Section 7.4: age < 21 or experience 1-3 years => 2x
    }
    if (data.driverAgeExpMultiplier !== multiplier) {
      setData((prev) => ({ ...prev, driverAgeExpMultiplier: multiplier }));
    }
  }, [data.driverMinAge, data.driverMinExp, data.driverAgeExpMultiplier]);

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

    // Standard Tier (Section A Physical Only)
    const stdData: CascoInsuranceData = {
      ...data,
      sectionOption: "physical_only",
      theftCoverage: "չներառել",
      theftExclusionPercent: 0,
      warrantyService: "չներառել",
      trafficRules: "չներառել",
      includeDriverPassengerAccident: false,
      includeVoluntaryTpl: false,
    };
    const stdCalc = calculateCascoFromExcel(stdData);

    // Silver Tier (Section A Physical + Theft + Standard Deductible)
    const silverData: CascoInsuranceData = {
      ...data,
      sectionOption: "physical_and_theft",
      theftCoverage: "ներառել",
      warrantyService: "չներառել",
      includeDriverPassengerAccident: true,
      includeVoluntaryTpl: false,
    };
    const silverCalc = calculateCascoFromExcel(silverData);

    // Gold Tier (Full CASCO VIP: 0% Deductible + ԴՊ + Կամավոր ԱՊՊԱ + Dealer Service + Glass waiver)
    const goldData: CascoInsuranceData = {
      ...data,
      sectionOption: "physical_and_theft",
      theftCoverage: "ներառել",
      franchiseOption: "Ֆրանշիզան անփոփոխ",
      franchiseDeductibleType: "zero",
      franchiseAmount: 0,
      warrantyService: Number(data.manufactureYear) >= 2021 ? "ներառել" : "չներառել",
      trafficRules: "ներառել",
      includeGlassNoPolice: true,
      includeTowingAssistance: true,
      includeDriverPassengerAccident: true,
      includeVoluntaryTpl: true,
      voluntaryTplLimit: 5000000,
    };
    const goldCalc = calculateCascoFromExcel(goldData);

    return [
      {
        id: "standard",
        title: "Standard (Միայն Ֆիզիկական Վնաս)",
        badge: "Բազային",
        badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
        bgGradient: "bg-white border-slate-200",
        description: "ՃՏՊ բախումներ, շրջվել, անկում (Բաժին Ա - առանց գողության)",
        tariff: stdCalc.finalTariff,
        premium: stdCalc.annualPremium,
        data: stdData,
        proposal: buildCascoProposal(stdData),
        features: [
          { text: "Բաժին Ա. ՃՏՊ բախումներ և վնասներ", inc: true },
          { text: "Տարերային աղետներ / Հրդեհ", inc: true },
          { text: "Գողության ծածկույթ", inc: false },
          { text: "Բաժին Բ. Դժբախտ պատահարներ (ԴՊ)", inc: false },
          { text: "0% Չհատուցվող գումար", inc: false },
        ],
      },
      {
        id: "silver",
        title: "Silver (Համապարփակ ԿԱՍԿՈ + ԴՊ)",
        badge: "⭐ Ամենապահանջվածը",
        badgeColor: "bg-blue-600 text-white border-blue-600",
        bgGradient: "bg-gradient-to-b from-blue-50/60 to-white border-blue-300 shadow-md ring-2 ring-blue-500/20",
        description: "Համապարփակ ԿԱՍԿՈ (Ֆիզիկական վնաս + Գողություն) + Ուղևորների ԴՊ",
        tariff: silverCalc.finalTariff,
        premium: silverCalc.annualPremium,
        data: silverData,
        proposal: buildCascoProposal(silverData),
        isPopular: true,
        features: [
          { text: "Բաժին Ա. ՃՏՊ + Գողություն + Հափշտակություն", inc: true },
          { text: "Տարերային աղետներ / Հրդեհ / Վանդալիզմ", inc: true },
          { text: "Բաժին Բ. Վարորդի և ուղևորների ԴՊ", inc: true },
          { text: "Ապակի առանց Ոստիկանության ակտի", inc: true },
          { text: "0% Չհատուցվող գումար", inc: false },
        ],
      },
      {
        id: "gold",
        title: "Gold (Լիակատար VIP 0% Ֆրանշիզա)",
        badge: "👑 VIP 0% Ֆրանշիզա",
        badgeColor: "bg-amber-500 text-white border-amber-500",
        bgGradient: "bg-gradient-to-b from-amber-50/70 to-white border-amber-300 shadow-lg",
        description: "0% Ֆրանշիզա + Բաժին Ա, Բ (ԴՊ), Գ (Կամավոր ԱՊՊԱ) + Դիլերական սերվիս",
        tariff: goldCalc.finalTariff,
        premium: goldCalc.annualPremium,
        data: goldData,
        proposal: buildCascoProposal(goldData),
        features: [
          { text: "Բաժին Ա. Լրիվ ծածկույթ (ՃՏՊ + Գողություն + Աղետներ)", inc: true },
          { text: "0% Չհատուցվող գումար (Առանց ֆրանշիզայի)", inc: true },
          { text: "Բաժին Բ (ԴՊ) + Բաժին Գ (Կամավոր ԱՊՊԱ 5 մլն ֏)", inc: true },
          { text: "Դիլերի պաշտոնական երաշխիքային սպասարկում", inc: goldData.warrantyService === "ներառել" },
          { text: "Անվճար Էվակուատոր / Ճանապարհային ասիսթանս", inc: true },
        ],
      },
    ];
  }, [data, calc.valid]);

  return (
    <div className="max-w-[1550px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="rounded-[28px] bg-gradient-to-r from-[#061A40] via-[#0b2b63] to-[#061A40] p-6 sm:p-9 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-black uppercase tracking-wider text-[#65C8FF]">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>SIL Insurance • ԿԱՍԿՈ Գնառաջարկի Կառավարման Կենտրոն</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black">ԿԱՍԿՈ Հաշվիչ — Գիտելիքի Բազայի (Casco.txt) և Excel-ի Լրիվ Պայմաններով</h1>
            <p className="mt-2 max-w-4xl text-xs sm:text-sm text-[#D9E8FF] leading-relaxed">
              Գնառաջարկի ձևավորումն իրականացվում է «casco calculator 2024 - առանց ՃՈՈ.xlsx» սակագնային հաշվարկով և «Casco.txt» կանոնների համապատասխանությամբ (Բաժին Ա, Բ, Գ, Ֆրանշիզայի բազմապատկիչներ, Շահառու բանկ, ԴՊ և Կամավոր ԱՊՊԱ)։
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowOcrModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer"
            >
              <Camera size={16} />
              <span>AI Տեխպասպորտի Scanner</span>
            </button>
            <button onClick={onBackToGeneric} className="rounded-xl border border-white/20 px-4 py-2 text-xs sm:text-sm font-bold hover:bg-white/10 transition cursor-pointer">
              Այլ պրոդուկտ
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_.55fr] gap-6">
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("vehicle")}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                activeTab === "vehicle" ? "bg-white text-blue-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Car className="w-4 h-4 text-blue-600" />
              <span>1. Հաճախորդ & Տրանսպորտային Միջոց</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sections")}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                activeTab === "sections" ? "bg-white text-blue-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>2. Ծածկույթի Բաժիններ (Ա, Բ, Գ)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("franchise")}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                activeTab === "franchise" ? "bg-white text-blue-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>3. Ֆրանշիզա & Վարորդներ</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("services")}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                activeTab === "services" ? "bg-white text-blue-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Settings className="w-4 h-4 text-amber-600" />
              <span>4. Excel Գործակիցներ & Ծառայություններ</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("rules")}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                activeTab === "rules" ? "bg-white text-blue-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4 text-purple-600" />
              <span>5. Casco.txt Կանոնների Հուշաթերթ</span>
            </button>
          </div>

          {/* TAB 1: Client & Vehicle Details */}
          {activeTab === "vehicle" && (
            <section className="sil-card p-5 sm:p-7 space-y-6 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-600" />
                    <span>Հաճախորդի և Տրանսպորտային Միջոցի Տեխնիկական Տվյալներ</span>
                  </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <Field label="Ապահովադիր (Անուն Ազգանուն / Կազմակերպություն)">
                    <input className="sil-input" placeholder="Արմեն Պետրոսյան" value={data.clientName} onChange={e=>set("clientName",e.target.value)} />
                  </Field>
                  <Field label="Հեռախոսահամար">
                    <input className="sil-input" placeholder="+374 91 000000" value={data.phone} onChange={e=>set("phone",e.target.value)} />
                  </Field>
                  <Field label="Էլ․ փոստ">
                    <input className="sil-input" placeholder="client@example.am" value={data.email} onChange={e=>set("email",e.target.value)} />
                  </Field>

                  <Field label="Մակնիշ (Make)">
                    <input className="sil-input font-bold" placeholder="Toyota, Mercedes-Benz, etc." value={data.vehicleMake} onChange={e=>set("vehicleMake",e.target.value)} />
                  </Field>
                  <Field label="Մոդել (Model)">
                    <input className="sil-input font-bold" placeholder="Camry, E350, RAV4..." value={data.vehicleModel} onChange={e=>set("vehicleModel",e.target.value)} />
                  </Field>
                  <Field label="Արտադրման տարի">
                    <input type="number" min="1990" max={new Date().getFullYear()+1} className="sil-input" value={data.manufactureYear || ""} onChange={e=>set("manufactureYear",Number(e.target.value))} />
                  </Field>

                  <Field label="Պետհամարանիշ (License Plate)">
                    <input className="sil-input font-mono uppercase" placeholder="36 XX 666" value={data.licensePlate || ""} onChange={e=>set("licensePlate",e.target.value.toUpperCase())} />
                  </Field>
                  <Field label="VIN ծածկագիր (Vehicle Identification Number)">
                    <input className="sil-input font-mono uppercase text-xs" placeholder="JTDKN36U001234567" maxLength={17} value={data.vehicleVin || ""} onChange={e=>set("vehicleVin",e.target.value.toUpperCase())} />
                  </Field>
                  <Field label="Հաշվառման վկայագիր (Տեխպասպորտի համար)">
                    <input className="sil-input uppercase" placeholder="RA 123456" value={data.registrationDocNumber || ""} onChange={e=>set("registrationDocNumber",e.target.value.toUpperCase())} />
                  </Field>

                  <Field label="Շարժիչի հզորություն (ձ.ու. / HP)">
                    <input type="number" min="0" placeholder="180" className="sil-input" value={data.enginePowerHp || ""} onChange={e=>set("enginePowerHp",Number(e.target.value))} />
                  </Field>
                  <Field label="Փոխանցման տուփ (Transmission)">
                    <select className="sil-input" value={data.transmissionType || "automatic"} onChange={e=>set("transmissionType",e.target.value as any)}>
                      <option value="automatic">Ավտոմատ (Automatic / Variator / Robot)</option>
                      <option value="manual">Մեխանիկական (Manual)</option>
                    </select>
                  </Field>
                  <Field label="Վառելիքի տեսակ (Fuel Type)">
                    <select className="sil-input" value={data.fuelType || "petrol"} onChange={e=>set("fuelType",e.target.value as any)}>
                      <option value="petrol">Բենզին</option>
                      <option value="diesel">Դիզել</option>
                      <option value="gas">Գազ (LPG / CNG)</option>
                      <option value="hybrid">Հիբրիդ (Hybrid / Plug-in)</option>
                      <option value="electric">Էլեկտրական (EV)</option>
                    </select>
                  </Field>

                  <Field label="Շահագործման նպատակ (Casco.txt կետ 1.1/8)">
                    <select className="sil-input" value={data.vehicleUsagePurpose || "personal"} onChange={e=>set("vehicleUsagePurpose",e.target.value as CascoUsagePurpose)}>
                      <option value="personal">Անձնական / Ընտանեկան օգտագործում</option>
                      <option value="commercial">Ծառայողական / Կորպորատիվ բիզնես</option>
                      <option value="taxi_rental">Տաքսի / Վարձակալություն / Ուսումնական</option>
                    </select>
                  </Field>
                  <Field label="Ապահովադրի տեսակ (Excel)">
                    <select className="sil-input" value={data.policyholderType} onChange={e=>set("policyholderType",e.target.value as CascoInsuranceData["policyholderType"])}>
                      <option>Ֆիզիկական անձ</option>
                      <option>Իրավաբանական անձ</option>
                      <option>բանկային լիզինգ</option>
                    </select>
                  </Field>
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

                  <div className="md:col-span-3 bg-gradient-to-r from-blue-50 to-indigo-50/70 p-4 rounded-2xl border border-blue-200/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-sm">
                        <Car size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">ԱԲ Միջին Շուկայական Գնահատում (List.am Grounded)</div>
                        <div className="text-[11px] text-slate-600">Ավտոմեքենայի իրական շուկայական արժեքի որոշում մոդելի, տարեթվի և շուկայի հիման վրա</div>
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

                  <div className="md:col-span-3">
                    <Field label="Շուկայական / Ապահովագրական արժեք (Sum Insured)">
                      <input
                        type="number"
                        min="0"
                        placeholder="Օրինակ՝ 10000000 ֏ կամ 25000 $"
                        className="sil-input font-black text-blue-900 text-lg"
                        value={data.marketValue || ""}
                        onChange={e=>set("marketValue",Number(e.target.value))}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: Coverage Sections A, B, C (Casco.txt grounded) */}
          {activeTab === "sections" && (
            <section className="sil-card p-5 sm:p-7 space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  <span>ԿԱՍԿՈ Ծածկույթի Բաժիններ (Casco.txt կանոնների համապատասխանությամբ)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">Ընտրեք հիմնական ավտոտրանսպորտային, դժբախտ պատահարների և քաղաքացիական պատասխանատվության ծածկույթները</p>
              </div>

              {/* Section A: Transport Damage & Theft */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-black text-sm text-blue-950 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">Ա</span>
                    <span>Բաժին Ա. Տրանսպորտային Միջոցի Ապահովագրություն</span>
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">Պարտադիր ԿԱՍԿՈ Բաժին</span>
                </div>

                <div className="grid md:grid-cols-2 gap-3 pt-1">
                  <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${data.sectionOption === "physical_and_theft" ? "bg-white border-blue-500 shadow-xs ring-1 ring-blue-500/20" : "bg-slate-50 border-slate-200"}`}>
                    <input
                      type="radio"
                      name="sectionOption"
                      checked={data.sectionOption !== "physical_only"}
                      onChange={() => {
                        setData(prev => ({ ...prev, sectionOption: "physical_and_theft", theftCoverage: "ներառել" }));
                        setChecked(false);
                      }}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">Տարբերակ 1. «Ֆիզիկական վնաս և Հափշտակություն»</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Լիակատար ծածկույթ՝ ՃՏՊ բախումներ, գողություն, կողոպուտ, ավազակություն, հրդեհ, տարերային աղետներ, վանդալիզմ</div>
                    </div>
                  </label>

                  <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${data.sectionOption === "physical_only" ? "bg-white border-blue-500 shadow-xs ring-1 ring-blue-500/20" : "bg-slate-50 border-slate-200"}`}>
                    <input
                      type="radio"
                      name="sectionOption"
                      checked={data.sectionOption === "physical_only"}
                      onChange={() => {
                        setData(prev => ({ ...prev, sectionOption: "physical_only", theftCoverage: "չներառել" }));
                        setChecked(false);
                      }}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">Տարբերակ 2. «Միայն Ֆիզիկական Վնաս»</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">ՃՏՊ բախումներ, տարերային աղետներ, հրդեհ/պայթյուն, առանց հափշտակության/գողության ռիսկի</div>
                    </div>
                  </label>
                </div>

                {/* Section A specific tariff and franchise configuration */}
                <div className="grid md:grid-cols-3 gap-3 pt-2 bg-white/70 p-3 rounded-xl border border-blue-100">
                  <Field label="Բաժին Ա. Առանձին սակագին (%)">
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      className="sil-input font-bold text-blue-900"
                      placeholder={`Ավտոմատ՝ ${(calc.finalTariff * 100).toFixed(2)}%`}
                      value={data.sectionATariffPercent || ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? undefined : Number(e.target.value);
                        setData(prev => ({ ...prev, sectionATariffPercent: val }));
                        setChecked(false);
                      }}
                    />
                  </Field>

                  <Field label="Բաժին Ա. Ֆրանշիզայի տեսակ">
                    <select
                      className="sil-input font-bold"
                      value={data.sectionAFranchiseType || data.franchiseDeductibleType || (data.franchiseAmount === 0 ? "zero" : "unconditional")}
                      onChange={(e) => {
                        const v = e.target.value as CascoFranchiseDeductibleType;
                        setData(prev => ({
                          ...prev,
                          sectionAFranchiseType: v,
                          franchiseDeductibleType: v,
                          sectionAFranchiseAmount: v === "zero" ? 0 : prev.sectionAFranchiseAmount || prev.franchiseAmount || 50000,
                          franchiseAmount: v === "zero" ? 0 : prev.franchiseAmount || 50000,
                        }));
                        setChecked(false);
                      }}
                    >
                      <option value="unconditional">Ոչ պայմանական (Deductible)</option>
                      <option value="conditional">Պայմանական (Conditional)</option>
                      <option value="zero">0% (Առանց ֆրանշիզայի)</option>
                    </select>
                  </Field>

                  <Field label="Բաժին Ա. Ֆրանշիզայի չափ">
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      className="sil-input font-bold"
                      value={data.sectionAFranchiseAmount !== undefined ? data.sectionAFranchiseAmount : data.franchiseAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setData(prev => ({ ...prev, sectionAFranchiseAmount: val, franchiseAmount: val }));
                        setChecked(false);
                      }}
                    />
                  </Field>
                </div>
              </div>

              {/* Section B: Personal Accident for Driver and Passengers */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-black text-sm text-indigo-950 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">Բ</span>
                    <span>Բաժին Բ. Վարորդի և Ուղևորների Դժբախտ Պատահարներ (ԴՊ)</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(data.includeDriverPassengerAccident)}
                      onChange={(e) => set("includeDriverPassengerAccident", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    <span className="ml-2 text-xs font-bold text-indigo-900">Ներառել ԴՊ</span>
                  </label>
                </div>

                {data.includeDriverPassengerAccident && (
                  <div className="space-y-3 pt-2">
                    <div className="grid md:grid-cols-2 gap-3">
                      <Field label="Ապահովագրված նստատեղերի քանակ">
                        <input
                          type="number"
                          min="1"
                          max="9"
                          className="sil-input"
                          value={data.accidentSeatsCount || 5}
                          onChange={(e) => set("accidentSeatsCount", Number(e.target.value))}
                        />
                      </Field>
                      <Field label="Ապահովագրական սահմանաչափ 1 նստատեղի համար">
                        <input
                          type="number"
                          min="100000"
                          step="100000"
                          className="sil-input font-bold"
                          value={data.accidentSumPerSeat || (data.currency === "USD" ? 2500 : 1000000)}
                          onChange={(e) => set("accidentSumPerSeat", Number(e.target.value))}
                        />
                      </Field>
                    </div>

                    {/* Section B dedicated Tariff and Franchise */}
                    <div className="grid md:grid-cols-3 gap-3 bg-white/70 p-3 rounded-xl border border-indigo-100">
                      <Field label="Բաժին Բ. Առանձին սակագին (%)">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="sil-input font-bold text-indigo-900"
                          value={data.sectionBTariffPercent !== undefined ? data.sectionBTariffPercent : 0.30}
                          onChange={(e) => set("sectionBTariffPercent", Number(e.target.value))}
                        />
                      </Field>

                      <Field label="Բաժին Բ. Առանձին ֆրանշիզայի տեսակ">
                        <select
                          className="sil-input font-bold"
                          value={data.sectionBFranchiseType || "zero"}
                          onChange={(e) => {
                            const val = e.target.value as CascoFranchiseDeductibleType;
                            setData(prev => ({
                              ...prev,
                              sectionBFranchiseType: val,
                              sectionBFranchiseAmount: val === "zero" ? 0 : (prev.sectionBFranchiseAmount || 10000),
                            }));
                            setChecked(false);
                          }}
                        >
                          <option value="zero">0% (Առանց ֆրանշիզայի)</option>
                          <option value="unconditional">Ոչ պայմանական (Deductible)</option>
                          <option value="conditional">Պայմանական (Conditional)</option>
                        </select>
                      </Field>

                      <Field label="Բաժին Բ. Ֆրանշիզայի գումար">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          className="sil-input font-bold"
                          disabled={data.sectionBFranchiseType === "zero"}
                          value={data.sectionBFranchiseAmount || 0}
                          onChange={(e) => set("sectionBFranchiseAmount", Number(e.target.value))}
                        />
                      </Field>
                    </div>

                    <div className="text-[11px] text-indigo-800 bg-indigo-100/60 p-2.5 rounded-xl">
                      <strong>Ծածկվող ԴՊ ռիսկեր (Casco.txt 4.1.2)՝</strong> 1) Մահ, 2) Լրիվ մշտական անաշխատունակություն (I, II, III խումբ), 3) Առաջին բժշկական օգնության ծախսեր (մինչև 100,000 ֏ սահմանաչափով)։
                    </div>
                  </div>
                )}
              </div>

              {/* Section C: Voluntary Third Party Liability */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-black text-sm text-emerald-950 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">Գ</span>
                    <span>Բաժին Գ. Քաղաքացիական Պատասխանատվություն (Կամավոր ԱՊՊԱ)</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(data.includeVoluntaryTpl)}
                      onChange={(e) => set("includeVoluntaryTpl", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-2 text-xs font-bold text-emerald-900">Ներառել Կամավոր ԱՊՊԱ</span>
                  </label>
                </div>

                {data.includeVoluntaryTpl && (
                  <div className="space-y-3 pt-2">
                    <Field label="Լրացուցիչ պատասխանատվության սահմանաչափ">
                      <select
                        className="sil-input font-bold"
                        value={data.voluntaryTplLimit || (data.currency === "USD" ? 12500 : 5000000)}
                        onChange={(e) => set("voluntaryTplLimit", Number(e.target.value))}
                      >
                        <option value={data.currency === "USD" ? 7500 : 3000000}>{data.currency === "USD" ? "$7,500" : "3,000,000 ֏"} (Լրացուցիչ ծածկույթ 3-րդ անձանց)</option>
                        <option value={data.currency === "USD" ? 12500 : 5000000}>{data.currency === "USD" ? "$12,500" : "5,000,000 ֏"} (Օպտիմալ)</option>
                        <option value={data.currency === "USD" ? 25000 : 10000000}>{data.currency === "USD" ? "$25,000" : "10,000,000 ֏"} (Մաքսիմալ պաշտպանություն)</option>
                        <option value={data.currency === "USD" ? 50000 : 20000000}>{data.currency === "USD" ? "$50,000" : "20,000,000 ֏"} (VIP լիմիտ)</option>
                      </select>
                    </Field>

                    {/* Section C dedicated Tariff and Franchise */}
                    <div className="grid md:grid-cols-3 gap-3 bg-white/70 p-3 rounded-xl border border-emerald-100">
                      <Field label="Բաժին Գ. Առանձին սակագին (%)">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="sil-input font-bold text-emerald-900"
                          value={data.sectionCTariffPercent !== undefined ? data.sectionCTariffPercent : 0.40}
                          onChange={(e) => set("sectionCTariffPercent", Number(e.target.value))}
                        />
                      </Field>

                      <Field label="Բաժին Գ. Առանձին ֆրանշիզայի տեսակ">
                        <select
                          className="sil-input font-bold"
                          value={data.sectionCFranchiseType || "zero"}
                          onChange={(e) => {
                            const val = e.target.value as CascoFranchiseDeductibleType;
                            setData(prev => ({
                              ...prev,
                              sectionCFranchiseType: val,
                              sectionCFranchiseAmount: val === "zero" ? 0 : (prev.sectionCFranchiseAmount || 20000),
                            }));
                            setChecked(false);
                          }}
                        >
                          <option value="zero">0% (Առանց ֆրանշիզայի)</option>
                          <option value="unconditional">Ոչ պայմանական (Deductible)</option>
                          <option value="conditional">Պայմանական (Conditional)</option>
                        </select>
                      </Field>

                      <Field label="Բաժին Գ. Ֆրանշիզայի գումար">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          className="sil-input font-bold"
                          disabled={data.sectionCFranchiseType === "zero"}
                          value={data.sectionCFranchiseAmount || 0}
                          onChange={(e) => set("sectionCFranchiseAmount", Number(e.target.value))}
                        />
                      </Field>
                    </div>

                    <div className="text-[11px] text-emerald-800 bg-emerald-100/60 p-2.5 rounded-xl flex items-center">
                      Ծածկում է պարտադիր ԱՊՊԱ-ի շեմը գերազանցող գույքային և առողջապահական վնասները (ներառյալ դատական ծախսերը մինչև 10%)։
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Non-factory Equipment */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-black text-sm text-amber-950 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>Լրացուցիչ Ոչ Գործարանային Սարքավորումներ (Casco.txt 3.1)</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(data.includeAdditionalEquipment)}
                      onChange={(e) => set("includeAdditionalEquipment", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    <span className="ml-2 text-xs font-bold text-amber-900">Ներառել</span>
                  </label>
                </div>

                {data.includeAdditionalEquipment && (
                  <div className="space-y-3 pt-2">
                    <div className="grid md:grid-cols-2 gap-3">
                      <Field label="Սարքավորումների նկարագրություն (Աուդիո/վիդեո, Գազաբալոն, Rims...)">
                        <input
                          className="sil-input"
                          placeholder="Օր․ Գազաբալոնային համակարգ (LPG), Pioneer Multimedia"
                          value={data.additionalEquipmentDetails || ""}
                          onChange={(e) => set("additionalEquipmentDetails", e.target.value)}
                        />
                      </Field>
                      <Field label="Սարքավորումների գնահատված արժեք">
                        <input
                          type="number"
                          min="0"
                          placeholder="500000"
                          className="sil-input font-bold"
                          value={data.additionalEquipmentValue || ""}
                          onChange={(e) => set("additionalEquipmentValue", Number(e.target.value))}
                        />
                      </Field>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 bg-white/70 p-3 rounded-xl border border-amber-100">
                      <Field label="Սարքավորումների առանձին սակագին (%)">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="sil-input font-bold text-amber-900"
                          placeholder={`Ավտոմատ՝ ${(calc.finalTariff * 100).toFixed(2)}%`}
                          value={data.additionalEquipmentTariffPercent || ""}
                          onChange={(e) => set("additionalEquipmentTariffPercent", e.target.value === "" ? undefined : Number(e.target.value))}
                        />
                      </Field>
                      <Field label="Սարքավորումների ֆրանշիզայի գումար">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          className="sil-input font-bold"
                          placeholder="Ըստ Բաժին Ա-ի"
                          value={data.additionalEquipmentFranchiseAmount || ""}
                          onChange={(e) => set("additionalEquipmentFranchiseAmount", e.target.value === "" ? undefined : Number(e.target.value))}
                        />
                      </Field>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* TAB 3: Franchise & Driver Rules */}
          {activeTab === "franchise" && (
            <section className="sil-card p-5 sm:p-7 space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <span>Չհատուցվող Գումար (Ֆրանշիզա) & Լիազորված Վարորդների Պայմաններ</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">Ըստ Casco.txt-ի 7-րդ բաժնի դրույթների, տարիքային և ստաժային բազմապատկիչների (7.4, 7.5 կետեր)</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Ֆրանշիզայի բնույթ (Casco.txt 7.1/7.2)">
                  <select
                    className="sil-input font-bold"
                    value={data.franchiseDeductibleType || (data.franchiseAmount === 0 ? "zero" : "unconditional")}
                    onChange={(e) => {
                      const v = e.target.value as CascoFranchiseDeductibleType;
                      setData(prev => ({
                        ...prev,
                        franchiseDeductibleType: v,
                        franchiseAmount: v === "zero" ? 0 : prev.franchiseAmount || 50000,
                      }));
                      setChecked(false);
                    }}
                  >
                    <option value="unconditional">Ոչ պայմանական (Deductible — նվազեցվում է հատուցումից)</option>
                    <option value="conditional">Պայմանական (Conditional — ավելին հատուցվում է լրիվ)</option>
                    <option value="zero">0% (Առանց ֆրանշիզայի / Լրիվ ծածկույթ)</option>
                  </select>
                </Field>

                <Field label="Ֆրանշիզայի արտահայտման ձև">
                  <select
                    className="sil-input"
                    value={data.franchiseCalculationBasis || "fixed_amount"}
                    onChange={(e) => set("franchiseCalculationBasis", e.target.value as CascoFranchiseBasis)}
                  >
                    <option value="fixed_amount">Ֆիքսված գումար (AMD / USD)</option>
                    <option value="percent_sum_insured">Տոկոս ապահովագրական գումարից (%)</option>
                  </select>
                </Field>

                <Field label="Ֆրանշիզայի փաստացի չափ">
                  <input
                    type="number"
                    min="0"
                    className="sil-input font-bold text-slate-900"
                    value={data.franchiseAmount}
                    onChange={(e) => set("franchiseAmount", Number(e.target.value))}
                  />
                </Field>

                <Field label="Excel-ի ֆրանշիզայի տարբերակ">
                  <select className="sil-input" value={data.franchiseOption} onChange={e=>set("franchiseOption",e.target.value as CascoInsuranceData["franchiseOption"])}>
                    <option>Ֆրանշիզան անփոփոխ</option>
                    <option>Ֆրանշիզայի կիսում</option>
                    <option>Մինիմալ ֆրանշիզա</option>
                  </select>
                </Field>

                <Field label="Վարորդի նվազագույն տարիք (տարի)">
                  <input
                    type="number"
                    min="18"
                    max="99"
                    className="sil-input font-bold"
                    value={data.driverMinAge || ""}
                    onChange={(e) => set("driverMinAge", Number(e.target.value))}
                  />
                </Field>

                <Field label="Վարորդական նվազագույն ստաժ (տարի)">
                  <input
                    type="number"
                    min="0"
                    max="80"
                    className="sil-input font-bold"
                    value={data.driverMinExp}
                    onChange={(e) => set("driverMinExp", Number(e.target.value))}
                  />
                </Field>

                <Field label="Լիազորված վարորդներ (Excel & Casco.txt 2.1)">
                  <select
                    className="sil-input"
                    value={data.driverCountOption}
                    onChange={(e) => {
                      const v = e.target.value as CascoInsuranceData["driverCountOption"];
                      setData(x => ({ ...x, driverCountOption: v, isUnlimitedDrivers: v === "Անսահմանափակ" }));
                      setChecked(false);
                    }}
                  >
                    <option>Անսահմանափակ</option>
                    <option>Սահմանափակ</option>
                  </select>
                </Field>

                {data.driverCountOption === "Սահմանափակ" && (
                  <div className="md:col-span-2">
                    <Field label="Լիազորված վարորդների անվանացանկ և վկայականներ">
                      <input
                        className="sil-input text-xs"
                        placeholder="Օր․ Արմեն Պետրոսյան (ՎՎ 001234, ստաժ 5տ.), Կարեն Գևորգյան (ՎՎ 005678, ստաժ 3տ.)"
                        value={data.authorizedDriversList || ""}
                        onChange={(e) => set("authorizedDriversList", e.target.value)}
                      />
                    </Field>
                  </div>
                )}
              </div>

              {/* Casco.txt clause 7.4 & 7.5 visual banner */}
              {data.driverAgeExpMultiplier && data.driverAgeExpMultiplier > 1 ? (
                <div className="bg-amber-500/15 border border-amber-500/40 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-extrabold text-amber-950">
                      ԿԱՍԿՈ Կանոնների {data.driverAgeExpMultiplier === 3 ? "7.5 կետի (ստաժ < 1 տարի) 3x ֆրանշիզայի կանոն" : "7.4 կետի (տարիք < 21 կամ ստաժ 1-3 տարի) 2x ֆրանշիզայի կանոն"}։
                    </strong>
                    <div className="mt-1 text-amber-800 leading-relaxed">
                      Պայմանագրով սահմանված ֆրանշիզայի չափը պատահարի ժամանակ կրկնապատկվում կամ եռապատկվում է ({data.driverAgeExpMultiplier}x), քանի որ վարորդի տարիքը կազմում է {data.driverMinAge} տ., իսկ ստաժը՝ {data.driverMinExp} տարի։ Տեղեկատվությունն ավտոմատ կերպով արտացոլվում է առաջարկի հատուկ պայմաններում։
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ստանդարտ ֆրանշիզա (1x)․ վարորդի տարիքը ≥21 տ. է և վարորդական ստաժը ≥3 տարի (Casco.txt կանոնների համապատասխանություն)։</span>
                </div>
              )}
            </section>
          )}

          {/* TAB 4: Excel Adjustments, Services, Bank Pledge */}
          {activeTab === "services" && (
            <section className="sil-card p-5 sm:p-7 space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-600" />
                  <span>Excel Ճշգրտումներ, Շահառու Բանկ & Հատուկ Ծառայություններ</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">Հաստատված Excel հաշվիչի մաթեմատիկական պարամետրերը և բանկային գրավի տվյալները</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Երաշխիքային սպասարկում (Դիլեր)"><select className="sil-input" value={data.warrantyService} onChange={e=>set("warrantyService",e.target.value as CascoInsuranceData["warrantyService"])}><option>չներառել</option><option>ներառել</option></select></Field>
                <Field label="Բոնուս Մալուս"><select className="sil-input" value={data.bonusMalus} onChange={e=>set("bonusMalus",e.target.value as CascoInsuranceData["bonusMalus"])}><option>չընտրել</option><option>&lt;=7</option><option>8-10</option><option>11-12</option><option>13-14</option></select></Field>
                <Field label="Վնասաբերություն"><select className="sil-input" value={data.lossRatio} onChange={e=>set("lossRatio",e.target.value as CascoInsuranceData["lossRatio"])}><option>չընտրել</option><option>Վնասաբերությունը  &gt;=  90% </option><option>Վնասաբերությունը  &lt; 90% </option></select></Field>
                <Field label="Վճարման ձև"><select className="sil-input" value={data.paymentMethod} onChange={e=>set("paymentMethod",e.target.value as CascoInsuranceData["paymentMethod"])}><option>Միանվագ</option><option>2 վճարում</option><option>4 վճարում</option><option>12 վճարում</option></select></Field>
                <Field label="ՃԵԿ կանոններ"><select className="sil-input" value={data.trafficRules} onChange={e=>set("trafficRules",e.target.value as CascoInsuranceData["trafficRules"])}><option>չներառել</option><option>ներառել</option></select></Field>
                <Field label="Տարածաշրջան"><select className="sil-input" value={data.territory} onChange={e=>set("territory",e.target.value as CascoInsuranceData["territory"])}><option>Միայն ՀՀ</option><option>ՀՀ և Վրաստան</option><option>ՀՀ, Վրաստան և ԱՊՀ երկրներ</option></select></Field>
                
                <Field label="Միջնորդավճար (%)"><input type="number" min="0" max="100" step="0.1" className="sil-input" value={data.brokerCommissionPercent} onChange={e=>set("brokerCommissionPercent",Number(e.target.value))} /></Field>
                <Field label="Շահույթ (%)"><input type="number" min="0" max="100" step="0.1" className="sil-input" value={data.profitPercent} onChange={e=>set("profitPercent",Number(e.target.value))} /></Field>
                
                <Field label="Առանց Ոստիկանության ակտի ապակիների լիմիտ">
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    className="sil-input"
                    value={data.noPoliceGlassAnnualLimit || 300000}
                    onChange={(e) => set("noPoliceGlassAnnualLimit", Number(e.target.value))}
                  />
                </Field>
              </div>

              {/* Bank Pledge Beneficiary */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Գրավադրվածություն և Շահառու Բանկ (Pledge / Beneficiary)
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(data.isPledged)}
                      onChange={(e) => set("isPledged", e.target.checked)}
                    />
                    <span>Առկա է բանկային գրավ</span>
                  </label>
                </div>

                {data.isPledged && (
                  <div className="grid md:grid-cols-2 gap-4 pt-1">
                    <Field label="Գրավառու Բանկ / Վարկային Կազմակերպություն">
                      <input
                        className="sil-input font-bold"
                        placeholder="«Ամերիաբանկ» ՓԲԸ, «ԱրարատԲանկ» ԲԲԸ..."
                        value={data.bankName || ""}
                        onChange={(e) => set("bankName", e.target.value)}
                      />
                    </Field>
                    <Field label="Վարկի / Գրավի պայմանագրի համար">
                      <input
                        className="sil-input"
                        placeholder="Օր․ CR-2025/0891"
                        value={data.loanContractNumber || ""}
                        onChange={(e) => set("loanContractNumber", e.target.value)}
                      />
                    </Field>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold cursor-pointer">
                  <input type="checkbox" checked={Boolean(data.includeTowingAssistance)} onChange={e=>set("includeTowingAssistance",e.target.checked)} />
                  <span>Անվճար Էվակուատոր և շուրջօրյա ճանապարհային ասիսթանս (ՀՀ տարածքում)</span>
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold cursor-pointer">
                  <input type="checkbox" checked={Boolean(data.electricVehicle)} onChange={e=>set("electricVehicle",e.target.checked)} />
                  <span>Էլեկտրոմոբիլ / Հիբրիդ (EV/PHEV)</span>
                </label>
              </div>
            </section>
          )}

          {/* TAB 5: Casco.txt Rules & Claim Documentation Checklist */}
          {activeTab === "rules" && (
            <section className="sil-card p-5 sm:p-7 space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <span>«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԿԱՍԿՈ Կանոնների Հուշաթերթ (Casco.txt Knowledge Base)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">Ապահովագրական պատահարների կարգավորման, ծանուցման և պարտադիր փաստաթղթերի պահանջները</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-black text-xs text-slate-900 uppercase flex items-center gap-1.5 text-blue-700">
                    <Activity className="w-4 h-4" />
                    <span>Պատահարի Ծանուցման Կարգը (Կետ 13.1)</span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>Անհապաղ տեղեկացնել Ճանապարհային Ոստիկանությանը (կամ ԱԻՆ / Ոստիկանություն)։</li>
                    <li>Առավելագույնը <strong>2 (երկու) աշխատանքային օրվա</strong> ընթացքում գրավոր ծանուցել «ՍԻԼ ԻՆՇՈՒՐԱՆՍ»-ին։</li>
                    <li>Առանց Ապահովագրողի համաձայնության չիրականացնել վերանորոգման աշխատանքներ։</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-black text-xs text-slate-900 uppercase flex items-center gap-1.5 text-emerald-700">
                    <FileCheck2 className="w-4 h-4" />
                    <span>Հատուցման Անհրաժեշտ Փաստաթղթեր (Կետ 13)</span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>Ապահովադրի անձնագիր / Նույնականացման քարտ</li>
                    <li>Տրանսպորտային միջոցի հաշվառման վկայագիր (Տեխպասպորտ)</li>
                    <li>Վարորդի վարորդական իրավունքի վկայական</li>
                    <li>Իրավասու մարմնի (ՃՈ/Ոստիկանություն) արձանագրություն / որոշում</li>
                  </ul>
                </div>

                <div className="md:col-span-2 p-4 rounded-2xl bg-red-50/70 border border-red-200/80 space-y-2">
                  <div className="font-black text-xs text-red-950 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Հատուցման Մերժման Հիմնական Պատճառները (Casco.txt Կետ 5.1)</span>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-2 text-xs text-red-900 pt-1">
                    <div className="bg-white/80 p-2 rounded-xl border border-red-100">
                      <strong>1. Ոչ սթափ վիճակ՝</strong> Ալկոհոլի, թմրանյութերի ազդեցության տակ վարելը կամ սթափության փորձաքննությունից խուսափելը։
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-red-100">
                      <strong>2. Անսարք ՏՄ՝</strong> Տեխնիկապես անսարք ՏՄ շահագործումը կամ սեզոնին ոչ համապատասխան անվադողերը (ամառային անվադող ձմռանը)։
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-red-100">
                      <strong>3. Չլիազորված վարորդ՝</strong> Պայմանագրով չնախատեսված կամ վարորդական իրավունք չունեցող անձի կողմից վարումը։
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Bottom Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap gap-2">
              <button onClick={save} className="rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-xs hover:bg-slate-50 transition cursor-pointer">
                Պահպանել Draft
              </button>
              <button onClick={reset} className="rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition cursor-pointer">
                <RotateCcw className="w-3.5 h-3.5"/>Մաքրել
              </button>
            </div>
            <button
              onClick={() => setChecked(true)}
              className="sil-primary text-white px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4"/>Ստուգել & Հաշվարկել
            </button>
          </div>
        </div>

        {/* Sticky Result Sidebar */}
        <aside className="space-y-4">
          <div className="sil-card p-5 sticky top-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-extrabold text-base text-slate-900">Հաշվարկի Արդյունք</h2>
              <span className="text-[11px] rounded-full bg-blue-100 text-blue-900 px-2.5 py-0.5 font-black">
                Excel Engine 2024
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Stat label="Տարիքային խումբ" value={calc.yearBand.replaceAll("_"," ")} />
              <Stat label="Գումարի խումբ" value={calc.amountBand === "under7" ? "< 7 մլն ֏" : "≥ 7 մլն ֏"} />
              <Stat label="Բազային մաքս." value={`${(calc.baseGrossMax*100).toFixed(3)}%`} />
              <Stat label="Excel նվազագույն" value={`${(calc.minimumTariff*100).toFixed(2)}%`} />
            </div>

            <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#061A40] to-[#0d3478] text-white p-5 shadow-lg">
              <div className="text-[11px] text-blue-200 font-bold uppercase tracking-wider">Ընդհանուր Սակագին (միջին)</div>
              <div className="text-3xl font-black mt-1 text-cyan-300">{(calc.finalTariff*100).toFixed(4)}%</div>
              <div className="text-xs text-blue-200 mt-3 font-bold uppercase tracking-wider">Ընդհանուր Տարեկան Ապահովագրավճար</div>
              <div className="text-2xl font-black mt-1 text-amber-400">{formatCurrency(calc.annualPremium, data.currency)}</div>
            </div>

            {/* Per-Section Granular Breakdown Card (Ա, Բ, Գ) */}
            {proposal?.cascoBreakdown && proposal.cascoBreakdown.length > 0 && (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Բաժինների Առանձին Հաշվարկ (Ա, Բ, Գ)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Սակագին / Ֆրանշիզա</span>
                </div>
                
                <div className="space-y-2 text-xs">
                  {proposal.cascoBreakdown.map((item, idx) => {
                    const isSectionA = item.sectionKey === "section_a";
                    const isSectionB = item.sectionKey === "section_b";
                    const isSectionC = item.sectionKey === "section_c";
                    const borderColor = isSectionA ? "border-blue-100" : isSectionB ? "border-indigo-100" : isSectionC ? "border-emerald-100" : "border-amber-100";
                    const titleColor = isSectionA ? "text-blue-900" : isSectionB ? "text-indigo-900" : isSectionC ? "text-emerald-900" : "text-amber-900";
                    const tariffColor = isSectionA ? "text-blue-700" : isSectionB ? "text-indigo-700" : isSectionC ? "text-emerald-700" : "text-amber-700";

                    return (
                      <div key={idx} className={`p-2 rounded-lg bg-white border ${borderColor} shadow-2xs`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${titleColor} truncate max-w-[170px]`}>{item.sectionName}</span>
                          <span className={`font-extrabold ${tariffColor}`}>{item.tariff.toFixed(2)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1">
                          <span>Գումար՝ {formatCurrency(item.sumInsured, data.currency)}</span>
                          <span className="font-bold text-slate-900">{formatCurrency(item.premium, data.currency)}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Ֆրանշիզա՝ {item.franchise}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 space-y-1.5">
              <div className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                Excel Սակագնային Ճշգրտումներ
              </div>
              <div className="max-h-44 overflow-y-auto space-y-1 text-xs pr-1">
                {calc.adjustments.map((a, i) => (
                  <div key={i} className="flex justify-between gap-2 border-b border-slate-100 py-1 text-[11px]">
                    <span className="text-slate-600 truncate">{a.label}</span>
                    <b className={a.value < 0 ? "text-emerald-700 shrink-0" : "text-slate-800 shrink-0"}>
                      {a.value >= 0 ? "+" : ""}{(a.value * 100).toFixed(3)}%
                    </b>
                  </div>
                ))}
              </div>
            </div>

            {calc.errors.length > 0 && (
              <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800 space-y-1.5">
                {calc.errors.map((e, i) => (
                  <div key={i} className="flex gap-1.5">
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <span>{e}</span>
                  </div>
                ))}
              </div>
            )}

            {checked && calc.valid && calc.errors.length === 0 && (
              <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>Excel-ի և Casco.txt-ի բոլոր հաշվարկային պայմանները հաստատված են։</span>
              </div>
            )}

            <button
              disabled={!calc.valid || calc.errors.length > 0}
              onClick={() => proposal && onGenerateQuotation(proposal)}
              className="mt-4 w-full rounded-xl bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-emerald-700 text-white py-3 font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Ստեղծել Պաշտոնական Գնառաջարկ</span>
            </button>
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

      {/* AI OCR Scanner Modal */}
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
                  licensePlate: (scanned as any).plateNumber || prev.licensePlate,
                  vehicleVin: (scanned as any).vin || prev.vehicleVin,
                  registrationDocNumber: (scanned as any).registrationNumber || prev.registrationDocNumber,
                }));
                setChecked(false);
                setShowOcrModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* List.am AI Market Valuation Modal */}
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

function Field({label,children}:{label:string;children:ReactNode}) {
  return <label className="text-xs font-bold text-slate-700 block space-y-1"><span>{label}</span>{children}</label>;
}

function Stat({label,value}:{label:string;value:string}) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
      <div className="text-[10px] text-slate-500 font-semibold">{label}</div>
      <div className="font-black text-xs text-slate-800 mt-0.5 truncate">{value}</div>
    </div>
  );
}
