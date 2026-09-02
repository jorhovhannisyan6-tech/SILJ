import React, { useState } from "react";
import { ClientRenewalLead, updateClientRenewalStatus, LeadStatus } from "../../utils/clientRenewalStore";
import {
  Clock,
  Phone,
  FileText,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Paperclip,
  Sparkles,
  Send,
  MessageSquare,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { QuickCommunicationModal } from "./QuickCommunicationModal";

interface KanbanBoardProps {
  leads: ClientRenewalLead[];
  onLeadClick: (lead: ClientRenewalLead) => void;
  onLeadsUpdated: () => void;
}

const COLUMNS: { id: LeadStatus; title: string; color: string; badgeColor: string; icon: React.ReactNode }[] = [
  {
    id: "pending",
    title: "Նոր հայտ (New Lead)",
    color: "border-rose-200 bg-rose-50/50 dark:bg-rose-950/10 dark:border-rose-900/30",
    badgeColor: "bg-rose-500 text-white",
    icon: <Clock className="w-4 h-4 text-rose-500" />
  },
  {
    id: "quote_sent",
    title: "Գնառաջարկն ուղարկված է",
    color: "border-blue-200 bg-blue-50/50 dark:bg-blue-950/10 dark:border-blue-900/30",
    badgeColor: "bg-blue-500 text-white",
    icon: <FileText className="w-4 h-4 text-blue-500" />
  },
  {
    id: "negotiation",
    title: "Բանակցություններ",
    color: "border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-900/30",
    badgeColor: "bg-amber-500 text-white",
    icon: <Phone className="w-4 h-4 text-amber-500" />
  },
  {
    id: "closed",
    title: "Պայմանագիր կնքված է",
    color: "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-900/30",
    badgeColor: "bg-emerald-600 text-white",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />
  },
  {
    id: "rejected",
    title: "Մերժված / Կորցված",
    color: "border-slate-200 bg-slate-50/50 dark:bg-slate-900/20 dark:border-slate-800",
    badgeColor: "bg-slate-600 text-white",
    icon: <XCircle className="w-4 h-4 text-slate-500" />
  },
];

export function KanbanBoard({ leads, onLeadClick, onLeadsUpdated }: KanbanBoardProps) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [selectedLeadForComm, setSelectedLeadForComm] = useState<ClientRenewalLead | null>(null);
  const [rejectingLeadId, setRejectingLeadId] = useState<string | null>(null);
  const [lostReason, setLostReason] = useState("Թանկ էր / Գնաց մրցակցի մոտ");

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLeadId(id);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      const el = document.getElementById(`kanban-card-${id}`);
      if (el) el.classList.add("opacity-50");
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent, id: string) => {
    setDraggedLeadId(null);
    const el = document.getElementById(`kanban-card-${id}`);
    if (el) el.classList.remove("opacity-50");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    if (!draggedLeadId) return;

    if (status === "rejected") {
      setRejectingLeadId(draggedLeadId);
      return;
    }

    updateClientRenewalStatus(draggedLeadId, status);
    onLeadsUpdated();
  };

  const confirmRejection = () => {
    if (!rejectingLeadId) return;
    updateClientRenewalStatus(rejectingLeadId, "rejected", { lostReason });
    setRejectingLeadId(null);
    onLeadsUpdated();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-280px)] min-h-[520px] no-scrollbar">
        {COLUMNS.map((column) => {
          const columnLeads = leads.filter(
            (l) => l.status === column.id || (column.id === "negotiation" && (l.status as any) === "contacted")
          );

          const totalColumnSum = columnLeads.reduce((sum, l) => sum + (l.estimatedPremium || 0), 0);

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`flex-shrink-0 w-80 rounded-2xl border ${column.color} p-3.5 flex flex-col`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {column.icon}
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{column.title}</h3>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${column.badgeColor}`}>
                  {columnLeads.length}
                </span>
              </div>

              {/* Volume summary */}
              {totalColumnSum > 0 && (
                <div className="text-[10px] text-slate-500 font-mono mb-3 bg-white/50 dark:bg-slate-800/40 px-2 py-1 rounded-lg">
                  Ծավալ՝ <strong>{totalColumnSum.toLocaleString()} ֏</strong>
                </div>
              )}

              {/* Cards List */}
              <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-1">
                {columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    id={`kanban-card-${lead.id}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onDragEnd={(e) => handleDragEnd(e, lead.id)}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            lead.productType === "casco"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              : lead.productType === "property"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                              : lead.productType === "health"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : lead.productType === "cargo"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {lead.productType}
                        </span>

                        {lead.leadScore && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-600 dark:text-purple-300 border border-purple-400/30 flex items-center gap-0.5">
                            <Sparkles size={10} /> {lead.leadScore}%
                          </span>
                        )}

                        {lead.priority === "high" && (
                          <span className="w-2 h-2 rounded-full bg-rose-500" title="High Priority" />
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedLeadForComm(lead)}
                        className="text-slate-400 hover:text-emerald-500 transition p-1"
                        title="Ուղարկել WhatsApp / SMS"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4
                      onClick={() => onLeadClick(lead)}
                      className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm hover:text-blue-600 transition cursor-pointer mb-1"
                    >
                      {lead.clientName}
                    </h4>

                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-2 flex items-center justify-between">
                      <span>{lead.phone}</span>
                      {lead.channelSource && (
                        <span className="text-[10px] text-slate-400 font-sans">
                          {lead.channelSource === "web_link" ? "🌐 Օնլայն" : "📞 Զանգ"}
                        </span>
                      )}
                    </div>

                    {lead.vehicleOrPropertyDetails && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl leading-relaxed line-clamp-2 mb-2">
                        {lead.vehicleOrPropertyDetails}
                      </div>
                    )}

                    {lead.lostReason && (
                      <div className="text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-1.5 rounded-lg mb-2">
                        ⚠️ Պատճառ՝ {lead.lostReason}
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                      <div className="flex items-center gap-2">
                        <span>{new Date(lead.createdAt).toLocaleDateString("hy-AM")}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {lead.estimatedPremium > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                            {lead.estimatedPremium.toLocaleString()} ֏
                          </span>
                        )}
                        <button
                          onClick={() => onLeadClick(lead)}
                          className="px-2 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-600 hover:text-white transition font-bold"
                          title="1-Click Գնառաջարկ"
                        >
                          Գնառաջարկ →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lost Reason Modal */}
      {rejectingLeadId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 text-white max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base flex items-center gap-2 text-rose-400">
              <AlertTriangle size={18} /> Մերժման / Կորստի Պատճառ (Lost Reason)
            </h3>
            <p className="text-xs text-slate-300">
              Նշեք պատճառը շուկայական անալիտիկայի և ապագա ռազմավարության համար․
            </p>

            <select
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
            >
              <option value="Թանկ էր / Գնաց մրցակցի մոտ">Թանկ էր / Գնաց մրցակցի մոտ</option>
              <option value="Ավտոմեքենան կամ գույքը վաճառվեց">Ավտոմեքենան կամ գույքը վաճառվեց</option>
              <option value="Հաճախորդը որոշեց հետաձգել ապահովագրությունը">Հաճախորդը որոշեց հետաձգել</option>
              <option value="Անհասանելի հեռախոսահամար / Չի պատասխանում">Անհասանելի / Չի պատասխանում</option>
              <option value="Այլ պատճառ">Այլ պատճառ</option>
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingLeadId(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Չեղարկել
              </button>
              <button
                onClick={confirmRejection}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold"
              >
                Հաստատել Մերժումը
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Communication Modal Trigger */}
      {selectedLeadForComm && (
        <QuickCommunicationModal
          clientName={selectedLeadForComm.clientName}
          phone={selectedLeadForComm.phone}
          email={selectedLeadForComm.email}
          productType={selectedLeadForComm.productType}
          premium={selectedLeadForComm.estimatedPremium}
          onClose={() => setSelectedLeadForComm(null)}
        />
      )}
    </div>
  );
}
