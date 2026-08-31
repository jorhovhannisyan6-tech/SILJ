import React, { useState, useMemo, useEffect } from "react";
import {
  Building,
  Home,
  Briefcase,
  Warehouse,
  MapPin,
  Sparkles,
  ExternalLink,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Info,
  Maximize2,
  Layers,
  Check,
  Sliders,
  ArrowRight,
  RefreshCw,
  Hammer,
  FileCheck2,
  Camera,
} from "lucide-react";
import { PropertyPhotoScannerModal } from "./PropertyPhotoScannerModal";
import {
  ARMENIAN_REGIONS_AND_DISTRICTS,
  PROPERTY_TYPES,
  BUILDING_STRUCTURES,
  RENOVATION_CONDITIONS,
  USD_TO_AMD_PROPERTY_RATE,
  type PropertyType,
} from "../../data/propertyMarketData";
import {
  estimatePropertyMarketValue,
  type PropertyValuationInput,
  type PropertyValuationResult,
} from "../../utils/propertyValuationEngine";

interface Props {
  initialDistrictId?: string;
  initialPropertyType?: PropertyType;
  initialArea?: number;
  onApplyToPropertyInsurance?: (data: {
    propertyType: PropertyType;
    districtName: string;
    subDistrict?: string;
    areaSqm: number;
    marketValueUSD: number;
    marketValueAMD: number;
    constructiveValueAMD: number;
    finishingValueAMD: number;
    movablesValueAMD: number;
  }) => void;
  isEmbedded?: boolean;
}

