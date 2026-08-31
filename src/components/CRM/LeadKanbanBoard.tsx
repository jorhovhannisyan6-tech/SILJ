import React from "react";
import {
  Car,
  Home,
  HeartPulse,
  Plane,
  Building,
  Phone,
  Mail,
  Edit2,
  Trash2,
  FileCheck,
  MessageCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { ClientRenewalLead } from "../../utils/clientRenewalStore";

interface Props {
  leads: ClientRenewalLead[];
  onStatusChange: (id: string, newStatus: ClientRenewalLead["status"]) => void;
  onEdit: (lead: ClientRenewalLead) => void;
  onDelete: (id: string) => void;
  onGenerateQuote: (lead: ClientRenewalLead) => void;
  onWhatsApp: (lead: ClientRenewalLead) => void;
}

const COLUMNS: {
  id: ClientRenewalLead["status"];
  title: string;
  badgeColor: string;
  borderColor: string;
  bgColor: string;
}[] = [
  {
    id: "pending",
    title: "Նոր Հայտեր (Pending)",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    borderColor: "border-amber-300",
    bgColor: "bg-amber-50/50",
  },
  {
    id: "contacted",
    title: "Կապ է Հաստատվել",
    badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
    borderColor: "border-blue-300",
    bgColor: "bg-blue-50/50",
  },
  {
    id: "quote_sent",
    title: "Գնառաջարկն Ուղարկված է",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
    borderColor: "border-purple-300",
    bgColor: "bg-purple-50/50",
  },
  {
    id: "closed",
    title: "Կնքված (Won / Closed)",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    borderColor: "border-emerald-300",
    bgColor: "bg-emerald-50/50",
  },
];

export const LeadKanbanBoard: React.FC<Props> = ({
  leads,
  onStatusChange,
  onEdit,
  onDelete,
  onGenerateQuote,
  onWhatsApp,
}) => {
  const getProductIcon = (type: string) => {
    switch (type) {
      case "casco":
        return <Car size={14} className="text-blue-600" />;
      case "property":
        return <Home size={14} className="text-purple-600" />;
      case "mortgage":
        return <Building size={14} className="text-indigo-600" />;
      case "health":
        return <HeartPulse size={14} className="text-emerald-600" />;
      case "travel":
        return <Plane size={14} className="text-amber-600" />;
      default:
        return <Car size={14} className="text-slate-600" />;
    }
  };

  const getProductLabel = (type: string) => {
    switch (type) {
      case "casco": return "ԿԱՍԿՈ";
      case "property": return "Գույք";
      case "mortgage": return "Հիփոթեք";
      case "health": return "Առողջություն";
      case "travel": return "Ճամփորդություն";
      default: return type.toUpperCase();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 animate-fadeIn">
      {COLUMNS.map((col) => {
        const colLeads = leads.filter((l) => l.status === col.id);
        const colTotalSum = colLeads.reduce((sum, l) => sum + (l.estimatedPremium || 0), 0);

        return (
          <div
            key={col.id}
            className={`rounded-2xl border ${col.borderColor} ${col.bgColor} p-3.5 flex flex-col min-h-[500px] shadow-xs`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${col.badgeColor}`}>
                  {colLeads.length}
                </span>
                <h3 className="text-xs font-black text-slate-900">{col.title}</h3>
              </div>
              <div className="text-[11px] font-black text-slate-700">
                {colTotalSum.toLocaleString()} ֏
              </div>
            </div>

            {/* Column Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {colLeads.length === 0 ? (
                <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium">
                  Հայտեր չկան այս փուլում
                </div>
              ) : (
                colLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {getProductIcon(lead.productType)}
                            <span>{getProductLabel(lead.productType)}</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {lead.policyNumber || lead.id}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-blue-700 transition">
                          {lead.clientName}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(lead)}
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="Խմբագրել"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(lead.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Ջնջել"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Object / Notes Preview */}
                    {(lead.vehicleOrPropertyDetails || lead.notes) && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100 mb-2.5 font-medium">
                        {lead.vehicleOrPropertyDetails || lead.notes}
                      </p>
                    )}

                    {/* Pricing and Contact Info */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <div className="font-black text-blue-900 text-xs">
                        {lead.estimatedPremium ? `${lead.estimatedPremium.toLocaleString()} ֏` : "Ճշտվում է"}
                      </div>
                      <a
                        href={`tel:${lead.phone}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-blue-600 transition"
                      >
                        <Phone size={11} className="text-emerald-600" />
                        <span>{lead.phone}</span>
                      </a>
                    </div>

                    {/* Actions and Stage Navigation */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onWhatsApp(lead)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                          title="WhatsApp հաղորդագրություն"
                        >
                          <MessageCircle size={12} />
                          <span className="hidden sm:inline">WA</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onGenerateQuote(lead)}
                          className="px-2 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                          title="Գեներացնել Գնառաջարկ"
                        >
                          <FileCheck size={12} />
                          <span>Գնառաջարկ</span>
                        </button>
                      </div>

                      {/* Move Stage Selector */}
                      <select
                        className="text-[10px] font-bold bg-slate-100 text-slate-700 rounded-lg px-2 py-1 border border-slate-200 cursor-pointer focus:outline-none"
                        value={lead.status}
                        onChange={(e) => onStatusChange(lead.id, e.target.value as any)}
                      >
                        <option value="pending">🟡 Նոր</option>
                        <option value="contacted">🔵 Կապ</option>
                        <option value="quote_sent">🟣 Ուղարկված</option>
                        <option value="closed">🟢 Կնքված</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
