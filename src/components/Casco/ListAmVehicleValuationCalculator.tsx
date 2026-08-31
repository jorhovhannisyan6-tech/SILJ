import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Car,
  Search,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Check,
  RefreshCw,
  Gauge,
  Calendar,
  Fuel,
  DollarSign,
  FileCheck2,
  Bot,
  Camera,
  X,
} from "lucide-react";
import {
  POPULAR_ARMENIAN_CAR_BRANDS,
  USD_TO_AMD_CAR_RATE,
} from "../../data/carMarketData";
import {
  estimateVehicleMarketValue,
  inferFuelTypeFromModel,
  type VehicleValuationInput,
  type VehicleValuationResult,
} from "../../utils/cascoValuationEngine";
import { getCurrentCbaRates } from "../../utils/exchangeRates";
import { AiDocumentScanner, type ExtractedTechPassportData } from "../AiDocumentScanner";

interface Props {
  initialMake?: string;
  initialModel?: string;
  initialYear?: number;
  onApplyToCasco?: (data: {
    make: string;
    model: string;
    year: number;
    marketValueUSD: number;
    marketValueAMD: number;
  }) => void;
  isEmbedded?: boolean;
}

export function ListAmVehicleValuationCalculator({
  initialMake = "Toyota",
  initialModel = "Camry",
  initialYear = 2020,
  onApplyToCasco,
  isEmbedded = false,
}: Props) {
  const [make, setMake] = useState<string>(initialMake);
  const [model, setModel] = useState<string>(initialModel);
  const [manufactureYear, setManufactureYear] = useState<number>(initialYear);
  const [fuelType, setFuelType] = useState<"gasoline" | "diesel" | "hybrid" | "electric" | "gas_lpg">(() =>
    inferFuelTypeFromModel(initialMake, initialModel)
  );
  const [condition, setCondition] = useState<"excellent" | "good" | "fair" | "salvage">("good");
  const [mileageKm, setMileageKm] = useState<number>(85000);
  const [currency, setCurrency] = useState<"USD" | "AMD">("USD");

  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [isFuelAutoRecognized, setIsFuelAutoRecognized] = useState<boolean>(true);

  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiCommentary, setAiCommentary] = useState<string | null>(null);
  const [aiValuationData, setAiValuationData] = useState<{
    estimatedPriceUSD: number;
    minPriceUSD?: number;
    maxPriceUSD?: number;
    liquidity?: string;
    source?: string;
  } | null>(null);

  // Auto-infer fuel/engine type when make or model changes
  useEffect(() => {
    if (make || model) {
      const inferred = inferFuelTypeFromModel(make, model);
      setFuelType(inferred);
      setIsFuelAutoRecognized(true);
    }
  }, [make, model]);

  const handleOcrAutoFill = (data: ExtractedTechPassportData) => {
    if (data.vehicleMake) setMake(data.vehicleMake);
    if (data.vehicleModel) setModel(data.vehicleModel);
    if (data.manufactureYear) setManufactureYear(data.manufactureYear);
    
    const detectedFuel =
      data.fuelType ||
      (data.vehicleMake && data.vehicleModel
        ? inferFuelTypeFromModel(data.vehicleMake, data.vehicleModel)
        : fuelType);

    setFuelType(detectedFuel);
    setIsFuelAutoRecognized(true);
    setAiValuationData(null);
    setShowScannerModal(false);
  };

  // Get current selected brand object
  const currentBrand = useMemo(() => {
    return POPULAR_ARMENIAN_CAR_BRANDS.find(
      (b) => b.make.toLowerCase() === make.toLowerCase()
    );
  }, [make]);

  // Baseline calculation (fallback if AI is loading/offline)
  const baselineValuation: VehicleValuationResult = useMemo(() => {
    const input: VehicleValuationInput = {
      make,
      model,
      manufactureYear,
      fuelType,
      condition,
      mileageKm,
    };
    return estimateVehicleMarketValue(input);
  }, [make, model, manufactureYear, fuelType, condition, mileageKm]);

  // Fetch AI insight & valuation from backend
  const fetchAiValuation = useCallback(async () => {
    if (!make.trim() || !model.trim()) return;
    setIsAiLoading(true);
    try {
      const token = localStorage.getItem("sil-auth-token") || localStorage.getItem("sil-session-token");
      const res = await fetch("/api/valuation/vehicle-market-value", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          make,
          model,
          manufactureYear,
          fuelType,
          condition,
          mileageKm,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.aiCommentary) {
          setAiCommentary(json.aiCommentary);
        }
        if (json.estimatedPriceUSD && json.estimatedPriceUSD > 0) {
          setAiValuationData({
            estimatedPriceUSD: Math.round(json.estimatedPriceUSD),
            minPriceUSD: json.minPriceUSD ? Math.round(json.minPriceUSD) : Math.round(json.estimatedPriceUSD * 0.9),
            maxPriceUSD: json.maxPriceUSD ? Math.round(json.maxPriceUSD) : Math.round(json.estimatedPriceUSD * 1.1),
            liquidity: json.liquidity || "Բարձր",
            source: json.source || "AI (Արհեստական Բանականություն)",
          });
        }
      }
    } catch (e) {
      console.warn("Vehicle AI valuation error:", e);
    } finally {
      setIsAiLoading(false);
    }
  }, [make, model, manufactureYear, fuelType, condition, mileageKm]);

  // Auto-fetch AI valuation on parameters change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAiValuation();
    }, 600);
    return () => clearTimeout(timer);
  }, [fetchAiValuation]);

  // Combined final valuation (prefers AI data when present)
  const effectiveUsdRate = getCurrentCbaRates().USD?.rateToAMD || USD_TO_AMD_CAR_RATE;

  const valuation: VehicleValuationResult & { isAiSourced: boolean } = useMemo(() => {
    if (aiValuationData && aiValuationData.estimatedPriceUSD > 0) {
      const estUSD = aiValuationData.estimatedPriceUSD;
      const minUSD = aiValuationData.minPriceUSD || Math.round(estUSD * 0.90);
      const maxUSD = aiValuationData.maxPriceUSD || Math.round(estUSD * 1.10);
      const estAMD = Math.round(estUSD * effectiveUsdRate);
      const minAMD = Math.round(minUSD * effectiveUsdRate);
      const maxAMD = Math.round(maxUSD * effectiveUsdRate);
      const liq = aiValuationData.liquidity || baselineValuation.liquidity;

      return {
        estimatedPriceUSD: estUSD,
        estimatedPriceAMD: estAMD,
        minPriceUSD: minUSD,
        minPriceAMD: minAMD,
        maxPriceUSD: maxUSD,
        maxPriceAMD: maxAMD,
        listAmSearchUrl: baselineValuation.listAmSearchUrl,
        liquidity: (liq === "Բարձր" || liq === "Միջին" || liq === "Ցածր") ? liq : "Բարձր",
        marketTrendDescription: `ԱԲ-ն (Արհեստական Բանականություն) ${make} ${model} (${manufactureYear}թ.) մոդելի համար գնահատել է միջին շուկայական գինը ${estUSD.toLocaleString()} USD (${estAMD.toLocaleString("hy-AM")} ֏)՝ ${liq.toLowerCase()} պահանջարկով։`,
        depreciationAgeYears: baselineValuation.depreciationAgeYears,
        confidenceScore: 95,
        isAiSourced: true,
      };
    }

    return {
      ...baselineValuation,
      isAiSourced: false,
    };
  }, [aiValuationData, baselineValuation, make, model, manufactureYear, effectiveUsdRate]);

  const formatMoney = (amountUSD: number, amountAMD: number) => {
    if (currency === "USD") {
      return `$${amountUSD.toLocaleString()}`;
    }
    return `${amountAMD.toLocaleString()} ֏`;
  };

  return (
    <div className={`space-y-6 ${isEmbedded ? "p-3 sm:p-5" : ""}`}>
      {/* Header */}
      {!isEmbedded && (
        <div className="bg-gradient-to-r from-[#061A40] via-[#092B6B] to-[#0A4EA3] rounded-[24px] p-6 sm:p-8 text-white shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/20 border border-cyan-400/30 text-cyan-200 text-xs font-bold mb-2">
                <Bot className="w-4 h-4 text-cyan-300" />
                <span>ԱԲ (Արհեստական Բանականություն) Շուկայական Գնահատիչ</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-extrabold">
                Ավտոմեքենայի Միջին Շուկայական Գնահատում ԱԲ-ով
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-blue-100 max-w-3xl">
                Արհեստական Բանականությունը (Gemini API) վերլուծում է Հայաստանի ավտոշուկայի (List.am) իրական գները և տրամադրում ճշգրիտ միջին շուկայական գին ԿԱՍԿՈ ապահովագրության համար։
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

      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_.85fr] gap-6">
        {/* Left Inputs */}
        <div className="sil-card p-5 sm:p-7 space-y-6">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 mb-2 gap-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-[#075bd5]" />
              <span>Ավտոմեքենայի Պարամետրեր</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowScannerModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-200" />
              <span>📷 Տեխպասպորտի Սկանավորում (AI OCR)</span>
            </button>
          </div>

          {showScannerModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl text-white">
                <button
                  type="button"
                  onClick={() => setShowScannerModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="mb-4">
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-cyan-400" />
                    Տեխնիկական Անձնագրի (Տեխպասպորտ) AI Սկանավորում
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Վերբեռնեք ավտոմեքենայի տեխպասպորտի լուսանկարը՝ մակնիշը, մոդելը, տարեթիվը և շարժիչի/վառելիքի տեսակը ավտոմատ լրացնելու համար։
                  </p>
                </div>
                <AiDocumentScanner
                  onAutoFill={handleOcrAutoFill}
                  onDataExtracted={(scanned) => handleOcrAutoFill(scanned)}
                />
              </div>
            </div>
          )}

          {/* Brand Selection */}
          <div>
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-2.5">
              1. Մակնիշ ( Make )
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {POPULAR_ARMENIAN_CAR_BRANDS.slice(0, 12).map((b) => {
                const isSelected = make.toLowerCase() === b.make.toLowerCase();
                return (
                  <button
                    key={b.make}
                    type="button"
                    onClick={() => {
                      setMake(b.make);
                      if (b.popularModels.length > 0) {
                        setModel(b.popularModels[0].name);
                      }
                      setAiValuationData(null);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer text-xs ${
                      isSelected
                        ? "bg-[#EDF5FF] border-[#075bd5] text-[#075bd5] font-extrabold shadow-sm ring-1 ring-[#075bd5]/30"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                    }`}
                  >
                    {b.make}
                  </button>
                );
              })}
            </div>

            {/* Custom Make input if not in list */}
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Այլ մակնիշ (ձեռքով մուտքագրում)
                </label>
                <input
                  className="sil-input"
                  placeholder="Օր․՝ Audi, Porsche, Mazda"
                  value={make}
                  onChange={(e) => {
                    setMake(e.target.value);
                    setAiValuationData(null);
                  }}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Մոդել ( Model )
                </label>
                <input
                  className="sil-input font-bold"
                  placeholder="Օր․՝ Camry, E-Class, Model 3"
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    setAiValuationData(null);
                  }}
                />
              </div>
            </div>

            {/* Quick Model presets */}
            {currentBrand && currentBrand.popularModels.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-[11px] font-bold text-slate-500 mr-1">Հայտնի մոդելներ՝</span>
                {currentBrand.popularModels.map((m) => (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => {
                      setModel(m.name);
                      setAiValuationData(null);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                      model.toLowerCase().includes(m.name.toLowerCase())
                        ? "bg-blue-600 text-white border-blue-600 font-bold"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Year & Fuel */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#075bd5]" />
                  Արտադրման Տարեթիվ
                </label>
                <span className="text-xs font-black text-[#075bd5]">{manufactureYear}թ.</span>
              </div>
              <input
                type="number"
                min="1990"
                max={new Date().getFullYear()}
                className="sil-input font-bold"
                value={manufactureYear || ""}
                onChange={(e) => {
                  setManufactureYear(Number(e.target.value));
                  setAiValuationData(null);
                }}
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {[2024, 2022, 2020, 2018, 2015, 2012, 2008].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => {
                      setManufactureYear(yr);
                      setAiValuationData(null);
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${
                      manufactureYear === yr
                        ? "bg-[#075bd5] text-white border-[#075bd5]"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-[#075bd5]" />
                  Շարժիչի / Վառելիքի Տեսակ
                </label>
                {isFuelAutoRecognized && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                    Ավտոմատ
                  </span>
                )}
              </div>
              <select
                className={`sil-input font-medium ${isFuelAutoRecognized ? "ring-1 ring-emerald-400/40 bg-emerald-50/20" : ""}`}
                value={fuelType}
                onChange={(e) => {
                  setFuelType(e.target.value as any);
                  setIsFuelAutoRecognized(false);
                  setAiValuationData(null);
                }}
              >
                <option value="gasoline">⛽ Բենզին</option>
                <option value="diesel">🛢️ Դիզել</option>
                <option value="hybrid">🔋 Հիբրիդ (Hybrid)</option>
                <option value="electric">⚡ Էլեկտրական (Electric / EV)</option>
                <option value="gas_lpg">🔥 Գազ (LPG / CNG)</option>
              </select>
            </div>
          </div>

          {/* Mileage & Condition */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#075bd5]" />
                Վազք (կիլոմետր)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                className="sil-input font-bold"
                value={mileageKm || ""}
                onChange={(e) => {
                  setMileageKm(Number(e.target.value));
                  setAiValuationData(null);
                }}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Ընդհանուր Վիճակ
              </label>
              <select
                className="sil-input font-medium"
                value={condition}
                onChange={(e) => {
                  setCondition(e.target.value as any);
                  setAiValuationData(null);
                }}
              >
                <option value="excellent">✨ Գերազանց / Անթերի</option>
                <option value="good">👍 Լավ / Նորմալ</option>
                <option value="fair">⚠️ Միջին / Թեթև վնասվածքներով</option>
                <option value="salvage">🛠️ Վթարված / Վերականգնված</option>
              </select>
            </div>
          </div>

          {/* AI Market Insight Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={fetchAiValuation}
              disabled={isAiLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 hover:from-cyan-700 hover:to-indigo-800 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              {isAiLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ԱԲ-ն (Gemini) հաշվարկում է միջին շուկայական գինը...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Վերահաշվարկել ԱԲ Շուկայական Գնահատականը (Gemini AI)</span>
                </>
              )}
            </button>

            {aiCommentary && (
              <div className="mt-3 p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 text-xs text-cyan-950 space-y-1.5 shadow-sm">
                <div className="font-extrabold flex items-center gap-1.5 text-cyan-900">
                  <Bot className="w-4 h-4 text-cyan-700" />
                  <span>ԱԲ (Արհեստական Բանականություն) Վերլուծության Աղբյուր</span>
                </div>
                <p className="leading-relaxed whitespace-pre-line text-cyan-900/90">{aiCommentary}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Output Card */}
        <div className="space-y-5">
          <div className="sil-card p-5 sm:p-6 bg-gradient-to-b from-white to-blue-50/40 border-[#075bd5]/20 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Միջին Շուկայական Արժեք</span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Պահանջարկ՝ {valuation.liquidity}
              </span>
            </div>

            {/* Total Price Card */}
            <div className="rounded-2xl bg-gradient-to-br from-[#061A40] to-[#0A326B] text-white p-5 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-wider text-cyan-200 font-bold flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ԱԲ Գնահատված Միջին Արժեք</span>
                </div>
                {valuation.isAiSourced && (
                  <span className="text-[10px] bg-cyan-400/20 text-cyan-200 px-2 py-0.5 rounded-full border border-cyan-400/30 font-bold">
                    Աղբյուր՝ ԱԲ
                  </span>
                )}
              </div>

              <div className="text-3xl font-black text-cyan-300">
                {isAiLoading ? (
                  <span className="text-lg text-cyan-200/80 animate-pulse flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Հաշվարկվում է...
                  </span>
                ) : (
                  formatMoney(valuation.estimatedPriceUSD, valuation.estimatedPriceAMD)
                )}
              </div>

              <div className="text-xs text-blue-200 pt-1">
                {currency === "USD"
                  ? `Համարժեք է ~${valuation.estimatedPriceAMD.toLocaleString()} ֏ (ԿԲ Լայվ)`
                  : `Համարժեք է ~$${valuation.estimatedPriceUSD.toLocaleString()} USD (ԿԲ Լայվ)`}
              </div>
            </div>

            {/* Price Range */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-700 flex items-center justify-between">
                <span>ԱԲ գների միջակայք (min - max)՝</span>
                <span className="text-[10px] text-slate-500">±10%</span>
              </div>
              <div className="flex items-center justify-between font-extrabold text-slate-900">
                <span className="text-emerald-700">
                  {formatMoney(valuation.minPriceUSD, valuation.minPriceAMD)}
                </span>
                <span className="text-slate-400">—</span>
                <span className="text-blue-700">
                  {formatMoney(valuation.maxPriceUSD, valuation.maxPriceAMD)}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-100">
                {valuation.marketTrendDescription}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5">
              {onApplyToCasco && (
                <button
                  type="button"
                  onClick={() =>
                    onApplyToCasco({
                      make,
                      model,
                      year: manufactureYear,
                      marketValueUSD: valuation.estimatedPriceUSD,
                      marketValueAMD: valuation.estimatedPriceAMD,
                    })
                  }
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Կիրառել ԱԲ Արժեքը ԿԱՍԿՈ-ի Հաշվարկում</span>
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
    </div>
  );
}