export function ListAmPropertyValuationCalculator({
  initialDistrictId = "kentron",
  initialPropertyType = "apartment",
  initialArea = 85,
  onApplyToPropertyInsurance,
  isEmbedded = false,
}: Props) {
  const [propertyType, setPropertyType] = useState<PropertyType>(initialPropertyType);
  const [districtId, setDistrictId] = useState<string>(initialDistrictId);
  const [subDistrict, setSubDistrict] = useState<string>("");
  const [areaSqm, setAreaSqm] = useState<number>(initialArea);
  const [landAreaSqm, setLandAreaSqm] = useState<number>(300);

  const [buildingStructure, setBuildingStructure] = useState<"monolith" | "stone" | "panel" | "other">(
    "monolith"
  );
  const [renovationCondition, setRenovationCondition] = useState<
    "designer" | "euro" | "good" | "needs_renovation" | "zero_shell"
  >("euro");

  const [floor, setFloor] = useState<number>(4);
  const [totalFloors, setTotalFloors] = useState<number>(14);

  const [hasFurnitureAndTech, setHasFurnitureAndTech] = useState<boolean>(true);
  const [hasParkingOrGarage, setHasParkingOrGarage] = useState<boolean>(false);
  const [hasIndividualHeating, setHasIndividualHeating] = useState<boolean>(true);
  const [hasPanoramicViewOrBalcony, setHasPanoramicViewOrBalcony] = useState<boolean>(true);

  const [currency, setCurrency] = useState<"USD" | "AMD">("USD");
  const [showPhotoScanner, setShowPhotoScanner] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiCommentary, setAiCommentary] = useState<string | null>(null);
  const [aiValuationData, setAiValuationData] = useState<{
    pricePerSqmUSD: number;
    pricePerSqmAMD: number;
    totalMarketValueUSD: number;
    totalMarketValueAMD: number;
    minMarketValueUSD: number;
    minMarketValueAMD: number;
    maxMarketValueUSD: number;
    maxMarketValueAMD: number;
    liquidity: string;
    marketTrendDescription: string;
    isAiSourced: boolean;
  } | null>(null);

  // Selected district object
  const currentDistrict = useMemo(() => {
    return (
      ARMENIAN_REGIONS_AND_DISTRICTS.find((d) => d.id === districtId) ||
      ARMENIAN_REGIONS_AND_DISTRICTS[0]
    );
  }, [districtId]);

  // Baseline Valuation Result (Deterministic)
  const baselineValuation: PropertyValuationResult = useMemo(() => {
    const input: PropertyValuationInput = {
      propertyType,
      districtId,
      subDistrict,
      areaSqm: Number(areaSqm) || 50,
      landAreaSqm: Number(landAreaSqm) || 0,
      buildingStructure,
      renovationCondition,
      floor: Number(floor) || 1,
      totalFloors: Number(totalFloors) || 1,
      hasFurnitureAndTech,
      hasParkingOrGarage,
      hasIndividualHeating,
      hasPanoramicViewOrBalcony,
      currency,
    };
    return estimatePropertyMarketValue(input);
  }, [
    propertyType,
    districtId,
    subDistrict,
    areaSqm,
    landAreaSqm,
    buildingStructure,
    renovationCondition,
    floor,
    totalFloors,
    hasFurnitureAndTech,
    hasParkingOrGarage,
    hasIndividualHeating,
    hasPanoramicViewOrBalcony,
    currency,
  ]);

  // Effective Valuation (AI-sourced if available, otherwise baseline)
  const valuation = useMemo(() => {
    if (aiValuationData) {
      const totalUSD = aiValuationData.totalMarketValueUSD;
      const totalAMD = aiValuationData.totalMarketValueAMD;

      const constructiveValueAMD = Math.round(totalAMD * 0.65);
      const finishingValueAMD = Math.round(totalAMD * 0.25);
      const movablesValueAMD = hasFurnitureAndTech ? Math.round(totalAMD * 0.10) : 0;

      const constructiveValueUSD = Math.round(totalUSD * 0.65);
      const finishingValueUSD = Math.round(totalUSD * 0.25);
      const movablesValueUSD = hasFurnitureAndTech ? Math.round(totalUSD * 0.10) : 0;

      return {
        ...baselineValuation,
        pricePerSqmUSD: aiValuationData.pricePerSqmUSD,
        pricePerSqmAMD: aiValuationData.pricePerSqmAMD,
        totalMarketValueUSD: totalUSD,
        totalMarketValueAMD: totalAMD,
        minMarketValueUSD: aiValuationData.minMarketValueUSD,
        minMarketValueAMD: aiValuationData.minMarketValueAMD,
        maxMarketValueUSD: aiValuationData.maxMarketValueUSD,
        maxMarketValueAMD: aiValuationData.maxMarketValueAMD,
        marketTrendDescription: aiValuationData.marketTrendDescription,
        insuranceBreakdown: {
          constructiveValueUSD,
          constructiveValueAMD,
          finishingValueUSD,
          finishingValueAMD,
          movablesValueUSD,
          movablesValueAMD,
        },
        isAiSourced: true,
      };
    }
    return { ...baselineValuation, isAiSourced: false };
  }, [baselineValuation, aiValuationData, hasFurnitureAndTech]);

  // Fetch AI real estate market insights from Gemini
  const fetchAiInsight = async () => {
    setIsAiLoading(true);
    try {
      const token = localStorage.getItem("sil-auth-token") || localStorage.getItem("sil-session-token");
      const res = await fetch("/api/valuation/property-market-value", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          propertyType: PROPERTY_TYPES.find((p) => p.id === propertyType)?.label || propertyType,
          districtName: currentDistrict.nameArm,
          subDistrict,
          areaSqm,
          buildingStructure:
            BUILDING_STRUCTURES.find((b) => b.id === buildingStructure)?.label || buildingStructure,
          renovationCondition:
            RENOVATION_CONDITIONS.find((r) => r.id === renovationCondition)?.label || renovationCondition,
          floor,
          totalFloors,
          hasFurnitureAndTech,
          hasParkingOrGarage,
          hasIndividualHeating,
          hasPanoramicViewOrBalcony,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.aiCommentary) {
          setAiCommentary(json.aiCommentary);
        }
        if (json.estimatedPricePerSqmUSD || json.estimatedTotalUSD) {
          const rateAMD = USD_TO_AMD_PROPERTY_RATE;
          const perSqmUSD = json.estimatedPricePerSqmUSD || baselineValuation.pricePerSqmUSD;
          const perSqmAMD = Math.round(perSqmUSD * rateAMD);
          const totalUSD = json.estimatedTotalUSD || Math.round(perSqmUSD * (Number(areaSqm) || 50));
          const totalAMD = Math.round(totalUSD * rateAMD);
          const minUSD = json.minTotalUSD || Math.round(totalUSD * 0.9);
          const minAMD = Math.round(minUSD * rateAMD);
          const maxUSD = json.maxTotalUSD || Math.round(totalUSD * 1.1);
          const maxAMD = Math.round(maxUSD * rateAMD);

          setAiValuationData({
            pricePerSqmUSD: perSqmUSD,
            pricePerSqmAMD: perSqmAMD,
            totalMarketValueUSD: totalUSD,
            totalMarketValueAMD: totalAMD,
            minMarketValueUSD: minUSD,
            minMarketValueAMD: minAMD,
            maxMarketValueUSD: maxUSD,
            maxMarketValueAMD: maxAMD,
            liquidity: json.liquidity || "Բարձր",
            marketTrendDescription: json.marketTrendDescription || `List.am-ի տվյալներով ${currentDistrict.nameArm} շրջանում գները գնահատվել են ԱԲ-ով։`,
            isAiSourced: true,
          });
        }
      }
    } catch (e) {
      console.warn("Property AI insight error:", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Auto-fetch AI valuation on mount & key parameter changes
  useEffect(() => {
    fetchAiInsight();
  }, [propertyType, districtId, areaSqm, buildingStructure, renovationCondition]);

  const formatMoney = (amountUSD: number, amountAMD: number) => {
    if (currency === "USD") {
      return `$${amountUSD.toLocaleString()}`;
    }
    return `${amountAMD.toLocaleString()} ֏`;
  };

  return (
    <div className={`space-y-6 ${isEmbedded ? "p-3 sm:p-5" : ""}`}>
      {/* Valuation Header */}
      {!isEmbedded && (
        <div className="bg-gradient-to-r from-[#061A40] via-[#092B6B] to-[#0A4EA3] rounded-[24px] p-6 sm:p-8 text-white shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-200 text-xs font-bold mb-2">
                <Building className="w-3.5 h-3.5" />
                <span>List.am Անշարժ Գույքի Գնահատիչ & Վերլուծություն</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-extrabold">
                Անշարժ Գույքի Շուկայական Արժեքի Հաշվիչ
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-blue-100 max-w-3xl">
                Հաշվարկեք բնակարանի, առանձնատան կամ կոմերցիոն տարածքի իրական շուկայական գինը ըստ Երևանի վարչական շրջանների և ՀՀ մարզերի տվյալների։
              </p>
            </div>

            {/* Currency Switcher */}
            <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/20">
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  currency === "USD" ? "bg-white text-slate-900 shadow-md" : "text-white hover:bg-white/10"
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency("AMD")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  currency === "AMD" ? "bg-white text-slate-900 shadow-md" : "text-white hover:bg-white/10"
                }`}
              >
                AMD (֏)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Parameters on Left, Valuation on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_.85fr] gap-6">
        {/* Left Card: Input Parameters */}
        <div className="sil-card p-5 sm:p-7 space-y-6">
          {/* Property Type Tabs */}
          <div>
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-2.5">
              1. Գույքի Տեսակը
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PROPERTY_TYPES.map((pt) => {
                const isSelected = propertyType === pt.id;
                let Icon = Home;
                if (pt.id === "apartment") Icon = Building;
                if (pt.id === "commercial") Icon = Briefcase;
                if (pt.id === "warehouse") Icon = Warehouse;
                if (pt.id === "land") Icon = Maximize2;

                return (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => setPropertyType(pt.id)}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-[#EDF5FF] border-[#075bd5] text-[#075bd5] font-extrabold shadow-sm ring-1 ring-[#075bd5]/30"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? "text-[#075bd5]" : "text-slate-500"}`} />
                    <span className="text-xs">{pt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* District & Location Selection */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#075bd5]" />
                Վարչական շրջան / Տարածաշրջան *
              </label>
              <select
                className="sil-input font-medium"
                value={districtId}
                onChange={(e) => {
                  setDistrictId(e.target.value);
                  setSubDistrict("");
                }}
              >
                <optgroup label="🏢 Երևանի Վարչական Շրջաններ">
                  {ARMENIAN_REGIONS_AND_DISTRICTS.filter((d) => d.isYerevan).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameArm} (միջինը՝ ${d.baseApartmentPricePerSqmUSD}/քմ)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🏔️ ՀՀ Մարզեր և Քաղաքներ">
                  {ARMENIAN_REGIONS_AND_DISTRICTS.filter((d) => !d.isYerevan).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameArm} (միջինը՝ ${d.baseApartmentPricePerSqmUSD}/քմ)
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Sub-district / Street / Landmark */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Ենթաշրջան / Փողոց / Թաղամաս
              </label>
              <input
                className="sil-input"
                placeholder="Օր․՝ Փոքր Կենտրոն, Կոմիտաս, 2-րդ թաղամաս"
                value={subDistrict}
                onChange={(e) => setSubDistrict(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Sub-districts suggestions */}
          {currentDistrict.popularSubDistricts && currentDistrict.popularSubDistricts.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Հայտնի գոտիներ՝</span>
              {currentDistrict.popularSubDistricts.map((sd) => (
                <button
                  key={sd}
                  type="button"
                  onClick={() => setSubDistrict(sd)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                    subDistrict === sd
                      ? "bg-blue-600 text-white border-blue-600 font-bold"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {sd}
                </button>
              ))}
            </div>
          )}

          {/* Area & Land Area */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Շինության մակերես (քառակուսի մետր) *
                </label>
                <span className="text-xs font-black text-[#075bd5]">{areaSqm} քմ</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="10"
                  max="10000"
                  className="sil-input font-bold flex-1"
                  value={areaSqm || ""}
                  onChange={(e) => setAreaSqm(Number(e.target.value))}
                />
                <span className="inline-flex items-center px-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
                  քմ
                </span>
              </div>
              {/* Quick Area Pills */}
              <div className="flex flex-wrap gap-1 mt-2">
                {[45, 65, 85, 110, 150, 220].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAreaSqm(preset)}
                    className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${
                      areaSqm === preset
                        ? "bg-[#075bd5] text-white border-[#075bd5]"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {preset} քմ
                  </button>
                ))}
              </div>
            </div>

            {/* Land Area for Private Houses or Land */}
            {(propertyType === "house" || propertyType === "land") && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Հողամասի մակերես (քառակուսի մետր)
                  </label>
                  <span className="text-xs font-black text-emerald-700">{landAreaSqm} քմ</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="50000"
                    className="sil-input font-bold flex-1"
                    value={landAreaSqm || ""}
                    onChange={(e) => setLandAreaSqm(Number(e.target.value))}
                  />
                  <span className="inline-flex items-center px-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
                    քմ հող
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  1 քմ հողի միջին արժեքը այս գոտում՝ ${currentDistrict.baseLandPricePerSqmUSD}
                </div>
              </div>
            )}
          </div>

          {/* Building Structure & Renovation Condition */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#075bd5]" />
                Շենքի Կառուցվածք / Տիպ
              </label>
              <select
                className="sil-input font-medium"
                value={buildingStructure}
                onChange={(e) => setBuildingStructure(e.target.value as any)}
              >
                {BUILDING_STRUCTURES.map((bs) => (
                  <option key={bs.id} value={bs.id}>
                    {bs.label} ({bs.multiplier >= 1 ? `+${Math.round((bs.multiplier - 1) * 100)}%` : `-${Math.round((1 - bs.multiplier) * 100)}%`})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Hammer className="w-3.5 h-3.5 text-[#075bd5]" />
                  Վերանորոգման Վիճակ
                </label>
                <button
                  type="button"
                  onClick={() => setShowPhotoScanner(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-purple-600" />
                  <span>AI Ֆոտո-Սկանավորում</span>
                </button>
              </div>
              <select
                className="sil-input font-medium"
                value={renovationCondition}
                onChange={(e) => setRenovationCondition(e.target.value as any)}
              >
                {RENOVATION_CONDITIONS.map((rc) => (
                  <option key={rc.id} value={rc.id}>
                    {rc.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Floor Position for Apartments */}
          {propertyType === "apartment" && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Հարկ</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  className="sil-input"
                  value={floor}
                  onChange={(e) => setFloor(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Շենքի ընդհանուր հարկեր</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  className="sil-input"
                  value={totalFloors}
                  onChange={(e) => setTotalFloors(Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* Amenities and Special Features */}
          <div>
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-2.5">
              Լրացուցիչ Հարմարություններ և Կահավորում
            </label>
            <div className="grid sm:grid-cols-2 gap-2.5">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={hasFurnitureAndTech}
                  onChange={(e) => setHasFurnitureAndTech(e.target.checked)}
                  className="rounded text-blue-600 w-4 h-4"
                />
                <span>🛋️ Կահույք և կենցաղային տեխնիկա</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={hasParkingOrGarage}
                  onChange={(e) => setHasParkingOrGarage(e.target.checked)}
                  className="rounded text-blue-600 w-4 h-4"
                />
                <span>🚗 Ստորգետնյա պարկինգ / Գարաժ</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={hasIndividualHeating}
                  onChange={(e) => setHasIndividualHeating(e.target.checked)}
                  className="rounded text-blue-600 w-4 h-4"
                />
                <span>🔥 Անհատական ջեռուցում (Baxi / Կաթսա)</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={hasPanoramicViewOrBalcony}
                  onChange={(e) => setHasPanoramicViewOrBalcony(e.target.checked)}
                  className="rounded text-blue-600 w-4 h-4"
                />
                <span>🌅 Պանորամային տեսարան / Բաց պատշգամբ</span>
              </label>
            </div>
          </div>

          {/* AI Market Insight Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={fetchAiInsight}
              disabled={isAiLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              {isAiLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Վերլուծվում է List.am-ի անշարժ գույքի շուկան...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Ստանալ AI Շուկայական Գնահատական և Վերլուծություն</span>
                </>
              )}
            </button>

            {aiCommentary && (
              <div className="mt-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5 shadow-sm">
                <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>AI Շուկայական Խորհրդատվություն (List.am)</span>
                </div>
                <p className="leading-relaxed whitespace-pre-line text-amber-900/90">{aiCommentary}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Valuation Results & Underwriting Breakdown */}
        <div className="space-y-5">
          {/* Main Price Card */}
          <div className="sil-card p-5 sm:p-6 bg-gradient-to-b from-white to-blue-50/40 border-[#075bd5]/20 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2 flex-wrap">
              <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Շուկայական Գնահատում</span>
              </div>
              <div className="flex items-center gap-1.5">
                {valuation.isAiSourced && (
                  <span className="text-[10px] bg-indigo-100 text-indigo-900 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                    🤖 ԱԲ (Gemini) / List.am
                  </span>
                )}
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    valuation.liquidity === "high" || valuation.liquidity === "Բարձր"
                      ? "bg-emerald-100 text-emerald-800"
                      : valuation.liquidity === "moderate" || valuation.liquidity === "Միջին"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {typeof valuation.liquidity === "string" ? valuation.liquidity : valuation.liquidityLabel}
                </span>
              </div>
            </div>

            {/* Price Per Sq.m & Total Price */}
            <div className="rounded-2xl bg-[#061A40] text-white p-5 space-y-3 relative overflow-hidden">
              <div className="absolute top-2 right-3 text-[10px] text-cyan-300/80 font-bold bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                Աղբյուր՝ List.am + Gemini AI
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-blue-200 font-bold flex items-center gap-1.5">
                  <span>1 քմ-ի միջին շուկայական արժեք</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black mt-0.5 text-cyan-300">
                  {formatMoney(valuation.pricePerSqmUSD, valuation.pricePerSqmAMD)}
                  <span className="text-xs font-normal text-blue-200 ml-1">/ քմ</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/15">
                <div className="text-[11px] uppercase tracking-wider text-blue-200 font-bold">
                  Գույքի ընդհանուր գնահատված արժեք
                </div>
                <div className="text-2xl sm:text-3xl font-black mt-0.5 text-white">
                  {formatMoney(valuation.totalMarketValueUSD, valuation.totalMarketValueAMD)}
                </div>
                <div className="text-xs text-blue-200 mt-1">
                  {currency === "USD"
                    ? `Համարժեք է ~${valuation.totalMarketValueAMD.toLocaleString()} ֏`
                    : `Համարժեք է ~$${valuation.totalMarketValueUSD.toLocaleString()} USD`}
                </div>
              </div>
            </div>

            {/* List.am Price Range */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-700 flex items-center justify-between">
                <span>List.am-ում գների միջակայք՝</span>
                <span className="text-[10px] text-slate-500">±10% շեղումով</span>
              </div>
              <div className="flex items-center justify-between font-extrabold text-slate-900">
                <span className="text-emerald-700">
                  {formatMoney(valuation.minMarketValueUSD, valuation.minMarketValueAMD)}
                </span>
                <span className="text-slate-400">—</span>
                <span className="text-blue-700">
                  {formatMoney(valuation.maxMarketValueUSD, valuation.maxMarketValueAMD)}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-100">
                {valuation.marketTrendDescription}
              </div>
            </div>

            {/* Insurance Underwriting Breakdown */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="font-extrabold text-xs text-slate-800 flex items-center justify-between">
                <span>Ապահովագրական Գումարի Բաշխում</span>
                <span className="text-[10px] text-blue-700 font-bold">SIL Insurance Standard</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">🏗️ Շինության կոնստրուկցիա՝</span>
                  <b className="text-slate-900">
                    {formatMoney(
                      valuation.insuranceBreakdown.constructiveValueUSD,
                      valuation.insuranceBreakdown.constructiveValueAMD
                    )}
                  </b>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">🎨 Ներքին հարդարում և ցանցեր՝</span>
                  <b className="text-slate-900">
                    {formatMoney(
                      valuation.insuranceBreakdown.finishingValueUSD,
                      valuation.insuranceBreakdown.finishingValueAMD
                    )}
                  </b>
                </div>
                {hasFurnitureAndTech && (
                  <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-600">🛋️ Շարժական գույք / Կահույք՝</span>
                    <b className="text-slate-900">
                      {formatMoney(
                        valuation.insuranceBreakdown.movablesValueUSD,
                        valuation.insuranceBreakdown.movablesValueAMD
                      )}
                    </b>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5">
              {onApplyToPropertyInsurance && (
                <button
                  type="button"
                  onClick={() =>
                    onApplyToPropertyInsurance({
                      propertyType,
                      districtName: currentDistrict.nameArm,
                      subDistrict,
                      areaSqm,
                      marketValueUSD: valuation.totalMarketValueUSD,
                      marketValueAMD: valuation.totalMarketValueAMD,
                      constructiveValueAMD: valuation.insuranceBreakdown.constructiveValueAMD,
                      finishingValueAMD: valuation.insuranceBreakdown.finishingValueAMD,
                      movablesValueAMD: valuation.insuranceBreakdown.movablesValueAMD,
                    })
                  }
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Կիրառել Գույքի Ապահովագրության մեջ</span>
                </button>
              )}

              <a
                href={valuation.listAmSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 transition"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                <span>Ստուգել հայտարարությունները List.am-ում</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {showPhotoScanner && (
        <PropertyPhotoScannerModal
          onClose={() => setShowPhotoScanner(false)}
          onApplyResult={(result) => {
            const conditionMap: Record<string, string> = {
              economy: "Էկոնոմ (հին / ստանդարտ)",
              euro: "Եվրոնորոգված (որակյալ)",
              luxury: "Լյուքս / Դիզայներական",
              zero: "Զրոյական (սև սվաղ)",
            };
            const mapped = conditionMap[result.renovationConditionId] || "Եվրոնորոգված (որակյալ)";
            setRenovationCondition(mapped as any);
          }}
        />
      )}
    </div>
  );
}
