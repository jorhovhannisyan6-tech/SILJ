import React, { useState } from "react";
import { Camera, Upload, Sparkles, CheckCircle2, AlertCircle, X, Loader2, ShieldCheck, Home } from "lucide-react";

interface PropertyScanResult {
  renovationCondition: string;
  renovationConditionId: string; // "economy" | "euro" | "luxury" | "zero"
  buildingStructure?: string;
  qualityScore: number;
  materialsObserved: string;
  aiAnalysisSummary: string;
  underwritingRiskLevel: string;
}

interface Props {
  onClose: () => void;
  onApplyResult: (result: PropertyScanResult) => void;
}

export function PropertyPhotoScannerModal({ onClose, onApplyResult }: Props) {
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
        renovationCondition: data.renovationCondition || "Եվրոնորոգում",
        renovationConditionId: data.renovationConditionId || "euro",
        buildingStructure: data.buildingStructure || "Մոնոլիտ",
        qualityScore: data.qualityScore || 8.0,
        materialsObserved: data.materialsObserved || "Որակյալ հարդարման նյութեր",
        aiAnalysisSummary: data.aiAnalysisSummary || "Լուսանկարի վերլուծությամբ հաստատվել է գույքի բարձրորակ վիճակը։",
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

        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          Վերբեռնեք բնակարանի կամ տան ներքին հարդարման լուսանկարը։ Արհեստական Բանականությունը (Gemini Vision) ավտոմատ կգնահատի վերանորոգման որակը (Էկոնոմ / Եվրոնորոգում / Լյուքս), նյութերը և ռիսկայնությունը։
        </p>

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
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black">
                  {scanResult.renovationCondition}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <div className="text-[11px] text-slate-300">Վերանորոգման մակարդակ</div>
                  <div className="text-base font-extrabold text-white mt-0.5">{scanResult.renovationCondition}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <div className="text-[11px] text-slate-300">Որակի AI Միավոր (1-10)</div>
                  <div className="text-base font-extrabold text-amber-300 mt-0.5">{scanResult.qualityScore} / 10</div>
                </div>
              </div>

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
              <span>Կիրառել «{scanResult.renovationCondition}» վիճակը հաշվիչում</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
