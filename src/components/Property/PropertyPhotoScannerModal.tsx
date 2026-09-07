import React, { useState } from "react";
import { Camera, Upload, Sparkles, CheckCircle2, AlertCircle, X, Loader2, ShieldCheck, Home } from "lucide-react";

interface PropertyScanResult {
  detectedPropertyType?: string;
  detectedPropertyTypeId?: string;
  propertyCategoryArm?: string;
  purposeVisualClues?: string[];
  renovationCondition: string;
  renovationConditionId: string; // "economy" | "euro" | "luxury" | "zero"
  buildingStructure?: string;
  buildingStructureId?: string;
  qualityScore: number;
  materialsObserved: string;
  visibleDefects?: string;
  aiAnalysisSummary: string;
  underwritingRiskLevel: string;
}

interface Props {
  onClose: () => void;
  onApplyResult: (result: PropertyScanResult) => void;
  onOpenFullSurvey?: () => void;
}

export function PropertyPhotoScannerModal({ onClose, onApplyResult, onOpenFullSurvey }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<PropertyScanResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Խնդրում ենք ընտրել նկարային ֆայլ (JPG, PNG, WEBP):");
      return;
    }

    setMimeType(file.type);
    setError(null);
    setScanResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      setSelectedImage(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzePhoto = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/property-photo-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
        }),
      });

      if (!res.ok) throw new Error("Չհաջողվեց կատարել լուսանկարի AI վերլուծություն");

      const data = await res.json();
      setScanResult({
        detectedPropertyType: data.detectedPropertyType || "Բնակարան",
        detectedPropertyTypeId: data.detectedPropertyTypeId || "apartment",
        propertyCategoryArm: data.propertyCategoryArm || "Բնակելի ֆոնդ",
        purposeVisualClues: Array.isArray(data.purposeVisualClues)
          ? data.purposeVisualClues
          : typeof data.purposeVisualClues === "string" && data.purposeVisualClues.trim()
          ? [data.purposeVisualClues]
          : ["Տարածքի կահավորումը համապատասխանում է տեսակին։"],
        renovationCondition: data.renovationCondition || "Եվրոնորոգում",
        renovationConditionId: data.renovationConditionId || "euro",
        buildingStructure: data.buildingStructure || "Մոնոլիտ (Նորակառույց)",
        buildingStructureId: data.buildingStructureId || "monolith",
        qualityScore: typeof data.qualityScore === "number" ? data.qualityScore : 7.5,
        materialsObserved: data.materialsObserved || "Հարդարման նյութեր",
        visibleDefects: data.visibleDefects || "Էական դեֆեկտներ չեն նկատվել",
        aiAnalysisSummary: data.aiAnalysisSummary || "Լուսանկարի վերլուծությամբ արձանագրվել է գույքի վիճակը։",
        underwritingRiskLevel: data.underwritingRiskLevel || "Ցածր ռիսկ",
      });
    } catch (err: any) {
      setError(err?.message || "Սխալ լուսանկարի սկանավորման ընթացքում");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl border border-slate-200 text-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">AI Computer Vision</div>
            <h2 className="text-xl font-black text-slate-900">Գույքի Լուսանկարի AI Սկանավորում</h2>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
          Վերբեռնեք բնակարանի կամ տան ներքին հարդարման լուսանկարը։ Արհեստական Բանականությունը (Gemini Vision) ավտոմատ կգնահատի վերանորոգման որակը (Էկոնոմ / Եվրոնորոգում / Լյուքս), նյութերը և ռիսկայնությունը։
        </p>

        {onOpenFullSurvey && (
          <div className="mb-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-emerald-950 font-medium">
                Անհրաժեշտ է ամբողջակա՞ն սուրվեյ (1-6 լուսանկար, ինժեներական ցանցեր, պաշտոնական ակտ)։
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullSurvey();
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0 transition cursor-pointer"
            >
              Բացել Սուրվեյի Ռեպորտը
            </button>
          </div>
        )}

        {!selectedImage ? (
          <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">Ընտրեք կամ քաշեք լուսանկարը այստեղ</div>
              <div className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP ֆորմատով</div>
            </div>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 max-h-64 flex items-center justify-center">
              <img src={selectedImage} alt="Property Preview" className="max-h-64 object-contain" />
              <button
                type="button"
                onClick={() => { setSelectedImage(null); setScanResult(null); }}
                className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-full backdrop-blur-xs transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {!scanResult && (
              <button
                type="button"
                onClick={handleAnalyzePhoto}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-purple-200" />
                    <span>AI-ը վերլուծում է լուսանկարը...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>Վերլուծել վերանորոգման որակը AI-ով</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {scanResult && (
          <div className="mt-6 space-y-4 animate-in fade-in duration-300">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white space-y-3 shadow-lg border border-indigo-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">AI Վերլուծության Արդյունք</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                  scanResult.renovationConditionId === "zero"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : scanResult.renovationConditionId === "economy"
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                }`}>
                  {scanResult.renovationCondition}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                <div className="bg-white/10 rounded-xl p-2.5 border border-white/10 col-span-2 sm:col-span-3 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">Ճանաչված Գույքի Նշանակություն</div>
                    <div className="text-sm font-black text-white mt-0.5">{scanResult.detectedPropertyType || "Բնակարան"}</div>
                  </div>
                  {scanResult.propertyCategoryArm && (
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-[11px] font-bold text-cyan-200">
                      {scanResult.propertyCategoryArm}
                    </span>
                  )}
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                  <div className="text-[10px] text-slate-300">Վերանորոգում</div>
                  <div className="text-sm font-extrabold text-white mt-0.5">{scanResult.renovationCondition}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                  <div className="text-[10px] text-slate-300">Կառուցվածք / Շենք</div>
                  <div className="text-sm font-extrabold text-white mt-0.5">{scanResult.buildingStructure || "Մոնոլիտ"}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 border border-white/10 col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-300">Որակի Միավոր</div>
                  <div className="text-sm font-extrabold text-amber-300 mt-0.5">{scanResult.qualityScore} / 10</div>
                </div>
              </div>

              {scanResult.purposeVisualClues && scanResult.purposeVisualClues.length > 0 && (
                <div className="text-xs text-cyan-100 bg-cyan-950/40 p-3 rounded-xl border border-cyan-500/30 space-y-1">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Տեսողական նշաններ ըստ լուսանկարի.</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-cyan-100/90 pl-1">
                    {scanResult.purposeVisualClues.map((clue, idx) => (
                      <li key={idx}>{clue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {scanResult.visibleDefects && scanResult.visibleDefects !== "Էական դեֆեկտներ չեն նկատվել" && (
                <div className="text-xs text-amber-200 bg-amber-950/40 p-3 rounded-xl border border-amber-500/30 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300">Նկատված դեֆեկտներ/առանձնահատկություններ՝ </span>
                    <span>{scanResult.visibleDefects}</span>
                  </div>
                </div>
              )}

              <div className="text-xs text-indigo-100 bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="font-bold text-white mb-1">Նկատված նյութեր և հարդարում.</div>
                <div>{scanResult.materialsObserved}</div>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed italic">
                "{scanResult.aiAnalysisSummary}"
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onApplyResult(scanResult);
                onClose();
              }}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Կիրառել «{scanResult.renovationCondition}» տվյալները հաշվիչում</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
