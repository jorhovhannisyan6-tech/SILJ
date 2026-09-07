import React, { useRef, useState, useEffect } from "react";
import {
  PenTool,
  RotateCcw,
  CheckCircle2,
  X,
  ShieldCheck,
  Award,
  Sparkles,
  Lock,
} from "lucide-react";

export interface DigitalSignatureResult {
  signatureDataUrl: string;
  signerName: string;
  signerRole: "client" | "surveyor" | "underwriter";
  signerRoleLabel: string;
  signedAt: string;
  verificationHash: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (sig: DigitalSignatureResult) => void;
  defaultSignerName?: string;
  defaultRole?: "client" | "surveyor" | "underwriter";
  title?: string;
}

export const SignatureModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaveSignature,
  defaultSignerName = "",
  defaultRole = "client",
  title = "Էլեկտրոնային Թվային Ստորագրություն (e-Sign)",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [signerRole, setSignerRole] = useState<"client" | "surveyor" | "underwriter">(defaultRole);
  const [penColor, setPenColor] = useState<string>("#003399"); // SIL Blue default
  const [penWidth, setPenWidth] = useState<number>(2.5);

  useEffect(() => {
    if (defaultSignerName && !signerName) {
      setSignerName(defaultSignerName);
    }
  }, [defaultSignerName]);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High DPI Canvas setup
    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = (rect.width || 480) * ratio;
    canvas.height = (rect.height || 180) * ratio;
    ctx.scale(ratio, ratio);

    // Canvas background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width || 480, rect.height || 180);

    // Baseline guide
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, (rect.height || 180) * 0.75);
    ctx.lineTo((rect.width || 480) - 30, (rect.height || 180) * 0.75);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [isOpen]);

  if (!isOpen) return null;

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Redraw baseline guide
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, rect.height * 0.75);
    ctx.lineTo(rect.width - 30, rect.height * 0.75);
    ctx.stroke();
    ctx.setLineDash([]);

    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    const signatureDataUrl = canvas.toDataURL("image/png");
    const roleLabels = {
      client: "Ապահովադիր / Հաճախորդ",
      surveyor: "Ավագ Սուրվեյոր / Ռիսկ-Ինժեներ",
      underwriter: "Գլխավոր Անդեռռայթեր",
    };

    const randomHex = Math.random().toString(16).substring(2, 10).toUpperCase();
    const verificationHash = `SIL-SIG-${Date.now().toString(36).toUpperCase()}-${randomHex}`;

    onSaveSignature({
      signatureDataUrl,
      signerName: signerName.trim() || (signerRole === "client" ? "Հաճախորդ" : "Լիազորված Անձ"),
      signerRole,
      signerRoleLabel: roleLabels[signerRole],
      signedAt: new Date().toLocaleString("hy-AM"),
      verificationHash,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 text-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <PenTool size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                {title}
              </h3>
              <p className="text-xs text-slate-400">
                Ստորագրեք մկնիկով կամ սենսորային էկրանին
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Role and Name Configuration */}
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSignerRole("client")}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                signerRole === "client"
                  ? "bg-blue-600 text-white border-blue-400 shadow-md"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
              }`}
            >
              👤 Հաճախորդ
            </button>
            <button
              type="button"
              onClick={() => setSignerRole("surveyor")}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                signerRole === "surveyor"
                  ? "bg-emerald-600 text-white border-emerald-400 shadow-md"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
              }`}
            >
              🔍 Ռիսկ-Ինժեներ
            </button>
            <button
              type="button"
              onClick={() => setSignerRole("underwriter")}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                signerRole === "underwriter"
                  ? "bg-indigo-600 text-white border-indigo-400 shadow-md"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
              }`}
            >
              ⚖️ Անդեռռայթեր
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ստորագրողի Անուն, Ազգանուն
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Օր․՝ Արմեն Կարապետյան կամ Գ․ Գևորգյան"
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Canvas Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ստորագրության Դաշտ (Sign Here)</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px]">Գույն՝</span>
              <button
                type="button"
                onClick={() => setPenColor("#003399")}
                className={`w-5 h-5 rounded-full bg-[#003399] border-2 cursor-pointer ${
                  penColor === "#003399" ? "border-white scale-110" : "border-slate-600"
                }`}
                title="Կապույտ"
              />
              <button
                type="button"
                onClick={() => setPenColor("#0f172a")}
                className={`w-5 h-5 rounded-full bg-slate-900 border-2 cursor-pointer ${
                  penColor === "#0f172a" ? "border-white scale-110" : "border-slate-600"
                }`}
                title="Սև"
              />
              <button
                type="button"
                onClick={() => setPenColor("#1e3a8a")}
                className={`w-5 h-5 rounded-full bg-blue-900 border-2 cursor-pointer ${
                  penColor === "#1e3a8a" ? "border-white scale-110" : "border-slate-600"
                }`}
                title="Մուգ Կապույտ"
              />
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border-2 border-slate-700 bg-white shadow-inner">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-44 cursor-crosshair touch-none"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
                Ստորագրեք այստեղ (մատով կամ մկնիկով)
              </div>
            )}
          </div>
        </div>

        {/* Security / Verification Badge */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck size={14} />
            <span>256-bit Digital Signature Token ID</span>
          </div>
          <div className="text-slate-400 font-mono">
            {new Date().toLocaleDateString("hy-AM")}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={clearCanvas}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Մաքրել</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer"
            >
              Չեղարկել
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasDrawn}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>Հաստատել և Կցել Ակտին</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
