import { useState } from "react";
import {
  SIL_PRODUCTS_CATALOG,
  CatalogProduct,
} from "../../data/productsCatalog";
import {
  InsuranceProductType,
  QuotationProposal,
  CascoInsuranceData,
  HealthInsuranceData,
  TravelInsuranceData,
  CargoInsuranceData,
} from "../../types";
import {
  buildGenericCatalogProposal,
  buildCascoProposal,
  buildHealthProposal,
  buildTravelProposal,
  buildCargoProposal,
  formatCurrency,
  formatPercent,
  generateQuotationNumber,
} from "../../utils/insuranceCalculator";
import {
  Car,
  HeartPulse,
  Plane,
  Building2,
  Package,
  HardHat,
  Scale,
  ShieldAlert,
  Sprout,
  Layers,
  Search,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronRight,
  PlusCircle,
  FileCheck,
  Percent,
} from "lucide-react";

interface ProductCatalogViewProps {
  onSelectProductForQuotation: (proposal: QuotationProposal) => void;
  onStartQuotation: (productId: InsuranceProductType) => void;
  onNavigateToProperty: () => void;
  onNavigateToMortgage: () => void;
}

const CATEGORY_TABS = [
  { id: "all", label: "Բոլոր Պրոդուկտները", icon: Layers },
  { id: "motor", label: "Ավտոտրանսպորտ", icon: Car },
  { id: "property", label: "Գույք & Հիփոթեք", icon: Building2 },
  { id: "health", label: "Առողջություն & Կյանք", icon: HeartPulse },
  { id: "travel", label: "Ճամփորդություն", icon: Plane },
  { id: "corporate", label: "Բիզնես, Բեռներ & Շինարարություն", icon: Package },
  { id: "special", label: "Գյուղատնտեսություն & Այլ", icon: Sprout },
];

import { getCurrentUser } from "../../utils/authStore";

