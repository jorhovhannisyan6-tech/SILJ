import React, { useState, useMemo } from "react";
import {
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Percent,
  Plus,
  Trash2,
  Car,
  Building,
  HeartPulse,
  Plane,
  Package,
  ShieldAlert,
  HardHat,
  Scale,
  Award,
  DollarSign,
  FileCheck2,
  AlertCircle
} from "lucide-react";
import { QuotationProposal, InsuranceProductType } from "../../types";
import { formatCurrency, formatPercent } from "../../utils/insuranceCalculator";
import { SIL_PRODUCTS_CATALOG } from "../../data/productsCatalog";

interface BundleItem {
  id: string;
  productType: InsuranceProductType;
  productNameArm: string;
  sumInsured: number;
  tariff: number; // percentage, e.g. 2.5
  premium: number;
  deductibleText: string;
  coverageDetails: string;
  icon: any;
}

interface Props {
  onGenerateQuotation: (proposal: QuotationProposal) => void;
  onBackToSingle: () => void;
}

const PRESET_BUNDLES = [
  {
    id: "auto_plus",
    nameArm: "«Ավտո Պլյուս» Համալիր Փաթեթ",
    description: "ԿԱՍԿՈ + Դժբախտ պատահարներից ապահովագրություն + Կամավոր ԱՊՊԱ",
    recommendedDiscount: 10,
    items: [
      {
        productType: "casco" as InsuranceProductType,
        productNameArm: "ԿԱՍԿՈ Ավտոմեքենայի Ապահովագրություն",
        sumInsured: 8000000,
        tariff: 3.2,
        deductibleText: "1% ոչ պայմանական, ապակիներն առանց ֆրանշիզայի",
        coverageDetails: "Ֆիզիկական վնաս, հափշտակություն, 24/7 քարշակ և տեխօգնություն",
      },
      {
        productType: "accident" as InsuranceProductType,
        productNameArm: "Վարորդի և Ուղևորների ԴՊ Ապահովագրություն",
        sumInsured: 3000000,
        tariff: 0.8,
        deductibleText: "Առանց ֆրանշիզայի (0 ֏)",
        coverageDetails: "Մահ, հաշմանդամություն և բժշկական ծախսեր դժբախտ պատահարից (5 նստատեղ)",
      },
      {
        productType: "liability" as InsuranceProductType,
        productNameArm: "Կամավոր ԱՊՊԱ (Երրորդ անձանց պատասխանատվություն)",
        sumInsured: 5000000,
        tariff: 0.5,
        deductibleText: "Պարտադիր ԱՊՊԱ-ի սահմանաչափը գերազանցելիս",
        coverageDetails: "Լրացուցիչ գույքային և առողջական հատուցում մինչև 5,000,000 ֏",
      },
    ],
  },
  {
    id: "business_shield",
    nameArm: "«Բիզնես Ամրոց» Կորպորատիվ Փաթեթ",
    description: "Անշարժ գույք + Ապրանքանյութական արժեքներ + Քաղաքացիական պատասխանատվություն (CGL)",
    recommendedDiscount: 12,
    items: [
      {
        productType: "property" as InsuranceProductType,
        productNameArm: "Անշարժ Գույքի և Շենք-Շինության Ապահովագրություն",
        sumInsured: 45000000,
        tariff: 0.18,
        deductibleText: "0.5% վնասի գումարից, նվազագույնը 50,000 ֏",
        coverageDetails: "Հրդեհ, պայթյուն, ջրի արտահոսք, տարերային աղետներ, երկրաշարժ",
      },
      {
        productType: "property" as InsuranceProductType,
        productNameArm: "Ապրանքային Պաշարների և Սարքավորումների Ապահովագրություն",
        sumInsured: 20000000,
        tariff: 0.25,
        deductibleText: "100,000 ֏ յուրաքանչյուր դեպքի համար",
        coverageDetails: "Պահեստավորված ապրանքներ, սառնարանային խափանում, չարամիտ վնասում",
      },
      {
        productType: "liability" as InsuranceProductType,
        productNameArm: "Ընդհանուր Քաղաքացիական Պատասխանատվություն (CGL)",
        sumInsured: 15000000,
        tariff: 0.35,
        deductibleText: "30,000 ֏ ֆիքսված",
        coverageDetails: "Հաճախորդների և երրորդ անձանց պատճառված վնասների հատուցում",
      },
    ],
  },
  {
    id: "logistics_bundle",
    nameArm: "«Տրանսպորտ և Լոգիստիկա» Փաթեթ",
    description: "Բեռների ապահովագրություն (Cargo ICC A) + Փոխադրողի պատասխանատվություն (CMR)",
    recommendedDiscount: 8,
    items: [
      {
        productType: "cargo" as InsuranceProductType,
        productNameArm: "Բեռների Ապահովագրություն (All Risks / ICC A)",
        sumInsured: 25000000,
        tariff: 0.3,
        deductibleText: "0.3% բեռի արժեքից (մոտ 75,000 ֏)",
        coverageDetails: "Միջազգային փոխադրում՝ դռնից դուռ, բոլոր ռիսկերից պաշտպանություն",
      },
      {
        productType: "liability" as InsuranceProductType,
        productNameArm: "Ավտոփոխադրողի Պատասխանատվություն (CMR)",
        sumInsured: 10000000,
        tariff: 0.45,
        deductibleText: "50,000 ֏",
        coverageDetails: "Պատասխանատվություն բեռի կորստի կամ վնասման համար ըստ CMR կոնվենցիայի",
      },
    ],
  },
  {
    id: "family_shield",
    nameArm: "«Ընտանեկան Ապահովություն» Փաթեթ",
    description: "Բնակարանի գույքային ապահովագրություն + Ընտանիքի Առողջություն",
    recommendedDiscount: 10,
    items: [
      {
        productType: "property" as InsuranceProductType,
        productNameArm: "Բնակարանի Գույքի Ապահովագրություն",
        sumInsured: 18000000,
        tariff: 0.22,
        deductibleText: "30,000 ֏ ֆիքսված",
        coverageDetails: "Հրդեհ, ջրով ողողում, հարևաններին պատճառված վնաս, գողություն",
      },
      {
        productType: "health" as InsuranceProductType,
        productNameArm: "Ընտանեկան Բժշկական Ապահովագրություն",
        sumInsured: 6000000,
        tariff: 3.5,
        deductibleText: "Առանց ֆրանշիզայի ՍԻԼ-ի պայմանագրային կլինիկաներում",
        coverageDetails: "Անհետաձգելի բուժօգնություն, վիրահատություն, ամբուլատոր ծառայություններ",
      },
    ],
  },
];

