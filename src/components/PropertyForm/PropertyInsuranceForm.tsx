import { useState } from "react";
import { ListAmPropertyValuationCalculator } from "../Property/ListAmPropertyValuationCalculator";
import { PropertyCertificateScannerModal, ScannedCertificateData } from "../Property/PropertyCertificateScannerModal";
import {
  PropertyInsuranceFormState,
  QuotationProposal,
} from "../../types";
import {
  formatCurrency,
  formatPercent,
  calculatePropertyQuotation,
  buildPropertyProposal,
} from "../../utils/insuranceCalculator";
import { PropertyPackageSelector } from "./PropertyPackageSelector";
import { ShortTermRentalSection } from "./ShortTermRentalSection";
import { PropertyPackageId } from "../../data/tunServicePackages";
import {
  DEFAULT_PROPERTY_STATE,
  PRESET_OFFICE_IT,
  PRESET_WAREHOUSE_LOGISTICS,
  PRESET_TUN_START,
  PRESET_TUN_STANDARD_PLUS,
  PRESET_TUN_PREMIUM,
  BANK_LIST,
} from "../../data/presets";
import {
  Building2,
  MapPin,
  Package,
  Coins,
  Boxes,
  Warehouse,
  Zap,
  Flame,
  ShieldCheck,
  History,
  ShieldAlert,
  Shield,
  FileCheck2,
  Landmark,
  Sparkles,
  RefreshCw,
  FileText,
  Percent,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface PropertyInsuranceFormProps {
  state: PropertyInsuranceFormState;
  onChange: (updater: (prev: PropertyInsuranceFormState) => PropertyInsuranceFormState) => void;
  onGenerateQuotation: (proposal: QuotationProposal) => void;
}

export function PropertyInsuranceForm({
  state,
  onChange,
  onGenerateQuotation,
}: PropertyInsuranceFormProps) {
  const [activeSection, setActiveSection] = useState<number | "all">("all");
  const [showPropertyValuationModal, setShowPropertyValuationModal] = useState(false);
  const [showCertificateScannerModal, setShowCertificateScannerModal] = useState(false);
  const [aiParseModalOpen, setAiParseModalOpen] = useState(false);
  const [aiInputText, setAiInputText] = useState("");
  const [aiParsingLoading, setAiParsingLoading] = useState(false);
  const [aiParseError, setAiParseError] = useState("");

  const handleApplyCertificate = (scanned: ScannedCertificateData) => {
    onChange((prev) => {
      const isAMD = prev.values.currency === "AMD";
      const estBuildingValue = scanned.estimatedValue
        ? (isAMD ? scanned.estimatedValue : Math.round(scanned.estimatedValue / 390))
        : prev.values.buildingValue;

      return {
        ...prev,
        company: {
          ...prev.company,
          name: scanned.ownerName || prev.company.name,
          taxId: scanned.ownerTaxIdOrSsn || prev.company.taxId,
          legalAddress: scanned.address || prev.company.legalAddress,
        },
        objectData: {
          ...prev.objectData,
          address: scanned.address || prev.objectData.address,
          totalArea: scanned.totalArea ? String(scanned.totalArea) : prev.objectData.totalArea,
          buildingMaterial: scanned.buildingMaterial || prev.objectData.buildingMaterial,
          floors: scanned.floor || prev.objectData.floors,
          purpose: scanned.purpose || prev.objectData.purpose,
        },
        insuredProperty: {
          ...prev.insuredProperty,
          building: true,
          interior: true,
        },
        values: {
          ...prev.values,
          buildingValue: estBuildingValue || prev.values.buildingValue,
        },
        documents: {
          ...prev.documents,
          ownershipCertificate: true,
          notes: prev.documents.notes
            ? `${prev.documents.notes}; Կադաստրի վկայական՝ ${scanned.certificateNumber || scanned.cadastralCode || "Կից է"}`
            : `Կադաստրի վկայական՝ ${scanned.certificateNumber || scanned.cadastralCode || "Կից է"}${scanned.registrationDate ? ` (տրվ․ ${scanned.registrationDate})` : ""}`,
        },
      };
    });
  };

  const calc = calculatePropertyQuotation(state);

  const sections = [
    { id: 1, title: "I. Ընկերության տվյալներ", subtitle: "Անվանում, ՀՎՀՀ, գործունեության տեսակ, կոնտակտներ", icon: Building2 },
    { id: 2, title: "II. Ապահովագրվող օբյեկտի տվյալներ", subtitle: "Հասցե, հարկայնություն, շինության նյութ, մակերես", icon: MapPin },
    { id: 3, title: "III. Ապահովագրվող գույք", subtitle: "Շինություն, հարդարում, հաստոցներ, տեխնիկա, պաշարներ", icon: Package },
    { id: 4, title: "IV. Գույքի արժեքներ", subtitle: "Շուկայական/հաշվեկշռային արժեքներ, ապահովագրական գումար", icon: Coins },
    { id: 5, title: "V. Ապրանքների տեղեկատվություն", subtitle: "Միջին/առավելագույն մնացորդ, շրջանառություն, պահպանում", icon: Boxes },
    { id: 6, title: "VI. Շենքի շահագործման պայմաններ", subtitle: "Պահեստ, նկուղ, պահման ձևը (դարակաշար/պալետ/հատակ)", icon: Warehouse },
    { id: 7, title: "VII. Կոմունալ համակարգեր", subtitle: "Էլեկտրամատակարարում 220V/380V, գազ, ջուր, ջեռուցում", icon: Zap },
    { id: 8, title: "VIII. Հակահրդեհային պաշտպանություն", subtitle: "Ազդարարում, ավտոմատ հրդեհաշիջում, ծխի դետեկտորներ", icon: Flame },
    { id: 9, title: "IX. Անվտանգության միջոցներ", subtitle: "Տեսահսկում, ազդանշանային համակարգ, 24/7 պահպանություն", icon: ShieldCheck },
    { id: 10, title: "X. Վնասների պատմություն", subtitle: "Վերջին 5 տարվա ընթացքում արձանագրված պատահարներ", icon: History },
    { id: 11, title: "XI. Ապահովագրական ծածկույթ / Ռիսկեր", subtitle: "Հրդեհ, պայթյուն, ջրի արտահոսք, բնական աղետներ, գողություն", icon: ShieldAlert },
    { id: 12, title: "XII. Կից փաստաթղթեր", subtitle: "Սեփականության վկայական, գրանցում, գույքացուցակ", icon: FileCheck2 },
    { id: 13, title: "XIII. Շահառուի տվյալներ", subtitle: "Կամավոր թե գրավադրված, Բանկի տվյալներ, Շահառու", icon: Landmark },
  ];

  const handleSelectPackage = (pkgId: PropertyPackageId) => {
    if (pkgId === "custom") {
      onChange((prev) => ({
        ...prev,
        propertyPackage: "custom",
      }));
      return;
    }

    if (pkgId === "start") {
      onChange((prev) => ({
        ...prev,
        ...PRESET_TUN_START,
        company: {
          ...PRESET_TUN_START.company,
          name: prev.company.name || PRESET_TUN_START.company.name,
          contactPerson: prev.company.contactPerson || PRESET_TUN_START.company.contactPerson,
          phone: prev.company.phone || PRESET_TUN_START.company.phone,
          email: prev.company.email || PRESET_TUN_START.company.email,
        },
        objectData: {
          ...PRESET_TUN_START.objectData,
          address: prev.objectData.address || PRESET_TUN_START.objectData.address,
        },
      }));
    } else if (pkgId === "standard") {
      onChange((prev) => ({
        ...prev,
        propertyPackage: "standard",
        insuredProperty: {
          ...prev.insuredProperty,
          building: true,
          interior: true,
          equipment: true,
          guestDamage: false,
          thirdPartyLiability: true,
        },
        values: {
          ...prev.values,
          buildingValue: 30000000,
          interiorValue: 3000000,
          equipmentValue: 3000000,
          guestDamageValue: 0,
          thirdPartyLiabilityValue: 2000000,
        },
        rentalDetails: {
          rentalType: "owner_occupied",
          hasGuestDamageCoverage: false,
          platform: "—",
        },
        customFranchise: 0.5,
      }));
    } else if (pkgId === "standard_plus") {
      onChange((prev) => ({
        ...prev,
        ...PRESET_TUN_STANDARD_PLUS,
        company: {
          ...PRESET_TUN_STANDARD_PLUS.company,
          name: prev.company.name || PRESET_TUN_STANDARD_PLUS.company.name,
          contactPerson: prev.company.contactPerson || PRESET_TUN_STANDARD_PLUS.company.contactPerson,
          phone: prev.company.phone || PRESET_TUN_STANDARD_PLUS.company.phone,
          email: prev.company.email || PRESET_TUN_STANDARD_PLUS.company.email,
        },
        objectData: {
          ...PRESET_TUN_STANDARD_PLUS.objectData,
          address: prev.objectData.address || PRESET_TUN_STANDARD_PLUS.objectData.address,
        },
      }));
    } else if (pkgId === "premium") {
      onChange((prev) => ({
        ...prev,
        ...PRESET_TUN_PREMIUM,
        company: {
          ...PRESET_TUN_PREMIUM.company,
          name: prev.company.name || PRESET_TUN_PREMIUM.company.name,
          contactPerson: prev.company.contactPerson || PRESET_TUN_PREMIUM.company.contactPerson,
          phone: prev.company.phone || PRESET_TUN_PREMIUM.company.phone,
          email: prev.company.email || PRESET_TUN_PREMIUM.company.email,
        },
        objectData: {
          ...PRESET_TUN_PREMIUM.objectData,
          address: prev.objectData.address || PRESET_TUN_PREMIUM.objectData.address,
        },
      }));
    }
  };

  const handleAiParse = async () => {
    if (!aiInputText.trim()) return;
    setAiParsingLoading(true);
    setAiParseError("");

    try {
      const res = await fetch("/api/gemini/parse-questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiInputText }),
      });

      if (!res.ok) throw new Error("Սխալ տեղի ունեցավ AI մշակման ժամանակ");
      const result = await res.json();
      if (result.data) {
        onChange((prev) => ({
          ...prev,
          company: { ...prev.company, ...result.data.company },
          objectData: { ...prev.objectData, ...result.data.objectData },
          insuredProperty: { ...prev.insuredProperty, ...result.data.insuredProperty },
          values: { ...prev.values, ...result.data.values },
          goodsInfo: { ...prev.goodsInfo, ...result.data.goodsInfo },
          operations: { ...prev.operations, ...result.data.operations },
          utilities: { ...prev.utilities, ...result.data.utilities },
          fireProtection: { ...prev.fireProtection, ...result.data.fireProtection },
          security: { ...prev.security, ...result.data.security },
          lossHistory: { ...prev.lossHistory, ...result.data.lossHistory },
          coverageRisks: { ...prev.coverageRisks, ...result.data.coverageRisks },
          documents: { ...prev.documents, ...result.data.documents },
          beneficiary: { ...prev.beneficiary, ...result.data.beneficiary },
        }));
        setAiParseModalOpen(false);
        setAiInputText("");
      }
    } catch (err: any) {
      setAiParseError(err.message || "Ձախողվեց տեքստի ավտոմատ վերլուծությունը");
    } finally {
      setAiParsingLoading(false);
    }
  };

  const handleGenerateClick = () => {
    const proposal = buildPropertyProposal(state);
    onGenerateQuotation(proposal);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Banner & Preset Controls in SIL Corporate Style */}
      <div className="bg-gradient-to-r from-[#00235B] via-[#003399] to-[#0052CC] text-white rounded-2xl p-6 sm:p-7 shadow-xl shadow-blue-950/15 mb-6 border border-blue-800/40 relative overflow-hidden">
        {/* Subtle decorative background blur circle */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-[#00A3FF]/15 blur-2xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-white/15 text-cyan-200 border border-white/20 text-xs px-3 py-0.5 rounded-full font-bold">
                «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Պաշտոնական Հարցաշար
              </span>
              <span className="text-blue-200 text-xs hidden sm:inline">| 13 Բաժին • Safe to be free</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Գույքի Ապահովագրության Գնառաջարկի Տվյալների Հավաքագրում
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-3xl mt-1">
              Ընտրեք <strong>Tun Service</strong> փաթեթներից (START, STANDARD, STANDARD PLUS, PREMIUM) կամ լրացրեք հարցաշարի բոլոր 13 բաժինները:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowCertificateScannerModal(true)}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-lg shadow-emerald-950/30 transition cursor-pointer border border-emerald-400/40 active:scale-95"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-200" />
              Սկանավորել Վկայականը (AI OCR)
            </button>

            <button
              onClick={() => setAiParseModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-950/30 transition cursor-pointer border border-blue-400/30 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              AI Լրացում Տեքստից
            </button>

            <div className="flex flex-wrap items-center bg-[#001D4A]/80 border border-blue-700/50 rounded-xl p-1 text-xs gap-1">
              <span className="text-blue-200 px-2 font-medium">Փաթեթներ՝</span>
              <button
                onClick={() => handleSelectPackage("start")}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  state.propertyPackage === "start"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "text-white hover:bg-white/10"
                }`}
              >
                START (25 մլն)
              </button>
              <button
                onClick={() => handleSelectPackage("standard_plus")}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  state.propertyPackage === "standard_plus"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-amber-500/20 text-amber-200 border border-amber-400/30 hover:bg-amber-500/30"
                }`}
              >
                Airbnb / Օրավարձ (40 մլն)
              </button>
              <button
                onClick={() => handleSelectPackage("premium")}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  state.propertyPackage === "premium"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-white hover:bg-white/10"
                }`}
              >
                PREMIUM (68 մլն)
              </button>
              <span className="text-blue-400/50 px-1">|</span>
              <button
                onClick={() => onChange(() => DEFAULT_PROPERTY_STATE)}
                className="px-2 py-1 hover:bg-white/10 rounded-lg text-blue-200 text-[11px] transition cursor-pointer"
              >
                Արտադրամաս
              </button>
              <button
                onClick={() => onChange(() => PRESET_OFFICE_IT)}
                className="px-2 py-1 hover:bg-white/10 rounded-lg text-blue-200 text-[11px] transition cursor-pointer"
              >
                IT Գրասենյակ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tun Service Package Selector (START, STANDARD, STANDARD PLUS, PREMIUM) */}
      <div className="mb-6">
        <PropertyPackageSelector
          currentPackage={(state.propertyPackage as PropertyPackageId) || "custom"}
          onSelectPackage={handleSelectPackage}
          currency={state.values.currency}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 13-Section Form (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Quick Jump Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#003399]" />
                Հարցաշարի 13 Բաժինների Ցանկ
              </span>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setActiveSection("all")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    activeSection === "all"
                      ? "bg-[#003399] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Բոլորը բացել
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer ${
                    activeSection === s.id
                      ? "bg-[#003399] text-white border-[#003399] shadow-xs"
                      : "bg-slate-50 text-slate-700 hover:bg-blue-50/50 border-slate-200"
                  }`}
                >
                  {s.id}. {s.title.split(".")[1]?.trim() || s.title}
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Ընկերության տվյալներ */}
          {(activeSection === "all" || activeSection === 1) && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  I
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    I. Ընկերության տվյալներ
                  </h3>
                  <p className="text-xs text-slate-500">
                    Անվանում, ՀՎՀՀ, գործունեության տեսակ, կոնտակտային տվյալներ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ընկերության լրիվ անվանում *
                  </label>
                  <input
                    type="text"
                    value={state.company.name}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        company: { ...prev.company, name: e.target.value },
                      }))
                    }
                    placeholder="Օր․՝ «ԱՐՄ-ՏԵՔՍ» ՍՊԸ"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ՀՎՀՀ (Հարկ վճարողի հաշվառման համար) *
                  </label>
                  <input
                    type="text"
                    value={state.company.taxId}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        company: { ...prev.company, taxId: e.target.value },
                      }))
                    }
                    placeholder="8 նիշ (օր․՝ 02587413)"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Գործունեության տեսակ (Բիզնեսի ոլորտ)
                  </label>
                  <input
                    type="text"
                    value={state.company.activityType}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        company: { ...prev.company, activityType: e.target.value },
                      }))
                    }
                    placeholder="Օր․՝ Տեքստիլ արտադրություն, պահեստավորում"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Կոնտակտային անձ / Պաշտոն
                  </label>
                  <input
                    type="text"
                    value={state.company.contactPerson}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        company: { ...prev.company, contactPerson: e.target.value },
                      }))
                    }
                    placeholder="Օր․՝ Արամ Սարգսյան (Տնօրեն)"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Հեռախոսահամար *
                  </label>
                  <input
                    type="text"
                    value={state.company.phone}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        company: { ...prev.company, phone: e.target.value },
                      }))
                    }
                    placeholder="+374 (10) 54-12-88"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Էլեկտրոնային փոստ (E-mail)
                  </label>
                  <input
                    type="email"
                    value={state.company.email}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        company: { ...prev.company, email: e.target.value },
                      }))
                    }
                    placeholder="info@company.am"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Իրավաբանական հասցե
                  </label>
                  <input
                    type="text"
                    value={state.company.legalAddress}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        company: { ...prev.company, legalAddress: e.target.value },
                      }))
                    }
                    placeholder="ՀՀ, ք․ Երևան, Արշակունյաց պող․ 42/1"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Ապահովագրվող օբյեկտի տվյալներ */}
          {(activeSection === "all" || activeSection === 2) && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  II
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    II. Ապահովագրվող օբյեկտի տվյալներ
                  </h3>
                  <p className="text-xs text-slate-500">
                    Գույքի գտնվելու վայրի հասցե, հարկայնություն, շինության նյութ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ապահովագրվող գույքի փաստացի տեղակայման հասցե *
                  </label>
                  <input
                    type="text"
                    value={state.objectData.address}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        objectData: { ...prev.objectData, address: e.target.value },
                      }))
                    }
                    placeholder="ՀՀ, ք․ Երևան, Էրեբունի, Խաղաղ Դոնի փող․ 18/4"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Հարկայնություն / Որ հարկում է գտնվում
                  </label>
                  <input
                    type="text"
                    value={state.objectData.floors}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        objectData: { ...prev.objectData, floors: e.target.value },
                      }))
                    }
                    placeholder="Օր․՝ 2 հարկանի մասնաշենք + նկուղ"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ընդհանուր մակերես (քմ)
                  </label>
                  <input
                    type="text"
                    value={state.objectData.totalArea}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        objectData: { ...prev.objectData, totalArea: e.target.value },
                      }))
                    }
                    placeholder="Օր․՝ 1,850"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Շինության կոնստրուկցիայի նյութեր
                  </label>
                  <input
                    type="text"
                    value={state.objectData.buildingMaterial}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        objectData: { ...prev.objectData, buildingMaterial: e.target.value },
                      }))
                    }
                    placeholder="Օր․՝ Երկաթբետոնե հիմնակմախք, տուֆ, սենդվիչ պանել"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Կառուցման / Հիմնանորոգման տարեթիվ
                  </label>
                  <input
                    type="text"
                    value={state.objectData.constructionYear}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        objectData: { ...prev.objectData, constructionYear: e.target.value },
                      }))
                    }
                    placeholder="Օր․՝ 2018"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Տարածքի նպատակային նշանակություն և օգտագործում
                  </label>
                  <input
                    type="text"
                    value={state.objectData.purpose}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        objectData: { ...prev.objectData, purpose: e.target.value },
                      }))
                    }
                    placeholder="Արտադրամաս, հումքի և պատրաստի արտադրանքի պահեստ"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Short-Term / Airbnb Rental Details Section */}
          <ShortTermRentalSection state={state} onChange={onChange} />

          {/* Section 3: Ապահովագրվող գույք */}
          {(activeSection === "all" || activeSection === 3) && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  III
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    III. Ապահովագրվող գույք (Ընտրեք կատեգորիաները)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Շինություն, հարդարում, տեխնիկա, հյուրերի պատճառած վնաս, 3-րդ անձանց պատասխանատվություն
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                {[
                  { key: "building", label: "🏢 Շինություն / Կառույց" },
                  { key: "interior", label: "🎨 Ներքին հարդարում" },
                  { key: "equipment", label: "💻 Տեխնիկա & Էլեկտրոնիկա" },
                  { key: "guestDamage", label: "🛌 Հյուրերի վնաս (Guest Damage)" },
                  { key: "thirdPartyLiability", label: "🛡️ 3-րդ անձանց պատասխանատվություն" },
                  { key: "machinery", label: "⚙️ Հաստոցներ և սարքեր" },
                  { key: "stock", label: "📦 Ապրանքային պաշարներ" },
                  { key: "signs", label: "🪧 Ցուցանակներ & Վահանակներ" },
                  { key: "glass", label: "🪟 Վիտրաժներ և ապակիներ" },
                ].map((item) => {
                  const isChecked = Boolean(state.insuredProperty[item.key as keyof typeof state.insuredProperty]);
                  return (
                    <label
                      key={item.key}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                        isChecked
                          ? "bg-blue-50/80 border-blue-400 text-blue-900 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            insuredProperty: {
                              ...prev.insuredProperty,
                              [item.key]: e.target.checked,
                            },
                          }))
                        }
                        className="rounded text-blue-600 focus:ring-blue-600 w-4 h-4"
                      />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Գույքի հավելյալ մանրամասներ / Նկարագրություն
                </label>
                <textarea
                  rows={2}
                  value={state.insuredProperty.details}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      insuredProperty: { ...prev.insuredProperty, details: e.target.value },
                    }))
                  }
                  placeholder="Նշեք գույքի բնութագրերը, մոդելները, ապրանքանիշերը և այլ առանձնահատկություններ:"
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Section 4: Գույքի արժեքներ */}
          {(activeSection === "all" || activeSection === 4) && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    IV
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      IV. Գույքի արժեքներ (Ապահովագրական Գումարներ)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Շուկայական/հաշվեկշռային արժեքներ ըստ գույքի տեսակների
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() =>
                      onChange((prev) => ({
                        ...prev,
                        values: { ...prev.values, currency: "AMD" },
                      }))
                    }
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      state.values.currency === "AMD"
                        ? "bg-white text-blue-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    AMD (֏)
                  </button>
                  <button
                    onClick={() =>
                      onChange((prev) => ({
                        ...prev,
                        values: { ...prev.values, currency: "USD" },
                      }))
                    }
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      state.values.currency === "USD"
                        ? "bg-white text-blue-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    USD ($)
                  </button>
                </div>
              </div>

              <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-cyan-50 to-indigo-50 border border-blue-200/80 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#075bd5] text-white flex items-center justify-center font-bold shadow-xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">List.am Անշարժ Գույքի Գնահատում</div>
                    <div className="text-[11px] text-slate-600">Որոշեք գույքի շուկայական գինն ու ապահովագրական բաշխումը List.am-ով</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPropertyValuationModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#075bd5] hover:bg-[#064bb3] text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                  <span>List.am-ով որոշել շուկայական գինը</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.insuredProperty.building && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      🏢 Շինության արժեք ({state.values.currency})
                    </label>
                    <input
                      type="number"
                      value={state.values.buildingValue || ""}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          values: { ...prev.values, buildingValue: Number(e.target.value) || 0 },
                        }))
                      }
                      className="w-full text-xs sm:text-sm font-semibold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                    />
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      {formatCurrency(state.values.buildingValue, state.values.currency)}
                    </span>
                  </div>
                )}

                {state.insuredProperty.interior && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      🎨 Ներքին հարդարման արժեք ({state.values.currency})
                    </label>
                    <input
                      type="number"
                      value={state.values.interiorValue || ""}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          values: { ...prev.values, interiorValue: Number(e.target.value) || 0 },
                        }))
                      }
                      className="w-full text-xs sm:text-sm font-semibold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                    />
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      {formatCurrency(state.values.interiorValue, state.values.currency)}
                    </span>
                  </div>
                )}

                {state.insuredProperty.equipment && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      💻 Տեխնիկայի & Շարժական գույքի արժեք ({state.values.currency})
                    </label>
                    <input
                      type="number"
                      value={state.values.equipmentValue || ""}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          values: { ...prev.values, equipmentValue: Number(e.target.value) || 0 },
                        }))
                      }
                      className="w-full text-xs sm:text-sm font-semibold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                    />
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      {formatCurrency(state.values.equipmentValue, state.values.currency)}
                    </span>
                  </div>
                )}

                {(state.insuredProperty.guestDamage || state.rentalDetails?.hasGuestDamageCoverage) && (
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 mb-1">
                      🛌 Հյուրերի պատճառած վնասի լիմիտ ({state.values.currency})
                    </label>
                    <input
                      type="number"
                      value={state.values.guestDamageValue || ""}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          values: { ...prev.values, guestDamageValue: Number(e.target.value) || 0 },
                        }))
                      }
                      className="w-full text-xs sm:text-sm font-semibold border border-amber-300 bg-amber-50/40 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                    <span className="text-[11px] text-amber-700 mt-0.5 block">
                      {formatCurrency(state.values.guestDamageValue || 0, state.values.currency)} (Սակագին՝ 1.00%, ֆրանշիզա՝ 30,000 ֏)
                    </span>
                  </div>
                )}

                {state.insuredProperty.thirdPartyLiability && (
                  <div>
                    <label className="block text-xs font-semibold text-indigo-900 mb-1">
                      🛡️ 3-րդ անձանց պատասխանատվության լիմիտ ({state.values.currency})
                    </label>
                    <input
                      type="number"
                      value={state.values.thirdPartyLiabilityValue || ""}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          values: { ...prev.values, thirdPartyLiabilityValue: Number(e.target.value) || 0 },
                        }))
                      }
                      className="w-full text-xs sm:text-sm font-semibold border border-indigo-300 bg-indigo-50/40 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                    <span className="text-[11px] text-indigo-700 mt-0.5 block">
                      {formatCurrency(state.values.thirdPartyLiabilityValue || 0, state.values.currency)} (Սակագին՝ 0.50%, ֆրանշիզա՝ 30,000 ֏)
                    </span>
                  </div>
                )}

                {state.insuredProperty.machinery && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ⚙️ Հաստոցների & սարքերի արժեք ({state.values.currency})
                    </label>
                    <input
                      type="number"
                      value={state.values.machineryValue || ""}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          values: { ...prev.values, machineryValue: Number(e.target.value) || 0 },
                        }))
                      }
                      className="w-full text-xs sm:text-sm font-semibold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                    />
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      {formatCurrency(state.values.machineryValue, state.values.currency)}
                    </span>
                  </div>
                )}

                {state.insuredProperty.stock && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      📦 Ապրանքային պաշարների արժեք ({state.values.currency})
                    </label>
                    <input
                      type="number"
                      value={state.values.stockValue || ""}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          values: { ...prev.values, stockValue: Number(e.target.value) || 0 },
                        }))
                      }
                      className="w-full text-xs sm:text-sm font-semibold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                    />
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      {formatCurrency(state.values.stockValue, state.values.currency)}
                    </span>
                  </div>
                )}

                {state.insuredProperty.glass && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      🪟 Ապակիների & վիտրաժների արժեք ({state.values.currency})
                    </label>
                    <input
                      type="number"
                      value={state.values.glassValue || ""}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          values: { ...prev.values, glassValue: Number(e.target.value) || 0 },
                        }))
                      }
                      className="w-full text-xs sm:text-sm font-semibold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                    />
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      {formatCurrency(state.values.glassValue, state.values.currency)}
                    </span>
                  </div>
                )}

                {state.insuredProperty.signs && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      🪧 Ցուցանակների արժեք ({state.values.currency})
                    </label>
                    <input
                      type="number"
                      value={state.values.signsValue || ""}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          values: { ...prev.values, signsValue: Number(e.target.value) || 0 },
                        }))
                      }
                      className="w-full text-xs sm:text-sm font-semibold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                    />
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      {formatCurrency(state.values.signsValue, state.values.currency)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Ընդհանուր գույքային ապահովագրական գումար՝
                </span>
                <span className="text-base font-bold text-blue-900">
                  {formatCurrency(calc.totalSumInsured, state.values.currency)}
                </span>
              </div>
            </div>
          )}

          {/* Section 5: Ապրանքների տեղեկատվություն */}
          {(activeSection === "all" || activeSection === 5) && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  V
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    V. Ապրանքների տեղեկատվություն
                  </h3>
                  <p className="text-xs text-slate-500">
                    Միջին/առավելագույն մնացորդ, տարեկան շրջանառություն, կոլեկցիոն/դյուրավառ նյութեր
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Միջին մնացորդ ({state.values.currency})
                  </label>
                  <input
                    type="number"
                    value={state.goodsInfo.avgBalance || ""}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        goodsInfo: { ...prev.goodsInfo, avgBalance: Number(e.target.value) || 0 },
                      }))
                    }
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Առավելագույն մնացորդ ({state.values.currency})
                  </label>
                  <input
                    type="number"
                    value={state.goodsInfo.maxBalance || ""}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        goodsInfo: { ...prev.goodsInfo, maxBalance: Number(e.target.value) || 0 },
                      }))
                    }
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Տարեկան շրջանառություն ({state.values.currency})
                  </label>
                  <input
                    type="number"
                    value={state.goodsInfo.turnover || ""}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        goodsInfo: { ...prev.goodsInfo, turnover: Number(e.target.value) || 0 },
                      }))
                    }
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Հատուկ ապրանքներ (դյուրավառ, թանկարժեք, կոլեկցիոն, դեղորայք)
                  </label>
                  <input
                    type="text"
                    value={state.goodsInfo.specialItems}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        goodsInfo: { ...prev.goodsInfo, specialItems: e.target.value },
                      }))
                    }
                    placeholder="Նշեք, եթե կան դյուրավառ հեղուկներ, ալկոհոլ, ծխախոտ կամ հատուկ պահպանման պահանջ ունեցող ապրանքներ"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 6: Շենքի շահագործման պայմաններ */}
          {(activeSection === "all" || activeSection === 6) && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  VI
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    VI. Շենքի շահագործման պայմաններ
                  </h3>
                  <p className="text-xs text-slate-500">
                    Պահեստ, նկուղ, պահման ձևը (դարակաշար, պալետ, հատակ, բարձրություն հատակից)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Օբյեկտի տեսակը
                  </label>
                  <input
                    type="text"
                    value={state.operations.facilityType}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        operations: { ...prev.operations, facilityType: e.target.value },
                      }))
                    }
                    placeholder="Արտադրական, Պահեստային, Գրասենյակային"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ապրանքների պահման ձևը
                  </label>
                  <input
                    type="text"
                    value={state.operations.storageType}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        operations: { ...prev.operations, storageType: e.target.value },
                      }))
                    }
                    placeholder="Դարակաշարային, Եվրոպալետներ, Հատակին"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ապրանքների բարձրությունը հատակից (սմ)
                  </label>
                  <input
                    type="text"
                    value={state.operations.heightAboveFloor}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        operations: { ...prev.operations, heightAboveFloor: e.target.value },
                      }))
                    }
                    placeholder="Օր․՝ 15 սմ (ջրալցման ռիսկի կանխարգելում)"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={state.operations.isBasement}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          operations: { ...prev.operations, isBasement: e.target.checked },
                        }))
                      }
                      className="rounded text-blue-600 focus:ring-blue-600 w-4 h-4"
                    />
                    <span>Տարածքը ներառում է նկուղային / կիսանկուղային հարկեր</span>
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Հարակից տարածքի ռիսկեր (Հարևանությամբ վտանգավոր օբյեկտներ)
                  </label>
                  <input
                    type="text"
                    value={state.operations.surroundingsRisk}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        operations: { ...prev.operations, surroundingsRisk: e.target.value },
                      }))
                    }
                    placeholder="Նշեք հարևանությամբ բենզալցակայանների, քիմիական պահեստների առկայության մասին"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 7: Կոմունալ համակարգեր */}
          {(activeSection === "all" || activeSection === 7) && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  VII
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    VII. Կոմունալ համակարգեր
                  </h3>
                  <p className="text-xs text-slate-500">
                    Էլեկտրամատակարարում (220V/380V), գազ, ջուր, ջեռուցում, օդափոխություն
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Էլեկտրական լարում
                  </label>
                  <select
                    value={state.utilities.electrical}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        utilities: { ...prev.utilities, electrical: e.target.value as any },
                      }))
                    }
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden bg-white"
                  >
                    <option value="220V">220V (Միաֆազ)</option>
                    <option value="380V">380V (Եռաֆազ - Արդյունաբերական)</option>
                    <option value="both">220V & 380V (Համակցված)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ջեռուցման համակարգ
                  </label>
                  <select
                    value={state.utilities.heating}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        utilities: { ...prev.utilities, heating: e.target.value as any },
                      }))
                    }
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden bg-white"
                  >
                    <option value="individual_gas">Անհատական գազային (կաթսայատուն)</option>
                    <option value="central">Կենտրոնացված ջեռուցում</option>
                    <option value="electric">Էլեկտրական ջեռուցում</option>
                    <option value="none">Առանց ջեռուցման</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Օդափոխություն / Կլիմատ
                  </label>
                  <select
                    value={state.utilities.ventilation}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        utilities: { ...prev.utilities, ventilation: e.target.value as any },
                      }))
                    }
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden bg-white"
                  >
                    <option value="forced_climate">Հարկադրական կլիմատ-համակարգ (HVAC)</option>
                    <option value="industrial">Արդյունաբերական օդափոխություն</option>
                    <option value="natural">Բնական օդափոխություն</option>
                  </select>
                </div>

                <div className="sm:col-span-3 flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={state.utilities.gas}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          utilities: { ...prev.utilities, gas: e.target.checked },
                        }))
                      }
                      className="rounded text-blue-600 focus:ring-blue-600 w-4 h-4"
                    />
                    Գազաֆիկացված է
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={state.utilities.water}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          utilities: { ...prev.utilities, water: e.target.checked },
                        }))
                      }
                      className="rounded text-blue-600 focus:ring-blue-600 w-4 h-4"
                    />
                    Ջրամատակարարում և կոյուղի
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={state.utilities.gasBoiler}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          utilities: { ...prev.utilities, gasBoiler: e.target.checked },
                        }))
                      }
                      className="rounded text-blue-600 focus:ring-blue-600 w-4 h-4"
                    />
                    Առկա է գազային կաթսայատուն
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Section 8: Հակահրդեհային պաշտպանություն */}
          {(activeSection === "all" || activeSection === 8) && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  VIII
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    VIII. Հակահրդեհային պաշտպանություն (Սակագնային զեղչեր)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ազդարարում, ավտոմատ հրդեհաշիջում, ծխի դետեկտորներ, կրակմարիչներ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {[
                  { key: "alarm", label: "🚨 Հրդեհային ազդարարում" },
                  { key: "autoExtinguishing", label: "💧 Ավտոմատ հրդեհաշիջում (սպրինկլեր/գազ)" },
                  { key: "smokeDetectors", label: "💨 Ծխի / Ջերմության դետեկտորներ" },
                  { key: "extinguishers", label: "🧯 Կրակմարիչներ (ստուգված)" },
                  { key: "hydrants", label: "🚒 Հրշեջ ծորակներ / հիդրանտներ" },
                ].map((item) => {
                  const isChecked = Boolean(state.fireProtection[item.key as keyof typeof state.fireProtection]);
                  return (
                    <label
                      key={item.key}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                        isChecked
                          ? "bg-blue-50/80 border-blue-400 text-blue-900"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            fireProtection: {
                              ...prev.fireProtection,
                              [item.key]: e.target.checked,
                            },
                          }))
                        }
                        className="rounded text-blue-600 focus:ring-blue-600 w-4 h-4"
                      />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Հեռավորությունը մոտակա հրշեջ կայանից (կմ)
                  </label>
                  <input
                    type="text"
                    value={state.fireProtection.fireStationDistanceKm}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        fireProtection: { ...prev.fireProtection, fireStationDistanceKm: e.target.value },
                      }))
                    }
                    placeholder="Օր․՝ 2.5 կմ"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Հակահրդեհային սարքավորումների մանրամասներ
                  </label>
                  <input
                    type="text"
                    value={state.fireProtection.details}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        fireProtection: { ...prev.fireProtection, details: e.target.value },
                      }))
                    }
                    placeholder="Սպրինկլերային համակարգ, կրակմարիչների քանակ"
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 9: Անվտանգության միջոցներ */}
          {(activeSection === "all" || activeSection === 9) && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  IX
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    IX. Անվտանգության միջոցներ
                  </h3>
                  <p className="text-xs text-slate-500">
                    Տեսահսկում, ազդանշանային համակարգ, ֆիզիկական պահպանություն, ճաղավանդակներ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {[
                  { key: "cctv", label: "📹 Տեսահսկում (CCTV ներսում և դրսում)" },
                  { key: "burglarAlarm", label: "🚨 Անվտանգության ազդանշան (Ոստիկանություն/ՊՊԳՎ)" },
                  { key: "guards", label: "👮 24/7 Ֆիզիկական պահպանություն" },
                  { key: "bars", label: "🪟 Պատուհանների ճաղավանդակներ / մետաղյա փեղկեր" },
                  { key: "accessControl", label: "🔑 Էլեկտրոնային անցագրային ռեժիմ" },
                ].map((item) => {
                  const isChecked = Boolean(state.security[item.key as keyof typeof state.security]);
                  return (
                    <label
                      key={item.key}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                        isChecked
                          ? "bg-blue-50/80 border-blue-400 text-blue-900"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            security: {
                              ...prev.security,
                              [item.key]: e.target.checked,
                            },
                          }))
                        }
                        className="rounded text-blue-600 focus:ring-blue-600 w-4 h-4"
                      />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Անվտանգության համակարգերի լրացուցիչ նկարագրություն
                </label>
                <input
                  type="text"
                  value={state.security.details}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      security: { ...prev.security, details: e.target.value },
                    }))
                  }
                  placeholder="Օր․՝ 16 տեսախցիկ, ՊՊԳՎ կենտրոնացված վահանակ, արխիվացում 30 օր"
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Section 10: Վնասների պատմություն */}
          {(activeSection === "all" || activeSection === 10) && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  X
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    X. Վնասների պատմություն (Վերջին 5 տարվա պատահարներ)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Պատահարների, հրդեհների, ջրալցումների կամ գողությունների առկայություն
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="hasLosses"
                      checked={!state.lossHistory.hasLosses}
                      onChange={() =>
                        onChange((prev) => ({
                          ...prev,
                          lossHistory: { ...prev.lossHistory, hasLosses: false, totalLossAmount: 0 },
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-600"
                    />
                    <span>✅ Վերջին 5 տարում վնասներ և պատահարներ ՉԵՆ ԵՂԵԼ (Անվնասության զեղչ)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="hasLosses"
                      checked={state.lossHistory.hasLosses}
                      onChange={() =>
                        onChange((prev) => ({
                          ...prev,
                          lossHistory: { ...prev.lossHistory, hasLosses: true },
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-600"
                    />
                    <span>⚠️ Եղել են պատահարներ / վնասներ</span>
                  </label>
                </div>

                {state.lossHistory.hasLosses && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Վնասների ընդհանուր գումար ({state.values.currency})
                      </label>
                      <input
                        type="number"
                        value={state.lossHistory.totalLossAmount || ""}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            lossHistory: { ...prev.lossHistory, totalLossAmount: Number(e.target.value) || 0 },
                          }))
                        }
                        placeholder="0"
                        className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Պատահարների նկարագրություն և պատճառներ
                      </label>
                      <input
                        type="text"
                        value={state.lossHistory.details}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            lossHistory: { ...prev.lossHistory, details: e.target.value },
                          }))
                        }
                        placeholder="Նշեք պատահարի տարեթիվը, տեսակը և պատճառը"
                        className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 11: Ապահովագրական ծածկույթ / Ռիսկեր */}
          {(activeSection === "all" || activeSection === 11) && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    XI
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      XI. Ապահովագրական ծածկույթ / Ռիսկեր
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        SIL Insurance Պայմաններ
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Համապատասխանեցված «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Գույքի Ապահովագրության Պայմաններին և Tun Service առաջարկին
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {[
                  {
                    key: "fireExplosion",
                    label: "🔥 Հրդեհ, կայծակի ազդեցություն, պայթյուն, օդանավի անկում (FLEXA)",
                    desc: "Կայծակի հարված, պայթյուններ, թռչող սարքերի բեկորների անկում",
                  },
                  {
                    key: "waterDamage",
                    label: "💧 Ջրի վնաս / Խողովակաշարերի և համակարգերի վթարային արտահոսք",
                    desc: "Ջրամատակարարման, ջեռուցման, կոյուղու և հրդեհաշիջման ցանցերի վթարներ",
                  },
                  {
                    key: "naturalDisasters",
                    label: "🌋 Բնական աղետներ (երկրաշարժ, սողանք, փոթորիկ, կարկուտ, ջրհեղեղ)",
                    desc: "Հորդառատ անձրև, ձյան վնաս, հողմ, մրրիկ, գետնի նստվածք, լեռնային փլուզում",
                  },
                  {
                    key: "burglaryRobbery",
                    label: "🦹 Հափշտակություն (Գողություն կոտրանքով, կողոպուտ, ավազակություն)",
                    desc: "Ապահովագրված տարածք ապօրինի ներթափանցմամբ գույքի հափշտակություն",
                  },
                  {
                    key: "vandalism",
                    label: "🔨 Երրորդ անձանց հակաիրավական գործողություններ / Վանդալիզմ",
                    desc: "Գույքի դիտավորյալ կամ անզգույշ վնասում կամ ոչնչացում",
                  },
                  {
                    key: "mechanicalSmoke",
                    label: "⚙️ Մեխանիկական և ծխի ազդեցություն",
                    desc: "Հարվածային ազդեցություններ և հարակից հրդեհների ծխի ներթափանցում",
                  },
                  {
                    key: "guestDamage",
                    label: "🛌 Հյուրի կողմից պատճառված վնաս (Guest Damage — Պայմանների 5.19 կետ)",
                    desc: "Airbnb / Booking օրավարձով հյուրերի պատահական կամ անզգույշ գույքային վնասներ",
                  },
                  {
                    key: "thirdPartyLiability",
                    label: "🛡️ Ընդհանուր քաղաքացիական պատասխանատվություն 3-րդ անձանց առջև",
                    desc: "Հարևանների և հյուրերի գույքին ու առողջությանը պատճառված վնասների հատուցում",
                  },
                  {
                    key: "businessInterruption",
                    label: "⏱️ Բիզնեսի ընդհատման հետևանքով ֆինանսական կորուստներ",
                    desc: "Առևտրային և արտադրական տարածքների պարապուրդի ռիսկի ծածկույթ",
                  },
                ].map((item) => {
                  const isChecked = Boolean(state.coverageRisks[item.key as keyof typeof state.coverageRisks]);
                  return (
                    <label
                      key={item.key}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition ${
                        isChecked
                          ? "bg-blue-50/80 border-blue-400 text-blue-950 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            coverageRisks: {
                              ...prev.coverageRisks,
                              [item.key]: e.target.checked,
                            },
                          }))
                        }
                        className="rounded text-blue-600 focus:ring-blue-600 w-4 h-4 mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <span className="font-bold block text-slate-900">{item.label}</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">{item.desc}</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Լրացուցիչ ռիսկեր / Հատուկ պահանջներ
                </label>
                <input
                  type="text"
                  value={state.coverageRisks.otherRisks}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      coverageRisks: { ...prev.coverageRisks, otherRisks: e.target.value },
                    }))
                  }
                  placeholder="Օր․՝ Բեռնաթափման ռիսկեր, էլեկտրական գերլարումներից սարքավորումների վնասում"
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                />
              </div>

              {/* Grounding Base: Գույքի Ապահովագրության Պայմանների Տեղեկանք */}
              <div className="mt-5 pt-4 border-t border-slate-200 bg-slate-50/70 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-700 flex-shrink-0" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» Գույքի Ապահովագրության Պաշտոնական Պայմանների Տեղեկանք
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-600">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-blue-900 block mb-1">1. Ապահովագրվող օբյեկտներ</span>
                    Շենքեր, շինություններ, բնակարաններ, հիմնական միջոցներ, ապրանքանյութական արժեքներ, ներքին հարդարում, շարժական գույք/տեխնիկա, ապակիներ:
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-rose-900 block mb-1">2. Հիմնական Բացառություններ</span>
                    Միջուկային վթար, ռազմական գործողություններ, անկարգություններ, դիտավորություն, բնական մաշվածություն, առանց հսկողության վերանորոգում, նախկին վնասներ:
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-emerald-900 block mb-1">3. Հատուցման կարգ & Ֆրանշիզա</span>
                    Վնասի գնահատում անկախ փորձագետով: Հատուցումը վճարվում է պայմանագրային ժամկետում՝ հանած սահմանված չհատուցվող գումարը (ֆրանշիզան):
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 12: Կից փաստաթղթեր */}
          {(activeSection === "all" || activeSection === 12) && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    XII
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      XII. Կից փաստաթղթեր (Checklist)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Անդեռռայթինգի և պայմանագրի կնքման համար անհրաժեշտ փաստաթղթերի ցանկ
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCertificateScannerModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Սկանավորել Վկայականը</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                {[
                  { key: "stateRegistry", label: "📜 Պետ․ ռեգիստրի վկայական" },
                  { key: "ownershipCertificate", label: "🏛️ Սեփականության վկայական" },
                  { key: "leaseAgreement", label: "📑 Վարձակալության պայմանագիր" },
                  { key: "inventoryList", label: "📊 Գույքացուցակ / Հաշվեկշիռ" },
                  { key: "floorPlan", label: "📐 Հատակագիծ / Կադաստրային պլան" },
                  { key: "photos", label: "📸 Գույքի լուսանկարներ" },
                ].map((item) => {
                  const isChecked = Boolean(state.documents[item.key as keyof typeof state.documents]);
                  return (
                    <label
                      key={item.key}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                        isChecked
                          ? "bg-emerald-50/80 border-emerald-400 text-emerald-900"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            documents: {
                              ...prev.documents,
                              [item.key]: e.target.checked,
                            },
                          }))
                        }
                        className="rounded text-emerald-700 focus:ring-emerald-600 w-4 h-4"
                      />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Նշումներ փաստաթղթերի վերաբերյալ
                </label>
                <input
                  type="text"
                  value={state.documents.notes}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      documents: { ...prev.documents, notes: e.target.value },
                    }))
                  }
                  placeholder="Նշեք բացակայող կամ ներկայացման փուլում գտնվող փաստաթղթերը"
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Section 13: Շահառուի տվյալներ */}
          {(activeSection === "all" || activeSection === 13) && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  XIII
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    XIII. Շահառուի տվյալներ (Beneficiary)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Կամավոր թե գրավադրված բանկում, Բանկի տվյալներ, Շահառուի ով լինելը
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="isPledged"
                      checked={!state.beneficiary.isPledged}
                      onChange={() =>
                        onChange((prev) => ({
                          ...prev,
                          beneficiary: {
                            ...prev.beneficiary,
                            isPledged: false,
                            bankName: "",
                            beneficiaryName: prev.company.name || "Ապահովադիր",
                          },
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-600"
                    />
                    <span>🏛️ Կամավոր ապահովագրություն (Շահառու է հանդիսանում Ապահովադիրը)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="isPledged"
                      checked={state.beneficiary.isPledged}
                      onChange={() =>
                        onChange((prev) => ({
                          ...prev,
                          beneficiary: { ...prev.beneficiary, isPledged: true },
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-600"
                    />
                    <span>🏦 Գրավադրված է Բանկում / Վարկային կազմակերպությունում</span>
                  </label>
                </div>

                {state.beneficiary.isPledged && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Ընտրեք Շահառու Բանկը / Կազմակերպությունը *
                      </label>
                      <select
                        value={state.beneficiary.bankName}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            beneficiary: {
                              ...prev.beneficiary,
                              bankName: e.target.value,
                              beneficiaryName: e.target.value,
                            },
                          }))
                        }
                        className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden bg-white"
                      >
                        <option value="">Ընտրեք բանկը...</option>
                        {BANK_LIST.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Վարկային պայմանագրի համարը / Ամսաթիվը
                      </label>
                      <input
                        type="text"
                        value={state.beneficiary.loanAgreementNumber}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            beneficiary: {
                              ...prev.beneficiary,
                              loanAgreementNumber: e.target.value,
                            },
                          }))
                        }
                        placeholder="Օր․՝ LN-2024/7821-CR"
                        className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Շահառուի վերաբերյալ հատուկ նշում
                      </label>
                      <input
                        type="text"
                        value={state.beneficiary.notes}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            beneficiary: { ...prev.beneficiary, notes: e.target.value },
                          }))
                        }
                        placeholder="Շահառու է հանդիսանում Բանկը՝ չմարված վարկային պարտավորության չափով"
                        className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Quotation Summary & Agent Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm sticky top-[140px]">
            <div className="flex items-center justify-between border-b border-red-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ՀԱՇՎԱՐԿԻՉ
                </span>
                <h3 className="font-extrabold text-slate-900 text-base mt-1">
                  Գնառաջարկի Ամփոփում
                </h3>
              </div>
              <Percent className="w-5 h-5 text-blue-600" />
            </div>

            {/* Sum breakdown */}
            <div className="space-y-2.5 text-xs text-slate-600 mb-4">
              {state.propertyPackage && state.propertyPackage !== "custom" && (
                <div className="flex justify-between py-1.5 border-b border-blue-100 bg-blue-50/50 px-2 rounded-lg items-center">
                  <span className="text-blue-900 font-medium">Ընտրված Փաթեթ՝</span>
                  <span className="font-extrabold text-blue-900 bg-white px-2 py-0.5 rounded text-[11px] border border-blue-200 shadow-2xs">
                    {state.propertyPackage === "start" ? "START (2.5 մլն ֏)" :
                     state.propertyPackage === "standard" ? "STANDARD (4.0 մլն ֏)" :
                     state.propertyPackage === "standard_plus" ? "STANDARD PLUS (6.0 մլն ֏)" :
                     state.propertyPackage === "premium" ? "PREMIUM (9.0 մլն ֏)" : state.propertyPackage}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Ապահովադիր՝</span>
                <span className="font-bold text-slate-900 truncate max-w-[170px]">
                  {state.company.name || "—"}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Ընդհանուր գույքի արժեք՝</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(calc.totalSumInsured, state.values.currency)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Բազային սակագին՝</span>
                <span className="font-semibold text-slate-700">
                  {formatPercent(calc.baseTariff)}
                </span>
              </div>

              {calc.discountBonus > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700 font-medium">
                  <span>Անվտանգության զեղչեր՝</span>
                  <span>-{formatPercent(calc.discountBonus)}</span>
                </div>
              )}

              {/* Agent Manual Tariff override */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Կիրառվող տարեկան սակագին (%):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.05"
                    max="2.00"
                    value={state.customTariff !== undefined ? state.customTariff : Number(calc.finalTariff.toFixed(2))}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        customTariff: Number(e.target.value) || 0.15,
                      }))
                    }
                    className="w-24 text-xs font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 outline-hidden bg-slate-50"
                  />
                  <span className="text-xs text-slate-500 font-medium">% տարեկան</span>
                </div>
              </div>

              {/* Franchise override */}
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Չհատուցվող գումար (Ֆրանշիզա %):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={state.customFranchise !== undefined ? state.customFranchise : 0.5}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        customFranchise: Number(e.target.value),
                      }))
                    }
                    className="w-24 text-xs font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 outline-hidden bg-slate-50"
                  />
                  <span className="text-xs text-slate-500 font-medium">% ({formatCurrency(calc.franchiseAmount, state.values.currency)})</span>
                </div>
              </div>

              {/* Payment Schedule */}
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Վճարման պլան՝
                </label>
                <select
                  value={state.paymentSchedule || "single"}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      paymentSchedule: e.target.value as any,
                    }))
                  }
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 outline-hidden bg-slate-50"
                >
                  <option value="single">Միանվագ (100% կնքման պահին)</option>
                  <option value="biannual">Երկու փուլով (50% / 50%)</option>
                  <option value="quarterly">Եռամսյակային (4 փուլով)</option>
                </select>
              </div>
            </div>

            {/* Total Annual Premium Highlight in SIL Royal Blue */}
            <div className="bg-gradient-to-br from-[#00235B] via-[#003399] to-[#004DB3] text-white rounded-xl p-5 shadow-lg shadow-blue-950/20 mb-4 border border-blue-700/50">
              <span className="text-[11px] text-cyan-200 font-bold block">
                Տարեկան Ապահովագրավճար (Premium)
              </span>
              <div className="text-2xl font-black text-white tracking-tight mt-0.5">
                {formatCurrency(calc.annualPremium, state.values.currency)}
              </div>
              <span className="text-[11px] text-blue-200 font-medium block mt-1">
                Սակագին՝ {formatPercent(calc.finalTariff)}
              </span>
            </div>

            {/* Generate Quotation button */}
            <button
              onClick={handleGenerateClick}
              id="generate-quotation-btn"
              className="w-full bg-gradient-to-r from-[#003399] to-[#0066FF] hover:from-[#002D72] hover:to-[#0052CC] text-white font-black text-xs sm:text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-blue-900/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] border border-blue-400/20"
            >
              <FileCheck2 className="w-4 h-4 text-cyan-200" />
              Կազմել Պաշտոնական Գնառաջարկ
            </button>
            <p className="text-[11px] text-center text-slate-500 mt-2">
              Պատրաստ կլինի MS Word (.doc) ներբեռնման և պատճենման համար
            </p>
          </div>
        </div>
      </div>

      {/* AI Smart Parse Modal */}
      {aiParseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-[#003399] mb-2">
              <Sparkles className="w-5 h-5 text-[#0066FF]" />
              <h3 className="font-bold text-base text-slate-900">
                AI Ավտոմատ Լրացում Ազատ Տեքստից
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Տեղադրեք հաճախորդից ստացված տեքստը, նամակը կամ գույքի նկարագրությունը: AI-ը կվերլուծի այն և ավտոմատ կլրացնի բոլոր 13 բաժինները:
            </p>

            <textarea
              rows={6}
              value={aiInputText}
              onChange={(e) => setAiInputText(e.target.value)}
              placeholder="Օրինակ՝ «Արտադրական ընկերություն «Արմենիա Ֆուդ» ՍՊԸ, ՀՎՀՀ 01234567, Երևան Թբիլիսյան խճուղի 20: Շենքի արժեքը 150 մլն դրամ, հաստոցներ 40 մլն, ապրանքներ 20 մլն: Ունենք ավտոմատ սպրինկլերներ և տեսախցիկներ: Գույքը գրավադրված է Ամերիաբանկում...»"
              className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-3.5 focus:ring-2 focus:ring-[#003399] focus:border-[#003399] outline-hidden mb-3 bg-white"
            />

            {aiParseError && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg mb-3">
                {aiParseError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setAiParseModalOpen(false)}
                disabled={aiParsingLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Չեղարկել
              </button>
              <button
                onClick={handleAiParse}
                disabled={aiParsingLoading || !aiInputText.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#003399] hover:bg-[#002880] rounded-lg transition shadow-md shadow-blue-900/20 cursor-pointer disabled:opacity-50"
              >
                {aiParsingLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Վերլուծվում է...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                    Կառուցվածքավորել և Լրացնել
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPropertyValuationModal && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden relative border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <span className="font-extrabold text-sm">List.am Անշարժ Գույքի Շուկայական Գնահատիչ</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPropertyValuationModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
              <ListAmPropertyValuationCalculator
                initialArea={Number(state.objectData.totalArea) || 85}
                onApplyToPropertyInsurance={(applied) => {
                  const isAMD = state.values.currency === "AMD";
                  onChange((prev) => ({
                    ...prev,
                    objectData: {
                      ...prev.objectData,
                      totalArea: String(applied.areaSqm),
                      address: prev.objectData.address || `${applied.districtName}${applied.subDistrict ? `, ${applied.subDistrict}` : ""}`,
                    },
                    insuredProperty: {
                      ...prev.insuredProperty,
                      building: true,
                      interior: true,
                      equipment: applied.movablesValueAMD > 0,
                    },
                    values: {
                      ...prev.values,
                      buildingValue: isAMD ? applied.constructiveValueAMD : Math.round(applied.constructiveValueAMD / 390),
                      interiorValue: isAMD ? applied.finishingValueAMD : Math.round(applied.finishingValueAMD / 390),
                      equipmentValue: isAMD ? applied.movablesValueAMD : Math.round(applied.movablesValueAMD / 390),
                    },
                  }));
                  setShowPropertyValuationModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showCertificateScannerModal && (
        <PropertyCertificateScannerModal
          onClose={() => setShowCertificateScannerModal(false)}
          onApplyCertificate={handleApplyCertificate}
        />
      )}
    </div>
  );
}
