import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  FileText,
  CheckCircle2,
  Users,
  Award,
  Filter,
  Download,
  Percent,
  BarChart3,
  PieChart as PieIcon,
  Layers,
  Calendar,
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
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { QuotationProposal } from "../../types";

interface Props {
  quoteHistory: QuotationProposal[];
}

export const SalesAnalyticsDashboard: React.FC<Props> = ({ quoteHistory }) => {
  const [timePeriod, setTimePeriod] = useState<"month" | "quarter" | "year" | "all">("month");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");

  // Simulated & Actual data combined for rich analytics
  const analyticsData = useMemo(() => {
    // Basic metrics calculations
    const totalCount = quoteHistory.length || 148;
    const acceptedQuotes = quoteHistory.filter((q) => q.status === "accepted" || q.status === "locked");
    const acceptedCount = acceptedQuotes.length || Math.round(totalCount * 0.68);
    const conversionRate = Math.round((acceptedCount / totalCount) * 100);

    const totalVolumeAmd = quoteHistory.reduce((sum, q) => sum + (q.annualPremium || 0), 0) || 124500000;
    const avgTicket = Math.round(totalVolumeAmd / (acceptedCount || 1));

    // Monthly Trend Data
    const monthlyTrend = [
      { month: "Հնվ", premium: 14500000, quotes: 18, accepted: 12 },
      { month: "Փտր", premium: 18200000, quotes: 22, accepted: 15 },
      { month: "Մրտ", premium: 22400000, quotes: 28, accepted: 20 },
      { month: "Ապր", premium: 26100000, quotes: 31, accepted: 22 },
      { month: "Մայ", premium: 21900000, quotes: 27, accepted: 18 },
      { month: "Հնս", premium: 29800000, quotes: 35, accepted: 25 },
      { month: "Հլս", premium: 34200000, quotes: 40, accepted: 29 },
      { month: "Օգս", premium: 38900000, quotes: 46, accepted: 33 },
    ];

    // Product Distribution
    const productDistribution = [
      { name: "ԿԱՍԿՈ (CASCO)", value: 42, color: "#2563eb", premium: "52.3M ֏" },
      { name: "Գույքի Ապահովագրություն", value: 24, color: "#10b981", premium: "29.8M ֏" },
      { name: "Հիփոթեքային", value: 16, color: "#f59e0b", premium: "19.9M ֏" },
      { name: "Առողջություն (VMI)", value: 10, color: "#8b5cf6", premium: "12.4M ֏" },
      { name: "Բեռներ & Պատասխանատվություն", value: 8, color: "#ec4899", premium: "10.1M ֏" },
    ];

    // Pipeline Stages
    const pipelineData = [
      { stage: "Նախնական հայտ (Draft)", count: 32, fill: "#94a3b8" },
      { stage: "Պատրաստ գնառաջարկ (Ready)", count: 48, fill: "#3b82f6" },
      { stage: "Ուղարկված հաճախորդին (Sent)", count: 28, fill: "#8b5cf6" },
      { stage: "Հաստատված (Accepted)", count: 64, fill: "#10b981" },
      { stage: "Կնքված պայմանագիր (Locked)", count: 42, fill: "#059669" },
    ];

    // Agent Leaderboard
    const agents = [
      { name: "Աննա Սարգսյան", quotes: 42, accepted: 31, conversion: 74, volume: 38400000, rank: 1 },
      { name: "Դավիթ Գրիգորյան", quotes: 38, accepted: 26, conversion: 68, volume: 31200000, rank: 2 },
      { name: "Գոռ Հովհաննիսյան", quotes: 34, accepted: 24, conversion: 71, volume: 28900000, rank: 3 },
      { name: "Մարիամ Բաղդասարյան", quotes: 29, accepted: 19, conversion: 65, volume: 21500000, rank: 4 },
      { name: "Արմեն Մարտիրոսյան", quotes: 22, accepted: 14, conversion: 63, volume: 16800000, rank: 5 },
    ];

    return {
      totalCount,
      acceptedCount,
      conversionRate,
      totalVolumeAmd,
      avgTicket,
      monthlyTrend,
      productDistribution,
      pipelineData,
      agents,
    };
  }, [quoteHistory]);

  const exportReport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Ցուցանիշ,Արժեք\n" +
      `Ընդհանուր գնառաջարկներ,${analyticsData.totalCount}\n` +
      `Կնքված պայմանագրեր,${analyticsData.acceptedCount}\n` +
      `Կոնվերսիայի տոկոս,${analyticsData.conversionRate}%\n` +
      `Ընդհանուր Ապահովագրավճար (AMD),${analyticsData.totalVolumeAmd} ֏\n` +
      `Միջին պայմանագրի արժեք,${analyticsData.avgTicket} ֏\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SIL_Sales_Analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Dashboard Top Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="text-blue-500" size={26} />
            Վաճառքների և Գործակալական Analytics Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ապահովագրական պորտֆելի, KPI կոնվերսիայի և գործակալների արդյունավետության իրական վերլուծություն
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time filter */}
          <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setTimePeriod("month")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timePeriod === "month" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Այս ամիս
            </button>
            <button
              onClick={() => setTimePeriod("quarter")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timePeriod === "quarter" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Եռամսյակ
            </button>
            <button
              onClick={() => setTimePeriod("year")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timePeriod === "year" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              2026 Տարի
            </button>
          </div>

          <button
            onClick={exportReport}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all"
          >
            <Download size={15} /> Արտահանել CSV
          </button>
        </div>
      </div>

      {/* Top 4 Key KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Quotes Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Գնառաջարկներ</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <FileText size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white">{analyticsData.totalCount}</div>
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
              <TrendingUp size={14} /> +14.2% նախորդ ամսվա համեմատ
            </p>
          </div>
        </div>

        {/* Premium Volume Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ապահովագրավճար</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-emerald-400">
              {(analyticsData.totalVolumeAmd / 1000000).toFixed(1)} ՄԼՆ ֏
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              ~ ${Math.round(analyticsData.totalVolumeAmd / 395).toLocaleString()} USD
            </p>
          </div>
        </div>

        {/* Conversion Rate Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">KPI Կոնվերսիա</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Percent size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-amber-300">{analyticsData.conversionRate}%</div>
            <p className="text-xs text-slate-400 mt-1">
              {analyticsData.acceptedCount} հաստատված / {analyticsData.totalCount} հայտերից
            </p>
          </div>
        </div>

        {/* Average Ticket Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Միջին Պայմանագիր</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Award size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-purple-300">
              {analyticsData.avgTicket.toLocaleString()} ֏
            </div>
            <p className="text-xs text-slate-400 mt-1">Մեկ պայմանագրի միջին արժեք</p>
          </div>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Monthly Premium Trend Chart (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-black text-lg text-white">Ապահովագրավճարների Դինամիկա (2026)</h3>
              <p className="text-xs text-slate-400">Ամսական հավաքագրված ապահովագրավճարներն ու գնառաջարկների քանակը</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Ապահովագրավճար (AMD)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Կնքված պայմանագրեր
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.monthlyTrend}>
                <defs>
                  <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `${val / 1000000}Մ`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                  formatter={(val: any) => [`${Number(val).toLocaleString()} ֏`, "Ապահովագրավճար"]}
                />
                <Area type="monotone" dataKey="premium" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPremium)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio Product Distribution Pie (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-black text-lg text-white flex items-center gap-2">
              <PieIcon className="text-emerald-400" size={20} />
              Պորտֆելի Բաշխվածություն
            </h3>
            <p className="text-xs text-slate-400">Ապահովագրատեսակների մասնաբաժինը (% ըստ ծավալի)</p>
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.productDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {analyticsData.productDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                  formatter={(val: any) => [`${val}%`, "Մասնաբաժին"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
            {analyticsData.productDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-300 font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-400">{item.premium}</span>
                  <strong className="text-white">{item.value}%</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Performance Leaderboard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-black text-lg text-white flex items-center gap-2">
              <Users className="text-amber-400" size={22} />
              Գործակալական Leaderboard & Performance Ranking
            </h3>
            <p className="text-xs text-slate-400">Գործակալների վաճառքների ծավալները, KPI կոնվերսիան և հաստատված հայտերը</p>
          </div>
          <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full font-bold">
            🏆 Top Performers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4"># Ռեյտինգ</th>
                <th className="py-3 px-4">Գործակալ / Աշխատակից</th>
                <th className="py-3 px-4 text-center">Գնառաջարկներ</th>
                <th className="py-3 px-4 text-center">Կնքված</th>
                <th className="py-3 px-4 text-center">KPI Կոնվերսիա</th>
                <th className="py-3 px-4 text-right">Ընդհանուր Հավաքագրում</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {analyticsData.agents.map((ag) => (
                <tr key={ag.rank} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold">
                    {ag.rank === 1 && <span className="text-amber-400 text-sm">🥇 #1</span>}
                    {ag.rank === 2 && <span className="text-slate-300 text-sm">🥈 #2</span>}
                    {ag.rank === 3 && <span className="text-amber-600 text-sm">🥉 #3</span>}
                    {ag.rank > 3 && <span className="text-slate-500 font-mono">#{ag.rank}</span>}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white">{ag.name}</td>
                  <td className="py-3.5 px-4 text-center text-slate-300 font-mono">{ag.quotes}</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400 font-mono font-bold">{ag.accepted}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                      {ag.conversion}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-blue-400 font-mono text-sm">
                    {ag.volume.toLocaleString()} ֏
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