export function ProductCatalogView({
  onSelectProductForQuotation,
  onStartQuotation,
  onNavigateToProperty,
  onNavigateToMortgage,
}: ProductCatalogViewProps) {
  const me = getCurrentUser();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeModalProduct, setActiveModalProduct] = useState<CatalogProduct | null>(null);

  // Dynamic state for modal customization
  const [customClientName, setCustomClientName] = useState("«Ապահովադիր»");
  const [customPhone, setCustomPhone] = useState("+374 (10) 58-00-00");
  const [customSum, setCustomSum] = useState<number>(15000000);
  const [customCurrency, setCustomCurrency] = useState<"AMD" | "USD" | "EUR">("AMD");
  const [customDiscount, setCustomDiscount] = useState<number>(0);

  // Product-specific modal state
  const [cascoVehicle, setCascoVehicle] = useState({ make: "Toyota", model: "RAV4", year: 2023, glassNoPolice: true });
  const [healthConfig, setHealthConfig] = useState({ count: 20, limitPerPerson: 5000000, dental: true, plan: "classic" as "classic" | "standard" | "platinum" });
  const [travelConfig, setTravelConfig] = useState({ destination: "schengen" as "schengen" | "georgia" | "worldwide", days: 15, count: 2 });
  const [cargoConfig, setCargoConfig] = useState({ origin: "Գերմանիա", dest: "Հայաստան", mode: "road" as "road" | "air" | "sea", clause: "ICC_A" as "ICC_A" | "ICC_B" | "ICC_C" });

  const filteredProducts = SIL_PRODUCTS_CATALOG.filter((product) => {
    if (me?.role === "casco_sales" && product.id !== "casco") return false;
    const matchesCat = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch =
      product.nameArm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.nameEng.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenConfigurator = (product: CatalogProduct) => {
    if (product.id === "property") {
      onNavigateToProperty();
      return;
    }
    if (product.id === "mortgage") {
      onNavigateToMortgage();
      return;
    }

    setActiveModalProduct(product);
    setCustomClientName(product.defaultValues.clientName || product.defaultValues.contractorName || product.defaultValues.farmerName || "«Հաճախորդ»");
    setCustomPhone(product.defaultValues.phone || "+374 (10) 58-00-00");
    setCustomSum(product.defaultValues.marketValue || product.defaultValues.contractValue || product.defaultValues.cargoValue || product.defaultValues.estimatedHarvestValue || 20000000);
    setCustomCurrency(product.defaultValues.currency || "AMD");
    setCustomDiscount(0);
  };

  const handleCreateQuotationFromModal = () => {
    if (!activeModalProduct) return;

    let proposal: QuotationProposal;

    if (activeModalProduct.id === "casco") {
      const cascoData: CascoInsuranceData = {
        clientName: customClientName,
        phone: customPhone,
        email: "client@mail.am",
        vehicleMake: cascoVehicle.make,
        vehicleModel: cascoVehicle.model,
        manufactureYear: cascoVehicle.year,
        marketValue: customSum,
        currency: customCurrency as "AMD" | "USD",
        coverageType: "comprehensive",
        franchiseType: "zero",
        franchiseAmount: 0,
        driverMinAge: 26,
        driverMinExp: 4,
        isUnlimitedDrivers: false,
        includeGlassNoPolice: cascoVehicle.glassNoPolice,
        includeTowingAssistance: true,
        isPledged: false,
        baseTariff: 2.4,
        discount: customDiscount,
      };
      proposal = buildCascoProposal(cascoData);
    } else if (activeModalProduct.id === "health") {
      const healthData: HealthInsuranceData = {
        clientName: customClientName,
        phone: customPhone,
        email: "hr@company.am",
        groupType: "corporate",
        insuredCount: healthConfig.count,
        planLevel: healthConfig.plan,
        limitPerPerson: healthConfig.limitPerPerson,
        currency: customCurrency as "AMD" | "USD",
        includeDental: healthConfig.dental,
        includeVision: false,
        includeMaternity: false,
        includePreventiveCheckup: true,
        companyName: customClientName,
        tariffPerPerson: 4.2,
      };
      proposal = buildHealthProposal(healthData);
    } else if (activeModalProduct.id === "travel") {
      const travelData: TravelInsuranceData = {
        travelerName: customClientName,
        phone: customPhone,
        destination: travelConfig.destination,
        tripDurationDays: travelConfig.days,
        travelerCount: travelConfig.count,
        travelerAges: "30, 28",
        coverageLimit: 30000,
        currency: "EUR",
        includeBaggage: true,
        includeTripCancellation: false,
        includeCovid: true,
        includeSports: false,
      };
      proposal = buildTravelProposal(travelData);
    } else if (activeModalProduct.id === "cargo") {
      const cargoData: CargoInsuranceData = {
        clientName: customClientName,
        phone: customPhone,
        cargoDescription: "Արդյունաբերական ապրանքներ և տեխնիկա",
        cargoValue: customSum,
        currency: customCurrency,
        originCountry: cargoConfig.origin,
        destinationCountry: cargoConfig.dest,
        transportMode: cargoConfig.mode,
        clauseType: cargoConfig.clause,
        packagingType: "Ստանդարտ արկղեր և պալետներ",
        isFragile: false,
        isTemperatureControlled: false,
      };
      proposal = buildCargoProposal(cargoData);
    } else if (activeModalProduct.id === "bundle") {
      // Create multi-product bundle proposal
      const today = new Date();
      const validUntilDate = new Date();
      validUntilDate.setDate(today.getDate() + 30);
      const totalSum = 320000000;
      const basePrem = 4200000;
      const bundleDiscount = basePrem * 0.15; // 15% discount
      const finalPrem = basePrem - bundleDiscount;

      proposal = {
        id: `bundle-${Date.now()}`,
        quotationNumber: generateQuotationNumber("bundle"),
        type: "bundle",
        productNameArm: "Կորպորատիվ Համապարփակ Փաթեթ (Multi-Line Package)",
        categoryNameArm: "Բիզնես և Կորպորատիվ",
        date: today.toLocaleDateString("hy-AM"),
        validUntil: validUntilDate.toLocaleDateString("hy-AM"),
        clientName: customClientName || "«ԳԼՈԲԱԼ ՀՈԼԴԻՆԳ» ՓԲԸ",
        contactInfo: `Հեռ․՝ ${customPhone}`,
        objectDescription: "Կորպորատիվ ակտիվների համապարփակ պաշտպանության փաթեթ՝ Գույք (FLEXA) + Կորպորատիվ Ավտոպարկ (ԿԱՍԿՈ) + Անձնակազմի Բժշկական ապահովագրություն (ԿԲԱ) + Բեռնափոխադրումներ (ICC A):",
        totalSumInsured: totalSum,
        currency: "AMD",
        baseTariff: (basePrem / totalSum) * 100,
        discountBonus: 15,
        finalTariff: (finalPrem / totalSum) * 100,
        annualPremium: finalPrem,
        franchiseDescription: "Համաձայն յուրաքանչյուր առանձին բաժնի պայմանների",
        franchiseAmount: 500000,
        paymentTerms: "Եռամսյակային հավասար մասերով (4 փուլով)",
        beneficiaryDetails: "Շահառու՝ Ապահովադիր Ընկերություն",
        coveredPerilsList: [
          "Գույքային ռիսկեր (Հրդեհ, պայթյուն, բնական աղետներ, ջրի վնաս)",
          "Կորպորատիվ ավտոպարկի ԿԱՍԿՈ ծածկույթ (ՃՏՊ, գողություն, տարերային աղետներ)",
          "Աշխատակազմի Կամավոր Բժշկական Ապահովագրություն (ստացիոնար, ամբուլատոր, Check-up)",
          "Ներմուծվող և արտահանվող բեռների ICC (A) All Risks ապահովագրություն",
          "Երրորդ անձանց առջև քաղաքացիական պատասխանատվություն (TPL)",
        ],
        bundleBreakdown: [
          { productName: "Գույք և Արտադրական Մասնաշենք (FLEXA)", sumInsured: 180000000, tariff: 0.18, premium: 324000, details: "Շենքեր, հաստոցներ, պահեստներ" },
          { productName: "Կորպորատիվ Ավտոպարկ (10 մեքենա ԿԱՍԿՈ)", sumInsured: 70000000, tariff: 2.2, premium: 1540000, details: "Toyota, Hyundai, Ford" },
          { productName: "Անձնակազմի Բժշկական Ապահովագրություն (ԿԲԱ 35 աշխատակից)", sumInsured: 50000000, tariff: 4.0, premium: 2000000, details: "Classic փաթեթ + Check-up" },
          { productName: "Միջազգային Բեռների Ապահովագրություն (ICC A)", sumInsured: 20000000, tariff: 0.25, premium: 50000, details: "Եվրոպա - Հայաստան" },
        ],
        specialConditions: [
          "Հատուկ 15% կորպորատիվ համալիր զեղչ բոլոր բաժինների համար:",
          "Մեկ միասնական պայմանագիր և 24/7 անձնական VIP սպասարկող մենեջեր:",
        ],
        agentName: "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Կորպորատիվ Բաժին",
        agentTitle: "Կորպորատիվ Հաճախորդների Տնօրեն",
        agentPhone: "+374 (10) 58-00-00 / 81-00",
        agentEmail: "corporate@silinsurance.am",
      };
    } else {
      proposal = buildGenericCatalogProposal(activeModalProduct.id, {
        clientName: customClientName,
        phone: customPhone,
        propertySum: customSum,
        marketValue: customSum,
        contractValue: customSum,
        cargoValue: customSum,
        estimatedHarvestValue: customSum,
        currency: customCurrency,
      });
    }

    setActiveModalProduct(null);
    onSelectProductForQuotation(proposal);
  };

  const getProductIcon = (id: InsuranceProductType) => {
    switch (id) {
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
        return Building2;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner with SIL official identity */}
      <div className="bg-gradient-to-r from-[#001D4A] via-[#003399] to-[#0066FF] text-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-blue-400/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400/30 via-blue-500/10 to-transparent pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-200 text-xs font-semibold backdrop-blur-xs mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            Պաշտոնական Ապրանքացանկ & Գնառաջարկների Գեներատոր
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» Ապահովագրական Պրոդուկտներ
          </h1>
          <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed mb-6">
            Ընտրեք ցանկացած ապահովագրատեսակ (ԿԱՍԿՈ, Բժշկական ԿԲԱ, Ճամփորդական, Բեռներ, Շինմոնտաժային CAR, Պատասխանատվություն, Ագրո կամ Գույք) և կազմեք պաշտոնական կնիքով գնառաջարկ վայրկյանների ընթացքում:
          </p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Որոնել ըստ անվանման կամ ռիսկի (օր․՝ ԿԱՍԿՈ, Բեռներ, Ճամփորդական, CAR, Ագրո)..."
                className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-md"
              />
            </div>
            <button
              onClick={() => {
                const bundleCat = SIL_PRODUCTS_CATALOG.find((p) => p.id === "bundle");
                if (bundleCat) handleOpenConfigurator(bundleCat);
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer flex-shrink-0"
            >
              <Layers className="w-4 h-4 text-emerald-200" />
              Կորպորատիվ Համալիր Փաթեթ (15% Զեղչ)
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORY_TABS.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer flex-shrink-0 border ${
                isActive
                  ? "bg-[#002D72] text-white border-[#002D72] shadow-md ring-1 ring-[#0066FF]/30"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-cyan-300" : "text-slate-500"}`} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Product Grid */}
      <div className="sil-product-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((product) => {
          const Icon = getProductIcon(product.id);
          const isProperty = product.id === "property";
          const isMortgage = product.id === "mortgage";

          return (
            <div
              key={product.id}
              className="sil-product-card bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group hover:border-blue-300"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#003399] flex items-center justify-center flex-shrink-0 group-hover:bg-[#003399] group-hover:text-white transition-colors duration-200">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {product.badge}
                  </span>
                </div>

                <div className="text-[11px] text-blue-600 font-semibold tracking-wider uppercase mb-1">
                  {product.categoryArm}
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug mb-2 group-hover:text-[#003399] transition-colors">
                  {product.nameArm}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {product.shortDesc}
                </p>

                {/* Key Benefits List */}
                <div className="space-y-1.5 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Առավելություններ & Ծածկույթ․
                  </div>
                  {product.keyBenefits.slice(0, 2).map((benefit, idx) => (
                    <div key={idx} className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-tight">
                      <span className="text-[#0066FF] font-bold">•</span>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing / Tariff summary */}
                <div className="flex items-center justify-between text-xs py-2 border-t border-slate-100 mb-4">
                  <span className="text-slate-500">Բազային սակագին․</span>
                  <span className="font-bold text-[#002D72]">
                    {product.id === "travel" ? "0.9 € / օր" : `${formatPercent(product.baseTariffPercent)} -ից`}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => onStartQuotation(product.id)}
                  className="flex-1 bg-[#002D72] hover:bg-[#00235B] text-white font-bold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer product-cta"
                >
                  <FileCheck className="w-3.5 h-3.5 text-cyan-300" />
                  {isProperty ? "Կազմել Գույքի գնառաջարկ" : isMortgage ? "Կազմել Հիփոթեքի գնառաջարկ" : "Կազմել Գնառաջարկ"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleOpenConfigurator(product)}
                  title="Արագ նախադիտում / պարամետրեր"
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Configurator for quick quotation customization */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-[#00235B] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0066FF] flex items-center justify-center text-white font-bold">
                  <FileCheck className="w-5 h-5 text-cyan-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {activeModalProduct.nameArm}
                  </h3>
                  <p className="text-xs text-blue-200">
                    Պաշտոնական Գնառաջարկի Պարամետրերի Կարգավորում
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalProduct(null)}
                className="text-white/70 hover:text-white text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Client Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ապահովադիր (Ընկերություն / Անձ)
                  </label>
                  <input
                    type="text"
                    value={customClientName}
                    onChange={(e) => setCustomClientName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Օր․՝ «Արմ-Գրուպ» ՍՊԸ"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Հեռախոսահամար / Էլ․ հասցե
                  </label>
                  <input
                    type="text"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="+374 (10) 00-00-00"
                  />
                </div>
              </div>

              {/* Product specific fields */}
              {activeModalProduct.id === "casco" && (
                <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 space-y-3">
                  <div className="text-xs font-bold text-[#002D72]">
                    Ավտոմեքենայի Տվյալներ (ԿԱՍԿՈ)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Մակնիշ</label>
                      <input
                        type="text"
                        value={cascoVehicle.make}
                        onChange={(e) => setCascoVehicle({ ...cascoVehicle, make: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Մոդել</label>
                      <input
                        type="text"
                        value={cascoVehicle.model}
                        onChange={(e) => setCascoVehicle({ ...cascoVehicle, model: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Տարեթիվ</label>
                      <input
                        type="number"
                        value={cascoVehicle.year}
                        onChange={(e) => setCascoVehicle({ ...cascoVehicle, year: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-800 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cascoVehicle.glassNoPolice}
                      onChange={(e) => setCascoVehicle({ ...cascoVehicle, glassNoPolice: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    Ապակիներ & լուսարձակներ առանց Ոստիկանության տեղեկանքի
                  </label>
                </div>
              )}

              {activeModalProduct.id === "health" && (
                <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-3">
                  <div className="text-xs font-bold text-emerald-900">
                    Բժշկական Ապահովագրության Պարամետրեր (ԿԲԱ)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Աշխատակիցների թիվ</label>
                      <input
                        type="number"
                        value={healthConfig.count}
                        onChange={(e) => setHealthConfig({ ...healthConfig, count: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Սահմանաչափ 1 անձի համար</label>
                      <input
                        type="number"
                        value={healthConfig.limitPerPerson}
                        onChange={(e) => setHealthConfig({ ...healthConfig, limitPerPerson: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Փաթեթի Մակարդակ</label>
                      <select
                        value={healthConfig.plan}
                        onChange={(e) => setHealthConfig({ ...healthConfig, plan: e.target.value as any })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                      >
                        <option value="standard">Standard (Բազային)</option>
                        <option value="classic">Classic (Օպտիմալ)</option>
                        <option value="platinum">Platinum (VIP)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeModalProduct.id === "travel" && (
                <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200 space-y-3">
                  <div className="text-xs font-bold text-sky-900">
                    Ճամփորդության Պարամետրեր
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Ուղղություն</label>
                      <select
                        value={travelConfig.destination}
                        onChange={(e) => setTravelConfig({ ...travelConfig, destination: e.target.value as any })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                      >
                        <option value="schengen">Շենգեն Գոտի (30,000 €)</option>
                        <option value="georgia">Վրաստան (Արտոնյալ)</option>
                        <option value="worldwide">Ամբողջ Աշխարհ (50,000 $)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Օրերի քանակ</label>
                      <input
                        type="number"
                        value={travelConfig.days}
                        onChange={(e) => setTravelConfig({ ...travelConfig, days: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Ճամփորդների թիվ</label>
                      <input
                        type="number"
                        value={travelConfig.count}
                        onChange={(e) => setTravelConfig({ ...travelConfig, count: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sum & Currency */}
              {activeModalProduct.id !== "travel" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ապահովագրական Արժեք / Գումար
                    </label>
                    <input
                      type="number"
                      value={customSum}
                      onChange={(e) => setCustomSum(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Արժույթ
                    </label>
                    <select
                      value={customCurrency}
                      onChange={(e) => setCustomCurrency(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="AMD">ՀՀ Դրամ (AMD ֏)</option>
                      <option value="USD">ԱՄՆ Դոլար (USD $)</option>
                      <option value="EUR">Եվրո (EUR €)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Covered Perils list preview */}
              <div>
                <div className="text-xs font-bold text-slate-700 mb-2">
                  Ներառված Ապահովագրական Ռիսկեր (Պաշտոնական Ծածկույթ)․
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {activeModalProduct.coveredRisks.map((risk, idx) => (
                    <div key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setActiveModalProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Չեղարկել
              </button>
              <button
                onClick={handleCreateQuotationFromModal}
                className="bg-gradient-to-r from-[#002D72] to-[#0066FF] hover:from-[#00235B] hover:to-[#0052CC] text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <FileCheck className="w-4 h-4 text-cyan-200" />
                Ստեղծել Պաշտոնական Գնառաջարկ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
