import { useEffect, useState } from 'react';
import { BookOpen, Plus, Search, Edit3, Trash2, Save, X, RefreshCw, FileText, CheckCircle2, AlertCircle, Zap, Sparkles, Database } from 'lucide-react';

interface KbDocument {
  productId: string;
  sourceFile: string;
  textFile: string | null;
  characters?: number;
  text?: string;
}

const PRODUCT_NAMES: Record<string, string> = {
  property: "Գույքի ապահովագրություն",
  casco: "ԿԱՍԿՈ",
  health: "Առողջության ապահովագրություն (ԲԾԱ)",
  travel: "Ճամփորդական ապահովագրություն",
  mortgage: "Հիփոթեքային ապահովագրություն",
  cargo: "Բեռների ապահովագրություն",
  "general-liability": "Ընդհանուր պատասխանատվություն",
  "cash-in-transit": "Ինկասացիոն ռիսկ",
  "advance-payment": "Կանխավճարի ապահովագրություն",
  "construction-all-risks": "Շինմոնտաժային (CAR)",
  "professional-liability": "Մասնագիտական պատասխանատվություն",
  "machinery-breakdown": "Մեքենաների խափանում",
  "warehouse-liability": "Պահեստների պատասխանատվություն",
  accident: "Դժբախտ պատահարների ապահովագրություն",
  "law-insurance": "ՀՀ Օրենքը Ապահովագրության և Ապահովագրական Գործունեության Մասին",
  legislation: "Այլ ՀՀ Օրենսդրություն և Կարգավորումներ",
};

