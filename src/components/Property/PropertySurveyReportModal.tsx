import React, { useState } from "react";
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Printer,
  Copy,
  Check,
  Building2,
  Zap,
  Flame,
  ShieldCheck,
  Plus,
  Trash2,
  Eye,
  FileCheck,
  TrendingDown,
  Info,
  MapPin,
  Maximize2,
  Layers,
  Activity,
  Home,
  Compass,
  FileSpreadsheet,
  AlertOctagon,
  Award,
  FileDown,
  Download,
  FileText,
  Globe,
  PenTool,
  Lock,
} from "lucide-react";
import { PropertySurveyReport } from "../../types";
import {
  downloadSurveyReportAsPdf,
  downloadSurveyReportAsWordDoc,
  copySurveyReportForWord,
  type ExportLanguage,
  type DigitalSignatureAttachment,
} from "../../utils/surveyReportExport";
import { SignatureModal, type DigitalSignatureResult } from "../Common/SignatureModal";

interface SurveyPhotoItem {
  id: string;
  dataUrl: string;
  mimeType: string;
  tag: string;
}

interface Props {
  initialAddress?: string;
  initialPropertyType?: string;
  initialArea?: number | string;
  existingReport?: PropertySurveyReport;
  onClose: () => void;
  onApplySurveyReport: (report: PropertySurveyReport) => void;
}

const PHOTO_TAG_SUGGESTIONS = [
  "Ճակատ / Շենքի տեսք",
  "Մուտք / Նախասրահ",
  "Հյուրասենյակ / Հարդարում",
  "Խոհանոց / Ջրագծեր",
  "Սանհանգույց / Խողովակներ",
  "Էլեկտրական վահանակ / Լարեր",
  "Ջեռուցման կաթսա / Մարտկոցներ",
  "Պատուհաններ / Դռներ",
  "Տանիք / Ձեղնահարկ",
  "Նկուղ / Հիմք",
  "Հակահրդեհային ծխորսիչ / Կրակմարիչ",
  "Ազդանշանային / Տեսահսկման համակարգ",
  "Հարակից շենքեր / Հարևանություն",
  "Ռիսկային դեֆեկտ / Ճաք",
  "Պահեստային տարածք",
  "Հրշեջ հիդրանտ / Ծորակ",
  "Գազասպառման հանգույց / Հաշվիչ",
  "Ընդհանուր ինտերիեր",
];

