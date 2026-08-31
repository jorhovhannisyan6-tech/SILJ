import React, { useState, useEffect, useMemo } from "react";
import {
  Shield,
  Car,
  Home,
  HeartPulse,
  Plane,
  Package,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  User,
  Phone,
  Mail,
  FileText,
  Send,
  Sparkles,
  AlertCircle,
  Building,
  Info,
  Calendar,
  DollarSign,
  HelpCircle,
  Lock,
} from "lucide-react";
import horizontalLogo from "../../assets/images/sil-logo-horizontal.png";
import { addClientRenewal } from "../../utils/clientRenewalStore";

interface Props {
  initialProductType?: string;
  onCloseExpressMode?: () => void;
}

// Phone validator & formatter for Armenia and international
function formatArmenianPhone(val: string): string {
  // Remove non-digit chars except +
  let cleaned = val.replace(/[^\d+]/g, "");
  if (!cleaned) return "";

  // If starts with 0 (e.g. 091...), normalize to +37491...
  if (cleaned.startsWith("0") && cleaned.length >= 2) {
    cleaned = "+374" + cleaned.slice(1);
  } else if (!cleaned.startsWith("+") && cleaned.startsWith("374")) {
    cleaned = "+" + cleaned;
  } else if (!cleaned.startsWith("+") && cleaned.length > 0) {
    cleaned = "+374" + cleaned;
  }

  // Format as +374 (XX) XX-XX-XX
  if (cleaned.startsWith("+374")) {
    const digits = cleaned.slice(4).replace(/\D/g, "");
    if (digits.length === 0) return "+374";
    if (digits.length <= 2) return `+374 (${digits}`;
    if (digits.length <= 4) return `+374 (${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 6) return `+374 (${digits.slice(0, 2)}) ${digits.slice(2, 4)}-${digits.slice(4)}`;
    return `+374 (${digits.slice(0, 2)}) ${digits.slice(2, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  return cleaned;
}

function isValidPhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, "");
  // RA number +374XXXXXXXX (total 11 digits: 374 + 8 digits)
  if (phone.startsWith("+374")) {
    if (digitsOnly.length !== 11) return false;
    const prefix = digitsOnly.slice(3, 5);
    const validPrefixes = ["91", "99", "96", "43", "33", "97", "77", "93", "94", "98", "49", "41", "44", "55", "95", "10", "11", "12", "60", "22", "23", "24", "25", "26", "28"];
    return validPrefixes.includes(prefix);
  }
  // Generic international
  return digitsOnly.length >= 9 && digitsOnly.length <= 15;
}

function isValidEmail(email: string): boolean {
  if (!email.trim()) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 3) return false;
  // Has at least 2 words or contains legal entity identifier
  const words = trimmed.split(/\s+/).filter(Boolean);
  const isLegal = /սպը|փբը|ա\/ձ|բբը|հիմնադրամ|կոոպ|llc|cjsc|ojsc|gmbh/i.test(trimmed);
  return words.length >= 2 || isLegal;
}

const POPULAR_CARS = [
  "Toyota Camry", "Toyota RAV4", "Toyota Corolla", "Toyota Land Cruiser Prado", "Toyota Prius",
  "Mercedes-Benz C-Class", "Mercedes-Benz E-Class", "Mercedes-Benz S-Class", "Mercedes-Benz G-Class", "Mercedes-Benz GLE",
  "BMW 3 Series", "BMW 5 Series", "BMW 7 Series", "BMW X5", "BMW X6", "BMW X7",
  "Hyundai Elantra", "Hyundai Sonata", "Hyundai Tucson", "Hyundai Santa Fe",
  "Kia Sportage", "Kia Optima / K5", "Kia Sorento", "Kia Forte / Cerato",
  "Volkswagen ID.4", "Tesla Model 3", "Tesla Model Y", "Nissan Rogue / X-Trail",
  "Lexus RX 350", "Lexus GX 460", "Lexus LX 570 / 600", "Honda CR-V", "Mazda CX-5",
];

const YEREVAN_DISTRICTS = [
  "Երևան, Կենտրոն",
  "Երևան, Արաբկիր",
  "Երևան, Դավթաշեն",
  "Երևան, Աջափնյակ",
  "Երևան, Քանաքեռ-Զեյթուն",
  "Երևան, Նոր Նորք / Նորք-Մարաշ",
  "Երևան, Մալաթիա-Սեբաստիա",
  "Երևան, Շենգավիթ",
  "Երևան, Էրեբունի",
  "Երևան, Ավան",
  "Կոտայքի մարզ (Ծաղկաձոր, Աբովյան, Ձորաղբյուր)",
  "Արարատի մարզ",
  "Արմավիրի մարզ (Էջմիածին)",
  "Լոռու մարզ (Վանաձոր)",
  "Շիրակի մարզ (Գյումրի)",
  "Սյունիքի մարզ (Կապան, Գորիս)",
  "Այլ մարզ / Տարածաշրջան",
];

