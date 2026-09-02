import React from "react";
import { ClientRenewalLead } from "../../utils/clientRenewalStore";
import { TrendingUp, Target, Award, DollarSign, Zap, CheckCircle2, PhoneCall, Layers } from "lucide-react";

interface SalesPerformanceStatsProps {
  leads: ClientRenewalLead[];
}

export const SalesPerformanceStats: React.FC<SalesPerformanceStatsProps> = ({ leads }) => {
  const totalLeads = leads.length;
  const closedLeads = leads.filter((l) => l.status === "closed");
  const negotiationLeads = leads.filter((l) => l.status === "negotiation" || l.status === "quote_sent");

  const closedVolume = closedLeads.reduce((sum, l) => sum + (l.estimatedPremium || 0), 0);
  const pipelineVolume = negotiationLeads.reduce((sum, l) => sum + (l.estimatedPremium || 0), 0);

  // Conversion rate
  const conversionRate = totalLeads > 0 ? Math.round((closedLeads.length / totalLeads) * 100) : 0;

  // Monthly Target setup
  const MONTHLY_TARGET_AMD = 6000000;
  const targetPercent = Math.min(100, Math.round((closedVolume / MONTHLY_TARGET_AMD) * 100));

  // Estimated Agent Commission (avg ~12%)
  const estimatedCommission = Math.round(closedVolume * 0.12);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-[#071E4A] to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <Target size={22} />
          </div>
          <div>
            <h3 className="font-black text-base text-white flex items-center gap-2">
              Ամսական Վաճառքների Պլան & Gamification
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold">
                Սեպտեմբեր 2026
              </span>
            </h3>
            <p className="text-xs text-slate-400">Գործակալական թիրախի կատարման և բոնուսների հաշվիչ</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/60 text-right">
            <span className="text-[10px] text-slate-400 block uppercase">Կանխատեսվող Բոնուս (~12%)</span>
            <strong className="text-emerald-400 font-mono text-sm font-black">
              +{estimatedCommission.toLocaleString()} ֏
            </strong>
          </div>
        </div>
      </div>

      {/* Target Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-bold flex items-center gap-1.5">
            <TrendingUp size={14} className="text-cyan-400" />
            Պլանի կատարում՝ <strong className="text-cyan-400">{closedVolume.toLocaleString()} ֏</strong> / {MONTHLY_TARGET_AMD.toLocaleString()} ֏
          </span>
          <span className="text-amber-400 font-black font-mono text-sm">{targetPercent}%</span>
        </div>
        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-500 shadow-md"
            style={{ width: `${targetPercent}%` }}
          />
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold">Փոխակերպում (Conversion)</span>
            <Award size={14} className="text-purple-400" />
          </div>
          <strong className="text-purple-300 font-black text-lg font-mono">{conversionRate}%</strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">{closedLeads.length} կնքված / {totalLeads} հայտ</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold">Ակտիվ Ձագար (Pipeline)</span>
            <Layers size={14} className="text-cyan-400" />
          </div>
          <strong className="text-cyan-300 font-black text-lg font-mono">{pipelineVolume.toLocaleString()} ֏</strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">{negotiationLeads.length} բանակցվող հայտ</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold">Կնքված Պոլիսներ</span>
            <CheckCircle2 size={14} className="text-emerald-400" />
          </div>
          <strong className="text-emerald-300 font-black text-lg font-mono">{closedLeads.length} հատ</strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">Այս ամսվա ծավալ</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold">Միջին Պայմանագիր</span>
            <DollarSign size={14} className="text-amber-400" />
          </div>
          <strong className="text-amber-300 font-black text-lg font-mono">
            {closedLeads.length > 0 ? Math.round(closedVolume / closedLeads.length).toLocaleString() : "245,000"} ֏
          </strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">Average Ticket Size</span>
        </div>
      </div>
    </div>
  );
};
