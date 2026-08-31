import { useMemo, useState } from 'react';
import { Copy, Download, FileCheck2, Search, Trash2, GitCompare, Eye } from 'lucide-react';
import { QuotationProposal } from '../types';
import { downloadProposalAsPdf } from '../utils/documentExport';

interface Props {
  proposals: QuotationProposal[];
  onOpen: (p: QuotationProposal) => void;
  onDuplicate: (p: QuotationProposal) => void;
  onDelete: (id: string) => void;
}

export function QuoteHistory({ proposals, onOpen, onDuplicate, onDelete }: Props) {
  const [q, setQ] = useState('');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('hy-AM');
    if (!needle) return proposals;
    return proposals.filter(p => `${p.quotationNumber} ${p.clientName} ${p.productNameArm} ${p.objectDescription}`.toLocaleLowerCase('hy-AM').includes(needle));
  }, [q, proposals]);
  const compared = proposals.filter(p => compareIds.includes(p.id));
  const toggleCompare = (id: string) => setCompareIds(v => v.includes(id) ? v.filter(x => x !== id) : v.length >= 3 ? v : [...v, id]);

  return <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-6">
    <div className="rounded-[28px] bg-[#061A40] text-white p-7 sm:p-9 flex flex-col lg:flex-row justify-between gap-5">
      <div><div className="text-[#63c8ff] text-xs font-black tracking-[.16em]">QUOTE MANAGEMENT</div><h1 className="text-3xl font-black mt-2">Գնառաջարկների պատմություն</h1><p className="text-blue-100 mt-2 text-sm">Պահպանված հայտեր, տարբերակներ, կրկնօրինակում և համեմատություն։</p></div>
      <div className="text-right"><div className="text-3xl font-black">{proposals.length}</div><div className="text-xs text-blue-200">պահպանված գնառաջարկ</div></div>
    </div>
    <div className="sil-card p-4 flex gap-3 items-center"><Search size={18} className="text-slate-400"/><input value={q} onChange={e=>setQ(e.target.value)} className="flex-1 outline-none text-sm" placeholder="Որոնել quote №, հաճախորդ, պրոդուկտ, VIN/նկարագրություն..."/><span className="text-xs text-slate-500">Համեմատություն՝ մինչև 3</span></div>
    {compared.length >= 2 && <div className="sil-card p-5"><div className="flex items-center gap-2 font-black mb-4"><GitCompare size={18}/> Տարբերակների համեմատություն</div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-50"><th className="text-left p-3">Ցուցիչ</th>{compared.map(p=><th key={p.id} className="text-right p-3">{p.quotationNumber}</th>)}</tr></thead><tbody>{[['Հաճախորդ','clientName'],['Պրոդուկտ','productNameArm'],['Ապահովագրական գումար','totalSumInsured'],['Սակագին','finalTariff'],['Պրեմիա','annualPremium'],['Ֆրանշիզա','franchiseDescription']].map(([label,key])=><tr key={key} className="border-t"><td className="p-3 font-semibold">{label}</td>{compared.map(p=><td key={p.id} className="p-3 text-right">{String((p as any)[key] ?? '—')}</td>)}</tr>)}</tbody></table></div></div>}
    <div className="space-y-3">{filtered.map(p=><div key={p.id} className="sil-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-start gap-4"><div className="w-11 h-11 rounded-xl bg-blue-50 text-[#075bd5] flex items-center justify-center"><FileCheck2/></div><div><div className="font-black text-slate-900">{p.quotationNumber}</div><div className="text-sm text-slate-700">{p.clientName} · {p.productNameArm}</div><div className="text-xs text-slate-500 mt-1">{p.date} · {p.totalSumInsured.toLocaleString()} {p.currency} · {p.annualPremium.toLocaleString()} {p.currency}</div></div></div>
      <div className="flex flex-wrap gap-2"><button onClick={()=>onOpen(p)} className="px-3 py-2 rounded-lg bg-[#075bd5] text-white text-xs font-bold flex gap-1 items-center"><Eye size={14}/> Բացել</button><button onClick={()=>onDuplicate(p)} className="px-3 py-2 rounded-lg border text-xs font-bold flex gap-1 items-center"><Copy size={14}/> Կրկնօրինակել</button><button onClick={()=>downloadProposalAsPdf(p)} className="px-3 py-2 rounded-lg border text-xs font-bold flex gap-1 items-center"><Download size={14}/> PDF</button><button onClick={()=>toggleCompare(p.id)} className={`px-3 py-2 rounded-lg border text-xs font-bold flex gap-1 items-center ${compareIds.includes(p.id)?'bg-blue-50 border-blue-300 text-blue-700':''}`}><GitCompare size={14}/> Համեմատել</button><button onClick={()=>onDelete(p.id)} className="px-3 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-bold"><Trash2 size={14}/></button></div>
    </div>)}{filtered.length===0&&<div className="sil-card p-12 text-center text-slate-500">Գնառաջարկ չի գտնվել։</div>}</div>
  </div>
}