// Helper to compress large photos client-side before sending to server
async function compressImage(file: File, maxDimension = 1400, quality = 0.82): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve({ dataUrl: compressedDataUrl, mimeType: "image/jpeg" });
          return;
        }
        resolve({ dataUrl: e.target?.result as string, mimeType: file.type || "image/jpeg" });
      };
      img.onerror = () => {
        resolve({ dataUrl: e.target?.result as string, mimeType: file.type || "image/jpeg" });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function PropertySurveyReportModal({
  initialAddress = "",
  initialPropertyType = "Բնակարան",
  initialArea = "",
  existingReport,
  onClose,
  onApplySurveyReport,
}: Props) {
  const [photos, setPhotos] = useState<SurveyPhotoItem[]>([]);
  const [propertyType, setPropertyType] = useState<string>(initialPropertyType || "Բնակարան");
  const [address, setAddress] = useState<string>(initialAddress || "");
  const [estimatedArea, setEstimatedArea] = useState<string>(initialArea ? String(initialArea) : "85");
  const [loading, setLoading] = useState<boolean>(false);
  const [scanningStep, setScanningStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [surveyReport, setSurveyReport] = useState<PropertySurveyReport | null>(existingReport || null);
  const [activeTab, setActiveTab] = useState<"overview" | "cope" | "scores" | "warranties" | "photos" | "narrative">("overview");
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfExportSuccess, setPdfExportSuccess] = useState<boolean>(false);
  const [copyFormattedSuccess, setCopyFormattedSuccess] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportLanguage, setExportLanguage] = useState<ExportLanguage>("hy");
  const [signatureModalOpen, setSignatureModalOpen] = useState<boolean>(false);
  const [digitalSignature, setDigitalSignature] = useState<DigitalSignatureAttachment | null>(null);

  const MAX_PHOTOS = 24;

  const processFiles = async (fileList: FileList | File[]) => {
    setError(null);
    const availableSlots = MAX_PHOTOS - photos.length;
    if (availableSlots <= 0) {
      setError(`Առավելագույնը կարող եք վերբեռնել ${MAX_PHOTOS} լուսանկար:`);
      return;
    }

    const filesToProcess = Array.from(fileList).slice(0, availableSlots);
    const newItems: SurveyPhotoItem[] = [];

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      if (!file.type.startsWith("image/")) continue;

      try {
        const compressed = await compressImage(file, 1400, 0.82);
        const autoIndex = photos.length + newItems.length;
        const defaultTag = `Լուսանկար #${autoIndex + 1}`;

        newItems.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          dataUrl: compressed.dataUrl,
          mimeType: compressed.mimeType,
          tag: defaultTag,
        });
      } catch (e) {
        console.warn("Failed to process photo:", e);
      }
    }

    setPhotos((prev) => [...prev, ...newItems]);
  };

  const handleFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePhotoTag = (id: string, newTag: string) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, tag: newTag } : p)));
  };

  const handleGenerateSurvey = async () => {
    if (photos.length === 0) {
      setError("Խնդրում ենք վերբեռնել առնվազն 1 լուսանկար սուրվեյի համար:");
      return;
    }

    setLoading(true);
    setError(null);
    setScanningStep("Նախապատրաստում ենք լուսանկարների փաթեթը AI զննման համար...");

    try {
      const timeout1 = setTimeout(() => {
        setScanningStep("Gemini Vision-ը կատարում է COPE վերլուծություն (Կոնստրուկցիա, Շահագործում, Պաշտպանություն, Հարևանություն)...");
      }, 1200);

      const timeout2 = setTimeout(() => {
        setScanningStep("Հաշվարկվում են PML/MFL կորուստները, ինժեներական ցանցերի ռիսկերը և անդեռռայթինգի գնահատականը...");
      }, 2800);

      const res = await fetch("/api/ai/property-survey-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: photos.map((p) => ({
            imageBase64: p.dataUrl,
            mimeType: p.mimeType,
            tag: p.tag,
          })),
          propertyContext: {
            propertyType,
            address,
            estimatedArea: Number(estimatedArea) || 85,
          },
        }),
      });

      clearTimeout(timeout1);
      clearTimeout(timeout2);

      if (!res.ok) {
        throw new Error("Սերվերը չկարողացավ ավարտել սուրվեյի գեներացիան:");
      }

      const data = await res.json();
      if (data.report) {
        const fullReport: PropertySurveyReport = {
          ...data.report,
          photoThumbnails: photos.map((p) => ({ dataUrl: p.dataUrl, tag: p.tag })),
        };
        setSurveyReport(fullReport);
        setActiveTab("overview");
      } else {
        throw new Error("Ստացված տվյալները թերի են:");
      }
    } catch (err: any) {
      setError(err?.message || "Սխալ ապահովագրական սուրվեյի գեներացիայի ժամանակ:");
    } finally {
      setLoading(false);
      setScanningStep("");
    }
  };

  const handleCopyNarrative = () => {
    if (!surveyReport) return;
    navigator.clipboard.writeText(surveyReport.fullNarrativeReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    if (!surveyReport) return;
    setIsExportingPdf(true);
    setExportError(null);
    try {
      await downloadSurveyReportAsPdf(
        surveyReport,
        address,
        Number(estimatedArea) || 85,
        exportLanguage,
        digitalSignature || undefined
      );
      setPdfExportSuccess(true);
      setTimeout(() => setPdfExportSuccess(false), 3000);
    } catch (err: any) {
      console.error("PDF export failed:", err);
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "PDF ակտի ներբեռնումը չհաջողվեց:";
      setExportError(msg);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadWord = () => {
    if (!surveyReport) return;
    try {
      downloadSurveyReportAsWordDoc(
        surveyReport,
        address,
        Number(estimatedArea) || 85,
        exportLanguage,
        digitalSignature || undefined
      );
    } catch (err: any) {
      console.error("Word export failed:", err);
      setExportError(err?.message || "Word փաստաթղթի ներբեռնումը չհաջողվեց:");
    }
  };

  const handleCopyFormatted = async () => {
    if (!surveyReport) return;
    const ok = await copySurveyReportForWord(surveyReport, address, Number(estimatedArea) || 85);
    if (ok) {
      setCopyFormattedSuccess(true);
      setTimeout(() => setCopyFormattedSuccess(false), 2000);
    } else {
      setExportError("Չհաջողվեց պատճենել փաստաթուղթը clipboard:");
    }
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn("Print fallback:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="bg-white rounded-3xl max-w-6xl w-full my-6 shadow-2xl border border-slate-200 text-slate-800 flex flex-col max-h-[94vh] overflow-hidden relative">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#001D4A] via-[#003399] to-[#0052CC] text-white p-5 sm:p-6 flex items-center justify-between shrink-0 shadow-md flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner shrink-0">
              <Camera className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300 bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                  SIL Underwriting & Risk Engineering
                </span>
                {surveyReport && (
                  <span className="text-[11px] font-bold text-blue-200">
                    • Ակտ N {surveyReport.id}
                  </span>
                )}
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  Տարողություն՝ մինչև {MAX_PHOTOS} լուսանկար
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                Անշարժ Գույքի Ապահովագրական Սուրվեյ (Pre-Risk Survey Report)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {surveyReport && (
              <>
                {/* Language Switcher */}
                <div className="flex items-center bg-black/30 border border-white/20 rounded-xl p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setExportLanguage("hy")}
                    className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                      exportLanguage === "hy"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-blue-100 hover:text-white"
                    }`}
                    title="Հայերեն Պաշտոնական Ակտ"
                  >
                    🇦🇲 HY
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportLanguage("en")}
                    className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                      exportLanguage === "en"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-blue-100 hover:text-white"
                    }`}
                    title="English Reinsurance Format (Swiss Re / Munich Re)"
                  >
                    🇬🇧 EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportLanguage("ru")}
                    className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                      exportLanguage === "ru"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-blue-100 hover:text-white"
                    }`}
                    title="Русский Акт Осмотра"
                  >
                    🇷🇺 RU
                  </button>
                </div>

                {/* Digital Signature Action */}
                <button
                  type="button"
                  onClick={() => setSignatureModalOpen(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border shadow-xs ${
                    digitalSignature
                      ? "bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-400"
                      : "bg-white/15 hover:bg-white/25 text-white border-white/20"
                  }`}
                  title="Էլեկտրոնային Թվային Ստորագրություն"
                >
                  <PenTool className="w-3.5 h-3.5 text-cyan-200" />
                  <span>{digitalSignature ? "✓ Ստորագրված է" : "✍️ e-Sign"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-md ${
                    pdfExportSuccess
                      ? "bg-emerald-500 text-white border border-emerald-400"
                      : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black border border-cyan-300"
                  }`}
                  title={`Ներբեռնել ${exportLanguage.toUpperCase()} PDF ակտը`}
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>PDF...</span>
                    </>
                  ) : pdfExportSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>PDF Պատրաստ է</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4" />
                      <span>PDF ({exportLanguage.toUpperCase()})</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadWord}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition cursor-pointer border border-white/20 shadow-xs"
                  title={`Ներբեռնել Word (${exportLanguage.toUpperCase()})`}
                >
                  <FileText className="w-3.5 h-3.5 text-blue-200" />
                  <span>Word</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer border border-white/15 shadow-xs"
                  title="Տպել բրաուզերով"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-200" />
                  <span>Տպել</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6">
          
          {/* Photos Upload & Property Context Card */}
          <div
            className={`rounded-2xl p-5 space-y-4 border transition ${
              isDragOver
                ? "bg-blue-50/90 border-[#003399] ring-2 ring-[#003399]/30"
                : "bg-slate-50/80 border-slate-200"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#003399]" />
                  Լուսանկարների Փաթեթ (1-ից մինչև {MAX_PHOTOS} լուսանկար)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Վերբեռնեք շենքի ճակատի, ներքին հարդարման, էլեկտրական վահանակի, ջրագծերի, տանիքի, հակահրդեհային և անվտանգության համակարգերի լուսանկարները։
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded-xl border border-slate-200">
                  Վերբեռնված՝ {photos.length} / {MAX_PHOTOS}
                </span>
                {photos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPhotos([])}
                    className="text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1 transition cursor-pointer"
                  >
                    Մաքրել բոլորը
                  </button>
                )}
              </div>
            </div>

            {/* Property Context Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Գույքի հայտարարագրված տեսակ</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-[#003399]/30 focus:border-[#003399]"
                >
                  <option value="Բնակարան">Բնակարան (բազմաբնակարան շենք)</option>
                  <option value="Առանձնատուն">Առանձնատուն / Քոթեջ</option>
                  <option value="Գրասենյակ">Կոմերցիոն / Գրասենյակ</option>
                  <option value="Առևտրի տարածք / Խանութ">Առևտրի տարածք / Խանութ / Սրահ</option>
                  <option value="Սննդի օբյեկտ (Ռեստորան / Սրճարան)">Սննդի օբյեկտ (Ռեստորան / Սրճարան)</option>
                  <option value="Պահեստ">Պահեստային տարածք / Լոգիստիկ</option>
                  <option value="Արտադրամաս">Արտադրական շինություն / Գործարան</option>
                  <option value="Հյուրանոց">Հյուրանոց / Հանգստյան տուն</option>
                  <option value="Բժշկական կենտրոն">Բժշկական կենտրոն / Կլինիկա</option>
                  <option value="Ավտոսպասարկում">Ավտոսպասարկման կայան / Բոքսեր</option>
                  <option value="Այլ կոմերցիոն">Այլ հասարակական / Կոմերցիոն</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Հասցե / Գտնվելու վայր</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="ք․ Երևան, Կենտրոն..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-[#003399]/30 focus:border-[#003399]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Մակերես (քմ)</label>
                <input
                  type="number"
                  placeholder="85"
                  value={estimatedArea}
                  onChange={(e) => setEstimatedArea(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-[#003399]/30 focus:border-[#003399]"
                />
              </div>
            </div>

            {/* Photo Thumbnails & Multi-Uploader Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1">
              {photos.map((p, idx) => (
                <div
                  key={p.id}
                  className="relative group rounded-xl overflow-hidden border border-slate-300 bg-slate-900 aspect-square flex flex-col justify-between shadow-xs"
                >
                  <img
                    src={p.dataUrl}
                    alt={p.tag}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition duration-200"
                    onClick={() => setPreviewPhoto(p.dataUrl)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/40 pointer-events-none" />

                  {/* Top bar on photo */}
                  <div className="absolute top-1 left-1 right-1 flex items-center justify-between z-10">
                    <span className="text-[9px] font-black bg-slate-900/80 text-cyan-300 px-1 py-0.5 rounded backdrop-blur-xs">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(p.id)}
                      className="w-5 h-5 rounded-full bg-red-600/85 hover:bg-red-600 text-white flex items-center justify-center transition cursor-pointer"
                      title="Ջնջել լուսանկարը"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>

                  {/* Tag on bottom */}
                  <div className="absolute bottom-1 left-1 right-1 z-10">
                    <select
                      value={p.tag}
                      onChange={(e) => handleUpdatePhotoTag(p.id, e.target.value)}
                      className="w-full text-[9px] bg-slate-900/90 text-white font-semibold rounded px-1 py-0.5 border border-white/20 focus:outline-hidden truncate"
                      title={p.tag}
                    >
                      {PHOTO_TAG_SUGGESTIONS.map((tag) => (
                        <option key={tag} value={tag} className="text-slate-900 bg-white">
                          {tag}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}

              {/* Add Photo Button (if < MAX_PHOTOS) */}
              {photos.length < MAX_PHOTOS && (
                <label className="border-2 border-dashed border-indigo-200 hover:border-[#003399] bg-indigo-50/40 hover:bg-indigo-50/70 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer transition text-center p-2 group">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 group-hover:bg-[#003399] text-indigo-600 group-hover:text-white flex items-center justify-center transition mb-1 shadow-xs">
                    <Plus size={16} />
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-700">Ավելացնել</span>
                  <span className="text-[8px] text-slate-400">մինչև {MAX_PHOTOS}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFilesUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Action button to generate or re-generate */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleGenerateSurvey}
                disabled={loading || photos.length === 0}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#003399] to-[#0066FF] hover:from-[#00235B] hover:to-[#0052CC] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                    <span>AI-ը կատարում է սուրվեյ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>
                      {surveyReport ? "Թարմացնել / Վերագեներացնել Սուրվեյը" : `Գեներացնել Ռեպորտ (${photos.length} լուսանկար)`}
                    </span>
                  </>
                )}
              </button>

              {loading && scanningStep && (
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-[#0066FF]" />
                  <span>{scanningStep}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {exportError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{exportError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setExportError(null)}
                  className="text-red-700 hover:text-red-900 font-bold px-2 py-0.5 text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Generated Survey Report Card */}
          {surveyReport && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              
              {/* Executive Dashboard KPI Card */}
              <div className="bg-gradient-to-br from-slate-900 via-[#001D4A] to-[#002B66] text-white rounded-2xl p-6 shadow-xl border border-blue-900/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                        {surveyReport.id}
                      </span>
                      <span className="text-xs text-blue-200">
                        Ամսաթիվ՝ {surveyReport.createdAt}
                      </span>
                      {surveyReport.signOff?.surveyorName && (
                        <span className="text-xs text-slate-300 hidden lg:inline">
                          • Տեսուչ՝ {surveyReport.signOff.surveyorName}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                      {surveyReport.propertyType} • {surveyReport.buildingStructure}
                    </h3>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 shadow-xs ${
                        surveyReport.underwritingRiskLevel === "Ցածր ռիսկ"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : surveyReport.underwritingRiskLevel === "Միջին ռիսկ"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-red-500/20 text-red-300 border-red-500/40"
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{surveyReport.underwritingRiskLevel}</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl text-xs font-black bg-blue-500/20 text-cyan-200 border border-blue-400/30">
                      Կարգավիճակ՝ «{surveyReport.acceptanceStatus}»
                    </div>
                  </div>
                </div>

                {/* Score Indicators Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
                  <div className="bg-white/10 rounded-xl p-3.5 border border-white/10">
                    <div className="text-[11px] text-blue-200 font-medium">Անդեռռայթինգի Ինդեքս</div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
                      {surveyReport.underwritingScore} <span className="text-xs text-blue-200">/ 100</span>
                    </div>
                    <div className="text-[10px] text-slate-300 mt-0.5">Ընդունելիության բարձր ցուցանիշ</div>
                  </div>

                  <div className="bg-white/10 rounded-xl p-3.5 border border-white/10">
                    <div className="text-[11px] text-blue-200 font-medium">Հարդարման Որակ</div>
                    <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
                      {surveyReport.qualityScore} <span className="text-xs text-blue-200">/ 10</span>
                    </div>
                    <div className="text-[10px] text-slate-300 mt-0.5">{surveyReport.renovationCondition}</div>
                  </div>

                  <div className="bg-white/10 rounded-xl p-3.5 border border-white/10">
                    <div className="text-[11px] text-blue-200 font-medium">Սակագնի Գործակից</div>
                    <div className="text-xl sm:text-2xl font-black text-cyan-300 mt-1 flex items-center gap-1">
                      <TrendingDown className="w-5 h-5 text-emerald-400" />
                      <span>x {surveyReport.recommendedTariffMultiplier}</span>
                    </div>
                    <div className="text-[10px] text-slate-300 mt-0.5">
                      {surveyReport.recommendedTariffMultiplier < 1 ? "Արտոնյալ զեղչ" : "Ստանդարտ սակագին"}
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-xl p-3.5 border border-white/10">
                    <div className="text-[11px] text-blue-200 font-medium">PML (Հավանական Վնաս)</div>
                    <div className="text-xl sm:text-2xl font-black text-rose-300 mt-1">
                      {surveyReport.lossExpectancy ? `${surveyReport.lossExpectancy.pmlPercent}%` : "18%"}
                    </div>
                    <div className="text-[10px] text-slate-300 mt-0.5">
                      Ֆրանշիզա՝ {surveyReport.recommendedFranchisePercent}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 gap-1 overflow-x-auto text-xs font-extrabold pb-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-2.5 rounded-t-xl border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === "overview"
                      ? "border-[#003399] text-[#003399] bg-blue-50/50"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Building2 size={15} />
                  <span>Ընդհանուր & Կոնստրուկցիա</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("cope")}
                  className={`px-4 py-2.5 rounded-t-xl border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === "cope"
                      ? "border-[#003399] text-[#003399] bg-blue-50/50"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Layers size={15} />
                  <span>COPE Վերլուծություն</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("scores")}
                  className={`px-4 py-2.5 rounded-t-xl border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === "scores"
                      ? "border-[#003399] text-[#003399] bg-blue-50/50"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Activity size={15} />
                  <span>Ռիսկերի Ռադար & Կորուստներ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("warranties")}
                  className={`px-4 py-2.5 rounded-t-xl border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === "warranties"
                      ? "border-[#003399] text-[#003399] bg-blue-50/50"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ShieldCheck size={15} />
                  <span>Երաշխիքներ & Ռիսկեր</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("photos")}
                  className={`px-4 py-2.5 rounded-t-xl border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === "photos"
                      ? "border-[#003399] text-[#003399] bg-blue-50/50"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Camera size={15} />
                  <span>Լուսանկարների Փաստարկում ({surveyReport.photoEvidence?.length || surveyReport.photoThumbnails?.length || photos.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("narrative")}
                  className={`px-4 py-2.5 rounded-t-xl border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === "narrative"
                      ? "border-[#003399] text-[#003399] bg-blue-50/50"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileCheck size={15} />
                  <span>Պաշտոնական Ակտի Տեքստ</span>
                </button>
              </div>

              {/* Tab Content 1: Overview & Structure */}
              {activeTab === "overview" && (
                <div className="space-y-4 text-xs">
                  {/* AI Property Purpose & Classification Banner */}
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-cyan-50/50 border border-blue-200/80 rounded-2xl p-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-200/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#003399] text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                          <Building2 className="w-5 h-5 text-cyan-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-black text-[#003399] tracking-wider">
                              AI Գույքի Ֆունկցիոնալ Նշանակության Ճանաչում
                            </span>
                            {surveyReport.propertyCategoryArm && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#003399]/15 text-[#003399] border border-[#003399]/20">
                                {surveyReport.propertyCategoryArm}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-black text-slate-900 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>Ճանաչված տեսակ՝</span>
                            <span className="text-[#003399] bg-white px-2 py-0.5 rounded-lg border border-blue-200 shadow-xs">
                              {surveyReport.detectedPropertyType || surveyReport.propertyType}
                            </span>
                            {surveyReport.functionalSubtype && (
                              <span className="text-slate-600 font-bold text-xs">
                                ({surveyReport.functionalSubtype})
                              </span>
                            )}
                          </h4>
                        </div>
                      </div>

                      {/* Confidence badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 font-semibold block">Ճանաչման վստահություն</span>
                          <span className="text-xs font-black text-emerald-700">
                            {surveyReport.propertyPurposeConfidence || 95}% (Բարձր ճշգրտություն)
                          </span>
                        </div>
                        <div className="w-10 h-10 rounded-full border-2 border-emerald-500 bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs">
                          {surveyReport.propertyPurposeConfidence || 95}%
                        </div>
                      </div>
                    </div>

                    {/* Visual Clues / Forensic Proofs */}
                    {Array.isArray(surveyReport.purposeVisualClues) && surveyReport.purposeVisualClues.length > 0 && (
                      <div className="pt-3 space-y-1.5">
                        <div className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Լուսանկարներից նույնականացված տեսողական փաստարկներ (Visual Clues)՝</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {surveyReport.purposeVisualClues.map((clue, cIdx) => (
                            <span
                              key={cIdx}
                              className="bg-white text-slate-800 border border-blue-200/80 px-2.5 py-1 rounded-lg text-[11px] font-medium shadow-2xs inline-flex items-center gap-1"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#003399]" />
                              {clue}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Discrepancy Alert if declared != detected */}
                    {surveyReport.detectedPropertyType &&
                      propertyType &&
                      !surveyReport.detectedPropertyType.toLowerCase().includes(propertyType.toLowerCase()) &&
                      !propertyType.toLowerCase().includes(surveyReport.detectedPropertyType.toLowerCase()) && (
                        <div className="mt-3 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Ուշադրություն՝ </span>
                            Հայտարարագրված էր որպես <span className="font-bold underline">{propertyType}</span>, սակայն AI-ը լուսանկարների փաստացի զննմամբ ճանաչել է որպես <span className="font-bold underline text-[#003399]">{surveyReport.detectedPropertyType}</span>: Կիրառելիս հարցաշարը կթարմացվի փաստացի նշանակությամբ:
                          </div>
                        </div>
                      )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#003399]" />
                        Շինարարական Կոնստրուկցիա և Ամրություն
                      </div>
                      <div className="space-y-2 text-slate-700 leading-relaxed">
                        <div>
                          <span className="font-bold text-slate-900">Կոնստրուկտիվ տիպ՝</span>{" "}
                          {surveyReport.buildingStructure}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">Ամրության գնահատական՝</span>{" "}
                          {surveyReport.structuralIntegritySummary}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">Տեսանելի թերություններ՝</span>{" "}
                          <span className={surveyReport.visibleDefects.includes("չեն") ? "text-emerald-700 font-semibold" : "text-amber-700 font-semibold"}>
                            {surveyReport.visibleDefects}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        Հարդարում և Օգտագործված Նյութեր
                      </div>
                      <div className="space-y-2 text-slate-700 leading-relaxed">
                        <div>
                          <span className="font-bold text-slate-900">Վերանորոգման կարգ՝</span>{" "}
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-[#003399] font-bold">
                            {surveyReport.renovationCondition}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">Նկատված նյութեր՝</span>{" "}
                          {surveyReport.materialsObserved}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">Որակի գնահատական՝</span>{" "}
                          <span className="font-extrabold text-[#003399]">{surveyReport.qualityScore} միավոր</span> (10-բալանոց սանդղակով)
                        </div>
                      </div>
                    </div>

                    {/* Systems Summary Cards */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                      <div className="font-extrabold text-slate-900 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Էլեկտրական և Կոմունալ Ցանցեր
                      </div>
                      <p className="text-slate-700 leading-relaxed">
                        {surveyReport.utilitiesRiskSummary}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                      <div className="font-extrabold text-slate-900 flex items-center gap-2">
                        <Flame className="w-4 h-4 text-rose-500" />
                        Հակահրդեհային & Ֆիզիկական Անվտանգություն
                      </div>
                      <p className="text-slate-700 leading-relaxed">
                        {surveyReport.fireSafetyObserved} • {surveyReport.securityObserved}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content 2: COPE Framework */}
              {activeTab === "cope" && (
                <div className="space-y-4 text-xs">
                  <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase font-black tracking-wider text-cyan-300">
                        International Property Underwriting Standard
                      </div>
                      <h4 className="text-sm font-bold text-white mt-0.5">
                        COPE Analysis Matrix (Construction, Occupancy, Protection, Exposure)
                      </h4>
                    </div>
                    <div className="text-xs text-blue-200 font-medium hidden sm:block">
                      Swiss Re / Munich Re ստանդարտացված գույքային ռիսկերի գնահատում
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* C - Construction */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="font-black text-sm text-blue-950 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xs">C</span>
                          <span>Construction (Կոնստրուկցիա)</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Բարձր հուսալիություն
                        </span>
                      </div>
                      <div className="space-y-2 text-slate-700">
                        <div>
                          <span className="font-bold text-slate-900">Հիմնական նյութեր՝</span>{" "}
                          {surveyReport.copeAnalysis?.construction.materials || "Մոնոլիտ երկաթբետոն, տուֆ/բազալտե շարվածք"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">Կրող տարրեր և ծածկեր՝</span>{" "}
                          {surveyReport.copeAnalysis?.construction.loadBearing || "Կայուն, առանց դեֆորմացիաների"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">Տանիք և ծածկույթ՝</span>{" "}
                          {surveyReport.copeAnalysis?.construction.roofCondition || "Բարվոք վիճակ, ջրամեկուսացված"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">Սեյսմակայունություն՝</span>{" "}
                          {surveyReport.copeAnalysis?.construction.seismicResilience || "Համապատասխանում է ՀՀ նորմերին"}
                        </div>
                        <div className="pt-1 text-[#003399] font-medium italic border-t border-slate-200">
                          Եզրակացություն՝ {surveyReport.copeAnalysis?.construction.evaluation || "Կոնստրուկցիայի ռիսկը նվազագույն է:"}
                        </div>
                      </div>
                    </div>

                    {/* O - Occupancy */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="font-black text-sm text-indigo-950 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-black text-xs">O</span>
                          <span>Occupancy (Շահագործում)</span>
                        </div>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Ծանրաբեռնվածություն՝ {surveyReport.copeAnalysis?.occupancy.fireLoadDensity || "Ցածր"}
                        </span>
                      </div>
                      <div className="space-y-2 text-slate-700">
                        <div>
                          <span className="font-bold text-slate-900">Շահագործման բնույթ՝</span>{" "}
                          {surveyReport.copeAnalysis?.occupancy.purpose || `${surveyReport.propertyType} - բնականոն շահագործում`}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">Կարգուկանոն (Housekeeping)՝</span>{" "}
                          {surveyReport.copeAnalysis?.occupancy.housekeepingRating || "Լավ / Կոկիկ"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">Վտանգավոր / Դյուրավառ նյութեր՝</span>{" "}
                          {surveyReport.copeAnalysis?.occupancy.hazardousMaterials || "Չեն նկատվել"}
                        </div>
                        <div className="pt-1 text-[#003399] font-medium italic border-t border-slate-200">
                          Եզրակացություն՝ {surveyReport.copeAnalysis?.occupancy.evaluation || "Հրդեհային բեռնվածությունը ցածր է:"}
                        </div>
                      </div>
                    </div>

                    {/* P - Protection */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="font-black text-sm text-rose-950 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-black text-xs">P</span>
                          <span>Protection (Պաշտպանություն)</span>
                        </div>
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Առկա + Խորհուրդ
                        </span>
                      </div>
                      <div className="space-y-2 text-slate-700">
                        <div>
                          <span className="font-bold text-slate-900">Հակահրդեհային ահազանգում՝</span>{" "}
                          {surveyReport.copeAnalysis?.protection.fireDetectionAlarm || "Ծխորսիչ սենսորների առաջարկ"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">Կրակմարիչներ՝</span>{" "}
                          {surveyReport.copeAnalysis?.protection.fireExtinguishers || "Առկա է կամ խորհուրդ է տրվում OP-4"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">Ջրի արտահոսքի պաշտպանություն՝</span>{" "}
                          {surveyReport.copeAnalysis?.protection.waterLeakSensors || "Առաջարկվում է տեղադրել ավտոմատ փական"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">ՀՓՋ-ի ժամանման հեռավորություն (ETA)՝</span>{" "}
                          {surveyReport.copeAnalysis?.protection.nearestFireStationEta || "4-6 րոպե"}
                        </div>
                        <div className="pt-1 text-[#003399] font-medium italic border-t border-slate-200">
                          Եզրակացություն՝ {surveyReport.copeAnalysis?.protection.evaluation || "Հիմնական անվտանգությունն ապահովված է:"}
                        </div>
                      </div>
                    </div>

                    {/* E - Exposure */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="font-black text-sm text-teal-950 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xs">E</span>
                          <span>Exposure (Հարևանություն & Արտաքին)</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Ցածր վտանգ
                        </span>
                      </div>
                      <div className="space-y-2 text-slate-700">
                        <div>
                          <span className="font-bold text-slate-900">Հարակից շինություններ՝</span>{" "}
                          {surveyReport.copeAnalysis?.exposure.adjoiningBuildings || "Ստանդարտ բնակելի միջավայր, վտանգավոր արտադրություններ չկան"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">Հեղեղում / Բնական աղետներ՝</span>{" "}
                          {surveyReport.copeAnalysis?.exposure.floodWaterRisk || "Ռիսկը ցածր է"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">Հրշեջ տեխնիկայի մոտեցման ուղիներ՝</span>{" "}
                          {surveyReport.copeAnalysis?.exposure.accessForEmergencyVehicles || "Ազատ և անխոչընդոտ"}
                        </div>
                        <div className="pt-1 text-[#003399] font-medium italic border-t border-slate-200">
                          Եզրակացություն՝ {surveyReport.copeAnalysis?.exposure.evaluation || "Արտաքին վտանգներ չեն հայտնաբերվել:"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content 3: Scores & Loss Expectancy */}
              {activeTab === "scores" && (
                <div className="space-y-5 text-xs">
                  {/* Category Scores Breakdown */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#003399]" />
                        Ռիսկերի Բազմագործոն Գնահատական (0-100 Սանդղակով)
                      </div>
                      <span className="text-xs font-bold text-[#003399] bg-blue-100 px-2.5 py-0.5 rounded-full">
                        Ընդհանուր՝ {surveyReport.underwritingScore} / 100
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        {
                          name: "Կոնստրուկցիայի ամրություն",
                          score: surveyReport.categoryScores?.structuralScore ?? 90,
                          icon: Building2,
                          color: "from-blue-600 to-indigo-600",
                        },
                        {
                          name: "Հակահրդեհային պաշտպանվածություն",
                          score: surveyReport.categoryScores?.fireProtectionScore ?? 82,
                          icon: Flame,
                          color: "from-rose-600 to-orange-600",
                        },
                        {
                          name: "Կոմունալ / Ջրային անվտանգություն",
                          score: surveyReport.categoryScores?.utilitiesWaterScore ?? 85,
                          icon: Zap,
                          color: "from-amber-600 to-yellow-600",
                        },
                        {
                          name: "Ֆիզիկական պաշտպանություն & Գողություն",
                          score: surveyReport.categoryScores?.securityTheftScore ?? 88,
                          icon: ShieldCheck,
                          color: "from-emerald-600 to-teal-600",
                        },
                        {
                          name: "Արտաքին միջավայր & Բնական ռիսկեր",
                          score: surveyReport.categoryScores?.exposureNaturalHazardsScore ?? 84,
                          icon: Compass,
                          color: "from-cyan-600 to-blue-600",
                        },
                        {
                          name: "Հարդարման որակական ինդեքս",
                          score: Math.round((surveyReport.qualityScore / 10) * 100),
                          icon: Award,
                          color: "from-purple-600 to-indigo-600",
                        },
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                              <item.icon className="w-3.5 h-3.5 text-slate-500" />
                              <span className="truncate">{item.name}</span>
                            </div>
                            <span className="font-black text-slate-900">{item.score}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Loss Expectancy Matrix */}
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-cyan-400">Underwriting Loss Estimates</div>
                        <h4 className="text-sm font-bold text-white mt-0.5">
                          Կորուստների Ակնկալիքի Մատրից (Loss Expectancy)
                        </h4>
                      </div>
                      <span className="text-xs text-slate-300">
                        Առաջարկվող ֆրանշիզա՝ {surveyReport.recommendedFranchisePercent}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                        <div className="text-[10px] text-blue-200 font-bold uppercase">PML (Probable Max Loss)</div>
                        <div className="text-2xl font-black text-amber-300 mt-1">
                          {surveyReport.lossExpectancy?.pmlPercent ?? 18}%
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-tight">
                          {surveyReport.lossExpectancy?.pmlSummary || "Հավանական առավելագույն կորուստ տեղային հրդեհի և ՀՓՋ ժամանման դեպքում:"}
                        </p>
                      </div>

                      <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                        <div className="text-[10px] text-blue-200 font-bold uppercase">MFL (Max Foreseeable Loss)</div>
                        <div className="text-2xl font-black text-rose-400 mt-1">
                          {surveyReport.lossExpectancy?.mflPercent ?? 65}%
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-tight">
                          Տեսական առավելագույն կորուստ՝ հրդեհաշիջման համակարգի լրիվ ձախողման դեպքում:
                        </p>
                      </div>

                      <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                        <div className="text-[10px] text-blue-200 font-bold uppercase">NLE (Normal Loss Expectancy)</div>
                        <div className="text-2xl font-black text-emerald-400 mt-1">
                          {surveyReport.lossExpectancy?.nlePercent ?? 7}%
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-tight">
                          Ստանդարտ կենցաղային պատահարի (ջրի արտահոսք կամ փոքր բռնկում) սպասվող վնասի շեմ:
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content 4: Warranties & Risks */}
              {activeTab === "warranties" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Mandatory Pre-Inception Warranties */}
                  <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-3">
                    <div className="font-extrabold text-rose-950 flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4 text-rose-600" />
                      Պարտադիր Նախապայմաններ (Warranties)
                    </div>
                    <p className="text-[11px] text-rose-900 font-medium">
                      Պայմաններ, որոնք պետք է բավարարվեն մինչև ապահովագրական պայմանագրի ուժի մեջ մտնելը.
                    </p>
                    <ul className="space-y-2 text-rose-950">
                      {(surveyReport.warranties?.mandatoryPreInception || [
                        "Էլեկտրական վահանակի ավտոմատ անջատիչների սարքին վիճակի հաստատում",
                        "Հրդեհային տարհանման ուղիների և դռների անարգել բացում",
                      ]).map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                          <span className="font-semibold">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Advisory Risk Improvements */}
                  <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-3">
                    <div className="font-extrabold text-[#003399] flex items-center gap-2">
                      <Info className="w-4 h-4 text-[#003399]" />
                      Խորհրդատվական Բարելավումներ (Advisory)
                    </div>
                    <p className="text-[11px] text-blue-900 font-medium">
                      Առաջարկություններ սակագինը նվազեցնելու և գույքի պաշտպանությունը բարձրացնելու համար.
                    </p>
                    <ul className="space-y-2 text-slate-800">
                      {(surveyReport.warranties?.advisoryImprovement || surveyReport.recommendations).map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#003399] mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Positive Factors */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
                    <div className="font-extrabold text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Ապահովագրական Դրական Գործոններ
                    </div>
                    <ul className="space-y-2 text-emerald-950">
                      {surveyReport.positiveFactors.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Risk Factors */}
                  <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3">
                    <div className="font-extrabold text-amber-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Ուշադրության Արժանի Ռիսկային Կետեր
                    </div>
                    <ul className="space-y-2 text-amber-950">
                      {surveyReport.riskFactors.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab Content 5: Photos Evidence with AI Annotations */}
              {activeTab === "photos" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>
                      Փաստագրված է {surveyReport.photoEvidence?.length || surveyReport.photoThumbnails?.length || photos.length} լուսանկար՝ տեսուչի մեկնաբանություններով.
                    </span>
                    <span>Սեղմեք լուսանկարի վրա՝ մեծացնելու համար</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {(surveyReport.photoEvidence && surveyReport.photoEvidence.length > 0
                      ? surveyReport.photoEvidence
                      : (surveyReport.photoThumbnails || photos).map((p, i) => ({
                          dataUrl: p.dataUrl,
                          tag: p.tag || `Լուսանկար #${i + 1}`,
                          observation: "Տեխնիկական զննմամբ խախտումներ չեն արձանագրվել:",
                          riskRating: "low" as const,
                        }))
                    ).map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
                      >
                        <div
                          className="relative aspect-video bg-slate-900 cursor-pointer overflow-hidden group"
                          onClick={() => setPreviewPhoto(item.dataUrl)}
                        >
                          <img
                            src={item.dataUrl}
                            alt={item.tag}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          />
                          <div className="absolute top-2 left-2 bg-slate-900/80 text-cyan-300 text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-xs">
                            #{idx + 1}
                          </div>
                          <div className="absolute bottom-2 right-2 bg-slate-900/70 text-white p-1 rounded-md">
                            <Maximize2 size={12} />
                          </div>
                        </div>

                        <div className="p-3 flex-1 flex flex-col justify-between space-y-2 text-xs">
                          <div>
                            <div className="font-bold text-slate-900 text-[11px] truncate">
                              {item.tag}
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                              {item.observation || "Տարածքը գտնվում է բարվոք վիճակում:"}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-[10px] text-slate-400 font-medium">Ակտ N {surveyReport.id}</span>
                            <span
                              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                item.riskRating === "attention"
                                  ? "bg-amber-100 text-amber-800"
                                  : item.riskRating === "medium"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {item.riskRating === "attention" ? "Ուշադրություն" : item.riskRating === "medium" ? "Միջին" : "Բարվոք"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab Content 6: Full Narrative Report */}
              {activeTab === "narrative" && (
                <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 font-mono text-xs leading-relaxed space-y-3 relative shadow-inner">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700 pb-3 gap-2">
                    <span className="text-cyan-400 font-sans font-bold">
                      Պաշտոնական Ակտի Լրիվ Տեքստ (SIL Insurance Pre-Risk Survey Narrative)
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={isExportingPdf}
                        className="inline-flex items-center gap-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer font-sans text-xs"
                      >
                        {isExportingPdf ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <FileDown size={13} />
                        )}
                        <span>Ներբեռնել PDF Ակտ</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadWord}
                        className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg transition cursor-pointer font-sans text-xs"
                      >
                        <FileText size={13} />
                        <span>Word (.doc)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyNarrative}
                        className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition cursor-pointer font-sans text-xs"
                      >
                        {copied ? (
                          <>
                            <Check size={13} className="text-emerald-400" />
                            <span>Տեքստը Պատճենված է</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Պատճենել Տեքստը</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200 max-h-[450px] overflow-y-auto pr-2">
                    {surveyReport.fullNarrativeReport}
                  </pre>
                </div>
              )}

              {/* Bottom Apply & Export Buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isExportingPdf}
                    className={`px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                      pdfExportSuccess
                        ? "bg-emerald-600 text-white"
                        : "bg-cyan-600 hover:bg-cyan-700 text-white"
                    }`}
                  >
                    {isExportingPdf ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>PDF Պատրաստում...</span>
                      </>
                    ) : (
                      <>
                        <FileDown className="w-4 h-4" />
                        <span>Ներբեռնել PDF Ակտ</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadWord}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
                  >
                    <FileText className="w-4 h-4 text-blue-700" />
                    <span>Word (.doc)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyFormatted}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
                  >
                    {copyFormattedSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Պատճենված է Word-ի</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-600" />
                        <span>Պատճենել Word-ի համար</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onApplySurveyReport(surveyReport);
                      onClose();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Կիրառել Տվյալները Հարցաշարում</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer"
                  >
                    Փակել
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Zoom Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-[160] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewPhoto}
              alt="Photo Full Zoom"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/20"
            />
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-cyan-300 font-bold text-sm flex items-center gap-1 cursor-pointer"
            >
              <X size={20} /> Փակել
            </button>
          </div>
        </div>
      )}

      {/* Digital Signature Modal */}
      {signatureModalOpen && (
        <SignatureModal
          isOpen={signatureModalOpen}
          onClose={() => setSignatureModalOpen(false)}
          defaultSignerName={surveyReport?.signOff?.surveyorName || "Գ․ Գևորգյան"}
          defaultRole="surveyor"
          title="Սուրվեյի Ակտի Էլեկտրոնային Թվային Ստորագրություն"
          onSaveSignature={(sig) => {
            setDigitalSignature(sig);
          }}
        />
      )}

      {/* Printable Official Paper Survey Report */}
      {surveyReport && (
        <div className="hidden print:block fixed inset-0 bg-white text-slate-900 p-8 z-[200]">
          <div className="border-b-2 border-[#003399] pb-4 mb-5 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-[#003399]">«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ</h1>
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                ԳՈՒՅՔԻ ԱՊԱՀՈՎԱԳՐԱԿԱՆ ՏԵՂԱԶՆՆՈՒԹՅԱՆ ԵՎ ՌԻՍԿԵՐԻ ԳՆԱՀԱՏՄԱՆ (ՍՈՒՐՎԵՅԻ) ՊԱՇՏՈՆԱԿԱՆ ԱԿՏ
              </h2>
            </div>
            <div className="text-right text-xs">
              <div className="font-black text-[#003399] text-sm">Ակտ N {surveyReport.id}</div>
              <div>Ամսաթիվ՝ {surveyReport.createdAt}</div>
              <div>Վայր՝ {address || "ք․ Երևան"}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs mb-4 p-3 bg-slate-50 border border-slate-200 rounded">
            <div>
              <span className="font-bold">Գույքի տեսակ՝</span> {surveyReport.propertyType}
            </div>
            <div>
              <span className="font-bold">Կոնստրուկտիվ տիպ՝</span> {surveyReport.buildingStructure}
            </div>
            <div>
              <span className="font-bold">Վերանորոգման վիճակ՝</span> {surveyReport.renovationCondition} (Որակ՝ {surveyReport.qualityScore}/10)
            </div>
            <div>
              <span className="font-bold">Անդեռռայթինգի գնահատական՝</span> {surveyReport.underwritingScore} / 100 ({surveyReport.underwritingRiskLevel})
            </div>
            <div>
              <span className="font-bold">Ընդունելիություն՝</span> «{surveyReport.acceptanceStatus}»
            </div>
            <div>
              <span className="font-bold">Սակագնի գործակից՝</span> x {surveyReport.recommendedTariffMultiplier} (Ֆրանշիզա՝ {surveyReport.recommendedFranchisePercent}%)
            </div>
            <div>
              <span className="font-bold">PML (Հավանական վնաս)՝</span> {surveyReport.lossExpectancy?.pmlPercent ?? 18}%
            </div>
            <div>
              <span className="font-bold">MFL (Առավելագույն վնաս)՝</span> {surveyReport.lossExpectancy?.mflPercent ?? 65}%
            </div>
          </div>

          <div className="border-t border-slate-300 pt-3 mb-4 text-xs space-y-2">
            <div>
              <span className="font-bold text-slate-900">1. COPE Կոնստրուկցիա (Construction)՝</span> {surveyReport.copeAnalysis?.construction.materials || surveyReport.materialsObserved} — {surveyReport.structuralIntegritySummary}
            </div>
            <div>
              <span className="font-bold text-slate-900">2. COPE Շահագործում (Occupancy)՝</span> {surveyReport.copeAnalysis?.occupancy.purpose || surveyReport.propertyType} (Հրդեհային ծանրաբեռնվածություն՝ {surveyReport.copeAnalysis?.occupancy.fireLoadDensity || "Ցածր"})
            </div>
            <div>
              <span className="font-bold text-slate-900">3. COPE Պաշտպանություն (Protection)՝</span> {surveyReport.fireSafetyObserved} • {surveyReport.securityObserved} (ՀՓՋ՝ {surveyReport.copeAnalysis?.protection.nearestFireStationEta || "4-6 րոպե"})
            </div>
            <div>
              <span className="font-bold text-slate-900">4. COPE Հարևանություն (Exposure)՝</span> {surveyReport.copeAnalysis?.exposure.adjoiningBuildings || "Արտաքին վտանգներ չեն հայտնաբերվել"}
            </div>
            <div>
              <span className="font-bold text-slate-900">5. Տեսողական թերություններ՝</span> {surveyReport.visibleDefects}
            </div>
          </div>

          <div className="border-t border-slate-300 pt-3 mb-4 text-xs">
            <div className="font-bold text-slate-900 mb-1">Պարտադիր Երաշխիքներ և Անդեռռայթերի Հանձնարարականներ՝</div>
            <ul className="list-disc pl-4 space-y-1 text-slate-800">
              {(surveyReport.warranties?.mandatoryPreInception || surveyReport.recommendations).map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>

          <div className="pt-8 border-t border-slate-300 flex justify-between text-xs mt-10">
            <div>
              <div className="font-bold">{surveyReport.signOff?.surveyorName || "Գ․ Գևորգյան (Ավագ Ռիսկ-Ինժեներ / Սուրվեյոր)"}</div>
              <div className="text-slate-500 text-[10px]">{surveyReport.signOff?.surveyorTitle || "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Տեղազննության Վարչություն"}</div>
              <div className="mt-8 border-t border-slate-400 pt-1 w-48 text-center text-slate-600">
                (ստորագրություն)
              </div>
            </div>
            <div>
              <div className="font-bold">{surveyReport.signOff?.chiefUnderwriter || "Ա․ Մկրտչյան (Գլխավոր Անդեռռայթեր)"}</div>
              <div className="text-slate-500 text-[10px]">«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Գույքային Ռիսկերի Բաժին</div>
              <div className="mt-8 border-t border-slate-400 pt-1 w-48 text-center text-slate-600">
                (ստորագրություն, կնիք)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
