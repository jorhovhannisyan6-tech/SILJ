import React, { useState } from "react";
import {
  ShieldCheck,
  Activity,
  BarChart3,
  TrendingDown,
  PieChart as PieIcon,
  Flame,
  Building2,
  Lock,
  Layers,
  Award,
  Download,
  X,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const RISK_TIER_DATA = [
  { name: "Ցածր Ռիսկ (85-100)", count: 74, color: "#10b981" },
  { name: "Միջին Ռիսկ (65-84)", count: 38, color: "#f59e0b" },
  { name: "Բարձր / Սահմանային (0-64)", count: 12, color: "#ef4444" },
];

const COPE_RADAR_DATA = [
  { subject: "Կառուցվածք (C)", score: 91, fullMark: 100 },
  { subject: "Շահագործում (O)", score: 84, fullMark: 100 },
  { subject: "Հրդեհային (P)", score: 88, fullMark: 100 },
  { subject: "Անվտանգություն (P)", score: 86, fullMark: 100 },
  { subject: "Շրջակա Միջավայր (E)", score: 82, fullMark: 100 },
  { subject: "Ջրագծեր/Ինժեներական", score: 87, fullMark: 100 },
];

const PROPERTY_TYPE_DISTRIBUTION = [
  { name: "Բնակարաններ", value: 45, pmlAvg: 12, color: "#3b82f6" },
  { name: "Առանձնատներ", value: 28, pmlAvg: 18, color: "#06b6d4" },
  { name: "Կոմերցիոն Տարածքներ", value: 24, pmlAvg: 22, color: "#8b5cf6" },
  { name: "Պահեստներ / Լոգիստիկա", value: 16, pmlAvg: 28, color: "#f97316" },
  { name: "Արտադրական Շինություններ", value: 11, pmlAvg: 34, color: "#ec4899" },
];

const MONTHLY_SURVEY_EFFICIENCY = [
  { month: "Հնվ", totalSurveys: 24, acceptedRate: 92, avgScore: 86 },
  { month: "Փտր", totalSurveys: 31, acceptedRate: 90, avgScore: 85 },
  { month: "Մրտ", totalSurveys: 38, acceptedRate: 94, avgScore: 88 },
  { month: "Ապր", totalSurveys: 42, acceptedRate: 95, avgScore: 89 },
  { month: "Մայ", totalSurveys: 39, acceptedRate: 93, avgScore: 87 },
  { month: "Հուն", totalSurveys: 46, acceptedRate: 96, avgScore: 90 },
];

export const UnderwritingAnalyticsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "cope" | "pml" | "portfolio">("overview");

  if (!isOpen) return null;

  const exportAuditSummary = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Category,Count,PML_Avg_Percent,Status\n" +
      PROPERTY_TYPE_DISTRIBUTION.map((p) => `${p.name},${p.value},${p.pmlAvg}%,Acceptable`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SIL_Underwriting_Risk_Audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-5xl w-full my-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#001D4A] via-[#003399] to-[#0052CC] p-5 sm:p-6 flex items-center justify-between border-b border-blue-800/40 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-inner">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-400/30">
                  Risk Engineering Intelligence
                </span>
                <span className="text-xs text-blue-200">SIL Insurance CJSC</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                Անդեռռայթինգի և Ռիսկերի Վերլուծական Վահանակ
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportAuditSummary}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <Download size={15} />
              <span>Աուդիտի CSV Ֆայլ</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-950/60 px-6 pt-3 border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "overview"
                ? "bg-slate-900 text-cyan-400 border-t-2 border-cyan-400 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 size={15} />
            <span>Ռիսկերի Ամփոփագիր</span>
          </button>
          <button
            onClick={() => setActiveTab("cope")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "cope"
                ? "bg-slate-900 text-cyan-400 border-t-2 border-cyan-400 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck size={15} />
            <span>COPE Մատրից և Ռադար</span>
          </button>
          <button
            onClick={() => setActiveTab("pml")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "pml"
                ? "bg-slate-900 text-cyan-400 border-t-2 border-cyan-400 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingDown size={15} />
            <span>PML / MFL Կորուստներ</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-semibold">Սուրվեյների Քանակ</div>
              <div className="text-2xl font-black text-white mt-1">124</div>
              <div className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1 font-medium">
                <span>+18% նախորդ ամսվա համեմատ</span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-semibold">Միջին Սքորինգ (Score)</div>
              <div className="text-2xl font-black text-cyan-400 mt-1">87.8 / 100</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Ցածր Ռիսկի Պորտֆել</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-semibold">Ընդունելիություն</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">94.2%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">117 հաստատված ռեպորտ</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-semibold">Միջին PML Վնաս</div>
              <div className="text-2xl font-black text-amber-400 mt-1">19.4%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Reinsurance Limit OK</div>
            </div>
          </div>

          {/* Charts Row */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Risk Tier Pie Chart */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <PieIcon size={16} className="text-cyan-400" />
                  Ռիսկայնության Մակարդակների Բաշխվածություն
                </h4>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={RISK_TIER_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="count"
                      >
                        {RISK_TIER_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "10px", color: "#fff" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Volume */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <BarChart3 size={16} className="text-cyan-400" />
                  Ամսական Սուրվեյների Քանակ և Հաստատում
                </h4>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MONTHLY_SURVEY_EFFICIENCY}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "10px", color: "#fff" }} />
                      <Bar dataKey="totalSurveys" name="Սուրվեյներ" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === "cope" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-cyan-400" />
                  COPE Ռիսկ-Ինժեներական Ռադար (0-100)
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={COPE_RADAR_DATA}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis stroke="#64748b" domain={[0, 100]} />
                      <Radar name="Միջին Գնահատական" dataKey="score" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.4} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "10px", color: "#fff" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* COPE Breakdown List */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers size={16} className="text-cyan-400" />
                  COPE Ռիսկերի Վերլուծություն
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700">
                    <div className="font-bold text-cyan-300">C — Construction (Կառուցվածք) • 91/100</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Մոնոլիտ երկաթբետոնե և քարե շենքերի բարձր սեյսմակայունություն։</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700">
                    <div className="font-bold text-cyan-300">O — Occupancy (Շահագործում) • 84/100</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Բնակելի և գրասենյակային ցածր հրդեհային ծանրաբեռնվածություն։</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700">
                    <div className="font-bold text-cyan-300">P — Protection (Հակահրդեհային & Պահպանություն) • 88/100</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Ավտոմատ ծխորսիչներ և հրշեջ ծառայության արագ մոտեցում (մինչև 5 րոպե)։</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700">
                    <div className="font-bold text-cyan-300">E — Exposure (Արտաքին Ռիսկեր) • 82/100</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Հարակից վտանգավոր արտադրությունների բացակայություն։</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "pml" && (
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingDown size={16} className="text-cyan-400" />
                Գույքի Տեսակների Բաշխում և Հավանական Առավելագույն Վնաս (PML)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-2.5 px-3">Գույքի Տեսակ</th>
                      <th className="py-2.5 px-3">Սուրվեյների Քանակ</th>
                      <th className="py-2.5 px-3">Միջին PML (%)</th>
                      <th className="py-2.5 px-3">Վերաապահովագրական Կարգավիճակ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {PROPERTY_TYPE_DISTRIBUTION.map((item) => (
                      <tr key={item.name} className="hover:bg-slate-750/50">
                        <td className="py-2.5 px-3 font-semibold text-white">{item.name}</td>
                        <td className="py-2.5 px-3 text-slate-300">{item.value} օբյեկտ</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-amber-400">{item.pmlAvg}%</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                            Սեփական Պահում (Retention OK)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950/80 p-4 px-6 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ • Անդեռռայթինգի և Տեղազննության Վարչություն
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Փակել
          </button>
        </div>
      </div>
    </div>
  );
};
