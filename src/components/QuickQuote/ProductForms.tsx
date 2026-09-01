import React from "react";
import {
  Plane,
  HeartPulse,
  Truck,
  HardHat,
  Scale,
  Activity,
  Wheat,
  Landmark,
  Home,
  Building2,
  PackageCheck,
  Shield,
  Layers,
  Sparkles,
  Info,
  Calendar,
  Users,
  MapPin,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { QuoteInput } from "../../data/quotationRules";
import { InsuranceProductType } from "../../types";

interface ProductFormProps {
  input: QuoteInput;
  onChange: <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => void;
  updateProductDetail: (key: string, value: any) => void;
  attemptedNext: boolean;
}

export function ProductSpecificStep2Form({
  input,
  onChange,
  updateProductDetail,
  attemptedNext,
}: ProductFormProps) {
  const details = input.productDetails || {};

  switch (input.product) {
    case "travel":
      return (
        <TravelStep2
          input={input}
          details={details}
          onChange={onChange}
          updateDetail={updateProductDetail}
          attemptedNext={attemptedNext}
        />
      );
    case "health":
      return (
        <HealthStep2
          input={input}
          details={details}
          onChange={onChange}
          updateDetail={updateProductDetail}
          attemptedNext={attemptedNext}
        />
      );
    case "cargo":
      return (
        <CargoStep2
          input={input}
          details={details}
          onChange={onChange}
          updateDetail={updateProductDetail}
          attemptedNext={attemptedNext}
        />
      );
    case "construction":
      return (
        <ConstructionStep2
          input={input}
          details={details}
          onChange={onChange}
          updateDetail={updateProductDetail}
          attemptedNext={attemptedNext}
        />
      );
    case "liability":
      return (
        <LiabilityStep2
          input={input}
          details={details}
          onChange={onChange}
          updateDetail={updateProductDetail}
          attemptedNext={attemptedNext}
        />
      );
    case "accident":
      return (
        <AccidentStep2
          input={input}
          details={details}
          onChange={onChange}
          updateDetail={updateProductDetail}
          attemptedNext={attemptedNext}
        />
      );
    case "agro":
      return (
        <AgroStep2
          input={input}
          details={details}
          onChange={onChange}
          updateDetail={updateProductDetail}
          attemptedNext={attemptedNext}
        />
      );
    case "financial":
      return (
        <FinancialStep2
          input={input}
          details={details}
          onChange={onChange}
          updateDetail={updateProductDetail}
          attemptedNext={attemptedNext}
        />
      );
    case "mortgage":
      return (
        <MortgageStep2
          input={input}
          details={details}
          onChange={onChange}
          updateDetail={updateProductDetail}
          attemptedNext={attemptedNext}
        />
      );
    case "aviation":
      return (
        <AviationStep2
          input={input}
          details={details}
          onChange={onChange}
          updateDetail={updateProductDetail}
          attemptedNext={attemptedNext}
        />
      );
    case "bundle":
      return (
        <BundleStep2
          input={input}
          details={details}
          onChange={onChange}
          updateDetail={updateProductDetail}
          attemptedNext={attemptedNext}
        />
      );
    case "property":
      return null;
    case "casco":
      return null;
    default:
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Այս ապահովագրական արտադրանքի համար 2-րդ փուլի հատուկ ձևը հասանելի չէ։ Ընդհանուր ձևը չի օգտագործվում։
        </div>
      );
  }
}