export function PublicExpressQuoteView({ initialProductType = "casco", onCloseExpressMode }: Props) {
  const [productType, setProductType] = useState<string>(initialProductType);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [referenceId, setReferenceId] = useState<string>("");

  // Contact inputs
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("+374");
  const [email, setEmail] = useState("");

  // CASCO fields
  const [makeModel, setMakeModel] = useState("Toyota Camry");
  const [year, setYear] = useState<number>(2022);
  const [vehicleType, setVehicleType] = useState("Մարդատար սեդան");
  const [currency, setCurrency] = useState<"USD" | "AMD">("USD");
  const [estimatedValueUSD, setEstimatedValueUSD] = useState<number>(22000);
  const [estimatedValueAMD, setEstimatedValueAMD] = useState<number>(8500000);
  const [steeringWheel, setSteeringWheel] = useState("Ձախակողմյան");
  const [vehicleUsage, setVehicleUsage] = useState("Անձնական / Ընտանեկան");
  const [driverExperience, setDriverExperience] = useState("3+ տարի (տարիք՝ 23+)");
  const [isBankPledge, setIsBankPledge] = useState(false);
  const [pledgeBank, setPledgeBank] = useState("Ամերիաբանկ");

  // Property fields
  const [propertyType, setPropertyType] = useState("Բնակարան նորակառույցում");
  const [propertyDistrict, setPropertyDistrict] = useState("Երևան, Կենտրոն");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyArea, setPropertyArea] = useState<number>(90);
  const [propertyValueAMD, setPropertyValueAMD] = useState<number>(45000000);
  const [renovation, setRenovation] = useState("Եվրոնորոգում");
  const [securitySystem, setSecuritySystem] = useState("Ազդանշանային + Տեսահսկում");
  const [isMortgage, setIsMortgage] = useState(false);
  const [mortgageBank, setMortgageBank] = useState("Ամերիաբանկ");

  // Health fields
  const [healthProgram, setHealthProgram] = useState("Ընտանեկան փաթեթ");
  const [insuredCount, setInsuredCount] = useState<number>(2);
  const [eldestAge, setEldestAge] = useState<number>(34);
  const [healthLimitAMD, setHealthLimitAMD] = useState<number>(5000000);
  const [includeDental, setIncludeDental] = useState(true);

  // Travel fields
  const [travelDestination, setTravelDestination] = useState("Շենգենյան գոտի (Եվրոպա)");
  const [tripDays, setTripDays] = useState<number>(14);
  const [travelPurpose, setTravelPurpose] = useState("Զբոսաշրջություն և հանգիստ");
  const [medicalCoverageEur, setMedicalCoverageEur] = useState<number>(30000);
  const [includeLuggage, setIncludeLuggage] = useState(true);

  // Cargo fields
  const [cargoType, setCargoType] = useState("Սարքավորումներ և էլեկտրոնիկա");
  const [transportMode, setTransportMode] = useState("Ավտոմոբիլային բեռնափոխադրում");
  const [cargoRoute, setCargoRoute] = useState("Գերմանիա - Հայաստան (Երևան)");
  const [cargoValueUSD, setCargoValueUSD] = useState<number>(35000);

  // Liability fields
  const [liabilityActivity, setLiabilityActivity] = useState("Կոմերցիոն տարածք / Գրասենյակ (TPL)");
  const [liabilityLimitAMD, setLiabilityLimitAMD] = useState<number>(10000000);

  useEffect(() => {
    if (initialProductType) {
      setProductType(initialProductType);
    }
  }, [initialProductType]);

  // Handle phone input formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatArmenianPhone(e.target.value);
    setPhone(formatted);
  };

  // Live estimate calculation
  const estimatedSummary = useMemo(() => {
    if (productType === "casco") {
      const sumUsd = currency === "USD" ? estimatedValueUSD : estimatedValueAMD / 388.5;
      const rate = year >= 2020 ? 2.2 : year >= 2015 ? 2.6 : 3.0;
      const premUsd = Math.round(sumUsd * (rate / 100));
      const premAmd = Math.round(premUsd * 388.5);
      return {
        sumFormatted: currency === "USD" ? `$${estimatedValueUSD.toLocaleString()}` : `${estimatedValueAMD.toLocaleString()} ֏`,
        indicativeRate: `${rate}%`,
        indicativePremium: `${premAmd.toLocaleString()} ֏ (~$${premUsd.toLocaleString()})`,
        summaryText: `${makeModel} (${year}թ.), Ղեկը՝ ${steeringWheel}, ${vehicleUsage}`,
      };
    } else if (productType === "property") {
      const rate = renovation === "Լյուքս / Դիզայներական" ? 0.14 : renovation === "Եվրոնորոգում" ? 0.12 : 0.10;
      const premAmd = Math.round(propertyValueAMD * (rate / 100));
      return {
        sumFormatted: `${propertyValueAMD.toLocaleString()} ֏`,
        indicativeRate: `${rate}%`,
        indicativePremium: `${premAmd.toLocaleString()} ֏ / տարի`,
        summaryText: `${propertyType}, ${propertyArea} քմ, ${propertyDistrict}, ${renovation}`,
      };
    } else if (productType === "health") {
      const basePerPerson = 120000;
      const premAmd = basePerPerson * insuredCount + (includeDental ? insuredCount * 25000 : 0);
      return {
        sumFormatted: `${(healthLimitAMD * insuredCount).toLocaleString()} ֏ (Լիմիտ)`,
        indicativeRate: "Ֆիքսված փաթեթ",
        indicativePremium: `${premAmd.toLocaleString()} ֏ / տարի`,
        summaryText: `${healthProgram}, ${insuredCount} անձ, Ավագ անձ՝ ${eldestAge} տ․, Ատամնաբուժություն՝ ${includeDental ? "Այո" : "Ոչ"}`,
      };
    } else if (productType === "travel") {
      const dayRate = 450;
      const premAmd = Math.round(tripDays * dayRate + (includeLuggage ? 2500 : 0));
      return {
        sumFormatted: `€${medicalCoverageEur.toLocaleString()}`,
        indicativeRate: "Օրական սակագին",
        indicativePremium: `${premAmd.toLocaleString()} ֏`,
        summaryText: `${travelDestination}, ${tripDays} օր, ${travelPurpose}`,
      };
    } else if (productType === "cargo") {
      const rate = 0.35;
      const premUsd = Math.round(cargoValueUSD * (rate / 100));
      const premAmd = Math.round(premUsd * 388.5);
      return {
        sumFormatted: `$${cargoValueUSD.toLocaleString()}`,
        indicativeRate: `${rate}%`,
        indicativePremium: `${premAmd.toLocaleString()} ֏ (~$${premUsd.toLocaleString()})`,
        summaryText: `${cargoType}, Երթուղի՝ ${cargoRoute}, ${transportMode}`,
      };
    } else {
      const rate = 0.25;
      const premAmd = Math.round(liabilityLimitAMD * (rate / 100));
      return {
        sumFormatted: `${liabilityLimitAMD.toLocaleString()} ֏`,
        indicativeRate: `${rate}%`,
        indicativePremium: `${premAmd.toLocaleString()} ֏`,
        summaryText: `${liabilityActivity}, Պատասխանատվության լիմիտ՝ ${liabilityLimitAMD.toLocaleString()} ֏`,
      };
    }
  }, [
    productType,
    currency,
    estimatedValueUSD,
    estimatedValueAMD,
    year,
    makeModel,
    steeringWheel,
    vehicleUsage,
    renovation,
    propertyValueAMD,
    propertyType,
    propertyArea,
    propertyDistrict,
    healthProgram,
    insuredCount,
    eldestAge,
    healthLimitAMD,
    includeDental,
    travelDestination,
    tripDays,
    travelPurpose,
    medicalCoverageEur,
    includeLuggage,
    cargoType,
    cargoRoute,
    transportMode,
    cargoValueUSD,
    liabilityActivity,
    liabilityLimitAMD,
  ]);

  // Validation rules
  const nameError = touched.clientName && !isValidName(clientName) ? "Խնդրում ենք լրացնել Անուն Ազգանուն (առնվազն 2 բառ կամ ընկերության անվանում)" : null;
  const phoneError = touched.phone && !isValidPhone(phone) ? "Մուտքագրեք վավեր հեռախոսահամար (+374 XX XX-XX-XX)" : null;
  const emailError = touched.email && !isValidEmail(email) ? "Մուտքագրեք ճիշտ էլ․ փոստի ձևաչափ (օր․՝ name@domain.com)" : null;

  const isFormValid = isValidName(clientName) && isValidPhone(phone) && isValidEmail(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ clientName: true, phone: true, email: true });

    if (!isValidName(clientName)) {
      setError("Խնդրում ենք լրացնել Ձեր Անուն Ազգանունը (կամ ընկերության անվանումը)։");
      return;
    }

    if (!isValidPhone(phone)) {
      setError("Խնդրում ենք մուտքագրել վավեր գործող հեռախոսահամար (+374 XX XX-XX-XX)։");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Խնդրում ենք մուտքագրել ճիշտ էլ․ փոստի հասցե կամ դաշտը թողնել դատարկ։");
      return;
    }

    setLoading(true);
    setError(null);

    const ref = `EXP-${Date.now().toString().slice(-6)}`;
    setReferenceId(ref);

    try {
      let objectSummary = estimatedSummary.summaryText;
      let estPremium = 0;
      const numMatch = estimatedSummary.indicativePremium.match(/[\d,]+/);
      if (numMatch) {
        estPremium = Number(numMatch[0].replace(/,/g, ""));
      }

      await addClientRenewal({
        clientName: clientName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        productType: (productType === "cargo" || productType === "liability" ? "property" : productType) as any,
        policyNumber: ref,
        expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
        estimatedPremium: estPremium,
        status: "pending",
        lastContactedDate: new Date().toISOString().split("T")[0],
        notes: `✨ [Արագ Հայտ] Տեսակ՝ ${productType.toUpperCase()} | ${objectSummary} | Գումար՝ ${estimatedSummary.sumFormatted}`,
        vehicleOrPropertyDetails: `${productType.toUpperCase()}: ${objectSummary}`,
      });

      setSubmitted(true);
    } catch (err: any) {
      setError("Չհաջողվեց ուղարկել հայտը։ Խնդրում ենք փորձել նորից կամ զանգահարել +374 (10) 58-00-00:");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#061A40] to-slate-900 text-slate-800 p-4 sm:p-8 flex flex-col items-center justify-center relative">
      {onCloseExpressMode && (
        <button
          type="button"
          onClick={onCloseExpressMode}
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer backdrop-blur-md border border-white/20 shadow-lg z-10"
        >
          ← Վերադառնալ Գործակալի Պորտալ
        </button>
      )}

      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-6 animate-fadeIn">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-[#061A40] via-[#092B6B] to-[#0A4EA3] p-6 sm:p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <img src={horizontalLogo} alt="SIL Insurance" className="h-10 mx-auto mb-3 object-contain brightness-0 invert" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-cyan-200 text-xs font-bold mb-2 border border-white/15 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Պաշտոնական Ապահովագրական Արագ Հայտ</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» Գնառաջարկի Հայտ</h1>
          <p className="text-xs text-blue-100 mt-1.5 max-w-md mx-auto leading-relaxed">
            Լրացրեք տվյալները 1 րոպեում, և մեր ապահովագրական մասնագետը Ձեզ կուղարկի պաշտոնական հաշվարկված գնառաջարկը։
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* 1. Product Selection Tabs */}
            <div>
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider block mb-2.5 flex items-center justify-between">
                <span>1. Ընտրեք Ապահովագրատեսակը *</span>
                <span className="text-[11px] font-normal text-blue-600">6 Հիմնական ուղղություններ</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "casco", label: "ԿԱՍԿՈ Ավտո", icon: Car },
                  { id: "property", label: "Անշարժ Գույք", icon: Home },
                  { id: "health", label: "Առողջություն", icon: HeartPulse },
                  { id: "travel", label: "Ճամփորդություն", icon: Plane },
                  { id: "cargo", label: "Բեռներ", icon: Package },
                  { id: "liability", label: "Պատասխանատվություն", icon: Briefcase },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = productType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setProductType(item.id)}
                      className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#061A40] text-white border-[#061A40] shadow-md font-bold scale-[1.02]"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? "text-cyan-300" : "text-slate-500"}`} />
                      <span className="text-xs font-extrabold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Dynamic Product Questionnaire */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>
                    2. {productType === "casco"
                      ? "Ավտոմեքենայի Տվյալներ և Պայմաններ"
                      : productType === "property"
                      ? "Գույքի Տվյալներ և Բնութագիր"
                      : productType === "health"
                      ? "Առողջապահական Տվյալներ"
                      : productType === "travel"
                      ? "Ճանապարհորդության Տվյալներ"
                      : productType === "cargo"
                      ? "Բեռի Տվյալներ և Երթուղի"
                      : "Պատասխանատվության Տվյալներ"}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  Պարտադիր
                </span>
              </div>

              {/* CASCO Form Fields */}
              {productType === "casco" && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Տრանսպորտի Տեսակ</label>
                      <select
                        className="sil-input"
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                      >
                        <option value="Մարդատար սեդան">Մարդատար սեդան / Հեչբեք</option>
                        <option value="Ամենագնաց (SUV / Crossover)">Ամենագնաց (SUV / Crossover)</option>
                        <option value="Էլեկտրոմոբիլ (EV)">Էլեկտրոմոբիլ (EV / Hybrid)</option>
                        <option value="Կոմերցիոն / Բեռնատար">Կոմերցիոն / Բեռնատար</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Թողարկման Տարեթիվ *</label>
                      <select
                        className="sil-input font-bold"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                      >
                        {Array.from({ length: 25 }, (_, i) => 2026 - i).map((y) => (
                          <option key={y} value={y}>{y} թ.</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Մակնիշ և Մոդել *</label>
                    <input
                      type="text"
                      list="car-suggestions"
                      className="sil-input font-bold text-slate-900"
                      placeholder="Օր․՝ Toyota Camry 2.5 կամ Mercedes-Benz E350"
                      value={makeModel}
                      onChange={(e) => setMakeModel(e.target.value)}
                      required
                    />
                    <datalist id="car-suggestions">
                      {POPULAR_CARS.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">Շուկայական Արժեք *</label>
                        <div className="flex gap-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setCurrency("USD")}
                            className={`px-1.5 py-0.5 rounded font-bold ${currency === "USD" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"}`}
                          >
                            $ USD
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrency("AMD")}
                            className={`px-1.5 py-0.5 rounded font-bold ${currency === "AMD" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"}`}
                          >
                            ֏ AMD
                          </button>
                        </div>
                      </div>
                      {currency === "USD" ? (
                        <input
                          type="number"
                          min="1000"
                          max="500000"
                          step="500"
                          className="sil-input font-black text-slate-900"
                          value={estimatedValueUSD}
                          onChange={(e) => setEstimatedValueUSD(Math.max(1000, Number(e.target.value)))}
                        />
                      ) : (
                        <input
                          type="number"
                          min="400000"
                          max="200000000"
                          step="100000"
                          className="sil-input font-black text-slate-900"
                          value={estimatedValueAMD}
                          onChange={(e) => setEstimatedValueAMD(Math.max(400000, Number(e.target.value)))}
                        />
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Ղեկի Տեղակայում</label>
                      <select
                        className="sil-input"
                        value={steeringWheel}
                        onChange={(e) => setSteeringWheel(e.target.value)}
                      >
                        <option value="Ձախակողմյան">Ձախակողմյան (ստանդարտ)</option>
                        <option value="Աջակողմյան">Աջակողմյան (Right Hand)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Շահագործման Նպատակ</label>
                      <select
                        className="sil-input"
                        value={vehicleUsage}
                        onChange={(e) => setVehicleUsage(e.target.value)}
                      >
                        <option value="Անձնական / Ընտանեկան">Անձնական / Ընտանեկան</option>
                        <option value="Ծառայողական / Բիզնես">Ծառայողական / Բիզնես</option>
                        <option value="Վարձույթ / Տաքսի">Վարձույթ / Տաքսի</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Վարորդական Ստաժ</label>
                      <select
                        className="sil-input"
                        value={driverExperience}
                        onChange={(e) => setDriverExperience(e.target.value)}
                      >
                        <option value="3+ տարի (տարիք՝ 23+)">3+ տարի (տարիք՝ 23+)</option>
                        <option value="1-3 տարի">1-3 տարի (երիտասարդ վարորդ)</option>
                        <option value="Անսահմանափակ վարորդներ">Անսահմանափակ վարորդներ</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isBankPledge}
                        onChange={(e) => setIsBankPledge(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Ավտոմեքենան գրավադրված է բանկում (ավտովարկ/լիզինգ)</span>
                    </label>
                    {isBankPledge && (
                      <div className="mt-2 pl-6">
                        <input
                          type="text"
                          className="sil-input text-xs"
                          placeholder="Նշեք բանկի անվանումը (օր․՝ Ամերիաբանկ, Ինեկոբանկ...)"
                          value={pledgeBank}
                          onChange={(e) => setPledgeBank(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Property Form Fields */}
              {productType === "property" && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Գույքի Տեսակ *</label>
                      <select
                        className="sil-input font-bold"
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                      >
                        <option value="Բնակարան նորակառույցում">Բնակարան նորակառույցում</option>
                        <option value="Բնակարան երկրորդային շուկայում">Բնակարան երկրորդային շուկայում</option>
                        <option value="Առանձնատուն / Քոթեջ">Առանձնատուն / Քոթեջ</option>
                        <option value="Կոմերցիոն տարածք / Գրասենյակ">Կոմերցիոն տարածք / Գրասենյակ</option>
                        <option value="Արտադրական / Պահեստ">Արտադրական / Պահեստ</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Տարածաշրջան / Շրջան *</label>
                      <select
                        className="sil-input font-bold"
                        value={propertyDistrict}
                        onChange={(e) => setPropertyDistrict(e.target.value)}
                      >
                        {YEREVAN_DISTRICTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Ճշգրիտ Հասցե կամ Փողոց</label>
                    <input
                      type="text"
                      className="sil-input"
                      placeholder="Օր․՝ Ամիրյան 4/2, բն․ 45"
                      value={propertyAddress}
                      onChange={(e) => setPropertyAddress(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Մակերես (քմ) *</label>
                      <input
                        type="number"
                        min="15"
                        max="20000"
                        className="sil-input font-bold text-slate-900"
                        value={propertyArea}
                        onChange={(e) => setPropertyArea(Math.max(10, Number(e.target.value)))}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Վերանորոգում</label>
                      <select
                        className="sil-input font-bold"
                        value={renovation}
                        onChange={(e) => setRenovation(e.target.value)}
                      >
                        <option value="Եվրոնորոգում">Եվրոնորոգում</option>
                        <option value="Լյուքս / Դիզայներական">Լյուքս / Դիզայներական</option>
                        <option value="Կոսմետիկ (ստանդարտ)">Կոսմետիկ (ստանդարտ)</option>
                        <option value="Զրոյական (սև գործ)">Զրոյական (սև գործ)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Գույքի Արժեք (֏ AMD) *</label>
                      <input
                        type="number"
                        min="2000000"
                        max="2000000000"
                        step="500000"
                        className="sil-input font-black text-slate-900"
                        value={propertyValueAMD}
                        onChange={(e) => setPropertyValueAMD(Math.max(1000000, Number(e.target.value)))}
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isMortgage}
                        onChange={(e) => setIsMortgage(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Գույքը գրավադրված է հիփոթեքային բանկում</span>
                    </label>
                    {isMortgage && (
                      <div className="mt-2 pl-6">
                        <input
                          type="text"
                          className="sil-input text-xs"
                          placeholder="Նշեք գրավառու բանկի անվանումը (օր․՝ Ամերիաբանկ, Ինեկոբանկ...)"
                          value={mortgageBank}
                          onChange={(e) => setMortgageBank(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Health Form Fields */}
              {productType === "health" && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Ապահովագրության Ծրագիր</label>
                      <select
                        className="sil-input font-bold"
                        value={healthProgram}
                        onChange={(e) => setHealthProgram(e.target.value)}
                      >
                        <option value="Անհատական ծրագիր">Անհատական ծրագիր</option>
                        <option value="Ընտանեկան փաթեթ">Ընտանեկան փաթեթ (զեղչված)</option>
                        <option value="Կորպորատիվ խումբ">Կորպորատիվ խումբ</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Անձանց Քանակ *</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        className="sil-input font-bold"
                        value={insuredCount}
                        onChange={(e) => setInsuredCount(Math.max(1, Number(e.target.value)))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Ամենաավագ անձի տարիքը *</label>
                      <input
                        type="number"
                        min="1"
                        max="75"
                        className="sil-input font-bold"
                        value={eldestAge}
                        onChange={(e) => setEldestAge(Math.min(75, Math.max(1, Number(e.target.value))))}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Տարեկան Լիմիտ 1 անձի համար</label>
                      <select
                        className="sil-input font-bold"
                        value={healthLimitAMD}
                        onChange={(e) => setHealthLimitAMD(Number(e.target.value))}
                      >
                        <option value="3000000">3,000,000 ֏ (Ստանդարտ)</option>
                        <option value="5000000">5,000,000 ֏ (Օպտիմալ)</option>
                        <option value="10000000">10,000,000 ֏ (Պրեմիում)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeDental}
                        onChange={(e) => setIncludeDental(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Ներառել ատամնաբուժական ծածկույթ (թերապիա և պրոֆիլակտիկա)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Travel Form Fields */}
              {productType === "travel" && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Ուղղություն / Երկիր *</label>
                      <select
                        className="sil-input font-bold"
                        value={travelDestination}
                        onChange={(e) => setTravelDestination(e.target.value)}
                      >
                        <option value="Շենգենյան գոտի (Եվրոպա)">Շենգենյան գոտի (Եվրոպա)</option>
                        <option value="ԱՄՆ / Կանադա / Ճապոնիա">ԱՄՆ / Կանադա / Ճապոնիա</option>
                        <option value="Ամբողջ աշխարհ (Worldwide)">Ամբողջ աշխարհ (Worldwide)</option>
                        <option value="ԱՊՀ / Վրաստան">ԱՊՀ / Վրաստան</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Տևողություն (Օրեր) *</label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        className="sil-input font-bold"
                        value={tripDays}
                        onChange={(e) => setTripDays(Math.max(1, Number(e.target.value)))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Ճանապարհորդության Նպատակ</label>
                      <select
                        className="sil-input"
                        value={travelPurpose}
                        onChange={(e) => setTravelPurpose(e.target.value)}
                      >
                        <option value="Զբոսաշրջություն և հանգիստ">Զբոսաշրջություն և հանգիստ</option>
                        <option value="Գործուղում / Բիզնես">Գործուղում / Բիզնես</option>
                        <option value="Ուսում / Կրթություն">Ուսում / Կրթություն</option>
                        <option value="Սպորտ / Էքստրիմ">Սպորտ / Էքստրիմ</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Բժշկական Ծածկույթ</label>
                      <select
                        className="sil-input font-bold"
                        value={medicalCoverageEur}
                        onChange={(e) => setMedicalCoverageEur(Number(e.target.value))}
                      >
                        <option value="30000">€30,000 (Շենգեն վիզայի ստանդարտ)</option>
                        <option value="50000">€50,000 (Լայնացված)</option>
                        <option value="100000">€100,000 (VIP / Մաքսիմալ)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeLuggage}
                        onChange={(e) => setIncludeLuggage(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Ներառել ուղեբեռի կորստի և թռիչքի ուշացման ծածկույթ</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Cargo Form Fields */}
              {productType === "cargo" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Բեռի Տեսակ և Բնույթ *</label>
                    <input
                      type="text"
                      className="sil-input font-bold"
                      placeholder="Օր․՝ Բժշկական սարքավորումներ, Շինանյութ..."
                      value={cargoType}
                      onChange={(e) => setCargoType(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Տրանսպորտի Տեսակ</label>
                      <select
                        className="sil-input font-bold"
                        value={transportMode}
                        onChange={(e) => setTransportMode(e.target.value)}
                      >
                        <option value="Ավտոմոբիլային բեռնափոխադրում">Ավտոմոբիլային բեռնափոխադրում</option>
                        <option value="Ավիացիոն բեռնափոխադրում">Ավիացիոն բեռնափոխադրում</option>
                        <option value="Մուլտիմոդալ (Ծովային + Ցամաքային)">Մուլտիմոդալ (Ծովային + Ցամաքային)</option>
                        <option value="Երկաթուղային">Երկաթուղային</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Բեռի Ինվոյսային Արժեք ($ USD) *</label>
                      <input
                        type="number"
                        min="1000"
                        step="1000"
                        className="sil-input font-black text-slate-900"
                        value={cargoValueUSD}
                        onChange={(e) => setCargoValueUSD(Math.max(500, Number(e.target.value)))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Երթուղի (Ելք - Նշանակում) *</label>
                    <input
                      type="text"
                      className="sil-input"
                      placeholder="Օր․՝ Չինաստան (Շանհայ) - Վրաստան (Փոթի) - Երևան"
                      value={cargoRoute}
                      onChange={(e) => setCargoRoute(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Liability Form Fields */}
              {productType === "liability" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Գործունեության Ոլորտ / Տեսակ *</label>
                    <select
                      className="sil-input font-bold"
                      value={liabilityActivity}
                      onChange={(e) => setLiabilityActivity(e.target.value)}
                    >
                      <option value="Կոմերցիոն տարածք / Գրասենյակ (TPL)">Կոմերցիոն տարածք / Գրասենյակ (TPL)</option>
                      <option value="Շինարարական և մոնտաժային աշխատանքներ (CAR/EAR)">Շինարարական և մոնտաժային (CAR/EAR)</option>
                      <option value="Հանրային սնունդ / Ռեստորան / Հյուրանոց">Հանրային սնունդ / Ռեստորան / Հյուրանոց</option>
                      <option value="Մասնագիտական պատասխանատվություն (Բժիշկ, Աուդիտ, Իրավաբան)">Մասնագիտական պատասխանատվություն</option>
                      <option value="Արտադրական ձեռնարկություն">Արտադրական ձեռնարկություն</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Պահանջվող Լիմիտ (֏ AMD) *</label>
                    <select
                      className="sil-input font-black text-slate-900"
                      value={liabilityLimitAMD}
                      onChange={(e) => setLiabilityLimitAMD(Number(e.target.value))}
                    >
                      <option value="5000000">5,000,000 ֏</option>
                      <option value="10000000">10,000,000 ֏</option>
                      <option value="25000000">25,000,000 ֏</option>
                      <option value="50000000">50,000,000 ֏</option>
                      <option value="100000000">100,000,000 ֏</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Live Indicative Estimate Card */}
            <div className="bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-slate-100 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#003399] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-[#0066FF]" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Նախնական Հաշվարկ (Մոտավոր)</div>
                  <div className="text-xs text-slate-600">Ապահովագրական գումար՝ <strong>{estimatedSummary.sumFormatted}</strong></div>
                </div>
              </div>

              <div className="text-right self-end sm:self-center">
                <div className="text-[11px] text-slate-500 font-medium">Կանխատեսվող վճար</div>
                <div className="text-base font-black text-blue-900">{estimatedSummary.indicativePremium}</div>
              </div>
            </div>

            {/* 3. Client Personal Contact Info with Strict Validation */}
            <div className="space-y-4 pt-1">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                3. Ձեր Կոնտակտային Տվյալները *
              </label>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Անուն Ազգանուն կամ Ընկերության Անվանում *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    className={`sil-input pl-9 font-bold ${nameError ? "border-red-400 bg-red-50/40 focus:border-red-500" : ""}`}
                    placeholder="Օր․՝ Արմեն Գրիգորյան կամ «Ալֆա Թրեյդ» ՍՊԸ"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, clientName: true }))}
                  />
                </div>
                {nameError && (
                  <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {nameError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Հեռախոսահամար *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      required
                      className={`sil-input pl-9 font-bold ${phoneError ? "border-red-400 bg-red-50/40 focus:border-red-500" : ""}`}
                      placeholder="+374 (91) 00-00-00"
                      value={phone}
                      onChange={handlePhoneChange}
                      onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                    />
                  </div>
                  {phoneError && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {phoneError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Էլ․ Փոստ (կամավոր)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      className={`sil-input pl-9 ${emailError ? "border-red-400 bg-red-50/40" : ""}`}
                      placeholder="client@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                    />
                  </div>
                  {emailError && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {emailError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              <span>{loading ? "Ուղարկվում է..." : "Ուղարկել Գործակալին (Ստանալ Գնառաջարկ)"}</span>
            </button>

            <div className="text-center">
              <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> Ձեր տվյալները պաշտպանված են «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ գաղտնիության քաղաքականությամբ
              </span>
            </div>
          </form>
        ) : (
          <div className="p-8 sm:p-12 text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-extrabold">
                Հայտի Կոդ՝ {referenceId}
              </span>
              <h2 className="text-2xl font-black text-slate-900 pt-2">Շնորհակալություն, {clientName}։</h2>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Ձեր հայտը հաջողությամբ գրանցվեց համակարգում։ «ՍԻԼ ԻՆՇՈՒՐԱՆՍ»-ի անդեռռայթինգի մասնագետը ուսումնասիրելու է Ձեր տվյալները և կարճ ժամանակում կապ կհաստատի <strong>{phone}</strong> հեռախոսահամարով՝ պատրաստի պաշտոնական գնառաջարկով։
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left max-w-md mx-auto text-xs space-y-1.5">
              <div className="text-slate-500 font-bold">Հայտի ամփոփագիր՝</div>
              <div className="text-slate-800 font-semibold">• Տեսակ՝ <strong>{productType.toUpperCase()}</strong></div>
              <div className="text-slate-800 font-semibold">• Օբյեկտ՝ {estimatedSummary.summaryText}</div>
              <div className="text-slate-800 font-semibold">• Նախնական գումար՝ {estimatedSummary.sumFormatted}</div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setClientName("");
                  setPhone("+374");
                  setEmail("");
                  setTouched({});
                }}
                className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
              >
                Լրացնել նոր հայտ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
