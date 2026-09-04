import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  XCircle,
  Zap,
  ArrowRight,
  ArrowLeft,
  Lock,
  User,
  Building,
  Shield,
  FileText,
  AlertTriangle,
  RotateCcw,
  Check,
  Edit3,
  X,
  Scan,
  Camera,
} from "lucide-react";
import { InsuranceProductType } from "../../types";
import { QuoteInput } from "../../data/quotationRules";
import { getQuotationRules } from "../../utils/rulesStore";
import { evaluateQuoteInput } from "../../utils/quotationEngine";
import { formatCurrency } from "../../utils/insuranceCalculator";
import { CascoCalculator } from "./CascoCalculator";
import { BundleCrossSellCalculator } from "./BundleCrossSellCalculator";
import { ListAmPropertyValuationCalculator } from "../Property/ListAmPropertyValuationCalculator";
import { ProductSpecificStep2Form } from "./ProductForms";
import { AiDocumentScanner } from "../AiDocumentScanner";

interface Props {
  initialProduct?: InsuranceProductType | null;
  onGenerateQuotation: (proposal: NonNullable<ReturnType<typeof evaluateQuoteInput>["proposal"]>) => void;
}

export function QuickQuoteView({ onGenerateQuotation, initialProduct }: Props) {
  const [mode, setMode] = useState<"generic" | "casco" | "bundle">(
    initialProduct === "casco" ? "casco" : initialProduct === "bundle" ? "bundle" : "generic"
  );

  if (mode === "casco") {
    return (
      <CascoCalculator
        onGenerateQuotation={onGenerateQuotation}
        onBackToGeneric={() => setMode("generic")}
      />
    );
  }

  if (mode === "bundle") {
    return (
      <BundleCrossSellCalculator
        onGenerateQuotation={onGenerateQuotation}
        onBackToSingle={() => setMode("generic")}
      />
    );
  }

  return (
    <GenericQuickQuoteView
      onGenerateQuotation={onGenerateQuotation}
      onChooseCasco={() => setMode("casco")}
      onChooseBundle={() => setMode("bundle")}
      initialProduct={initialProduct}
    />
  );
}