// -------------------------------------------------------------
// 1. TRAVEL STEP 2
// -------------------------------------------------------------
function TravelStep2({
  input,
  details,
  onChange,
  updateDetail,
  attemptedNext,
}: any) {
  const destination = details.destination || "schengen";
  const days = Number(details.tripDays || 15);
  const count = Number(details.travelerCount || 1);
  const ageGroup = details.ageGroup || "adult";
  const tripPurpose = details.tripPurpose || "tourism";
  const limit = Number(details.coverageLimit || 30000);

  const calculateTravel = (d = destination, dy = days, c = count, ag = ageGroup, tp = tripPurpose, lim = limit) => {
    let baseDailyEur = 1.0;
    if (d === "cis") baseDailyEur = 0.65;
    else if (d === "schengen") baseDailyEur = 1.0;
    else if (d === "worldwide") baseDailyEur = 1.45;
    else if (d === "usa_canada") baseDailyEur = 2.0;

    let ageFactor = 1.0;
    if (ag === "child") ageFactor = 0.85;
    else if (ag === "senior_65_70") ageFactor = 1.5;
    else if (ag === "senior_71_75") ageFactor = 2.0;
    else if (ag === "senior_76_80") ageFactor = 3.0;

    let sportFactor = 1.0;
    if (tp === "extreme_sports") sportFactor = 2.2;
    else if (tp === "manual_work") sportFactor = 1.8;

    const limitFactor = lim > 30000 ? (lim === 50000 ? 1.25 : 1.5) : 1.0;

    const totalEur = Math.round(baseDailyEur * dy * c * ageFactor * sportFactor * limitFactor);
    const totalAmd = totalEur * 430; // standard approx rate

    const destLabel =
      d === "schengen"
        ? "Շենգեն/Եվրոպա"
        : d === "cis"
        ? "Վրաստան և ԱՊՀ"
        : d === "usa_canada"
        ? "ԱՄՆ, Կանադա, Ճապոնիա"
        : "Ամբողջ աշխարհ";

    onChange("currency", input.currency === "AMD" ? "AMD" : "EUR");
    onChange("insuredAmount", input.currency === "EUR" ? lim * c : lim * 430 * c);
    onChange("businessActivity", `Ճանապարհորդություն (${tripPurpose === "tourism" ? "Հանգիստ/տուրիզմ" : tripPurpose === "sports" ? "Սպորտ/լեռնադահուկ" : "Գործուղում"})`);
    onChange("objectDescription", `Ուղղություն՝ ${destLabel}, Տևողություն՝ ${dy} օր, Ճամփորդներ՝ ${c} անձ (Տարիքային խումբ՝ ${ag})`);
    onChange("franchisePercent", 0);
  };

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-blue-950">Ճանապարհորդության պարամետրեր</div>
            <div className="text-[11px] text-blue-800">
              Միջազգային ստանդարտ ծածկույթ €30,000 / €50,000 / $100,000 լիմիտով
            </div>
          </div>
        </div>
        <span className="text-[11px] font-bold bg-blue-200/80 text-blue-900 px-2.5 py-1 rounded-lg">
          Շենգեն/Համաշխարհային
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Ուղղություն / Տարածաշրջան <span className="text-red-500">*</span>
          </label>
          <select
            className="sil-input font-bold"
            value={destination}
            onChange={(e) => {
              updateDetail("destination", e.target.value);
              calculateTravel(e.target.value, days, count, ageGroup, tripPurpose, limit);
            }}
          >
            <option value="schengen">Շենգենյան գոտի / Եվրոպա</option>
            <option value="cis">Վրաստան և ԱՊՀ երկրներ</option>
            <option value="worldwide">Ամբողջ աշխարհ (բացի ԱՄՆ/Կանադա/Ճապոնիա)</option>
            <option value="usa_canada">Ամբողջ աշխարհ (ներառյալ ԱՄՆ, Կանադա, Ճապոնիա)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Ծածկույթի լիմիտ (1 անձի համար) <span className="text-red-500">*</span>
          </label>
          <select
            className="sil-input font-bold"
            value={limit}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("coverageLimit", val);
              calculateTravel(destination, days, count, ageGroup, tripPurpose, val);
            }}
          >
            <option value={30000}>€30,000 (Շենգենյան վիզայի ստանդարտ)</option>
            <option value={50000}>€50,000 (Ընդլայնված Եվրոպա)</option>
            <option value={100000}>$100,000 (Առավելագույն համաշխարհային)</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Տևողություն (Օրերի քանակ) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            max="365"
            className="sil-input font-bold"
            value={days}
            onChange={(e) => {
              const val = Math.max(1, Number(e.target.value));
              updateDetail("tripDays", val);
              calculateTravel(destination, val, count, ageGroup, tripPurpose, limit);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Ճամփորդների քանակ <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            max="50"
            className="sil-input font-bold"
            value={count}
            onChange={(e) => {
              const val = Math.max(1, Number(e.target.value));
              updateDetail("travelerCount", val);
              calculateTravel(destination, days, val, ageGroup, tripPurpose, limit);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Տարիքային խումբ
          </label>
          <select
            className="sil-input font-bold"
            value={ageGroup}
            onChange={(e) => {
              updateDetail("ageGroup", e.target.value);
              calculateTravel(destination, days, count, e.target.value, tripPurpose, limit);
            }}
          >
            <option value="adult">18 - 65 տարեկան (Ստանդարտ)</option>
            <option value="child">0 - 17 տարեկան (Երեխա)</option>
            <option value="senior_65_70">66 - 70 տարեկան (գործակից 1.5)</option>
            <option value="senior_71_75">71 - 75 տարեկան (գործակից 2.0)</option>
            <option value="senior_76_80">76 - 80 տարեկան (գործակից 3.0)</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Ճամփորդության նպատակ
          </label>
          <select
            className="sil-input font-bold"
            value={tripPurpose}
            onChange={(e) => {
              updateDetail("tripPurpose", e.target.value);
              calculateTravel(destination, days, count, ageGroup, e.target.value, limit);
            }}
          >
            <option value="tourism">Տուրիզմ և հանգիստ (Ստանդարտ)</option>
            <option value="business">Գործուղում / Բիզնես այց</option>
            <option value="extreme_sports">Լեռնադահուկ / Էքստրիմ սպորտ (+120%)</option>
            <option value="manual_work">Ֆիզիկական աշխատանք (+80%)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Ֆրանշիզա (չհատուցվող գումար)
          </label>
          <select
            className="sil-input font-bold"
            value={details.franchise || "0_eur"}
            onChange={(e) => {
              updateDetail("franchise", e.target.value);
              onChange("franchisePercent", e.target.value === "0_eur" ? 0 : 1);
            }}
          >
            <option value="0_eur">0 EUR (Առանց ֆրանշիզայի - Ամբողջական հատուցում)</option>
            <option value="50_eur">50 EUR (Ֆիքսված ֆրանշիզա)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. HEALTH STEP 2
// -------------------------------------------------------------
function HealthStep2({
  input,
  details,
  onChange,
  updateDetail,
  attemptedNext,
}: any) {
  const groupType = details.groupType || "corporate";
  const insuredCount = Number(details.insuredCount || 10);
  const planLevel = details.planLevel || "classic";
  const limitPerPerson = Number(details.limitPerPerson || 3000000);
  const copay = Number(details.copay || 0);

  const calculateHealth = (gt = groupType, count = insuredCount, plan = planLevel, lim = limitPerPerson, cp = copay) => {
    let basePricePerPerson = 120000;
    if (plan === "standard") basePricePerPerson = 65000;
    else if (plan === "classic") basePricePerPerson = 115000;
    else if (plan === "silver") basePricePerPerson = 180000;
    else if (plan === "gold") basePricePerPerson = 280000;
    else if (plan === "platinum") basePricePerPerson = 420000;

    let groupDiscount = 0;
    if (count >= 150) groupDiscount = 0.30;
    else if (count >= 50) groupDiscount = 0.20;
    else if (count >= 20) groupDiscount = 0.15;
    else if (count >= 5) groupDiscount = 0.10;

    const copayDiscount = cp === 20 ? 0.20 : cp === 10 ? 0.10 : 0;
    const finalPricePerPerson = Math.round(basePricePerPerson * (1 - groupDiscount) * (1 - copayDiscount));
    const totalSum = lim * count;

    onChange("currency", "AMD");
    onChange("insuredAmount", totalSum);
    onChange("businessActivity", `Առողջապահություն (${gt === "corporate" ? "Կորպորատիվ խմբային" : gt === "family" ? "Ընտանեկան" : "Անհատական"})`);
    onChange(
      "objectDescription",
      `Ապահովագրվածների քանակ՝ ${count} անձ, Ծրագիր՝ ${plan.toUpperCase()}, 1 անձի լիմիտ՝ ${lim.toLocaleString()} ֏, Համավճար՝ ${cp}%`
    );
    onChange("franchisePercent", cp);
    const tariff = Number(((finalPricePerPerson / lim) * 100).toFixed(2));
    onChange("customTariff", Math.max(0.1, tariff));
  };

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-emerald-950">Կամավոր Բժշկական Ապահովագրություն</div>
            <div className="text-[11px] text-emerald-800">
              Կորպորատիվ և անհատական առողջության համալիր փաթեթներ
            </div>
          </div>
        </div>
        <span className="text-[11px] font-bold bg-emerald-200/80 text-emerald-900 px-2.5 py-1 rounded-lg">
          SIL Health Care
        </span>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Խմբի տեսակ <span className="text-red-500">*</span>
          </label>
          <select
            className="sil-input font-bold"
            value={groupType}
            onChange={(e) => {
              updateDetail("groupType", e.target.value);
              calculateHealth(e.target.value, insuredCount, planLevel, limitPerPerson, copay);
            }}
          >
            <option value="corporate">Կորպորատիվ (Աշխատակիցներ)</option>
            <option value="family">Ընտանեկան փաթեթ</option>
            <option value="individual">Անհատական ապահովագրություն</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Ապահովագրվողների քանակ <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            className="sil-input font-bold"
            value={insuredCount}
            onChange={(e) => {
              const val = Math.max(1, Number(e.target.value));
              updateDetail("insuredCount", val);
              calculateHealth(groupType, val, planLevel, limitPerPerson, copay);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Ծրագրի փաթեթ <span className="text-red-500">*</span>
          </label>
          <select
            className="sil-input font-bold"
            value={planLevel}
            onChange={(e) => {
              updateDetail("planLevel", e.target.value);
              calculateHealth(groupType, insuredCount, e.target.value, limitPerPerson, copay);
            }}
          >
            <option value="standard">Standard (Հիվանդանոցային + Շտապ)</option>
            <option value="classic">Classic (Հիվանդանոցային + Պոլիկլինիկա)</option>
            <option value="silver">Silver (+ Դեղորայք + Ատամնաբուժություն)</option>
            <option value="gold">Gold (Ընդլայնված լրիվ ծածկույթ)</option>
            <option value="platinum">Platinum VIP (Անսահմանափակ VIP սպասարկում)</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            1 անձի տարեկան ծածկույթի լիմիտ (֏) <span className="text-red-500">*</span>
          </label>
          <select
            className="sil-input font-bold"
            value={limitPerPerson}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("limitPerPerson", val);
              calculateHealth(groupType, insuredCount, planLevel, val, copay);
            }}
          >
            <option value={1000000}>1,000,000 ֏</option>
            <option value={2500000}>2,500,000 ֏</option>
            <option value={5000000}>5,000,000 ֏</option>
            <option value={10000000}>10,000,000 ֏ (VIP)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Համավճար / Co-pay (%)
          </label>
          <select
            className="sil-input font-bold"
            value={copay}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("copay", val);
              calculateHealth(groupType, insuredCount, planLevel, limitPerPerson, val);
            }}
          >
            <option value={0}>0% (Ամբողջական 100% հատուցում)</option>
            <option value={10}>10% համավճար (-10% զեղչ գնից)</option>
            <option value={20}>20% համավճար (-20% զեղչ գնից)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. CARGO STEP 2
// -------------------------------------------------------------
function CargoStep2({
  input,
  details,
  onChange,
  updateDetail,
  attemptedNext,
}: any) {
  const cargoType = details.cargoType || "general";
  const cargoValue = Number(details.cargoValue || input.insuredAmount || 15000000);
  const transportMode = details.transportMode || "road";
  const origin = details.origin || "Երևան, Հայաստան";
  const destination = details.destination || "Մոսկվա, ՌԴ";
  const clause = details.clause || "ICC_A";
  const franchise = Number(details.franchise || 0.5);

  const calculateCargo = (ct = cargoType, val = cargoValue, tm = transportMode, cl = clause, fr = franchise, orig = origin, dest = destination) => {
    let baseTariff = 0.20;
    if (tm === "air") baseTariff = 0.15;
    else if (tm === "rail") baseTariff = 0.18;
    else if (tm === "road") baseTariff = 0.24;
    else if (tm === "sea") baseTariff = 0.26;
    else if (tm === "multimodal") baseTariff = 0.32;

    let cargoMultiplier = 1.0;
    if (ct === "fragile") cargoMultiplier = 1.4;
    else if (ct === "refrigerated") cargoMultiplier = 1.35;
    else if (ct === "adr_hazardous") cargoMultiplier = 1.7;
    else if (ct === "valuable") cargoMultiplier = 1.5;

    let clauseMultiplier = 1.0;
    if (cl === "ICC_B") clauseMultiplier = 0.75;
    else if (cl === "ICC_C") clauseMultiplier = 0.55;

    const finalTariff = Number((baseTariff * cargoMultiplier * clauseMultiplier).toFixed(3));

    onChange("insuredAmount", val);
    onChange("businessActivity", `Բեռնափոխադրում (${tm === "road" ? "Ավտո" : tm === "air" ? "Ավիա" : tm === "sea" ? "Ծովային" : "Մուլտիմոդալ"})`);
    onChange("objectDescription", `Բեռ՝ ${ct}, Երթուղի՝ ${orig} ➔ ${dest}, Պայմաններ՝ ${cl} (All Risks), Փոխադրամիջոց՝ ${tm}`);
    onChange("franchisePercent", fr);
    onChange("customTariff", finalTariff);
  };

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-amber-950">Բեռների Փոխադրման Ապահովագրություն (Cargo)</div>
            <div className="text-[11px] text-amber-800">
              Միջազգային Institute Cargo Clauses (ICC A, B, C) համաձայն
            </div>
          </div>
        </div>
        <span className="text-[11px] font-bold bg-amber-200/80 text-amber-900 px-2.5 py-1 rounded-lg">
          ICC (A) All Risks
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Բեռի տեսակ <span className="text-red-500">*</span>
          </label>
          <select
            className="sil-input font-bold"
            value={cargoType}
            onChange={(e) => {
              updateDetail("cargoType", e.target.value);
              calculateCargo(e.target.value, cargoValue, transportMode, clause, franchise, origin, destination);
            }}
          >
            <option value="general">Գեներալ արդյունաբերական ապրանքներ (Ստանդարտ)</option>
            <option value="refrigerated">Շուտ փչացող / Սառնարանային բեռ (+35%)</option>
            <option value="fragile">Դյուրաբեկ / Էլեկտրոնիկա / Ապակի (+40%)</option>
            <option value="adr_hazardous">Վտանգավոր բեռ ADR (+70%)</option>
            <option value="valuable">Թանկարժեք / Ոսկերչական բեռ (+50%)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Բեռի ապահովագրական արժեք ({input.currency}) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            className="sil-input font-bold text-base"
            value={cargoValue}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("cargoValue", val);
              calculateCargo(cargoType, val, transportMode, clause, franchise, origin, destination);
            }}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Փոխադրամիջոց / Տրանսպորտ <span className="text-red-500">*</span>
          </label>
          <select
            className="sil-input font-bold"
            value={transportMode}
            onChange={(e) => {
              updateDetail("transportMode", e.target.value);
              calculateCargo(cargoType, cargoValue, e.target.value, clause, franchise, origin, destination);
            }}
          >
            <option value="road">Ավտոտրանսպորտ (Միջազգային ֆուռ / բեռնատար)</option>
            <option value="air">Ավիափոխադրում (Air Cargo)</option>
            <option value="sea">Ծովային բեռնափոխադրում (Կոնտեյներ / Նավ)</option>
            <option value="rail">Երկաթուղային տրանսպորտ</option>
            <option value="multimodal">Մուլտիմոդալ (Խառը՝ Ծով + Ավտո + Երկաթուղի)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Ծածկույթի ծավալ (Institute Cargo Clauses) <span className="text-red-500">*</span>
          </label>
          <select
            className="sil-input font-bold"
            value={clause}
            onChange={(e) => {
              updateDetail("clause", e.target.value);
              calculateCargo(cargoType, cargoValue, transportMode, e.target.value, franchise, origin, destination);
            }}
          >
            <option value="ICC_A">Clause (A) — Բոլոր ռիսկերից (All Risks, լրիվ ծածկույթ)</option>
            <option value="ICC_B">Clause (B) — Միջին ռիսկեր (տարերային + հիմնական վթարներ)</option>
            <option value="ICC_C">Clause (C) — Միայն խոշոր տրանսպորտային վթարներ</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Մեկնման վայր (Երկիր, Քաղաք) <span className="text-red-500">*</span>
          </label>
          <input
            className="sil-input font-bold"
            value={origin}
            placeholder="Օր․ Շանհայ, Չինաստան"
            onChange={(e) => {
              updateDetail("origin", e.target.value);
              calculateCargo(cargoType, cargoValue, transportMode, clause, franchise, e.target.value, destination);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Ժամանման վայր (Երկիր, Քաղաք) <span className="text-red-500">*</span>
          </label>
          <input
            className="sil-input font-bold"
            value={destination}
            placeholder="Օր․ Երևան, Հայաստան"
            onChange={(e) => {
              updateDetail("destination", e.target.value);
              calculateCargo(cargoType, cargoValue, transportMode, clause, franchise, origin, e.target.value);
            }}
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 4. CONSTRUCTION (CAR/EAR) STEP 2
// -------------------------------------------------------------
function ConstructionStep2({
  input,
  details,
  onChange,
  updateDetail,
  attemptedNext,
}: any) {
  const contractValue = Number(details.contractValue || input.insuredAmount || 100000000);
  const durationMonths = Number(details.durationMonths || 12);
  const projectType = details.projectType || "residential";
  const projectName = details.projectName || "Բազմաբնակարան բնակելի համալիր";
  const projectAddress = details.projectAddress || "ք․ Երևան, Արաբկիր վարչական շրջան";
  const tplIncluded = details.tplIncluded !== false;
  const maintenanceMonths = Number(details.maintenanceMonths || 12);

  const calculateConstruction = (cv = contractValue, dm = durationMonths, pt = projectType, tpl = tplIncluded, mm = maintenanceMonths, pn = projectName, pa = projectAddress) => {
    let baseTariff = 0.25;
    if (pt === "residential") baseTariff = 0.22;
    else if (pt === "infrastructure") baseTariff = 0.38;
    else if (pt === "industrial") baseTariff = 0.45;
    else if (pt === "complex_hydro") baseTariff = 0.75;

    const durationFactor = dm > 12 ? 1 + (dm - 12) * 0.03 : 1.0;
    const maintenanceAddon = mm > 0 ? 0.05 : 0;
    const tplAddon = tpl ? 0.08 : 0;

    const finalTariff = Number(((baseTariff * durationFactor) + maintenanceAddon + tplAddon).toFixed(3));

    onChange("insuredAmount", cv);
    onChange("businessActivity", `Շինմոնտաժ (${pt === "residential" ? "Բնակելի շենքեր" : pt === "infrastructure" ? "Ճանապարհաշինություն" : "Արդյունաբերական"})`);
    onChange(
      "objectDescription",
      `Նախագիծ՝ ${pn}, Հասցե՝ ${pa}, Տևողություն՝ ${dm} ամիս, Երաշխիքային շրջան՝ ${mm} ամիս, TPL ծածկույթ՝ ${tpl ? "Ներառված է" : "Չներառված"}`
    );
    onChange("franchisePercent", 1.0);
    onChange("customTariff", Math.min(2.5, Math.max(0.1, finalTariff)));
  };

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-700 text-white flex items-center justify-center shrink-0 shadow-md">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-cyan-950">Շինմոնտաժային Ռիսկերի Ապահովագրություն (CAR / EAR)</div>
            <div className="text-[11px] text-cyan-800">
              Շինարարական օբյեկտներ, տեխնիկա և 3-րդ անձանց պատասխանատվություն
            </div>
          </div>
        </div>
        <span className="text-[11px] font-bold bg-cyan-200/80 text-cyan-900 px-2.5 py-1 rounded-lg">
          FIDIC / CAR All Risks
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Շինարարական նախագծի անվանում <span className="text-red-500">*</span>
          </label>
          <input
            className="sil-input font-bold"
            value={projectName}
            placeholder="Օր․ «Արևելյան Պլազա» բիզնես կենտրոնի կառուցում"
            onChange={(e) => {
              updateDetail("projectName", e.target.value);
              calculateConstruction(contractValue, durationMonths, projectType, tplIncluded, maintenanceMonths, e.target.value, projectAddress);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Շինարարության հասցե / Շինհրապարակ <span className="text-red-500">*</span>
          </label>
          <input
            className="sil-input font-bold"
            value={projectAddress}
            placeholder="ք․ Երևան, Կոմիտասի պողոտա"
            onChange={(e) => {
              updateDetail("projectAddress", e.target.value);
              calculateConstruction(contractValue, durationMonths, projectType, tplIncluded, maintenanceMonths, projectName, e.target.value);
            }}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Պայմանագրային արժեք ({input.currency}) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            className="sil-input font-bold text-base"
            value={contractValue}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("contractValue", val);
              calculateConstruction(val, durationMonths, projectType, tplIncluded, maintenanceMonths, projectName, projectAddress);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Շինարարության տևողություն (Ամիսներ) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            max="120"
            className="sil-input font-bold"
            value={durationMonths}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("durationMonths", val);
              calculateConstruction(contractValue, val, projectType, tplIncluded, maintenanceMonths, projectName, projectAddress);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Կառույցի տեսակ
          </label>
          <select
            className="sil-input font-bold"
            value={projectType}
            onChange={(e) => {
              updateDetail("projectType", e.target.value);
              calculateConstruction(contractValue, durationMonths, e.target.value, tplIncluded, maintenanceMonths, projectName, projectAddress);
            }}
          >
            <option value="residential">Բնակելի / Հասարակական շենքեր</option>
            <option value="infrastructure">Ճանապարհներ, կամուրջներ, ենթակառուցվածք</option>
            <option value="industrial">Արդյունաբերական գործարան / էներգետիկա</option>
            <option value="complex_hydro">Հիդրոտեխնիկական, թունելներ, բարդ կառույցներ</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Երաշխիքային շրջան (Extended Maintenance)
          </label>
          <select
            className="sil-input font-bold"
            value={maintenanceMonths}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("maintenanceMonths", val);
              calculateConstruction(contractValue, durationMonths, projectType, tplIncluded, val, projectName, projectAddress);
            }}
          >
            <option value={12}>12 ամիս երաշխիքային սպասարկում</option>
            <option value={24}>24 ամիս երաշխիքային սպասարկում</option>
            <option value={0}>Առանց երաշխիքային շրջանի</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            3-րդ անձանց պատասխանատվություն (TPL Շինհրապարակում)
          </label>
          <select
            className="sil-input font-bold"
            value={tplIncluded ? "yes" : "no"}
            onChange={(e) => {
              const val = e.target.value === "yes";
              updateDetail("tplIncluded", val);
              calculateConstruction(contractValue, durationMonths, projectType, val, maintenanceMonths, projectName, projectAddress);
            }}
          >
            <option value="yes">Ներառել TPL ծածկույթը շինհրապարակում</option>
            <option value="no">Չներառել (միայն գույքային CAR)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 5. LIABILITY STEP 2
// -------------------------------------------------------------
function LiabilityStep2({
  input,
  details,
  onChange,
  updateDetail,
  attemptedNext,
}: any) {
  const liabilityType = details.liabilityType || "general_tpl";
  const limit = Number(details.limitOfIndemnity || input.insuredAmount || 20000000);
  const turnover = Number(details.annualTurnover || 100000000);
  const businessField = details.businessField || "Հանրային սնունդ / Ռեստորանային ոլորտ";
  const legalDefense = details.legalDefense !== false;

  const calculateLiability = (lt = liabilityType, lim = limit, to = turnover, bf = businessField, ld = legalDefense) => {
    let baseTariff = 0.35;
    if (lt === "general_tpl") baseTariff = 0.30;
    else if (lt === "employers_el") baseTariff = 0.45;
    else if (lt === "professional_pi") baseTariff = 0.70;
    else if (lt === "product_pl") baseTariff = 0.50;
    else if (lt === "tenants_tpl") baseTariff = 0.25;

    const finalTariff = Number((baseTariff + (ld ? 0.05 : 0)).toFixed(2));

    onChange("insuredAmount", lim);
    onChange("businessActivity", `Պատասխանատվություն (${lt === "general_tpl" ? "Ընդհանուր TPL" : lt === "professional_pi" ? "Մասնագիտական PI" : "Գործատուի EL"})`);
    onChange(
      "objectDescription",
      `Տեսակ՝ ${lt}, Լիմիտ՝ ${lim.toLocaleString()} ֏, Ոլորտ՝ ${bf}, Տարեկան շրջանառություն՝ ${to.toLocaleString()} ֏`
    );
    onChange("franchisePercent", 0.5);
    onChange("customTariff", finalTariff);
  };

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-md">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-purple-950">Քաղաքացիական և Մասնագիտական Պատասխանատվություն</div>
            <div className="text-[11px] text-purple-800">
              TPL, Գործատուի EL, Մասնագիտական PI և Ապրանքի PL ծածկույթներ
            </div>
          </div>
        </div>
        <span className="text-[11px] font-bold bg-purple-200/80 text-purple-900 px-2.5 py-1 rounded-lg">
          Liability Protection
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Պատասխանատվության տեսակ <span className="text-red-500">*</span>
          </label>
          <select
            className="sil-input font-bold"
            value={liabilityType}
            onChange={(e) => {
              updateDetail("liabilityType", e.target.value);
              calculateLiability(e.target.value, limit, turnover, businessField, legalDefense);
            }}
          >
            <option value="general_tpl">Ընդհանուր քաղաքացիական պատասխանատվություն (TPL)</option>
            <option value="employers_el">Գործատուի պատասխանատվություն աշխատակիցների հանդեպ (EL)</option>
            <option value="professional_pi">Մասնագիտական պատասխանատվություն (PI — Բժիշկ, Հաշվապահ, ՏՏ)</option>
            <option value="product_pl">Արտադրանքի որակի պատասխանատվություն (Product Liability)</option>
            <option value="tenants_tpl">Վարձակալի պատասխանատվություն գույքատիրոջ հանդեպ</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Պատասխանատվության սահմանաչափ / Լիմիտ ({input.currency}) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            className="sil-input font-bold text-base"
            value={limit}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("limitOfIndemnity", val);
              calculateLiability(liabilityType, val, turnover, businessField, legalDefense);
            }}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Գործունեության ոլորտ / Մասնագիտություն <span className="text-red-500">*</span>
          </label>
          <input
            className="sil-input font-bold"
            value={businessField}
            placeholder="Օր․ Հանրային սնունդ, Բժշկական կենտրոն, ՏՏ ծառայություններ"
            onChange={(e) => {
              updateDetail("businessField", e.target.value);
              calculateLiability(liabilityType, limit, turnover, e.target.value, legalDefense);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Տարեկան շրջանառություն ({input.currency})
          </label>
          <input
            type="number"
            min="1"
            className="sil-input font-bold"
            value={turnover}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("annualTurnover", val);
              calculateLiability(liabilityType, limit, val, businessField, legalDefense);
            }}
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 6. ACCIDENT STEP 2
// -------------------------------------------------------------
function AccidentStep2({
  input,
  details,
  onChange,
  updateDetail,
  attemptedNext,
}: any) {
  const coverageType = details.coverageType || "24_hours";
  const numberOfPersons = Number(details.numberOfPersons || 1);
  const sumPerPerson = Number(details.sumPerPerson || 3000000);
  const riskClass = details.riskClass || "class_1";

  const calculateAccident = (cov = coverageType, num = numberOfPersons, sumP = sumPerPerson, rc = riskClass) => {
    let baseTariff = 0.35;
    if (rc === "class_1") baseTariff = 0.30;
    else if (rc === "class_2") baseTariff = 0.50;
    else if (rc === "class_3") baseTariff = 0.85;
    else if (rc === "class_4") baseTariff = 1.50;

    const timeMultiplier = cov === "workplace" ? 0.75 : 1.0;
    const finalTariff = Number((baseTariff * timeMultiplier).toFixed(2));
    const totalInsured = sumP * num;

    onChange("insuredAmount", totalInsured);
    onChange("businessActivity", `Դժբախտ պատահարներ (${cov === "24_hours" ? "24/7 շուրջօրյա" : "Աշխատանքային ժամերին"})`);
    onChange(
      "objectDescription",
      `Ապահովագրվածներ՝ ${num} անձ, 1 անձի լիմիտ՝ ${sumP.toLocaleString()} ֏, Ռիսկի դաս՝ ${rc === "class_1" ? "I դաս (Գրասենյակ)" : rc === "class_4" ? "IV դաս (Շինարարություն/Վարորդ)" : "II/III դաս"}`
    );
    onChange("franchisePercent", 0);
    onChange("customTariff", finalTariff);
  };

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-rose-950">Դժբախտ Պատահարների Ապահովագրություն (Accident)</div>
            <div className="text-[11px] text-rose-800">
              Մահ, հաշմանդամություն, ժամանակավոր անաշխատունակություն և բուժծախսեր
            </div>
          </div>
        </div>
        <span className="text-[11px] font-bold bg-rose-200/80 text-rose-900 px-2.5 py-1 rounded-lg">
          24/7 Ծածկույթ
        </span>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Ապահովագրվողների քանակ <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            className="sil-input font-bold"
            value={numberOfPersons}
            onChange={(e) => {
              const val = Math.max(1, Number(e.target.value));
              updateDetail("numberOfPersons", val);
              calculateAccident(coverageType, val, sumPerPerson, riskClass);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            1 անձի ապահովագրական գումար ({input.currency}) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="100000"
            className="sil-input font-bold text-base"
            value={sumPerPerson}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("sumPerPerson", val);
              calculateAccident(coverageType, numberOfPersons, val, riskClass);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Ծածկույթի ռեժիմ
          </label>
          <select
            className="sil-input font-bold"
            value={coverageType}
            onChange={(e) => {
              updateDetail("coverageType", e.target.value);
              calculateAccident(e.target.value, numberOfPersons, sumPerPerson, riskClass);
            }}
          >
            <option value="24_hours">24/7 Շուրջօրյա (ամբողջ աշխարհում)</option>
            <option value="workplace">Միայն աշխատանքային ժամերին (-25%)</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Մասնագիտական ռիսկի դաս
          </label>
          <select
            className="sil-input font-bold"
            value={riskClass}
            onChange={(e) => {
              updateDetail("riskClass", e.target.value);
              calculateAccident(coverageType, numberOfPersons, sumPerPerson, e.target.value);
            }}
          >
            <option value="class_1">I դաս — Գրասենյակային աշխատողներ, ՏՏ, ուսուցիչներ</option>
            <option value="class_2">II դաս — Առևտուր, սպասարկում, թեթև աշխատանք</option>
            <option value="class_3">III դաս — Արտադրություն, արհեստավորներ, պահեստ</option>
            <option value="class_4">IV դաս — Շինարարներ, վարորդներ, բանվորներ, պահնորդներ</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Ֆրանշիզա
          </label>
          <input
            className="sil-input bg-slate-100 text-slate-500 font-bold"
            disabled
            value="0% (Առանց ֆրանշիզայի — 100% հատուցում)"
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 7. AGRO STEP 2
// -------------------------------------------------------------
function AgroStep2({
  input,
  details,
  onChange,
  updateDetail,
  attemptedNext,
}: any) {
  const cropType = details.cropType || "grape";
  const hectares = Number(details.hectares || 2.5);
  const yieldKgPerHa = Number(details.yieldKgPerHa || 12000);
  const pricePerKg = Number(details.pricePerKg || 250);
  const region = details.region || "Արմավիր";
  const antiHailNet = details.antiHailNet === true;
  const subsidyPercent = Number(details.subsidyPercent || 50);

  const calculateAgro = (ct = cropType, ha = hectares, y = yieldKgPerHa, p = pricePerKg, reg = region, net = antiHailNet, sub = subsidyPercent) => {
    const totalHarvestValue = Math.round(ha * y * p);

    let baseTariff = 5.5;
    if (ct === "grape") baseTariff = 6.0;
    else if (ct === "apricot" || ct === "peach") baseTariff = 8.5;
    else if (ct === "grain") baseTariff = 3.5;
    else if (ct === "potato") baseTariff = 4.2;

    if (net) baseTariff *= 0.80; // 20% discount for anti-hail net

    const finalTariff = Number(baseTariff.toFixed(2));

    onChange("currency", "AMD");
    onChange("insuredAmount", totalHarvestValue);
    onChange("businessActivity", `Գյուղատնտեսություն (${ct === "grape" ? "Խաղողագործություն" : ct === "apricot" ? "Ծիրանի այգի" : "Բուսաբուծություն"})`);
    onChange(
      "objectDescription",
      `Մշակաբույս՝ ${ct}, Մակերես՝ ${ha} հա, Մարզ՝ ${reg}, Ակնկալվող բերք՝ ${(ha * y).toLocaleString()} կգ, Պետ․ սուբսիդիա՝ ${sub}%`
    );
    onChange("franchisePercent", 10);
    onChange("customTariff", finalTariff);
  };

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-lime-50 to-emerald-50 border border-lime-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lime-700 text-white flex items-center justify-center shrink-0 shadow-md">
            <Wheat className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-lime-950">Գյուղատնտեսական Ագրոապահովագրություն</div>
            <div className="text-[11px] text-lime-800">
              Պետական 50%-60% սուբսիդավորմամբ կարկուտի, ցրտահարության և հրդեհի ծածկույթ
            </div>
          </div>
        </div>
        <span className="text-[11px] font-bold bg-lime-200/80 text-lime-900 px-2.5 py-1 rounded-lg">
          50% Պետ․ սուբսիդիա
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Մշակաբույս <span className="text-red-500">*</span>
          </label>
          <select
            className="sil-input font-bold"
            value={cropType}
            onChange={(e) => {
              updateDetail("cropType", e.target.value);
              calculateAgro(e.target.value, hectares, yieldKgPerHa, pricePerKg, region, antiHailNet, subsidyPercent);
            }}
          >
            <option value="grape">Խաղող (Տեխնիկական / Սեղանի)</option>
            <option value="apricot">Ծիրան (Կարկուտ + Ցրտահարություն)</option>
            <option value="peach">Դեղձ / Սալոր</option>
            <option value="apple">Խնձոր / Տանձ</option>
            <option value="grain">Հացահատիկ (Ցորեն / Գարի)</option>
            <option value="potato">Կարտոֆիլ</option>
            <option value="vegetables">Բանջարեղեն / Ջերմոց</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Մարզ / Ռիսկի գոտի <span className="text-red-500">*</span>
          </label>
          <select
            className="sil-input font-bold"
            value={region}
            onChange={(e) => {
              updateDetail("region", e.target.value);
              calculateAgro(cropType, hectares, yieldKgPerHa, pricePerKg, e.target.value, antiHailNet, subsidyPercent);
            }}
          >
            <option value="Արմավիր">Արմավիրի մարզ</option>
            <option value="Արարատ">Արարատի մարզ</option>
            <option value="Արագածոտն">Արագածոտնի մարզ</option>
            <option value="Կոտայք">Կոտայքի մարզ</option>
            <option value="Տավուշ">Տավուշի մարզ</option>
            <option value="Վայոց Ձոր">Վայոց Ձորի մարզ</option>
            <option value="Շիրակ">Շիրակի մարզ</option>
            <option value="Լոռի">Լոռու մարզ</option>
            <option value="Սյունիք">Սյունիքի մարզ</option>
            <option value="Գեղարքունիք">Գեղարքունիքի մարզ</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Մակերես (Հեկտար) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            className="sil-input font-bold"
            value={hectares}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("hectares", val);
              calculateAgro(cropType, val, yieldKgPerHa, pricePerKg, region, antiHailNet, subsidyPercent);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Բերքատվություն (կգ/հա) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="100"
            className="sil-input font-bold"
            value={yieldKgPerHa}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("yieldKgPerHa", val);
              calculateAgro(cropType, hectares, val, pricePerKg, region, antiHailNet, subsidyPercent);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            1 կգ սահմանված գին (֏) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="10"
            className="sil-input font-bold"
            value={pricePerKg}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("pricePerKg", val);
              calculateAgro(cropType, hectares, yieldKgPerHa, val, region, antiHailNet, subsidyPercent);
            }}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Հակակարկտային ցանցերի առկայություն
          </label>
          <select
            className="sil-input font-bold"
            value={antiHailNet ? "yes" : "no"}
            onChange={(e) => {
              const val = e.target.value === "yes";
              updateDetail("antiHailNet", val);
              calculateAgro(cropType, hectares, yieldKgPerHa, pricePerKg, region, val, subsidyPercent);
            }}
          >
            <option value="no">Ցանց առկա չէ (Ստանդարտ սակագին)</option>
            <option value="yes">Ցանց առկա է (-20% սակագնային զեղչ)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Պետական սուբսիդավորում (%)
          </label>
          <select
            className="sil-input font-bold"
            value={subsidyPercent}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("subsidyPercent", val);
              calculateAgro(cropType, hectares, yieldKgPerHa, pricePerKg, region, antiHailNet, val);
            }}
          >
            <option value={50}>50% Պետական սուբսիդավորում</option>
            <option value={60}>60% Պետական սուբսիդավորում (Սահմանամերձ գոտի)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 8. FINANCIAL & BONDS STEP 2
// -------------------------------------------------------------
function FinancialStep2({
  input,
  details,
  onChange,
  updateDetail,
  attemptedNext,
}: any) {
  const bondType = details.bondType || "bid_bond";
  const bondAmount = Number(details.bondAmount || input.insuredAmount || 10000000);
  const durationMonths = Number(details.durationMonths || 6);
  const collateralType = details.collateralType || "unsecured";
  const beneficiary = details.beneficiary || "ՀՀ Պետական մարմին (Պետգնումներ)";

  const calculateFinancial = (bt = bondType, amt = bondAmount, dm = durationMonths, col = collateralType, ben = beneficiary) => {
    let annualRate = 1.2;
    if (bt === "bid_bond") annualRate = 1.0;
    else if (bt === "performance_bond") annualRate = 1.8;
    else if (bt === "advance_payment") annualRate = 2.2;
    else if (bt === "maintenance_bond") annualRate = 1.4;

    if (col === "cash_deposit") annualRate *= 0.60;
    else if (col === "real_estate") annualRate *= 0.80;

    const termRate = Number((annualRate * (dm / 12)).toFixed(2));

    onChange("insuredAmount", amt);
    onChange("businessActivity", `Ֆինանսական երաշխիք (${bt === "bid_bond" ? "Տենդերային" : bt === "performance_bond" ? "Կատարման երաշխիք" : "Կանխավճարի"})`);
    onChange(
      "objectDescription",
      `Երաշխիքի տեսակ՝ ${bt}, Գումար՝ ${amt.toLocaleString()} ֏, Ժամկետ՝ ${dm} ամիս, Շահառու՝ ${ben}, Ապահովում՝ ${col}`
    );
    onChange("franchisePercent", 0);
    onChange("customTariff", Math.max(0.2, termRate));
  };

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-700 text-white flex items-center justify-center shrink-0 shadow-md">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-sky-950">Ֆինանսական Ռիսկեր և Բանկային Երաշխիքներ (Bonds)</div>
            <div className="text-[11px] text-sky-800">
              Տենդերային, պայմանագրի պատշաճ կատարման և կանխավճարի վերադարձի երաշխիքներ
            </div>
          </div>
        </div>
        <span className="text-[11px] font-bold bg-sky-200/80 text-sky-900 px-2.5 py-1 rounded-lg">
          Official Bond / Guarantee
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Երաշխիքի տեսակ <span className="text-red-500">*</span>
          </label>
          <select
            className="sil-input font-bold"
            value={bondType}
            onChange={(e) => {
              updateDetail("bondType", e.target.value);
              calculateFinancial(e.target.value, bondAmount, durationMonths, collateralType, beneficiary);
            }}
          >
            <option value="bid_bond">Տենդերային մասնակցության երաշխիք (Bid Bond)</option>
            <option value="performance_bond">Պայմանագրի պատշաճ կատարման երաշխիք (Performance Bond)</option>
            <option value="advance_payment">Կանխավճարի վերադարձի երաշխիք (Advance Payment Bond)</option>
            <option value="maintenance_bond">Որակի / Երաշխիքային ժամկետի երաշխիք (Maintenance Bond)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Երաշխիքի գումար ({input.currency}) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            className="sil-input font-bold text-base"
            value={bondAmount}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("bondAmount", val);
              calculateFinancial(bondType, val, durationMonths, collateralType, beneficiary);
            }}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Գործողության ժամկետ (Ամիսներ) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            max="60"
            className="sil-input font-bold"
            value={durationMonths}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("durationMonths", val);
              calculateFinancial(bondType, bondAmount, val, collateralType, beneficiary);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Ապահովման միջոց (Գրավ / Դեպոզիտ)
          </label>
          <select
            className="sil-input font-bold"
            value={collateralType}
            onChange={(e) => {
              updateDetail("collateralType", e.target.value);
              calculateFinancial(bondType, bondAmount, durationMonths, e.target.value, beneficiary);
            }}
          >
            <option value="unsecured">Առանց գրավի (Բլանկային)</option>
            <option value="cash_deposit">Դրամական ավանդի գրավ (-40% զեղչ)</option>
            <option value="real_estate">Անշարժ գույքի գրավ (-20% զեղչ)</option>
            <option value="corporate_guarantee">Ընկերության հիմնադրի երաշխավորություն</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Պատվիրատու / Շահառու
          </label>
          <input
            className="sil-input font-bold"
            value={beneficiary}
            placeholder="Օր․ ՀՀ Ֆինանսների նախարարություն"
            onChange={(e) => {
              updateDetail("beneficiary", e.target.value);
              calculateFinancial(bondType, bondAmount, durationMonths, collateralType, e.target.value);
            }}
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 9. MORTGAGE STEP 2
// -------------------------------------------------------------
function MortgageStep2({
  input,
  details,
  onChange,
  updateDetail,
  attemptedNext,
}: any) {
  const loanBalance = Number(details.loanBalance || input.insuredAmount || 25000000);
  const program = details.program || "nmc_package";
  const propertyType = details.propertyType || "apartment";
  const bankName = details.bankName || "Արդշինբանկ";

  const calculateMortgage = (lb = loanBalance, pr = program, pt = propertyType, b = bankName) => {
    let finalTariff = 0.33;
    if (pr === "nmc_package") finalTariff = 0.33; // Package I (NMC)
    else if (pr === "hfy_package") finalTariff = 0.43; // Package II (HFY)
    else if (pr === "commercial") finalTariff = 0.35;

    onChange("currency", "AMD");
    onChange("insuredAmount", lb);
    onChange("businessActivity", `Հիփոթեքային վարկառու (${pr === "nmc_package" ? "Փաթեթ I (ԱՀԸ)" : pr === "hfy_package" ? "Փաթեթ II (ԲԵ)" : "Ստանդարտ բանկային"})`);
    onChange(
      "objectDescription",
      `Գրավադրված գույք՝ ${pt === "apartment" ? "Բնակարան" : "Առանձնատուն"}, Վարկառու Բանկ՝ ${b}, Վարկի մնացորդ՝ ${lb.toLocaleString()} ֏`
    );
    onChange("franchisePercent", 0);
    onChange("customTariff", finalTariff);
  };

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-indigo-950">Հիփոթեքային Վարկառուների Ապահովագրություն</div>
            <div className="text-[11px] text-indigo-800">
              ԱՀԸ (0.33%), ԲԵ (0.43%) և Կոմերցիոն բանկերի համալիր փաթեթներ
            </div>
          </div>
        </div>
        <span className="text-[11px] font-bold bg-indigo-200/80 text-indigo-900 px-2.5 py-1 rounded-lg">
          ԱՀԸ / ԲԵ Փաթեթներ
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Հիփոթեքային ծրագիր / Փաթեթ <span className="text-red-500">*</span>
          </label>
          <select
            className="sil-input font-bold"
            value={program}
            onChange={(e) => {
              updateDetail("program", e.target.value);
              calculateMortgage(loanBalance, e.target.value, propertyType, bankName);
            }}
          >
            <option value="nmc_package">Փաթեթ I (ԱՀԸ - Ազգային Հիփոթեքային Ընկերություն 0.33%)</option>
            <option value="hfy_package">Փաթեթ II (ԲԵ - Բնակարան Երիտասարդներին 0.43%)</option>
            <option value="commercial">Կոմերցիոն Բանկային ստանդարտ փաթեթ (0.35%)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Վարկի մնացորդային գումար (֏) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            className="sil-input font-bold text-base"
            value={loanBalance}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("loanBalance", val);
              calculateMortgage(val, program, propertyType, bankName);
            }}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Գրավադրված գույքի տեսակ
          </label>
          <select
            className="sil-input font-bold"
            value={propertyType}
            onChange={(e) => {
              updateDetail("propertyType", e.target.value);
              calculateMortgage(loanBalance, program, e.target.value, bankName);
            }}
          >
            <option value="apartment">Բնակարան բազմաբնակարան շենքում</option>
            <option value="house">Առանձնատուն / Բնակելի տուն</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Գրավառու Բանկ / Վարկային կազմակերպություն
          </label>
          <input
            className="sil-input font-bold"
            value={bankName}
            placeholder="Օր․ Արդշինբանկ, Ամերիաբանկ, Ինեկոբանկ"
            onChange={(e) => {
              updateDetail("bankName", e.target.value);
              calculateMortgage(loanBalance, program, propertyType, e.target.value);
            }}
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 10. AVIATION STEP 2
// -------------------------------------------------------------
function AviationStep2({
  input,
  details,
  onChange,
  updateDetail,
  attemptedNext,
}: any) {
  const aviationType = details.aviationType || "commercial_drone";
  const aircraftValue = Number(details.aircraftValue || input.insuredAmount || 5000000);
  const aircraftModel = details.aircraftModel || "DJI Matrice 300 RTK";
  const flightHours = Number(details.flightHours || 250);

  const calculateAviation = (at = aviationType, val = aircraftValue, model = aircraftModel, fh = flightHours) => {
    let baseTariff = 3.0;
    if (at === "commercial_drone") baseTariff = 3.2;
    else if (at === "aircraft_hull") baseTariff = 1.4;
    else if (at === "helicopter") baseTariff = 1.8;
    else if (at === "aviation_tpl") baseTariff = 0.35;

    const finalTariff = Number(baseTariff.toFixed(2));

    onChange("insuredAmount", val);
    onChange("businessActivity", `Ավիացիա (${at === "commercial_drone" ? "Կոմերցիոն դրոն/ԱԹՍ" : at === "aircraft_hull" ? "Օդանավ Hull" : "Ուղղաթիռ"})`);
    onChange(
      "objectDescription",
      `Տեսակ՝ ${at}, Մոդել՝ ${model}, Օդաչուի փորձ՝ ${fh} ժամ, Ծածկույթ՝ ԿԱՍԿՈ Hull + TPL`
    );
    onChange("franchisePercent", 1.0);
    onChange("customTariff", finalTariff);
  };

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-sky-50 border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-md">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-950">Ավիացիոն Ռիսկերի և Դրոնների Ապահովագրություն</div>
            <div className="text-[11px] text-slate-700">
              Օդանավեր, ուղղաթիռներ, կոմերցիոն ԱԹՍ-ներ և ավիացիոն TPL
            </div>
          </div>
        </div>
        <span className="text-[11px] font-bold bg-slate-200 text-slate-900 px-2.5 py-1 rounded-lg">
          Aviation & Drone Hull
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Ավիացիոն օբյեկտի տեսակ <span className="text-red-500">*</span>
          </label>
          <select
            className="sil-input font-bold"
            value={aviationType}
            onChange={(e) => {
              updateDetail("aviationType", e.target.value);
              calculateAviation(e.target.value, aircraftValue, aircraftModel, flightHours);
            }}
          >
            <option value="commercial_drone">Կոմերցիոն Անօդաչու թռչող սարք (Դրոն / UAV)</option>
            <option value="aircraft_hull">Մարդատար / Բիզնես օդանավ (Hull ԿԱՍԿՈ)</option>
            <option value="helicopter">Ուղղաթիռ (Helicopter Hull)</option>
            <option value="aviation_tpl">Ավիացիոն քաղաքացիական պատասխանատվություն (TPL)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Ապահովագրական արժեք ({input.currency}) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            className="sil-input font-bold text-base"
            value={aircraftValue}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("aircraftValue", val);
              calculateAviation(aviationType, val, aircraftModel, flightHours);
            }}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Թռչող սարքի մոդել և սերիական համար
          </label>
          <input
            className="sil-input font-bold"
            value={aircraftModel}
            placeholder="Օր․ DJI Matrice 300 RTK (S/N: 1581F)"
            onChange={(e) => {
              updateDetail("aircraftModel", e.target.value);
              calculateAviation(aviationType, aircraftValue, e.target.value, flightHours);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Օդաչուի թռիչքային փորձ (ժամեր)
          </label>
          <input
            type="number"
            min="1"
            className="sil-input font-bold"
            value={flightHours}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("flightHours", val);
              calculateAviation(aviationType, aircraftValue, aircraftModel, val);
            }}
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 11. BUNDLE STEP 2
// -------------------------------------------------------------
function BundleStep2({
  input,
  details,
  onChange,
  updateDetail,
  attemptedNext,
}: any) {
  const propertyVal = Number(details.bundlePropertyVal || 50000000);
  const liabilityVal = Number(details.bundleLiabilityVal || 15000000);
  const cargoVal = Number(details.bundleCargoVal || 0);
  const accidentVal = Number(details.bundleAccidentVal || 10000000);

  const calculateBundle = (pv = propertyVal, lv = liabilityVal, cv = cargoVal, av = accidentVal) => {
    let count = 0;
    if (pv > 0) count++;
    if (lv > 0) count++;
    if (cv > 0) count++;
    if (av > 0) count++;

    const discount = count >= 4 ? 0.20 : count === 3 ? 0.15 : count === 2 ? 0.10 : 0;
    const totalAmount = pv + lv + cv + av;

    onChange("insuredAmount", totalAmount);
    onChange("businessActivity", "Կորպորատիվ համալիր գործունեություն");
    onChange(
      "objectDescription",
      `Համալիր փաթեթ՝ Գույք (${pv.toLocaleString()} ֏) + Պատասխանատվություն (${lv.toLocaleString()} ֏) + ԴՊ (${av.toLocaleString()} ֏) ${cv > 0 ? `+ Բեռ (${cv.toLocaleString()} ֏)` : ""}, Փաթեթային զեղչ՝ ${(discount * 100)}%`
    );
    onChange("franchisePercent", 0.5);
    onChange("customTariff", 0.35 * (1 - discount));
  };

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-teal-950">Կորպորատիվ Համալիր Փաթեթ (Corporate Bundle)</div>
            <div className="text-[11px] text-teal-800">
              Միավորեք գույքը, պատասխանատվությունը, բեռները և աշխատակիցներին մինչև 20% փաթեթային զեղչով
            </div>
          </div>
        </div>
        <span className="text-[11px] font-bold bg-teal-200/80 text-teal-900 px-2.5 py-1 rounded-lg">
          Մինչև 20% Զեղչ
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            1. Գույքային ապահովագրության գումար (֏)
          </label>
          <input
            type="number"
            min="0"
            className="sil-input font-bold"
            value={propertyVal}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("bundlePropertyVal", val);
              calculateBundle(val, liabilityVal, cargoVal, accidentVal);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            2. Պատասխանատվության ծածկույթի լիմիտ (֏)
          </label>
          <input
            type="number"
            min="0"
            className="sil-input font-bold"
            value={liabilityVal}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("bundleLiabilityVal", val);
              calculateBundle(propertyVal, val, cargoVal, accidentVal);
            }}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            3. Աշխատակիցների Դժբախտ պատահարներ / Առողջություն (֏)
          </label>
          <input
            type="number"
            min="0"
            className="sil-input font-bold"
            value={accidentVal}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("bundleAccidentVal", val);
              calculateBundle(propertyVal, liabilityVal, cargoVal, val);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            4. Բեռների փոխադրման գումար (կամընտիր) (֏)
          </label>
          <input
            type="number"
            min="0"
            className="sil-input font-bold"
            value={cargoVal}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateDetail("bundleCargoVal", val);
              calculateBundle(propertyVal, liabilityVal, val, accidentVal);
            }}
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 12. GENERIC / PROPERTY STEP 2
// -------------------------------------------------------------
function LegacyPropertyOnlyStep2({
  input,
  details,
  onChange,
  updateDetail,
  attemptedNext,
}: any) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Ապահովագրական գումար ({input.currency}) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={input.insuredAmount || ""}
            onChange={(e) => onChange("insuredAmount", Number(e.target.value))}
            className={`sil-input text-base font-bold ${
              attemptedNext && (!input.insuredAmount || input.insuredAmount <= 0)
                ? "border-red-400 bg-red-50/40"
                : ""
            }`}
            placeholder="0"
          />
          {attemptedNext && (!input.insuredAmount || input.insuredAmount <= 0) && (
            <span className="text-[11px] text-red-600 mt-1 block">Գումարը պետք է լինի 0-ից մեծ</span>
          )}
          {input.insuredAmount > 0 && (
            <span className="text-[11px] text-slate-500 mt-1 block">
              {input.insuredAmount.toLocaleString("hy-AM")} {input.currency}
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Գործունեության / շահագործման տեսակ <span className="text-red-500">*</span>
          </label>
          <input
            value={input.businessActivity}
            onChange={(e) => onChange("businessActivity", e.target.value)}
            className={`sil-input ${
              attemptedNext && (!input.businessActivity.trim() || input.businessActivity.trim().length < 2)
                ? "border-red-400 bg-red-50/40"
                : ""
            }`}
            placeholder="Օր․ արտադրություն, պահեստ, գրասենյակ, առևտուր"
          />
          {attemptedNext && (!input.businessActivity.trim() || input.businessActivity.trim().length < 2) && (
            <span className="text-[11px] text-red-600 mt-1 block">Նշեք գործունեության ոլորտը</span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Ապահովագրվող օբյեկտի նկարագրություն և հասցե <span className="text-red-500">*</span>
        </label>
        <textarea
          value={input.objectDescription}
          onChange={(e) => onChange("objectDescription", e.target.value)}
          rows={3}
          className={`sil-input w-full min-h-[90px] ${
            attemptedNext && (!input.objectDescription.trim() || input.objectDescription.trim().length < 3)
              ? "border-red-400 bg-red-50/40"
              : ""
          }`}
          placeholder="Օբյեկտի հասցե, շինության տեսակ, սարքավորումներ, բեռի երթուղի կամ այլ մանրամասներ..."
        />
        {attemptedNext && (!input.objectDescription.trim() || input.objectDescription.trim().length < 3) && (
          <span className="text-[11px] text-red-600 mt-1 block">
            Լրացրեք օբյեկտի հասցեն կամ նկարագրությունը (առնվազն 3 նիշ)
          </span>
        )}
      </div>
    </div>
  );
}
