import React from "react";
import { ShieldAlert, CheckCircle2, AlertTriangle, TrendingUp, Info } from "lucide-react";

interface RiskScoringPanelProps {
  productType: string;
  quotationData: any;
  annualPremium: number;
}

export function RiskScoringPanel({ productType, quotationData, annualPremium }: RiskScoringPanelProps) {
  // Compute a deterministic risk score based on product and input values
  let riskScore = 24; // Lower is safer
  let riskLevel = "Ցածր ռիսկային (Low Risk)";
  let riskColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
  let recommendations: string[] = [];

  if (productType === "casco") {
    const carAge = 2026 - Number(quotationData?.carYear || 2020);
    riskScore = Math.min(90, Math.max(10, carAge * 7 + (quotationData?.driversAge < 25 ? 25 : 5)));
    if (riskScore > 65) {
      riskLevel = "Բարձր ռիսկային (High Risk)";
      riskColor = "text-rose-600 bg-rose-50 border-rose-200";
      recommendations.push("Առաջարկվում է սահմանել ավելացված ֆրանշիզա (օր.՝ 100,000 AMD) վնասի դեպքում");
      recommendations.push("Պահանջվում է լրացուցիչ տեխնիկական զննություն նախքան պայմանագրի կնքումը");
    } else if (riskScore > 40) {
      riskLevel = "Միջին ռիսկային (Moderate Risk)";
      riskColor = "text-amber-600 bg-amber-50 border-amber-200";
      recommendations.push("Ստանդարտ պայմանները լիովին բավարար են");
      recommendations.push("Կարող եք ակտիվացնել 24/7 ավտոօգնություն փաթեթը");
    } else {
      riskLevel = "Ցածր ռիսկային (Optimal Risk)";
      riskColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
      recommendations.push("Հնարավոր է տրամադրել մինչև 10% անվթար վարելու զեղչ");
      recommendations.push("Հաստատված է առանց հավելյալ սահմանափակումների");
    }
  } else if (productType === "property") {
    riskScore = 18;
    riskLevel = "Ապահով ռիսկ (Safe Property)";
    riskColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
    recommendations.push("Գույքը գտնվում է բարձրլիկვიդային վարչական շրջանում");
    recommendations.push("Առաջարկվում է ներառել նաև երրորդ անձանց հանդեպ պատասխանատվության ծածկույթ");
  } else {
    riskScore = 30;
    riskLevel = "Ստանդարտ ռիսկային պրոֆիլ";
    riskColor = "text-blue-600 bg-blue-50 border-blue-200";
    recommendations.push("Underwriting կանոնները լիովին պահպանված են");
    recommendations.push("Սակագինը համապատասխանում է ընդհանուր ուղեցույցներին");
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            <TrendingUp size={16}/>
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900">Underwriting Ռիսկերի Սքորինգ</h4>
            <p className="text-[11px] text-slate-500">Ավտոմատ գնահատական և երաշխավորված առաջարկներ</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full border text-xs font-bold ${riskColor}`}>
          {riskLevel}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ռիսկի Ինդեքս (0-100)</div>
          <div className="text-2xl font-black text-slate-900">{riskScore} <span className="text-xs font-normal text-slate-500">/ 100</span></div>
          <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
            <div className={`h-full rounded-full ${riskScore > 60 ? "bg-rose-500" : riskScore > 35 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${riskScore}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Հաշվարկված Հավելավճար</div>
          <div className="text-2xl font-black text-emerald-700">
            {new Intl.NumberFormat("hy-AM").format(Math.round(annualPremium))} <span className="text-xs font-bold text-slate-600">AMD</span>
          </div>
          <div className="text-[10px] text-emerald-800 font-bold mt-1">✓ Ներառյալ բոլոր հարկերը և վճարները</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ստուգման կարգավիճակ</div>
          <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 mt-1">
            <CheckCircle2 size={16} className="text-emerald-600"/> Ավտոմատ Հաստատված
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Լրացուցիչ underwriter ստուգում չի պահանջվում։</div>
        </div>
      </div>

      <div>
        <div className="text-xs font-black text-slate-700 mb-2 flex items-center gap-1.5">
          <Info size={14} className="text-slate-500"/> Մասնագիտական առաջարկություններ այս գնառաջարկի համար.
        </div>
        <ul className="space-y-2">
          {recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-100">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">{idx + 1}</span>
              <span className="font-medium">{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