export const BundleCrossSellCalculator: React.FC<Props> = ({
  onGenerateQuotation,
  onBackToSingle,
}) => {
  const [clientName, setClientName] = useState("«ՄԵԳԱ ԹՐԵՅԴ» ՍՊԸ");
  const [phone, setPhone] = useState("+374 91 123456");
  const [email, setEmail] = useState("info@megatrade.am");
  const [currency, setCurrency] = useState<"AMD" | "USD" | "EUR">("AMD");
  const [bundleName, setBundleName] = useState("«Ավտո Պլյուս» Համալիր Փաթեթ");
  const [selectedPreset, setSelectedPreset] = useState<string>("auto_plus");

  const [items, setItems] = useState<BundleItem[]>(() => {
    const preset = PRESET_BUNDLES[0];
    return preset.items.map((it, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      productType: it.productType,
      productNameArm: it.productNameArm,
      sumInsured: it.sumInsured,
      tariff: it.tariff,
      premium: Math.round((it.sumInsured * it.tariff) / 100),
      deductibleText: it.deductibleText,
      coverageDetails: it.coverageDetails,
      icon: it.productType === "casco" ? Car : it.productType === "property" ? Building : it.productType === "health" ? HeartPulse : it.productType === "cargo" ? Package : ShieldCheck,
    }));
  });

  const [discountPercent, setDiscountPercent] = useState<number>(10);

  const handleApplyPreset = (presetId: string) => {
    const preset = PRESET_BUNDLES.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPreset(presetId);
    setBundleName(preset.nameArm);
    setDiscountPercent(preset.recommendedDiscount);
    setItems(
      preset.items.map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        productType: it.productType,
        productNameArm: it.productNameArm,
        sumInsured: it.sumInsured,
        tariff: it.tariff,
        premium: Math.round((it.sumInsured * it.tariff) / 100),
        deductibleText: it.deductibleText,
        coverageDetails: it.coverageDetails,
        icon: it.productType === "casco" ? Car : it.productType === "property" ? Building : it.productType === "health" ? HeartPulse : it.productType === "cargo" ? Package : ShieldCheck,
      }))
    );
  };

  const handleAddItem = (productType: InsuranceProductType) => {
    const catalogItem = SIL_PRODUCTS_CATALOG.find((c) => c.id === productType);
    const newSum = 5000000;
    const newTariff = 1.0;
    const newItem: BundleItem = {
      id: `item-${Date.now()}`,
      productType,
      productNameArm: catalogItem?.nameArm || "Նոր պրոդուկտ",
      sumInsured: newSum,
      tariff: newTariff,
      premium: Math.round((newSum * newTariff) / 100),
      deductibleText: "1% ոչ պայմանական ֆրանշիզա",
      coverageDetails: "Ստանդարտ ծածկույթ համաձայն ՍԻԼ ԻՆՇՈՒՐԱՆՍ-ի կանոնների",
      icon: productType === "casco" ? Car : productType === "property" ? Building : productType === "health" ? HeartPulse : productType === "cargo" ? Package : ShieldCheck,
    };
    setItems((prev) => [...prev, newItem]);
    // Auto adjust discount based on count
    if (items.length + 1 >= 3) {
      setDiscountPercent((prev) => Math.max(prev, 10));
    }
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (id: string, patch: Partial<BundleItem>) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, ...patch };
        if (patch.sumInsured !== undefined || patch.tariff !== undefined) {
          updated.premium = Math.round((updated.sumInsured * updated.tariff) / 100);
        }
        return updated;
      })
    );
  };

  // Totals calculations
  const totalSumInsured = useMemo(
    () => items.reduce((sum, it) => sum + (it.sumInsured || 0), 0),
    [items]
  );
  const totalPreDiscountPremium = useMemo(
    () => items.reduce((sum, it) => sum + (it.premium || 0), 0),
    [items]
  );
  const discountAmount = useMemo(
    () => Math.round((totalPreDiscountPremium * discountPercent) / 100),
    [totalPreDiscountPremium, discountPercent]
  );
  const finalAnnualPremium = useMemo(
    () => totalPreDiscountPremium - discountAmount,
    [totalPreDiscountPremium, discountAmount]
  );
  const effectiveTariff = totalSumInsured > 0
    ? (finalAnnualPremium / totalSumInsured) * 100
    : 0;

  const handleGenerate = () => {
    const quoteNumber = `SIL-BND-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("hy-AM");

    const proposal: QuotationProposal = {
      id: `bnd-${Date.now()}`,
      quotationNumber: quoteNumber,
      type: "bundle",
      productNameArm: bundleName || "Փաթեթային Ապահովագրություն (Cross-Sell Bundle)",
      categoryNameArm: "Խաչաձև Վաճառքի Փաթեթ",
      date: now.toLocaleDateString("hy-AM"),
      validUntil,
      clientName: clientName || "Հարգելի Հաճախորդ",
      contactInfo: `${phone} ${email}`.trim(),
      objectDescription: `Համալիր փաթեթ՝ ${items.map((i) => i.productNameArm).join(" + ")}`,
      totalSumInsured,
      currency,
      baseTariff: totalSumInsured > 0 ? (totalPreDiscountPremium / totalSumInsured) * 100 : 0,
      discountBonus: discountPercent,
      finalTariff: effectiveTariff,
      annualPremium: finalAnnualPremium,
      franchiseDescription: items.map((i) => `${i.productNameArm}՝ ${i.deductibleText}`).join("; "),
      franchiseAmount: 0,
      paymentTerms: "Միանվագ կամ եռամսյակային գրաֆիկով (4 հավասար մասերով)",
      beneficiaryDetails: "Ապահովադիր կամ գրավառու ֆինանսական կազմակերպություն",
      coveredPerilsList: items.flatMap((it) => [
        `[${it.productNameArm}]՝ ${it.coverageDetails}`,
      ]),
      bundleBreakdown: items.map((it) => ({
        productName: it.productNameArm,
        sumInsured: it.sumInsured,
        tariff: it.tariff,
        premium: it.premium,
        details: it.deductibleText,
      })),
      specialConditions: [
        `Փաթեթային խաչաձև վաճառքի զեղչ՝ ${discountPercent}% (ընդհանուր տնտեսումը՝ ${formatCurrency(discountAmount, currency)}):`,
        "Բոլոր պրոդուկտները միավորված են մեկ միասնական պայմանագրային փաթեթում:",
        "Անվճար 24/7 աջակցություն և անհատական սպասարկող մենեջեր:",
        "Գնառաջարկն ուժի մեջ է 30 օրացուցային օր:",
      ],
      agentName: "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Գործակալական Կենտրոն",
      agentTitle: "Գլխավոր Մասնագետ / Անդեռռայթեր",
      agentPhone: "(+374 60) 54 00 00",
      agentEmail: "info@silinsurance.am",
      underwriting: {
        status: discountPercent > 15 ? "manual_review" : "approved",
        reasons: discountPercent > 15 ? ["Փաթեթային զեղչը գերազանցում է 15%-ը (պահանջվում է ղեկավարի վավերացում)"] : [],
      },
    };

    onGenerateQuotation(proposal);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#001D4A] via-[#003399] to-[#0052CC] text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-200 text-xs font-bold border border-cyan-400/30 mb-3">
              <Sparkles size={14} className="text-cyan-300" />
              Խաչաձև Վաճառք (Cross-Sell / Bundling Engine)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Փաթեթային Գնառաջարկների Հաշվիչ
            </h1>
            <p className="text-sm text-blue-100/80 max-w-2xl mt-1.5 leading-relaxed">
              Միավորեք 2 կամ ավելի ապահովագրական պրոդուկտներ մեկ ընդհանուր առաջարկում՝ ավտոմատ
              փաթեթային զեղչով, միասնական ծածկույթի աղյուսակով և պաշտոնական DOCX/PDF փաստաթղթով։
            </p>
          </div>
          <button
            onClick={onBackToSingle}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition flex items-center gap-2 cursor-pointer shrink-0"
          >
            <RotateCcw size={14} />
            Վերադառնալ Մեկ Պրոդուկտի
          </button>
        </div>

        {/* Preset Packages Bar */}
        <div className="mt-6 pt-6 border-t border-white/15">
          <div className="text-xs font-bold text-cyan-200 mb-3 flex items-center gap-1.5">
            <Award size={14} /> Պատրաստի Հանրաճանաչ Փաթեթներ (1-Click Templates).
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {PRESET_BUNDLES.map((preset) => {
              const active = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset.id)}
                  className={`text-left p-3 rounded-2xl transition border cursor-pointer ${
                    active
                      ? "bg-white text-slate-900 border-white shadow-lg font-bold"
                      : "bg-white/5 hover:bg-white/10 text-white border-white/15"
                  }`}
                >
                  <div className="text-xs font-extrabold line-clamp-1">{preset.nameArm}</div>
                  <div className={`text-[11px] mt-0.5 line-clamp-1 ${active ? "text-slate-600" : "text-blue-200/70"}`}>
                    {preset.description}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        active ? "bg-blue-100 text-blue-800" : "bg-cyan-500/20 text-cyan-300"
                      }`}
                    >
                      -{preset.recommendedDiscount}% Զեղչ
                    </span>
                    <span className={`text-[10px] ${active ? "text-slate-500" : "text-slate-300"}`}>
                      {preset.items.length} պրոդուկտ
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form & Bundled Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client & Bundle Details Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <FileCheck2 size={18} className="text-blue-600" />
              Հաճախորդի և Փաթեթի Տվյալներ
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Փաթեթի Անվանում
                </label>
                <input
                  type="text"
                  value={bundleName}
                  onChange={(e) => setBundleName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Ապահովադիր (Հաճախորդ)
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Անուն Ազգանուն կամ Ընկերություն"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Հեռախոսահամար
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Էլ․ փոստ
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Արժույթ
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="AMD">AMD (ՀՀ Դրամ)</option>
                  <option value="USD">USD (ԱՄՆ Դոլար)</option>
                  <option value="EUR">EUR (Եվրո)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Items List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Layers size={18} className="text-blue-600" />
                Փաթեթում Ներառված Պրոդուկտներ ({items.length})
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-bold mr-1">Ավելացնել՝</span>
                <button
                  type="button"
                  onClick={() => handleAddItem("casco")}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition flex items-center gap-1"
                >
                  <Plus size={12} /> ԿԱՍԿՈ
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem("property")}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition flex items-center gap-1"
                >
                  <Plus size={12} /> Գույք
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem("accident")}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 transition flex items-center gap-1"
                >
                  <Plus size={12} /> ԴՊ
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem("liability")}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 transition flex items-center gap-1"
                >
                  <Plus size={12} /> Պատասխ․
                </button>
              </div>
            </div>

            {items.map((item, idx) => {
              const ItemIcon = item.icon || ShieldCheck;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative transition hover:border-blue-300"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <ItemIcon size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-600">Պրոդուկտ {idx + 1}</div>
                        <input
                          type="text"
                          value={item.productNameArm}
                          onChange={(e) => handleUpdateItem(item.id, { productNameArm: e.target.value })}
                          className="text-sm font-black text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>
                    {items.length > 1 && (
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Հեռացնել փաթեթից"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Ապահովագրական Գումար
                      </label>
                      <input
                        type="number"
                        step="100000"
                        value={item.sumInsured}
                        onChange={(e) => handleUpdateItem(item.id, { sumInsured: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Սակագին (%)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={item.tariff}
                        onChange={(e) => handleUpdateItem(item.id, { tariff: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Պրեմիա (Հաշվարկված)
                      </label>
                      <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-emerald-700">
                        {formatCurrency(item.premium, currency)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Չհատուցվող Գումար (Ֆրանշիզա)
                      </label>
                      <input
                        type="text"
                        value={item.deductibleText}
                        onChange={(e) => handleUpdateItem(item.id, { deductibleText: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Ծածկվող Ռիսկեր / Մանրամասներ
                      </label>
                      <input
                        type="text"
                        value={item.coverageDetails}
                        onChange={(e) => handleUpdateItem(item.id, { coverageDetails: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Price Summary & Discount Widget */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg sticky top-24">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center justify-between">
              <span>Փաթեթի Ֆինանսական Ամփոփում</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                {items.length} Պրոդուկտ
              </span>
            </h3>

            {/* Price Breakdown List */}
            <div className="space-y-2.5 pb-4 border-b border-slate-100 text-xs">
              {items.map((it) => (
                <div key={it.id} className="flex items-center justify-between text-slate-600">
                  <span className="truncate pr-2">{it.productNameArm}</span>
                  <span className="font-bold shrink-0">{formatCurrency(it.premium, currency)}</span>
                </div>
              ))}
            </div>

            {/* Pre-discount total */}
            <div className="py-3.5 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Առանձին Պրեմիաների Գումար՝</span>
              <span className="text-slate-800">{formatCurrency(totalPreDiscountPremium, currency)}</span>
            </div>

            {/* Discount Selector */}
            <div className="py-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Percent size={14} className="text-emerald-600" /> Փաթեթային Զեղչ
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800">
                  {discountPercent}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                <span>0% (Ստանդարտ)</span>
                <span>10% (Առաջարկվող)</span>
                <span>25% (Առավելագույն)</span>
              </div>
              {discountPercent > 15 && (
                <div className="mt-2.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0 text-amber-600" />
                  15%-ից բարձր զեղչը պահանջում է Անդեռռայթերի հաստատում։
                </div>
              )}
            </div>

            {/* Savings Badge */}
            <div className="py-3 border-b border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-700">Հաճախորդի Խնայողությունը՝</span>
              <span className="font-black text-emerald-700">-{formatCurrency(discountAmount, currency)}</span>
            </div>

            {/* Big Final Total */}
            <div className="pt-4 pb-6">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Վերջնական Տարեկան Պրեմիա
              </div>
              <div className="text-3xl font-black text-[#002D72] tracking-tight">
                {formatCurrency(finalAnnualPremium, currency)}
              </div>
              <div className="text-[11px] text-slate-500 font-semibold mt-1">
                Ընդհանուր ապահովագրական գումար՝ {formatCurrency(totalSumInsured, currency)}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <span>Ստեղծել Փաթեթային Գնառաջարկ</span>
              <ArrowRight size={16} />
            </button>

            <div className="mt-3 text-center">
              <span className="text-[10px] text-slate-400 font-medium">
                Պաշտոնական ձևանմուշ N 0004 (0033) ԿԲ լիցենզիայով
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