function GenericQuickQuoteView({
  onGenerateQuotation,
  onChooseCasco,
  onChooseBundle,
  initialProduct,
}: Props & { onChooseCasco: () => void; onChooseBundle: () => void }) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [propertyValuationOpen, setPropertyValuationOpen] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);

  const [input, setInput] = useState<QuoteInput>({
    clientName: "",
    phone: "",
    product: initialProduct && initialProduct !== "casco" ? initialProduct : "property",
    currency: "AMD",
    insuredAmount: 0,
    businessActivity: "",
    objectDescription: "",
    selectedRisks:
      initialProduct && initialProduct !== "casco"
        ? [...getQuotationRules()[initialProduct].requiredRisks]
        : [...getQuotationRules().property.requiredRisks],
    franchisePercent:
      initialProduct && initialProduct !== "casco"
        ? getQuotationRules()[initialProduct].defaultFranchise
        : getQuotationRules().property.defaultFranchise,
    previousLosses: false,
    customTariff:
      initialProduct && initialProduct !== "casco"
        ? getQuotationRules()[initialProduct].defaultTariff
        : getQuotationRules().property.defaultTariff,
    productDetails: {},
  });

  const [saved, setSaved] = useState(false);
  const [rulesVersion, setRulesVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setRulesVersion((v) => v + 1);
    window.addEventListener("sil_rules_updated", refresh);
    return () => window.removeEventListener("sil_rules_updated", refresh);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sil-quick-quote-draft");
      if (raw) {
        const draft = JSON.parse(raw) as Partial<QuoteInput>;
        const draftProduct = draft.product;
        if (!initialProduct || initialProduct === draftProduct || (!initialProduct && !draftProduct)) {
          setInput((current) => ({ ...current, ...draft }));
        }
      }
    } catch {
      /* ignore malformed drafts */
    }
  }, []);

  const rules = getQuotationRules();
  void rulesVersion;
  const products = Object.values(rules) as (typeof rules)[InsuranceProductType][];
  const rule = rules[input.product] || rules.property;

  const result = useMemo(() => evaluateQuoteInput(input), [input, rulesVersion]);

  const saveDraft = () => {
    localStorage.setItem("sil-quick-quote-draft", JSON.stringify(input));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const resetForm = () => {
    localStorage.removeItem("sil-quick-quote-draft");
    setInput({
      clientName: "",
      phone: "",
      product: "property",
      currency: "AMD",
      insuredAmount: 0,
      businessActivity: "",
      objectDescription: "",
      selectedRisks: [...getQuotationRules().property.requiredRisks],
      franchisePercent: getQuotationRules().property.defaultFranchise,
      previousLosses: false,
      customTariff: getQuotationRules().property.defaultTariff,
      productDetails: {},
    });
    setCurrentStep(1);
    setAttemptedNext(false);
    setStepErrors([]);
  };

  const set = <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
    setStepErrors([]);
  };

  const updateProductDetail = (key: string, value: any) => {
    setInput((current) => ({
      ...current,
      productDetails: { ...(current.productDetails || {}), [key]: value },
    }));
    setStepErrors([]);
  };

  const toggleRisk = (risk: string) => {
    set(
      "selectedRisks",
      input.selectedRisks.includes(risk)
        ? input.selectedRisks.filter((item) => item !== risk)
        : [...input.selectedRisks, risk]
    );
  };

  // Step 1 Validation
  const validateStep1 = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (!input.clientName.trim() || input.clientName.trim().length < 2) {
      errors.push("Լրացրեք ապահովադրի անունը կամ ընկերության անվանումը (առնվազն 2 նիշ)։");
    }
    if (!input.phone.trim() || input.phone.trim().length < 5) {
      errors.push("Լրացրեք կոնտակտային հեռախոսահամարը։");
    }
    if (!input.product) {
      errors.push("Ընտրեք ապահովագրատեսակը։");
    }
    return { valid: errors.length === 0, errors };
  };

  // Step 2 Validation - Tailored specifically per insurance product
  const validateStep2 = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const details = input.productDetails || {};

    switch (input.product) {
      case "travel":
        if (!details.destination) {
          errors.push("Ընտրեք ճանապարհորդության ուղղությունը / գոտին։");
        }
        if (!details.tripDays || Number(details.tripDays) < 1) {
          errors.push("Մուտքագրեք ճանապարհորդության տևողությունը (առնվազն 1 օր)։");
        }
        if (!details.travelerCount || Number(details.travelerCount) < 1) {
          errors.push("Մուտքագրեք ճամփորդների քանակը (առնվազն 1 անձ)։");
        }
        if (!input.insuredAmount || input.insuredAmount <= 0) {
          errors.push("Ապահովագրական գումարը հաշվարկված չէ։");
        }
        break;

      case "health":
        if (!details.insuredCount || Number(details.insuredCount) < 1) {
          errors.push("Մուտքագրեք ապահովագրվող աշխատակիցների/անձանց քանակը։");
        }
        if (!details.planLevel) {
          errors.push("Ընտրեք առողջության ապահովագրության ծրագրի մակարդակը։");
        }
        if (!details.limitPerPerson || Number(details.limitPerPerson) <= 0) {
          errors.push("Ընտրեք 1 անձի տարեկան ծածկույթի լիմիտը։");
        }
        if (!input.insuredAmount || input.insuredAmount <= 0) {
          errors.push("Ապահովագրական գումարը պետք է լինի 0-ից մեծ։");
        }
        break;

      case "cargo":
        if (!details.cargoType) {
          errors.push("Ընտրեք փոխադրվող բեռի տեսակը։");
        }
        if ((!details.cargoValue || Number(details.cargoValue) <= 0) && (!input.insuredAmount || input.insuredAmount <= 0)) {
          errors.push("Մուտքագրեք բեռի ապահովագրական արժեքը։");
        }
        if (!details.origin || details.origin.trim().length < 2) {
          errors.push("Լրացրեք բեռնափոխադրման մեկնման վայրը (երկիր/քաղաք)։");
        }
        if (!details.destination || details.destination.trim().length < 2) {
          errors.push("Լրացրեք բեռնափոխադրման ժամանման վայրը (երկիր/քաղաք)։");
        }
        if (!details.transportMode) {
          errors.push("Ընտրեք փոխադրամիջոցի / տրանսպորտի տեսակը։");
        }
        break;

      case "construction":
        if (!details.projectName || details.projectName.trim().length < 2) {
          errors.push("Լրացրեք շինարարական նախագծի անվանումը։");
        }
        if (!details.projectAddress || details.projectAddress.trim().length < 2) {
          errors.push("Լրացրեք շինհրապարակի հասցեն։");
        }
        if ((!details.contractValue || Number(details.contractValue) <= 0) && (!input.insuredAmount || input.insuredAmount <= 0)) {
          errors.push("Մուտքագրեք շինարարության պայմանագրային արժեքը։");
        }
        if (!details.durationMonths || Number(details.durationMonths) < 1) {
          errors.push("Մուտքագրեք շինարարության տևողությունը (ամիսներ)։");
        }
        break;

      case "liability":
        if (!details.businessField || details.businessField.trim().length < 2) {
          errors.push("Լրացրեք գործունեության ոլորտը կամ մասնագիտությունը։");
        }
        if ((!details.limitOfIndemnity || Number(details.limitOfIndemnity) <= 0) && (!input.insuredAmount || input.insuredAmount <= 0)) {
          errors.push("Մուտքագրեք պատասխանատվության սահմանաչափը (լիմիտը)։");
        }
        if (!details.liabilityType) {
          errors.push("Ընտրեք պատասխանատվության ապահովագրության տեսակը։");
        }
        break;

      case "accident":
        if (!details.numberOfPersons || Number(details.numberOfPersons) < 1) {
          errors.push("Մուտքագրեք ապահովագրվողների քանակը (առնվազն 1 անձ)։");
        }
        if ((!details.sumPerPerson || Number(details.sumPerPerson) <= 0) && (!input.insuredAmount || input.insuredAmount <= 0)) {
          errors.push("Մուտքագրեք 1 անձի ապահովագրական գումարը։");
        }
        if (!details.coverageType) {
          errors.push("Ընտրեք ծածկույթի ռեժիմը (24/7 կամ աշխատանքային)։");
        }
        break;

      case "agro":
        if (!details.cropType) {
          errors.push("Ընտրեք ապահովագրվող մշակաբույսը։");
        }
        if (!details.region) {
          errors.push("Ընտրեք մարզը / ռիսկի գոտին։");
        }
        if (!details.hectares || Number(details.hectares) <= 0) {
          errors.push("Մուտքագրեք մշակվող հողատարածքի մակերեսը (հա)։");
        }
        if (!input.insuredAmount || input.insuredAmount <= 0) {
          errors.push("Բերքի ապահովագրական արժեքը հաշվարկված չէ։");
        }
        break;

      case "financial":
        if (!details.bondType) {
          errors.push("Ընտրեք երաշխիքի / ֆինանսական ռիսկի տեսակը։");
        }
        if ((!details.bondAmount || Number(details.bondAmount) <= 0) && (!input.insuredAmount || input.insuredAmount <= 0)) {
          errors.push("Մուտքագրեք երաշխիքի գումարը։");
        }
        if (!details.durationMonths || Number(details.durationMonths) < 1) {
          errors.push("Մուտքագրեք գործողության ժամկետը (ամիսներ)։");
        }
        break;

      case "mortgage":
        if (!details.bankName || details.bankName.trim().length < 2) {
          errors.push("Լրացրեք գրավառու բանկի կամ վարկային կազմակերպության անվանումը։");
        }
        if ((!details.loanBalance || Number(details.loanBalance) <= 0) && (!input.insuredAmount || input.insuredAmount <= 0)) {
          errors.push("Մուտքագրեք հիփոթեքային վարկի մնացորդային գումարը։");
        }
        if (!details.program) {
          errors.push("Ընտրեք հիփոթեքային ծրագիրը (ԱՀԸ, ԲԵ կամ կոմերցիոն)։");
        }
        break;

      case "aviation":
        if (!details.aircraftModel || details.aircraftModel.trim().length < 2) {
          errors.push("Լրացրեք թռչող սարքի / դրոնի մոդելը։");
        }
        if ((!details.aircraftValue || Number(details.aircraftValue) <= 0) && (!input.insuredAmount || input.insuredAmount <= 0)) {
          errors.push("Մուտքագրեք ավիացիոն օբյեկտի ապահովագրական արժեքը։");
        }
        if (!details.aviationType) {
          errors.push("Ընտրեք ավիացիոն օբյեկտի տեսակը։");
        }
        break;

      case "bundle":
        if (!input.insuredAmount || input.insuredAmount <= 0) {
          errors.push("Լրացրեք համալիր փաթեթի բաղադրիչներից առնվազն մեկի գումարը։");
        }
        break;

      case "casco":
        if (!input.insuredAmount || input.insuredAmount <= 0) {
          errors.push("Մուտքագրեք ավտոմեքենայի շուկայական/ապահովագրական արժեքը։");
        }
        break;

      case "property":
      default:
        if (!input.insuredAmount || input.insuredAmount <= 0) {
          errors.push("Մուտքագրեք ապահովագրական գումարը (պետք է լինի 0-ից մեծ)։");
        }
        if (!input.objectDescription.trim() || input.objectDescription.trim().length < 3) {
          errors.push("Լրացրեք ապահովագրվող գույքի հասցեն կամ նկարագրությունը։");
        }
        if (!input.businessActivity.trim() || input.businessActivity.trim().length < 2) {
          errors.push("Նշեք գույքի օգտագործման կամ գործունեության տեսակը։");
        }
        break;
    }

    return { valid: errors.length === 0, errors };
  };

  // Step 3 Validation
  const validateStep3 = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (!input.selectedRisks || input.selectedRisks.length === 0) {
      errors.push("Ընտրեք առնվազն մեկ ապահովագրական ռիսկ։");
    }
    if (input.franchisePercent === undefined || input.franchisePercent < 0) {
      errors.push("Ֆրանշիզայի տոկոսը չի կարող լինել բացասական։");
    }
    const currentTariff = input.customTariff ?? rule.defaultTariff;
    if (currentTariff < rule.minTariff || currentTariff > rule.maxTariff) {
      errors.push(
        `Սակագինը պետք է լինի սահմանված միջակայքում (${rule.minTariff}% - ${rule.maxTariff}%)։`
      );
    }
    return { valid: errors.length === 0, errors };
  };

  const isStep1Complete = validateStep1().valid;
  const isStep2Complete = isStep1Complete && validateStep2().valid;
  const isStep3Complete = isStep2Complete && validateStep3().valid;

  const handleNextStep = () => {
    setAttemptedNext(true);
    if (currentStep === 1) {
      const v1 = validateStep1();
      if (!v1.valid) {
        setStepErrors(v1.errors);
        return;
      }
      setStepErrors([]);
      setAttemptedNext(false);
      setCurrentStep(2);
      saveDraft();
    } else if (currentStep === 2) {
      const v2 = validateStep2();
      if (!v2.valid) {
        setStepErrors(v2.errors);
        return;
      }
      setStepErrors([]);
      setAttemptedNext(false);
      setCurrentStep(3);
      saveDraft();
    } else if (currentStep === 3) {
      const v3 = validateStep3();
      if (!v3.valid) {
        setStepErrors(v3.errors);
        return;
      }
      setStepErrors([]);
      setAttemptedNext(false);
      setCurrentStep(4);
      saveDraft();
    }
  };

  const handlePrevStep = () => {
    setStepErrors([]);
    setAttemptedNext(false);
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep === currentStep) return;
    if (targetStep < currentStep) {
      // Allowed to go back anytime
      setStepErrors([]);
      setAttemptedNext(false);
      setCurrentStep(targetStep);
      return;
    }
    // Checking gating when jumping forward
    if (targetStep === 2) {
      const v1 = validateStep1();
      if (!v1.valid) {
        setAttemptedNext(true);
        setStepErrors(v1.errors);
        return;
      }
      setCurrentStep(2);
    } else if (targetStep === 3) {
      const v1 = validateStep1();
      const v2 = validateStep2();
      if (!v1.valid) {
        setAttemptedNext(true);
        setStepErrors(v1.errors);
        setCurrentStep(1);
        return;
      }
      if (!v2.valid) {
        setAttemptedNext(true);
        setStepErrors(v2.errors);
        setCurrentStep(2);
        return;
      }
      setCurrentStep(3);
    } else if (targetStep === 4) {
      const v1 = validateStep1();
      const v2 = validateStep2();
      const v3 = validateStep3();
      if (!v1.valid) {
        setAttemptedNext(true);
        setStepErrors(v1.errors);
        setCurrentStep(1);
        return;
      }
      if (!v2.valid) {
        setAttemptedNext(true);
        setStepErrors(v2.errors);
        setCurrentStep(2);
        return;
      }
      if (!v3.valid) {
        setAttemptedNext(true);
        setStepErrors(v3.errors);
        setCurrentStep(3);
        return;
      }
      setCurrentStep(4);
    }
  };

  const stepsInfo = [
    {
      step: 1,
      title: "Հաճախորդ և ապահովագրատեսակ",
      desc: "Ապահովադիր, հեռախոս, պրոդուկտ",
      icon: User,
      isCompleted: isStep1Complete,
      canAccess: true,
    },
    {
      step: 2,
      title: input.product === "property" ? "Գույքի տվյալներ" : input.product === "casco" ? "ԿԱՍԿՈ տվյալներ" : `${rule.nameArm} — ապահովագրական տվյալներ`,
      desc: input.product === "property" ? "Գույք, արժեք, գործունեություն" : input.product === "casco" ? "Տրանսպորտային միջոց և ԿԱՍԿՈ հաշվարկ" : `${rule.nameArm}-ի տվյալներ`,
      icon: Building,
      isCompleted: isStep2Complete,
      canAccess: isStep1Complete,
    },
    {
      step: 3,
      title: "Ռիսկեր և սակագնային պայմաններ",
      desc: "Ծածկույթ, սակագին, ֆրանշիզա",
      icon: Shield,
      isCompleted: isStep3Complete,
      canAccess: isStep2Complete,
    },
    {
      step: 4,
      title: "Անդեռռայթինգ և գնառաջարկ",
      desc: "Ստուգում, հաշվարկ, փաստաթուղթ",
      icon: FileText,
      isCompleted: result.eligible && result.decision === "approved",
      canAccess: isStep3Complete,
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-7">
      {/* Header Banner */}
      <div className="rounded-[28px] bg-gradient-to-r from-[#061A40] via-[#003399] to-[#075bd5] p-6 sm:p-9 text-white shadow-[0_18px_45px_rgba(6,26,64,0.18)] relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold border border-white/15">
              <Zap className="w-3.5 h-3.5 text-[#39B7FF]" /> Փուլ առ փուլ գնառաջարկի կազմում
            </div>
            <h1 className="mt-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Գնառաջարկի հերթական մուտքագրում և անդեռռայթինգ
            </h1>
            <p className="mt-1.5 max-w-3xl text-xs sm:text-sm text-[#D9E8FF]">
              Տվյալները լրացվում են փուլ առ փուլ։ Հաջորդ փուլ անցնելու համար անհրաժեշտ է ամբողջությամբ լրացնել ընթացիկ փուլի պարտադիր դաշտերը։
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetForm}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white border border-white/20 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Մաքրել
            </button>
            <button
              onClick={saveDraft}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00A3FF] hover:bg-[#0088dd] text-xs font-bold text-white shadow-sm transition cursor-pointer"
            >
              {saved ? "✓ Պահպանված է" : "Պահպանել սևագիրը"}
            </button>
          </div>
        </div>
      </div>

      {/* Step Navigation Progress Bar */}
      <div className="sil-card p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {stepsInfo.map((s) => {
            const Icon = s.icon;
            const isCurrent = currentStep === s.step;
            const isPassed = currentStep > s.step && s.isCompleted;
            const isLocked = !s.canAccess && currentStep < s.step;

            return (
              <button
                key={s.step}
                type="button"
                onClick={() => handleStepClick(s.step)}
                disabled={isLocked}
                className={`text-left p-3.5 rounded-2xl border transition relative flex items-start gap-3 cursor-pointer ${
                  isCurrent
                    ? "bg-[#EDF5FF] border-[#075bd5] shadow-sm ring-2 ring-[#075bd5]/20"
                    : isPassed
                    ? "bg-emerald-50/70 border-emerald-300 hover:bg-emerald-100/50"
                    : isLocked
                    ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black transition ${
                    isCurrent
                      ? "bg-[#075bd5] text-white"
                      : isPassed
                      ? "bg-emerald-600 text-white"
                      : isLocked
                      ? "bg-slate-200 text-slate-500"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {isPassed ? <Check className="w-5 h-5" /> : isLocked ? <Lock className="w-4 h-4" /> : s.step}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Փուլ {s.step}
                    </span>
                    {isPassed && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                        Լրացված է
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-md">
                        Ընթացիկ
                      </span>
                    )}
                    {isLocked && (
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Կողպված
                      </span>
                    )}
                  </div>
                  <div className="font-extrabold text-xs sm:text-sm text-slate-900 truncate mt-0.5">
                    {s.title}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {s.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Validation Error Banner if user attempted to jump/proceed with missing fields */}
      {stepErrors.length > 0 && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 sm:p-5 text-sm text-red-900 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-black text-red-800 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            Հաջորդ փուլ անցնելու համար լրացրեք պարտադիր դաշտերը․
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-red-700 pl-1">
            {stepErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Multi-Step Form Container */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_.75fr] gap-6 items-start">
        {/* Active Step Content */}
        <div className="space-y-6">
          {/* STEP 1: Հաճախորդ և ապահովագրատեսակ */}
          {currentStep === 1 && (
            <section className="sil-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#075bd5] uppercase tracking-wider mb-1">
                    <User className="w-4 h-4" /> Փուլ 1 · Հիմնական տվյալներ
                  </div>
                  <h2 className="text-xl font-black text-slate-900">
                    Հաճախորդի տվյալներ և ապահովագրատեսակի ընտրություն
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Նշեք ապահովադրի անվանումը, կոնտակտային տվյալները կամ սկանավորեք փաստաթուղթը AI-ով:
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={onChooseBundle}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer"
                  >
                    <Zap size={16} />
                    <span>Փաթեթային Խաչաձև Վաճառք (Cross-Sell)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOcrModal(true)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer"
                  >
                    <Camera size={16} />
                    <span>AI Scanner / OCR</span>
                  </button>
                </div>
              </div>

              {showOcrModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl">
                    <button
                      type="button"
                      onClick={() => setShowOcrModal(false)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"
                    >
                      <X size={20} />
                    </button>
                    <AiDocumentScanner
                      onDataExtracted={(scanned) => {
                        setInput((prev) => ({
                          ...prev,
                          clientName: scanned.clientName || prev.clientName,
                          phone: scanned.phone || prev.phone,
                          objectDescription: scanned.address || prev.objectDescription,
                          insuredAmount: scanned.propertyValue || prev.insuredAmount,
                        }));
                        setShowOcrModal(false);
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Ապահովադիր (Անուն / Ընկերության անվանում) <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={input.clientName}
                      onChange={(e) => set("clientName", e.target.value)}
                      className={`sil-input ${
                        attemptedNext && (!input.clientName.trim() || input.clientName.trim().length < 2)
                          ? "border-red-400 bg-red-50/40"
                          : ""
                      }`}
                      placeholder="Օր․ «Արմենիա Թրեյդինգ» ՍՊԸ կամ Արամ Սարգսյան"
                    />
                    {attemptedNext && (!input.clientName.trim() || input.clientName.trim().length < 2) && (
                      <span className="text-[11px] text-red-600 mt-1 block">Պարտադիր դաշտ (առնվազն 2 նիշ)</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Կոնտակտային հեռախոսահամար <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={input.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      className={`sil-input ${
                        attemptedNext && (!input.phone.trim() || input.phone.trim().length < 5)
                          ? "border-red-400 bg-red-50/40"
                          : ""
                      }`}
                      placeholder="+374 (00) 00-00-00"
                    />
                    {attemptedNext && (!input.phone.trim() || input.phone.trim().length < 5) && (
                      <span className="text-[11px] text-red-600 mt-1 block">Մուտքագրեք հեռախոսահամար</span>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Ապահովագրատեսակ (Պրոդուկտ) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={input.product}
                      onChange={(e) => {
                        const product = e.target.value as InsuranceProductType;
                        if (product === "casco") {
                          onChooseCasco();
                          return;
                        }
                        if (product === "bundle") {
                          onChooseBundle();
                          return;
                        }
                        const nextRule = getQuotationRules()[product] || getQuotationRules().property;
                        setInput((v) => ({
                          ...v,
                          product,
                          productDetails: {},
                          insuredAmount: 0,
                          businessActivity: "",
                          objectDescription: "",
                          franchisePercent: nextRule.defaultFranchise,
                          customTariff: nextRule.defaultTariff,
                          selectedRisks: [...nextRule.requiredRisks],
                        }));
                        localStorage.removeItem("sil-quick-quote-draft");
                      }}
                      className="sil-input font-medium"
                    >
                      {products.map((p) => (
                        <option key={p.product} value={p.product}>
                          {p.nameArm}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Հաշվարկի արժույթ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={input.currency}
                      onChange={(e) => set("currency", e.target.value as QuoteInput["currency"])}
                      className="sil-input font-medium"
                    >
                      <option value="AMD">AMD — ՀՀ Դրամ</option>
                      <option value="USD">USD — ԱՄՆ Դոլար</option>
                      <option value="EUR">EUR — Եվրո</option>
                    </select>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-[#075bd5] shrink-0 mt-0.5" />
                  <div>
                    <b>Ընտրված պրոդուկտի կանոններ՝</b> {rule.nameArm} (Սակագին՝ {rule.minTariff}% – {rule.maxTariff}%, լռելյայն ֆրանշիզա՝ {rule.defaultFranchise}%)
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 2: Օբյեկտ և ապահովագրական գումար */}
          {currentStep === 2 && (
            <section className="sil-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#075bd5] tracking-wider mb-1">
                  <Building className="w-4 h-4" /> Փուլ 2 · {rule.stage2TitleArm}
                </div>
                <h2 className="text-xl font-black text-slate-900">{rule.stage2TitleArm}</h2>
                <p className="text-xs text-slate-500 mt-1">{rule.stage2DescriptionArm}</p>
              </div>

              <div className="space-y-4" data-product-stage="2" data-product={input.product} data-stage2-mode="product-specific" data-stage2-renderer="ProductSpecificStep2Form">
                {input.product === "property" && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                          List.am Գույքի Շուկայական Գնահատիչ
                          <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded-sm">ՆՈՐ</span>
                        </div>
                        <div className="text-[11px] text-emerald-800 mt-0.5">
                          Հաշվարկեք անշարժ գույքի միջին շուկայական արժեքը ըստ Երևանի վարչական շրջանի, մակերեսի և շինության տեսակի։
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPropertyValuationOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition cursor-pointer shrink-0 active:scale-95"
                    >
                      Բացել List.am հաշվիչը
                    </button>
                  </div>
                )}
                <div className="sr-only" aria-live="polite">Փուլ 2՝ {rule.nameArm}-ի տվյալների լրացում</div>
                <ProductSpecificStep2Form
                  input={input}
                  onChange={set}
                  updateProductDetail={updateProductDetail}
                  attemptedNext={attemptedNext}
                />
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex justify-between items-center">
                  <span>Հաճախորդ՝ <b>{input.clientName || "—"}</b> ({input.phone || "—"})</span>
                  <span className="text-[#075bd5] font-bold">{rule.nameArm}</span>
                </div>
              </div>
            </section>
          )}

          {/* STEP 3: Ռիսկեր և սակագնային պայմաններ */}
          {currentStep === 3 && (
            <section className="sil-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#075bd5] uppercase tracking-wider mb-1">
                  <Shield className="w-4 h-4" /> Փուլ 3 · Ռիսկեր և սակագին
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  Ապահովագրական ծածկույթի ռիսկեր և սակագնային պայմաններ
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ընտրեք ապահովագրվող ռիսկերը, ֆրանշիզան և սահմանեք կիրառվող սակագինը։
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700">
                      Ապահովագրական ծածկույթում ներառված ռիսկեր <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Ընտրված է՝ {input.selectedRisks.length} ռիսկ
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2">
                    {(rule.availableRisks ?? rule.requiredRisks).map((risk) => {
                      const isSelected = input.selectedRisks.includes(risk);
                      return (
                        <button
                          key={risk}
                          type="button"
                          onClick={() => toggleRisk(risk)}
                          className={`text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? "bg-[#EDF5FF] border-[#075bd5] text-[#061A40] font-bold shadow-xs"
                              : "border-[#DCE5F2] hover:bg-[#F5F8FC] text-slate-700"
                          }`}
                        >
                          <span>{risk}</span>
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                              isSelected ? "bg-[#075bd5] text-white" : "border border-slate-300"
                            }`}
                          >
                            {isSelected ? "✓" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {attemptedNext && input.selectedRisks.length === 0 && (
                    <span className="text-[11px] text-red-600 mt-1 block">Ընտրեք առնվազն 1 ռիսկ</span>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Ֆրանշիզա (% կամ ֆիքսված) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={input.franchisePercent}
                      onChange={(e) => set("franchisePercent", Number(e.target.value))}
                      className="sil-input"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Լռելյայն արժեք՝ {rule.defaultFranchise}%
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Կիրառվող տարեկան սակագին (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={rule.minTariff}
                      max={rule.maxTariff}
                      step="0.01"
                      value={input.customTariff ?? rule.defaultTariff}
                      onChange={(e) => set("customTariff", Number(e.target.value))}
                      className="sil-input font-bold"
                    />
                    <span className="text-[11px] text-[#075bd5] font-bold mt-1 block">
                      Թույլատրելի միջակայք՝ {rule.minTariff}% – {rule.maxTariff}% (Լռելյայն՝ {rule.defaultTariff}%)
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2.5 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs sm:text-sm font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={input.previousLosses}
                      onChange={(e) => set("previousLosses", e.target.checked)}
                      className="w-4 h-4 rounded text-[#075bd5] focus:ring-[#075bd5]"
                    />
                    <span>Վերջին 3–5 տարիների ընթացքում արձանագրվել են ապահովագրական պատահարներ / վնասներ</span>
                  </label>
                </div>
              </div>
            </section>
          )}

          {/* STEP 4: Անդեռռայթինգ և գնառաջարկի ամփոփում */}
          {currentStep === 4 && (
            <section className="space-y-6">
              {/* Summary of all 3 previous steps */}
              <div className="sil-card p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 uppercase tracking-wider mb-1">
                      <FileCheck2 className="w-4 h-4" /> Փուլ 4 · Ամփոփում և որոշում
                    </div>
                    <h2 className="text-xl font-black text-slate-900">
                      Մուտքագրված տվյալների ամփոփագիր
                    </h2>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    Բոլոր 3 փուլերը լրացված են ✓
                  </span>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Step 1 Recap */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black text-slate-500 uppercase">Փուլ 1 · Հաճախորդ</span>
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="text-[#075bd5] text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Խմբագրել
                      </button>
                    </div>
                    <div className="font-extrabold text-sm text-slate-900">{input.clientName}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{input.phone}</div>
                    <div className="text-xs font-bold text-[#075bd5] mt-2">{rule.nameArm} ({input.currency})</div>
                  </div>

                  {/* Step 2 Recap */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black text-slate-500 uppercase">Փուլ 2 · Օբյեկտ</span>
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="text-[#075bd5] text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Խմբագրել
                      </button>
                    </div>
                    <div className="font-extrabold text-sm text-slate-900">
                      {formatCurrency(input.insuredAmount, input.currency)}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 truncate">{input.businessActivity}</div>
                    <div className="text-xs text-slate-500 mt-2 truncate">{input.objectDescription}</div>
                  </div>

                  {/* Step 3 Recap */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black text-slate-500 uppercase">Փուլ 3 · Պայմաններ</span>
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="text-[#075bd5] text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Խմբագրել
                      </button>
                    </div>
                    <div className="font-extrabold text-sm text-slate-900">
                      Սակագին՝ {(input.customTariff ?? rule.defaultTariff).toFixed(2)}%
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">Ֆրանշիզա՝ {input.franchisePercent}%</div>
                    <div className="text-xs text-slate-500 mt-2">
                      {input.selectedRisks.length} ռիսկ {input.previousLosses ? "· ⚠ Նախկին վնասներ" : ""}
                    </div>
                  </div>
                </div>
              </div>

              {/* Underwriting Assessment Result */}
              <div className="sil-card p-6 sm:p-8 space-y-4">
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#075bd5]" /> Անդեռռայթինգի ստուգման արդյունք
                </h3>

                <div className="space-y-2">
                  {result.checks.map((check) => (
                    <div
                      key={check.label}
                      className={`flex items-start gap-3 p-3 rounded-xl border ${
                        check.passed
                          ? "bg-emerald-50/50 border-emerald-200/70"
                          : "bg-red-50/50 border-red-200/70"
                      }`}
                    >
                      {check.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900">{check.label}</div>
                        <div className="text-xs text-slate-600 mt-0.5">{check.message}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {result.decision === "manual_review" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs sm:text-sm text-amber-900">
                    <div className="font-extrabold flex items-center gap-2 text-amber-950 mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Պահանջվում է անդեռռայթերի մասնագիտական վերահաստատում
                    </div>
                    <p>
                      Բոլոր հիմնական սահմանները բավարարված են, սակայն նախկին վնասների առկայության պատճառով գնառաջարկը պետք է հաստատվի պատասխանատու աշխատակցի կողմից։
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Stepper Navigation Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Նախորդ փուլ
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-3 rounded-xl bg-[#075bd5] hover:bg-[#004bb5] text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-md shadow-blue-900/15 transition cursor-pointer"
                >
                  Հաջորդ փուլ <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                result.eligible &&
                result.proposal && (
                  <button
                    type="button"
                    onClick={() => onGenerateQuotation(result.proposal!)}
                    className="px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition cursor-pointer active:scale-95"
                  >
                    <FileCheck2 className="w-5 h-5" /> Ձևավորել պաշտոնական գնառաջարկ
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Right Side Sticky Calculator & Summary Card */}
        <aside className="space-y-5 lg:sticky lg:top-6">
          {/* Live Premium Calculation Card */}
          <div className="sil-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900">Հաշվարկի ամփոփում</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#075bd5]">
                {rule.nameArm}
              </span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Ապահովադիր</span>
                <b className="text-slate-900 truncate max-w-[170px]">{input.clientName || "—"}</b>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Ապահովագրական գումար</span>
                <b className="text-slate-900">
                  {input.insuredAmount > 0
                    ? formatCurrency(input.insuredAmount, input.currency)
                    : "0 " + input.currency}
                </b>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Տարեկան սակագին</span>
                <b className="text-[#075bd5] font-black">
                  {(input.customTariff ?? rule.defaultTariff).toFixed(2)}%
                </b>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Ֆրանշիզա</span>
                <b className="text-slate-900">{input.franchisePercent}%</b>
              </div>

              {result.proposal && (
                <div className="pt-2">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Տարեկան ապահովագրավճար
                    </span>
                    <div className="text-2xl font-black text-emerald-800 mt-1">
                      {formatCurrency(result.proposal.annualPremium, result.proposal.currency)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {currentStep === 4 && result.proposal && (
              <button
                type="button"
                onClick={() => onGenerateQuotation(result.proposal!)}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 font-extrabold flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" /> Գեներացնել գնառաջարկը
              </button>
            )}
          </div>

          {/* Underwriting Boundaries Reference */}
          <div className="bg-[#061A40] text-white rounded-2xl p-5 shadow-[0_10px_28px_rgba(6,26,64,.12)] text-xs space-y-2">
            <div className="font-extrabold text-sm text-cyan-200">Անդեռռայթինգային սահմանաչափեր</div>
            <div className="text-slate-300">
              Պրոդուկտ՝ <b className="text-white">{rule.nameArm}</b>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">Թույլատրելի սակագին՝</span>
              <b className="text-[#39B7FF]">{rule.minTariff}% – {rule.maxTariff}%</b>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Լռելյայն ֆրանշիզա՝</span>
              <b className="text-white">{rule.defaultFranchise}%</b>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Առավելագույն ավտոմատ գումար՝</span>
              <b className="text-white">
                {rule.maxInsuredAmount ? rule.maxInsuredAmount.toLocaleString("hy-AM") + " AMD" : "Անսահմանափակ"}
              </b>
            </div>
          </div>
        </aside>
      </div>

      {/* List.am Property Market Valuation Modal */}
      {propertyValuationOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-auto max-h-[92vh] overflow-y-auto relative">
            <button
              onClick={() => setPropertyValuationOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition cursor-pointer z-20"
              aria-label="Փակել"
            >
              <X className="w-5 h-5" />
            </button>

            <ListAmPropertyValuationCalculator
              isEmbedded={true}
              onApplyToPropertyInsurance={(data) => {
                const totalInsuredSum = data.constructiveValueAMD + data.finishingValueAMD + data.movablesValueAMD;
                set("currency", "AMD");
                set("insuredAmount", totalInsuredSum || data.marketValueAMD);
                const infoLines = [
                  input.objectDescription ? input.objectDescription : "",
                  `Օբյեկտ՝ ${data.districtName}${data.subDistrict ? ` (${data.subDistrict})` : ""}`,
                  `Մակերես՝ ${data.areaSqm} քմ`,
                  `Շուկայական գնահատում՝ $${data.marketValueUSD.toLocaleString()} (${data.marketValueAMD.toLocaleString("hy-AM")} AMD)`,
                  `Ապահովագրական բաշխում՝ Շինություն՝ ${data.constructiveValueAMD.toLocaleString("hy-AM")} AMD, Հարդարում՝ ${data.finishingValueAMD.toLocaleString("hy-AM")} AMD, Գույք՝ ${data.movablesValueAMD.toLocaleString("hy-AM")} AMD`,
                ].filter(Boolean);
                set("objectDescription", infoLines.join("\n"));
                if (!input.businessActivity.trim()) {
                  set("businessActivity", `Անշարժ գույք (${data.districtName})`);
                }
                setPropertyValuationOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