export function KnowledgeBaseAdmin() {
  const [docs, setDocs] = useState<KbDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [editDoc, setEditDoc] = useState<{ productId: string; sourceFile: string; text: string }>({ productId: 'casco', sourceFile: '', text: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<{ idx: number; name: string } | null>(null);
  const [validationError, setValidationError] = useState('');

  // Vector search server status variables
  const [vectorSearchActive, setVectorSearchActive] = useState(false);
  const [totalChunks, setTotalChunks] = useState(0);
  const [vectorizedChunks, setVectorizedChunks] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [vectorizing, setVectorizing] = useState(false);

  const token = localStorage.getItem('sil-auth-token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const loadKb = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/kb', { headers });
      if (!res.ok) throw new Error('Չհաջողվեց բեռնել AI Knowledge Base-ը');
      const data = await res.json();
      setDocs(data.products || []);
      setVectorSearchActive(!!data.vectorSearchActive);
      setTotalChunks(data.totalChunks || 0);
      setVectorizedChunks(data.vectorizedChunks || 0);
      setIsGenerating(!!data.isGenerating);
    } catch (err: any) {
      setError(err.message || 'Սխալ կապի ընթացքում');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerVectorize = async (forceAll: boolean = false) => {
    setVectorizing(true);
    setError('');
    try {
      const res = await fetch('/api/admin/kb/vectorize', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reloadDocs: true, forceAll }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Չհաջողվեց մեկնարկել վեկտորիզացումը');
      }
      const data = await res.json();
      setSuccessMsg(data.message || 'Վեկտորային ինդեքսավորումը և սեմանտիկ որոնման թարմացումը մեկնարկված է:');
      setTimeout(() => setSuccessMsg(''), 4000);
      setIsGenerating(true);
      await loadKb();
    } catch (err: any) {
      setError(err.message || 'Սխալ վեկտորիզացման մեկնարկի ընթացքում');
    } finally {
      setVectorizing(false);
    }
  };

  useEffect(() => {
    loadKb();
  }, []);

  // Poll vectorization status when generating in background
  useEffect(() => {
    let interval: any = null;
    if (isGenerating) {
      interval = setInterval(() => {
        fetch('/api/admin/kb', { headers })
          .then(res => res.json())
          .then(data => {
            setTotalChunks(data.totalChunks || 0);
            setVectorizedChunks(data.vectorizedChunks || 0);
            setIsGenerating(!!data.isGenerating);
          })
          .catch(() => {});
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  const handleOpenNew = () => {
    setIsNew(true);
    setSelectedIdx(null);
    setValidationError('');
    setEditDoc({
      productId: 'casco',
      sourceFile: '',
      text: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: KbDocument, idx: number) => {
    setIsNew(false);
    setSelectedIdx(idx);
    setValidationError('');
    setEditDoc({
      productId: doc.productId,
      sourceFile: doc.sourceFile,
      text: doc.text || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editDoc.sourceFile.trim()) {
      setValidationError('Խնդրում ենք նշել փաստաթղթի անվանումը');
      return;
    }
    setSaving(true);
    setError('');
    setValidationError('');
    try {
      const endpoint = isNew ? '/api/admin/kb' : `/api/admin/kb/${selectedIdx}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(endpoint, {
        method,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editDoc),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Չհաջողվեց պահպանել փաստաթուղթը');
      }

      setSuccessMsg('Փաստաթուղթը հաջողությամբ պահպանվեց և AI-ն թարմացվեց:');
      setTimeout(() => setSuccessMsg(''), 3000);
      setIsModalOpen(false);
      await loadKb();
    } catch (err: any) {
      setError(err.message || 'Սխալ պահպանման ընթացքում');
    } finally {
      setSaving(false);
    }
  };

  const filteredDocs = docs.filter(d => {
    const q = search.toLowerCase();
    const pName = (PRODUCT_NAMES[d.productId] || d.productId).toLowerCase();
    const fName = (d.sourceFile || '').toLowerCase();
    const tContent = (d.text || '').toLowerCase();
    return pName.includes(q) || fName.includes(q) || tContent.includes(q);
  });

  return (
    <div className="sil-card p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#075bd5] flex items-center justify-center font-bold">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Gemini AI Knowledge Base — Գիտելիքների Բազա</h2>
              <p className="text-xs text-slate-500">
                Այստեղ կարող եք ավելացնել, փոփոխել կամ ջնջել պաշտոնական ապահովագրական պայմանները և բացառությունները: Gemini AI-ն իր պատասխանները կառուցում է ԽՍՏԻՎ այս ֆայլերի հիման վրա:
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTriggerVectorize(false)}
            disabled={vectorizing || isGenerating}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-black flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-xs"
            title="Թարմացնել վեկտորիզացումը (Semantic Vector Search)"
          >
            <Zap size={15} className={vectorizing || isGenerating ? 'animate-bounce text-amber-500' : 'text-indigo-600'} />
            <span>⚡ Վեկտորային Որոնում</span>
          </button>
          <button
            onClick={loadKb}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
            title="Թարմացնել ցանկը"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleOpenNew}
            className="px-4 py-2.5 rounded-xl bg-[#075bd5] hover:bg-[#004bbd] text-white text-xs font-black flex items-center gap-2 shadow-md transition cursor-pointer"
          >
            <Plus size={16} />
            Ավելացնել Փաստաթուղթ
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Որոնել պրոդուկտ, ֆայլ կամ տեքստ..."
            className="sil-input pl-9 text-xs"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Ընդհանուր՝ <span className="font-bold text-slate-800">{docs.length}</span> փաստաթուղթ •{' '}
          <span className="font-bold text-slate-800">
            {docs.reduce((acc, d) => acc + (d.text?.length || d.characters || 0), 0).toLocaleString()}
          </span>{' '}
          նիշ
        </div>
      </div>

      {/* Vector Embeddings Status Card */}
      {vectorSearchActive && (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0 shadow-xs">
              ⚡
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                Վեկտորային և Սեմանտիկ Որոնում (Semantic Vector Search)
                <span className="inline-block bg-emerald-500 text-white text-[9px] px-2.5 py-0.5 rounded-full font-extrabold border border-emerald-600">
                  ԱԿՏԻՎ Է
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xl">
                Հարցումները որոնվում են ըստ իմաստի և սեմանտիկ նմանության: Փաստաթղթերը տրոհված են {totalChunks} հատվածների (chunks): Դուք կարող եք ցանկացած պահի թարմացնել վեկտորային բազան՝ սեղմելով ներքևի կոճակը:
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap justify-between lg:justify-end">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Վեկտորիզացված
                </div>
                <div className="text-xs font-black text-indigo-700 mt-0.5">
                  {vectorizedChunks} / {totalChunks} ({totalChunks > 0 ? Math.round((vectorizedChunks / totalChunks) * 100) : 0}%)
                </div>
              </div>
              <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-indigo-600 rounded-full ${isGenerating ? 'animate-pulse' : ''}`}
                  style={{ width: `${totalChunks > 0 ? (vectorizedChunks / totalChunks) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTriggerVectorize(false)}
                disabled={vectorizing || isGenerating}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-60"
                title="Թարմացնել վեկտորիզացումը (Sync & Vectorize)"
              >
                <Zap size={14} className={vectorizing || isGenerating ? 'animate-spin' : ''} />
                <span>{vectorizing || isGenerating ? 'Ինդեքսավորվում է...' : '⚡ Թարմացնել Վեկտորիզացումը'}</span>
              </button>
              <button
                onClick={() => handleTriggerVectorize(true)}
                disabled={vectorizing || isGenerating}
                className="p-2 rounded-xl bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                title="Վերաինդեքսավորել ամբողջ բազան (Force Full Re-vectorize)"
              >
                <RefreshCw size={14} className={vectorizing || isGenerating ? 'animate-spin text-indigo-600' : 'text-slate-600'} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Grid / Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500 font-bold flex items-center justify-center gap-2">
          <RefreshCw size={16} className="animate-spin text-[#075bd5]" />
          Բեռնվում են AI Knowledge Base փաստաթղթերը...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs sil-card bg-slate-50/50">
          Փաստաթղթեր չեն գտնվել
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                <th className="p-3 text-left">Պրոդուկտ</th>
                <th className="p-3 text-left">Աղբյուր Ֆայլ / Անվանում</th>
                <th className="p-3 text-left">Տեքստի Ֆայլ</th>
                <th className="p-3 text-right">Ծավալ</th>
                <th className="p-3 text-center">Գործողություններ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map((doc, i) => {
                const originalIdx = docs.findIndex(d => d.sourceFile === doc.sourceFile);
                const isExcel = doc.textFile === null;
                return (
                  <tr key={i} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-900">
                      <span className="inline-block bg-blue-50 text-[#075bd5] border border-blue-200 px-2.5 py-1 rounded-lg">
                        {PRODUCT_NAMES[doc.productId] || doc.productId}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <FileText size={14} className="text-slate-400" />
                        <span>{doc.sourceFile}</span>
                        {isExcel && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                            🔒 Պաշտպանված հաշվիչ
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {doc.textFile || <span className="text-slate-400">Excel / Տեքստ չկա</span>}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-700">
                      {isExcel ? "—" : `${(doc.text?.length || doc.characters || 0).toLocaleString()} նիշ`}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => !isExcel && handleOpenEdit(doc, originalIdx >= 0 ? originalIdx : i)}
                          disabled={isExcel}
                          className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition ${isExcel ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-65' : 'bg-blue-50 hover:bg-blue-100 text-[#075bd5]'}`}
                        >
                          <Edit3 size={13} />
                          Խմբագրել
                        </button>
                        <button
                          onClick={() => !isExcel && setDeleteConfirmDoc({ idx: originalIdx >= 0 ? originalIdx : i, name: doc.sourceFile })}
                          disabled={isExcel}
                          className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition ${isExcel ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-65' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}
                        >
                          <Trash2 size={13} />
                          Ջնջել
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit / Create Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-lg text-slate-900">
                {isNew ? '＋ Ավելացնել Նոր AI Փաստաթուղթ' : `Խմբագրել «${editDoc.sourceFile}»`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>

            {validationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="text-red-600" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              {/* .txt file uploader zone */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50 hover:bg-slate-100/80 transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".txt"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const text = await file.text();
                      setEditDoc({
                        ...editDoc,
                        sourceFile: file.name,
                        text: text,
                      });
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
                  <RefreshCw size={20} className="text-blue-500 animate-spin" style={{ animationDuration: '6s' }} />
                  <span className="text-xs font-bold text-slate-700">Քաշեք և գցեք կամ սեղմեք՝ ընտրելով .txt ֆայլ</span>
                  <span className="text-[10px] text-slate-400">Ֆայլի անունը և պարունակությունը ավտոմատ կտեղադրվեն ներքևի դաշտերում</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ապահովագրական Պրոդուկտ</label>
                  <select
                    value={editDoc.productId}
                    onChange={e => setEditDoc({ ...editDoc, productId: e.target.value })}
                    className="sil-input text-xs"
                  >
                    {Object.entries(PRODUCT_NAMES).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Փաստաթղթի Անվանում / Ֆայլ</label>
                  <input
                    value={editDoc.sourceFile}
                    onChange={e => setEditDoc({ ...editDoc, sourceFile: e.target.value })}
                    placeholder="Օրինակ՝ ԿԱՍԿՈ_Պայմաններ_2026.txt"
                    className="sil-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Պայմանների, Ծածկույթի և Բացառությունների (Exclusions) Ամբողջական Տեքստ
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Gemini AI-ն օգտագործելու է այս տեքստը հաճախորդների հարցերին պատասխանելու համար:
                </p>
                <textarea
                  value={editDoc.text}
                  onChange={e => setEditDoc({ ...editDoc, text: e.target.value })}
                  placeholder="Տեղադրեք ապահովագրական պայմանները, բացառությունները, հատուկ պայմանները..."
                  rows={12}
                  className="sil-input text-xs font-sans leading-relaxed min-h-64"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Չեղարկել
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#075bd5] hover:bg-[#004bbd] text-white text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Պահպանվում է...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Պահպանել & Reload AI KB
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmDoc !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[80] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center font-bold">
                <Trash2 size={20} />
              </div>
              <h3 className="font-black text-lg text-slate-900">Ջնջել փաստաթուղթը՞</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Վստա՞հ եք, որ ցանկանում եք ջնջել <span className="font-bold text-slate-900">«{deleteConfirmDoc.name}»</span> փաստաթուղթը Knowledge Base-ից: Այս գործողությունը անդառնալի է:
            </p>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmDoc(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Չեղարկել
              </button>
              <button
                type="button"
                onClick={async () => {
                  const { idx } = deleteConfirmDoc;
                  setDeleteConfirmDoc(null);
                  try {
                    const res = await fetch(`/api/admin/kb/${idx}`, {
                      method: 'DELETE',
                      headers,
                    });
                    if (!res.ok) {
                      const d = await res.json().catch(() => ({}));
                      throw new Error(d.error || 'Չհաջողվեց ջնջել փաստաթուղթը');
                    }
                    setSuccessMsg('Փաստաթուղթը հաջողությամբ ջնջվել է:');
                    setTimeout(() => setSuccessMsg(''), 3000);
                    await loadKb();
                  } catch (err: any) {
                    setError(err.message || 'Սխալ ջնջման ընթացքում');
                  }
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer shadow-md"
              >
                Այո, ջնջել
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
