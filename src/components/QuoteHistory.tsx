import { useMemo, useState } from 'react';
import { Copy, Download, FileCheck2, Search, Trash2, GitCompare, Eye, CheckCircle2, AlertTriangle, ShieldCheck, FileText, BadgeCheck } from 'lucide-react';
import { QuotationProposal, QuoteStatus } from '../types';
import { downloadProposalAsPdf } from '../utils/documentExport';
import { getCurrentUser } from '../utils/authStore';

interface Props {
  proposals: QuotationProposal[];
  onOpen: (p: QuotationProposal) => void;
  onDuplicate: (p: QuotationProposal) => void;
  onDelete: (id: string) => void;
  onUpdateStatus?: (id: string, status: QuoteStatus, patch?: Partial<QuotationProposal>) => void;
}

const STATUS_LABELS: Record<QuoteStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Սևագիր', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' },
  ready: { label: 'Պատրաստ է', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  pending_underwriter: { label: 'Անդեռռայթինգի սպասում', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-300 animate-pulse' },
  approved: { label: 'Անդեռռայթերի հաստատած', color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-300' },
  sent: { label: 'Ուղարկված է', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  accepted: { label: 'Ընդունված է', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  rejected: { label: 'Մերժված է', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  locked: { label: 'Ֆիքսված է', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  policy_issued: { label: 'ՊՈԼԻՍԸ ՏՐՎԱԾ Է', color: 'text-emerald-900 font-black', bg: 'bg-emerald-100 border-emerald-400' },
};

export function QuoteHistory({ proposals, onOpen, onDuplicate, onDelete, onUpdateStatus }: Props) {
  const me = getCurrentUser();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const canUnderwrite = ['admin', 'underwriter', 'manager'].includes(me?.role || '');

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('hy-AM');
    return proposals.filter(p => {
      const matchSearch = !needle || `${p.quotationNumber} ${p.clientName} ${p.productNameArm} ${p.objectDescription} ${p.policyNumber || ''}`.toLocaleLowerCase('hy-AM').includes(needle);
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [q, statusFilter, proposals]);

  const compared = proposals.filter(p => compareIds.includes(p.id));
  const toggleCompare = (id: string) => setCompareIds(v => v.includes(id) ? v.filter(x => x !== id) : v.length >= 3 ? v : [...v, id]);

  const handleIssuePolicy = (p: QuotationProposal) => {
    const polNum = `SIL-POL-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const confirmMsg = `Տրամադրե՞լ պաշտոնական Ապահովագրական Պոլիս N ${polNum} ${p.clientName}-ին:`;
    if (window.confirm(confirmMsg)) {
      if (onUpdateStatus) {
        onUpdateStatus(p.id, 'policy_issued', {
          policyNumber: polNum,
          issuedAt: new Date().toISOString(),
          issuedBy: me?.name || 'Underwriter',
        });
      }
    }
  };

  const handleApproveUnderwriting = (p: QuotationProposal) => {
    const note = prompt('Մուտքագրեք անդեռռայթերի նշումը / հաստատման հիմքը:', 'Հաստատված է ըստ ստանդարտ սակագների');
    if (note !== null && onUpdateStatus) {
      onUpdateStatus(p.id, 'approved', {
        underwriterNote: note,
      });
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Banner */}
      <div className="rounded-[28px] bg-gradient-to-r from-[#061A40] via-[#00235B] to-[#075bd5] text-white p-7 sm:p-9 flex flex-col lg:flex-row justify-between gap-5 shadow-xl">
        <div>
          <div className="text-cyan-300 text-xs font-black tracking-[.16em]">SIL CRM & QUOTE MANAGEMENT</div>
          <h1 className="text-3xl font-black mt-2">Գնառաջարկների & Պոլիսների Պատմություն</h1>
          <p className="text-blue-100 mt-2 text-sm">
            Պահպանված հայտեր, անդեռռայթինգի հաստատումներ, պոլիսների տրամադրում և համեմատություն:
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center min-w-32 border border-white/10">
            <div className="text-3xl font-black">{proposals.length}</div>
            <div className="text-xs text-blue-200">Ընդհանուր Հայտեր</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center min-w-32 border border-white/10">
            <div className="text-3xl font-black text-amber-300">
              {proposals.filter(p => p.status === 'pending_underwriter').length}
            </div>
            <div className="text-xs text-amber-200">Անդեռռայթինգի Սպասող</div>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="sil-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              className="sil-input pl-9 text-xs"
              placeholder="Որոնել quote №, Պոլիս №, հաճախորդ, VIN, պրոդուկտ..."
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {[
              { id: 'all', label: 'Բոլորը' },
              { id: 'pending_underwriter', label: '⚠️ Անդեռռայթինգ' },
              { id: 'approved', label: '✓ Հաստատված' },
              { id: 'policy_issued', label: '📜 Պոլիս տրված' },
              { id: 'ready', label: 'Պատրաստ' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-[#075bd5] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Drawer if active */}
      {compared.length >= 2 && (
        <div className="sil-card p-5 animate-fade-in border-2 border-blue-200">
          <div className="flex items-center justify-between font-black mb-4 text-slate-900">
            <div className="flex items-center gap-2">
              <GitCompare size={18} className="text-[#075bd5]" />
              <span>Տարբերակների Համեմատություն ({compared.length})</span>
            </div>
            <button onClick={() => setCompareIds([])} className="text-xs text-slate-500 underline hover:text-slate-800">
              Փակել
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800">
                  <th className="text-left p-3">Ցուցիչ</th>
                  {compared.map(p => (
                    <th key={p.id} className="text-right p-3 font-bold">
                      {p.quotationNumber}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['Հաճախորդ', 'clientName'],
                  ['Պրոդուկտ', 'productNameArm'],
                  ['Ապահովագրական գումար', 'totalSumInsured'],
                  ['Սակագին %', 'finalTariff'],
                  ['Տարեկան Պրեմիա', 'annualPremium'],
                  ['Ֆրանշիզա', 'franchiseDescription'],
                ].map(([label, key]) => (
                  <tr key={key}>
                    <td className="p-3 font-semibold text-slate-700">{label}</td>
                    {compared.map(p => {
                      const val = (p as any)[key];
                      const formatted = typeof val === 'number' ? val.toLocaleString() : val || '—';
                      return (
                        <td key={p.id} className="p-3 text-right font-bold text-slate-900">
                          {formatted}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Proposals List */}
      <div className="space-y-3">
        {filtered.map(p => {
          const st = STATUS_LABELS[p.status || 'ready'] || STATUS_LABELS.ready;
          return (
            <div
              key={p.id}
              className={`sil-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition hover:border-blue-300 ${
                p.status === 'policy_issued' ? 'bg-emerald-50/30 border-emerald-200' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold ${
                    p.status === 'policy_issued'
                      ? 'bg-emerald-100 text-emerald-800'
                      : p.status === 'pending_underwriter'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-50 text-[#075bd5]'
                  }`}
                >
                  {p.status === 'policy_issued' ? (
                    <BadgeCheck size={24} />
                  ) : p.status === 'pending_underwriter' ? (
                    <AlertTriangle size={24} />
                  ) : (
                    <FileCheck2 size={24} />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-slate-900 text-base">{p.quotationNumber}</span>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${st.bg} ${st.color}`}>
                      {st.label}
                    </span>
                    {p.policyNumber && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black">
                        📜 ՊՈԼԻՍ N {p.policyNumber}
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-semibold text-slate-800">
                    {p.clientName} • <span className="text-[#075bd5] font-bold">{p.productNameArm}</span>
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                    <span>📅 {p.date}</span>
                    <span>
                      💰 Ապահովագրական Գումար՝{' '}
                      <b className="text-slate-800">{p.totalSumInsured.toLocaleString()}</b> {p.currency}
                    </span>
                    <span>
                      🏷️ Պրեմիա՝ <b className="text-[#075bd5]">{p.annualPremium.toLocaleString()}</b> {p.currency}
                    </span>
                  </div>

                  {p.underwriterNote && (
                    <div className="text-xs bg-amber-50/80 border border-amber-200 text-amber-900 p-2 rounded-xl mt-1">
                      <b>Անդեռռայթերի նշում:</b> {p.underwriterNote}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Underwriter Approval & Policy Issuance Controls */}
                {canUnderwrite && p.status === 'pending_underwriter' && (
                  <button
                    onClick={() => handleApproveUnderwriting(p)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1 shadow-sm transition cursor-pointer"
                  >
                    <ShieldCheck size={14} />
                    Հաստատել Անդեռռայթինգը
                  </button>
                )}

                {canUnderwrite && (p.status === 'approved' || p.status === 'locked' || p.status === 'ready') && (
                  <button
                    onClick={() => handleIssuePolicy(p)}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-black flex items-center gap-1 shadow-md transition cursor-pointer"
                  >
                    <BadgeCheck size={14} />
                    Տրամադրել Պոլիս
                  </button>
                )}

                <button
                  onClick={() => onOpen(p)}
                  className="px-3 py-2 rounded-xl bg-[#075bd5] hover:bg-[#004bbd] text-white text-xs font-bold flex gap-1 items-center shadow-xs transition cursor-pointer"
                >
                  <Eye size={14} />
                  Բացել
                </button>

                <button
                  onClick={() => onDuplicate(p)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold flex gap-1 items-center hover:bg-slate-50 transition cursor-pointer"
                >
                  <Copy size={14} />
                  Կրկնօրինակել
                </button>

                <button
                  onClick={() => downloadProposalAsPdf(p)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold flex gap-1 items-center hover:bg-slate-50 transition cursor-pointer"
                >
                  <Download size={14} />
                  PDF
                </button>

                <button
                  onClick={() => toggleCompare(p.id)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold flex gap-1 items-center transition cursor-pointer ${
                    compareIds.includes(p.id) ? 'bg-blue-50 border-blue-300 text-[#075bd5]' : 'border-slate-200 text-slate-700'
                  }`}
                >
                  <GitCompare size={14} />
                  {compareIds.includes(p.id) ? 'Ընտրված է' : 'Համեմատել'}
                </button>

                <button
                  onClick={() => onDelete(p.id)}
                  className="px-2.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="sil-card p-12 text-center text-slate-500 text-xs font-bold">
            Գնառաջարկ չի գտնվել համապատասխան ֆիլտրով:
          </div>
        )}
      </div>
    </div>
  );
}
