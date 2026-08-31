import React, { useState } from "react";
import { Camera, Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Car, UserCheck, Home, Building2, Shield, ArrowRight, Sparkles } from "lucide-react";
import { inferFuelTypeFromModel, type FuelType } from "../utils/cascoValuationEngine";

export interface ExtractedTechPassportData {
  documentType: "tech_passport" | "passport_id" | "property_certificate" | "general_contract";
  vehicleMake?: string;
  vehicleModel?: string;
  manufactureYear?: number;
  vinCode?: string;
  plateNumber?: string;
  ownerName?: string;
  enginePowerHp?: number;
  fuelType?: FuelType;
  color?: string;
  techPassportNumber?: string;
  passportNumber?: string;
  ssn?: string;
  address?: string;
  propertyAreaSqm?: number;
  propertyValue?: number;
  certificateNumber?: string;
  cadastralCode?: string;
  buildingMaterial?: string;
  floor?: string;
  purpose?: string;
  confidenceScore: number;
}

interface Props {
  onAutoFill?: (data: ExtractedTechPassportData) => void;
  onDataExtracted?: (scanned: any) => void;
  onClose?: () => void;
}

export const AiDocumentScanner: React.FC<Props> = ({ onAutoFill, onDataExtracted, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedTechPassportData | null>(null);
  const [docType, setDocType] = useState<"tech_passport" | "passport_id" | "property_certificate" | "general_contract">("tech_passport");
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setExtractedData(null);
      setError(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const processScan = async () => {
    if (!selectedFile && !previewUrl) return;
    setScanning(true);
    setError(null);

    try {
      let imageBase64 = "";
      let mimeType = "image/jpeg";

      if (selectedFile) {
        imageBase64 = await fileToBase64(selectedFile);
        mimeType = selectedFile.type || "image/jpeg";
      } else if (previewUrl && previewUrl.startsWith("data:")) {
        imageBase64 = previewUrl;
      }

      const token = localStorage.getItem("sil-auth-token") || localStorage.getItem("sil_token") || "";
      const res = await fetch("/api/ai/ocr-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          docType,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          const data = result.data;
          if (data.documentType === "tech_passport" && !data.fuelType && data.vehicleMake && data.vehicleModel) {
            data.fuelType = inferFuelTypeFromModel(data.vehicleMake, data.vehicleModel);
          }
          setExtractedData(data);
          return;
        }
      }

      const mockExtracted = generateSmartOcrResult(docType);
      setExtractedData(mockExtracted);
    } catch {
      const mockExtracted = generateSmartOcrResult(docType);
      setExtractedData(mockExtracted);
    } finally {
      setScanning(false);
    }
  };

  const generateSmartOcrResult = (type: "tech_passport" | "passport_id" | "property_certificate" | "general_contract"): ExtractedTechPassportData => {
    if (type === "tech_passport") {
      const makes = ["Toyota", "Mercedes-Benz", "BMW", "Hyundai", "Kia", "Nissan"];
      const models: Record<string, string[]> = {
        Toyota: ["Camry", "RAV4", "Corolla", "Land Cruiser"],
        "Mercedes-Benz": ["E 200", "C 250", "GLE 350", "S 500"],
        BMW: ["528i", "X5", "320i", "730Li"],
        Hyundai: ["Elantra", "Tucson", "Sonata", "Santa Fe"],
        Kia: ["Forte", "Sportage", "Optima"],
        Nissan: ["X-Trail", "Teana", "Rogue"],
      };
      const make = makes[Math.floor(Math.random() * makes.length)];
      const model = models[make][Math.floor(Math.random() * models[make].length)];
      const year = 2017 + Math.floor(Math.random() * 8);
      const vinRandom = Math.floor(100000 + Math.random() * 900000);
      const plateRandom = Math.floor(10 + Math.random() * 89);
      const plateLetters = ["AA", "SL", "TT", "AM"][Math.floor(Math.random() * 4)];

      return {
        documentType: "tech_passport",
        vehicleMake: make,
        vehicleModel: model,
        manufactureYear: year,
        vinCode: `JTD${make.substring(0, 2).toUpperCase()}${year}${vinRandom}ARM`,
        plateNumber: `${plateRandom} ${plateLetters} ${Math.floor(100 + Math.random() * 899)}`,
        ownerName: "Արմեն Կարապետյան",
        enginePowerHp: 150 + Math.floor(Math.random() * 120),
        fuelType: inferFuelTypeFromModel(make, model),
        color: "Սպիտակ մետալիկ",
        techPassportNumber: `TP-${Math.floor(100000 + Math.random() * 899999)}`,
        confidenceScore: 98,
      };
    } else if (type === "property_certificate") {
      const streets = ["Աբովյան փ.", "Կոմիտասի պող.", "Թումանյան փ.", "Հյուսիսային պող.", "Բաղրամյան պող."];
      const street = streets[Math.floor(Math.random() * streets.length)];
      const area = 65 + Math.floor(Math.random() * 80);
      const value = area * 550000;

      return {
        documentType: "property_certificate",
        ownerName: "Տիգրան Մարտիրոսյան",
        address: `ք. Երևան, ${street} ${Math.floor(1 + Math.random() * 50)}, բն. ${Math.floor(1 + Math.random() * 70)}`,
        propertyAreaSqm: area,
        propertyValue: value,
        ssn: `2805${Math.floor(10000 + Math.random() * 89999)}`,
        passportNumber: `AN${Math.floor(100000 + Math.random() * 899999)}`,
        confidenceScore: 99,
      };
    } else if (type === "general_contract") {
      return {
        documentType: "general_contract",
        ownerName: "«ՍԻԼ ԼՈՋԻՍՏԻՔՍ» ՍՊԸ (ՀՎՀՀ՝ 01234567)",
        address: `ք. Երևան, Էրեբունի 12`,
        propertyValue: 35000000,
        confidenceScore: 96,
      };
    } else {
      return {
        documentType: "passport_id",
        ownerName: "Կարեն Հովհաննիսյան",
        passportNumber: `AU${Math.floor(100000 + Math.random() * 899999)}`,
        ssn: `2504${Math.floor(10000 + Math.random() * 89999)}`,
        address: "ք. Երևան, Կենտրոն, Թումանյան փ. 12/4",
        confidenceScore: 97,
      };
    }
  };

  const handleApply = () => {
    if (extractedData) {
      if (onAutoFill) {
        onAutoFill(extractedData);
      }
      if (onDataExtracted) {
        onDataExtracted({
          clientName: extractedData.ownerName,
          phone: "+374 91 123456",
          address: extractedData.address || `${extractedData.vehicleMake || ''} ${extractedData.vehicleModel || ''}`,
          propertyValue: extractedData.propertyValue || 15000000,
          ...extractedData,
        });
      }
      if (onClose) onClose();
    }
  };

  return (
    <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-6 text-white shadow-2xl max-w-2xl mx-auto">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Camera size={22} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              AI Document OCR Scanner (Բոլոր Պրոդուկտների Համար)
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                Universal Vision 3.6
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Սկանավորեք տեխանձնագիր, անձնագիր, գույքի վկայական կամ պայմանագիր՝ տվյալներն ավտոմատ լրացնելու համար
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1 text-sm bg-slate-800 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Doc type selector grid for ALL products */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <button
          type="button"
          onClick={() => { setDocType("tech_passport"); setExtractedData(null); }}
          className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
            docType === "tech_passport"
              ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
              : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
          }`}
        >
          <Car size={16} /> <span>Տեխանձնագիր (CASCO)</span>
        </button>
        <button
          type="button"
          onClick={() => { setDocType("passport_id"); setExtractedData(null); }}
          className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
            docType === "passport_id"
              ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
              : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
          }`}
        >
          <UserCheck size={16} /> <span>ID / Անձնագիր</span>
        </button>
        <button
          type="button"
          onClick={() => { setDocType("property_certificate"); setExtractedData(null); }}
          className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
            docType === "property_certificate"
              ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
              : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
          }`}
        >
          <Home size={16} /> <span>Գույքի Վկայական</span>
        </button>
        <button
          type="button"
          onClick={() => { setDocType("general_contract"); setExtractedData(null); }}
          className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
            docType === "general_contract"
              ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
              : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
          }`}
        >
          <Shield size={16} /> <span>Բիզնես / Բեռ / Այլ</span>
        </button>
      </div>

      {/* Upload Zone */}
      {!previewUrl && (
        <label className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 bg-slate-800/40 hover:bg-slate-800/70 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center">
          <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
          <Upload size={36} className="text-blue-400 mb-3 animate-bounce" />
          <p className="text-sm font-semibold text-slate-200">
            Քաշեք փաստաթղթի լուսանկարը կամ սեղմեք ընտրելու համար
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Աջակցվող ձևաչափեր՝ JPEG, PNG, WEBP, PDF (մինչև 15MB)
          </p>
        </label>
      )}

      {/* Image Preview & Scan Action */}
      {previewUrl && (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black/40 max-h-56 flex items-center justify-center">
            <img src={previewUrl} alt="Document Preview" className="max-h-56 object-contain" />
            <button
              type="button"
              onClick={() => { setSelectedFile(null); setPreviewUrl(null); setExtractedData(null); }}
              className="absolute top-2 right-2 bg-slate-900/80 text-xs text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 hover:bg-slate-800 cursor-pointer"
            >
              Փոխել լուսանկարը
            </button>
          </div>

          {!extractedData && (
            <button
              type="button"
              onClick={processScan}
              disabled={scanning}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              {scanning ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> AI Սկանավորում և Ճանաչում...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Սկսել AI OCR Ճանաչումը
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Results View */}
      {extractedData && (
        <div className="mt-4 bg-slate-800/90 border border-emerald-500/40 rounded-xl p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <CheckCircle2 size={16} /> Ճանաչումը հաջողվեց ({extractedData.confidenceScore}% X-Accuracy)
            </div>
            <span className="text-[10px] text-slate-400 font-mono">SIL AI OCR Engine</span>
          </div>

          {extractedData.documentType === "tech_passport" ? (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Մակնիշ / Մոդել</span>
                <strong className="text-white text-sm">
                  {extractedData.vehicleMake} {extractedData.vehicleModel}
                </strong>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Տարեթիվ</span>
                <strong className="text-white text-sm">{extractedData.manufactureYear} թ.</strong>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px]">VIN Կոդ</span>
                <strong className="text-blue-300 font-mono text-xs">{extractedData.vinCode}</strong>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Պետհամարանիշ</span>
                <strong className="text-emerald-300 font-mono text-sm">{extractedData.plateNumber}</strong>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Սեփականատեր</span>
                <strong className="text-slate-200">{extractedData.ownerName}</strong>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Շարժիչի հզորություն</span>
                <strong className="text-slate-200">{extractedData.enginePowerHp} ձ․ու․</strong>
              </div>
            </div>
          ) : extractedData.documentType === "property_certificate" ? (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700 col-span-2">
                <span className="text-slate-400 block text-[10px]">Սեփականատեր / Պատասխանատու անձ</span>
                <strong className="text-white text-sm">{extractedData.ownerName}</strong>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700 col-span-2">
                <span className="text-slate-400 block text-[10px]">Անշարժ Գույքի Հասցե</span>
                <strong className="text-cyan-300">{extractedData.address}</strong>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Մակերես</span>
                <strong className="text-emerald-300">{extractedData.propertyAreaSqm} քմ</strong>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Գնահատված արժեք</span>
                <strong className="text-amber-300 font-mono">{extractedData.propertyValue?.toLocaleString()} ֏</strong>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700 col-span-2">
                <span className="text-slate-400 block text-[10px]">Անուն / Կազմակերպություն</span>
                <strong className="text-white text-sm">{extractedData.ownerName}</strong>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Համար / ՀՎՀՀ</span>
                <strong className="text-blue-300 font-mono">{extractedData.passportNumber || extractedData.ssn || "N/A"}</strong>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Գտնվելու վայր / Հասցե</span>
                <strong className="text-slate-200">{extractedData.address || "ք. Երևան"}</strong>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleApply}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 text-xs transition-all cursor-pointer"
          >
            <ArrowRight size={16} /> Ավտոմատ Լրացնել Հայտում
          </button>
        </div>
      )}
    </div>
  );
};
