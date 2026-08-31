import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, CheckCircle2, FileText, KeyRound, Lock, RefreshCw, Save, Shield, Users, XCircle, Settings2, Download, Database as DatabaseIcon, Trash2, AlertTriangle, UserPlus, Edit3, Search } from 'lucide-react';
import { FIXED_QUOTATION_RULES, type FixedProductRule } from '../data/quotationRules';
import { getProductConditions, saveProductConditions } from '../data/productConditionsData';
import { fetchCBARates } from '../utils/exchangeRates';
import { getDraftQuotationRules, getSiteContent, saveQuotationRules, saveSiteContent, publishQuotationRules } from '../utils/rulesStore';
import { getAuditLog, getRulesVersion, publishRules, addAuditEvent, clearClientAuditLog, deleteClientAuditEvent } from '../utils/auditStore';
import { runCascoRegression } from '../utils/cascoRegression';
import { runSystemHealthCheck, type HealthCheck } from '../utils/systemHealth';
import { getCurrentUser } from '../utils/authStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const exportCSV = (filename: string, data: any[]) => {
  if (!data || !data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [
    keys.join(','),
    ...data.map(row => keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
};

const exportJSON = (filename: string, data: any[]) => {
  if (!data || !data.length) return;
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
};

type Tab='dashboard'|'users'|'approvals'|'logs'|'rules'|'templates'|'conditions'|'cba'|'security'|'analytics'|'database'|'settings';
const roles=['agent','underwriter','manager','auditor','admin','casco_sales','support'];
const ROLE_NAMES: Record<string, string> = {
  admin: 'Ադմինիստրատոր (Admin)',
  manager: 'Մենեջեր (Manager)',
  underwriter: 'Անդերռայթեր (Underwriter)',
  agent: 'Ապահովագրական Գործակալ (Agent)',
  casco_sales: 'ԿԱՍԿՈ Վաճառք (CASCO Sales)',
  support: 'Աջակցում (Support)',
  auditor: 'Աուդիտոր (Auditor)'
};

const productKeys=Object.keys(FIXED_QUOTATION_RULES) as (keyof typeof FIXED_QUOTATION_RULES)[];

export function AdminSettings(){
 const me=getCurrentUser(); const [tab,setTab]=useState<Tab>('dashboard'); const [users,setUsers]=useState<any[]>([]); const [logs,setLogs]=useState<any[]>(getAuditLog()); const [serverLogs,setServerLogs]=useState<any[]>([]); const [rules,setRules]=useState<any>(getDraftQuotationRules()); const [product,setProduct]=useState<any>(productKeys[0]); const [content,setContent]=useState<any>(getSiteContent()); const [health,setHealth]=useState<HealthCheck[]|null>(null); const [reg,setReg]=useState<any[]|null>(null); const [q,setQ]=useState(''); const [saved,setSaved]=useState(false); const [version,setVersion]=useState(getRulesVersion());
 const token=localStorage.getItem('sil-auth-token'); const headers:any=token?{Authorization:`Bearer ${token}`}:{};
 const load=async()=>{try{if(['admin','manager'].includes(me?.role||'')){const r=await fetch('/api/admin/users',{headers});if(r.ok)setUsers((await r.json()).users||[])} if(['admin','manager','auditor'].includes(me?.role||'')){const r=await fetch('/api/admin/audit',{headers});if(r.ok)setServerLogs((await r.json()).events||[])}}catch{}};
 useEffect(()=>{load()},[]);
 const rule=rules[product] as FixedProductRule; const save=()=>{saveQuotationRules(rules);saveSiteContent(content);setSaved(true);addAuditEvent({action:'admin.settings.save',entity:'settings',details:{product}});setTimeout(()=>setSaved(false),1200)};
 const publish=()=>{saveQuotationRules(rules);publishQuotationRules(rules);const v=publishRules();setVersion(v);setSaved(true)};
 const approve=async(id:string,ok:boolean)=>{const r=await fetch(`/api/admin/users/${id}/${ok?'approve':'reject'}`,{method:'POST',headers});if(r.ok){await load();addAuditEvent({action:ok?'user.approve':'user.reject',entity:'user',entityId:id});}};
 const updateUser=async(id:string,patch:any)=>{const r=await fetch(`/api/admin/users/${id}`,{method:'PATCH',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(patch)});if(r.ok)await load()};
 const createUser=async(userData:any)=>{
   const r=await fetch('/api/admin/users',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(userData)});
   if(r.ok){await load();return {ok:true};}
   const res=await r.json();
   return {ok:false, error: res.error || 'Չհաջողվեց ստեղծել օգտատիրոջը'};
 };
 const deleteUser=async(id:string)=>{
   const r=await fetch(`/api/admin/users/${id}`,{method:'DELETE',headers});
   if(r.ok){await load();addAuditEvent({action:'user.delete',entity:'user',entityId:id});return {ok:true};}
   const res=await r.json();
   return {ok:false, error: res.error || 'Չհաջողվեց ջնջել'};
 };
 
 const combinedLogs = useMemo(() => {
   const seen = new Set<string>();
   const merged: any[] = [];
   for (const item of [...serverLogs, ...logs]) {
     if (item && item.id && !seen.has(item.id)) {
       seen.add(item.id);
       merged.push(item);
     }
   }
   return merged.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
 }, [serverLogs, logs]);

 const filteredLogs = useMemo(() => {
   if (!q) return combinedLogs;
   const query = q.toLowerCase();
   return combinedLogs.filter(x => JSON.stringify(x).toLowerCase().includes(query));
 }, [combinedLogs, q]);

 const cards=[['dashboard','Գլխավոր',Activity],['users','Օգտատերեր',Users],['approvals','Հաստատումներ',CheckCircle2],['logs','Աուդիտ (Logs)',FileText],['rules','Հաշվիչի Կանոններ',Settings2],['templates','Ձևանմուշներ',FileText],['conditions','Պայմաններ & Word',FileText],['cba','ԿԲ Փոխարժեքներ',RefreshCw],['security','Անվտանգություն',Shield],['analytics','Վերլուծություն',BarChart3],['database','Տվյալների Բազա',DatabaseIcon],['settings','Կարգավորումներ',Settings2]] as const;
 return <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-8 space-y-6"><div className="rounded-[28px] bg-gradient-to-br from-[#061A40] to-[#075bd5] text-white p-7 shadow-xl"><div className="flex flex-wrap justify-between gap-5"><div><div className="text-cyan-200 text-xs font-black tracking-[.18em]">SIL CONTROL CENTER</div><h1 className="text-3xl font-black mt-2">Կառավարման կենտրոն</h1><p className="text-blue-100 text-sm mt-2">Օգտատերեր, հաստատումներ, աուդիտ, հաշվիչի կանոններ և անվտանգություն մեկ վայրում։</p></div><div className="rounded-2xl bg-white/10 px-4 py-3 text-sm"><b>{me?.name}</b><div className="text-blue-100 text-xs mt-1">{me?.role}</div></div></div></div><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-10 gap-2">{cards.map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} className={`rounded-2xl border px-3 py-3 text-left transition hover:-translate-y-0.5 ${tab===id?'bg-[#075bd5] text-white border-[#075bd5] shadow-lg':'bg-white border-slate-200 hover:border-blue-300'}`}><Icon size={17}/><div className="text-xs font-black mt-2">{label}</div></button>)}</div>
 {tab==='dashboard'&&<Dashboard users={users} logs={filteredLogs} onTab={setTab} />}
 {tab==='users'&&<UsersPanel users={users} onUpdate={updateUser} onCreate={createUser} onDelete={deleteUser} onApprove={approve} currentUser={me} />} 
 {tab==='approvals'&&<Approvals users={users} onApprove={approve}/>} 
 {tab==='logs'&&<Logs logs={filteredLogs} allLogs={combinedLogs} q={q} setQ={setQ} headers={headers} onReload={load} />} 
 {tab==='security'&&<Security users={users} logs={filteredLogs}/>} 
 {tab==='analytics'&&<Analytics users={users} logs={filteredLogs}/>} 
 {tab==='templates'&&<Templates/>}
 {tab==='conditions'&&<ConditionsPanel/>}
 {tab==='cba'&&<CBASettingsPanel/>}
 {tab==='rules'&&<Rules rules={rules} setRules={setRules} product={product} setProduct={setProduct} version={version} onHealth={async()=>setHealth(await runSystemHealthCheck())} health={health} onRegression={()=>setReg(runCascoRegression())} regression={reg}/>} 
 {tab==='database'&&<DatabasePanel headers={headers}/>}
  {tab==='settings'&&<SystemSettings content={content} setContent={setContent}/>} 
 {['rules','settings'].includes(tab)&&<div className="flex flex-wrap gap-3"><button onClick={save} className="sil-primary px-5 py-3 rounded-xl font-black flex gap-2 items-center"><Save size={17}/>{saved?'Պահպանված է':'Պահպանել Սևագիր (Draft)'}</button><button onClick={publish} className="px-5 py-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-black">Հրապարակել v{version}</button></div>}
 </div>
}
function Dashboard({users,logs,onTab}:{users:any[];logs:any[];onTab:(x:any)=>void}){const pending=users.filter(u=>u.status==='pending').length;return <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">{[['Օգտատերեր',users.length,Users,'users'],['Սպասող Հաստատումներ',pending,CheckCircle2,'approvals'],['Աուդիտ Իրադարձություններ (Ընդհանուր)',logs.length,FileText,'logs'],['Անվտանգություն','Պաշտպանված է',Shield,'security']].map(([a,b,I,t]:any)=><button onClick={()=>onTab(t)} key={a} className="sil-card p-6 text-left hover:-translate-y-0.5 transition"><I className="text-[#075bd5]"/><div className="text-2xl font-black mt-4">{b}</div><div className="text-xs text-slate-500 font-bold">{a}</div></button>)}</div>}
function UsersPanel({
  users,
  onUpdate,
  onCreate,
  onDelete,
  onApprove,
  currentUser
}: {
  users: any[];
  onUpdate: (id: string, p: any) => void;
  onCreate: (userData: any) => Promise<{ ok: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onApprove: (id: string, ok: boolean) => void;
  currentUser: any;
}) {
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  
  const [newForm, setNewForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'agent',
    status: 'active'
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchRole = filterRole === 'all' || u.role === filterRole;
      const matchStatus = filterStatus === 'all' || u.status === filterStatus;
      const matchSearch = !userSearch || 
        (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) ||
        (u.username && u.username.toLowerCase().includes(userSearch.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()));
      return matchRole && matchStatus && matchSearch;
    });
  }, [users, filterRole, filterStatus, userSearch]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newForm.username.trim() || !newForm.password.trim() || !newForm.name.trim()) {
      setFormError('Խնդրում ենք լրացնել բոլոր պարտադիր դաշտերը (Օգտանուն, Գաղտնաբառ, Անուն):');
      return;
    }
    setSaving(true);
    const res = await onCreate(newForm);
    setSaving(false);
    if (res.ok) {
      setShowAddModal(false);
      setNewForm({
        username: '',
        password: '',
        name: '',
        email: '',
        role: 'agent',
        status: 'active'
      });
    } else {
      setFormError(res.error || 'Սխալ');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !newPassword.trim()) return;
    await onUpdate(passwordModalUser.id, { password: newPassword });
    setPasswordModalUser(null);
    setNewPassword('');
    alert(`✓ ${passwordModalUser.username} օգտատիրոջ գաղտնաբառը հաջողությամբ փոխվեց:`);
  };

  const handleDelete = async (u: any) => {
    if (u.id === currentUser?.id) {
      alert("⚠️ Դուք չեք կարող ջնջել ձեր սեփական ակտիվ օգտահաշիվը:");
      return;
    }
    if (!window.confirm(`Ցանկանո՞ւմ եք անվերադարձ ջնջել "${u.name} (${u.username})" օգտատիրոջը:`)) return;
    const res = await onDelete(u.id);
    if (!res.ok) {
      alert(res.error || "Չհաջողվեց ջնջել օգտատիրոջը:");
    }
  };

  const pendingCount = users.filter(u => u.status === 'pending').length;

  return (
    <div className="sil-card p-6 space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-slate-900">Օգտատերերի Կառավարում</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
              Ընդհանուր՝ {users.length}
            </span>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 animate-pulse">
                {pendingCount} սպասող հաստատման
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Օգտատերերի դերերի կարգավորում, գաղտնաբառերի թարմացում, նոր օգտատերերի ավելացում և մուտքի վերահսկում:
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowAddModal(true)} 
            className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition"
          >
            <UserPlus size={15} /> Ավելացնել Օգտատեր
          </button>
          <button 
            onClick={() => exportCSV('sil_users.csv', filtered)} 
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition"
          >
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            value={userSearch} 
            onChange={e => setUserSearch(e.target.value)} 
            placeholder="Որոնել (անուն, օգտանուն, email)..." 
            className="sil-input w-full pl-9 text-xs" 
          />
        </div>
        
        <select 
          className="sil-input text-xs" 
          value={filterRole} 
          onChange={e => setFilterRole(e.target.value)}
        >
          <option value="all">Բոլոր դերերը ({users.length})</option>
          {roles.map(r => (
            <option key={r} value={r}>{ROLE_NAMES[r] || r}</option>
          ))}
        </select>

        <select 
          className="sil-input text-xs" 
          value={filterStatus} 
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="all">Բոլոր կարգավիճակները</option>
          <option value="active">Ակտիվ (Active)</option>
          <option value="pending">Սպասող հաստատման (Pending)</option>
          <option value="disabled">Անջատված (Disabled)</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
            <tr>
              <th className="p-3.5">Օգտատեր</th>
              <th className="p-3.5">Դեր (Role)</th>
              <th className="p-3.5">Կարգավիճակ</th>
              <th className="p-3.5">Վերջին Մուտք</th>
              <th className="p-3.5 text-right">Գործողություններ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(u => {
              const isMe = u.id === currentUser?.id;
              const isPending = u.status === 'pending';
              const isActive = u.status === 'active';

              return (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {u.name}
                        {isMe && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-bold">
                            Դուք
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        @{u.username} {u.email ? `· ${u.email}` : ''}
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5">
                    <select 
                      value={u.role} 
                      onChange={e => onUpdate(u.id, { role: e.target.value })} 
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {roles.map(r => (
                        <option key={r} value={r}>{ROLE_NAMES[r] || r}</option>
                      ))}
                    </select>
                  </td>

                  <td className="p-3.5">
                    {isPending ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Սպասող
                      </span>
                    ) : isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Ակտիվ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Անջատված
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 text-xs text-slate-500">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString('hy-AM') : 'Դեռ չի եղել'}
                  </td>

                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isPending && (
                        <>
                          <button 
                            onClick={() => onApprove(u.id, true)} 
                            title="Հաստատել գրանցումը"
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
                          >
                            Հաստատել
                          </button>
                          <button 
                            onClick={() => onApprove(u.id, false)} 
                            title="Մերժել գրանցումը"
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg transition cursor-pointer"
                          >
                            Մերժել
                          </button>
                        </>
                      )}

                      {!isPending && (
                        <button 
                          onClick={() => onUpdate(u.id, { status: isActive ? 'disabled' : 'active' })} 
                          title={isActive ? "Անջատել մուտքը" : "Ակտիվացնել մուտքը"}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
                            isActive ? 'border-slate-200 text-slate-700 hover:bg-slate-100' : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          {isActive ? 'Անջատել' : 'Ակտիվացնել'}
                        </button>
                      )}

                      <button 
                        onClick={() => { setPasswordModalUser(u); setNewPassword(''); }} 
                        title="Փոխել գաղտնաբառը"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <KeyRound size={14} />
                      </button>

                      <button 
                        onClick={() => setEditingUser({ ...u })} 
                        title="Խմբագրել տվյալները"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Edit3 size={14} />
                      </button>

                      {!isMe && (
                        <button 
                          onClick={() => handleDelete(u)} 
                          title="Ջնջել օգտատիրոջը"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!filtered.length && (
          <div className="p-8 text-center text-sm text-slate-500">
            Համապատասխան օգտատերեր չեն գտնվել:
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <UserPlus size={20} className="text-[#0066FF]" />
                Ավելացնել Նոր Օգտատեր
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Անուն Ազգանուն *</label>
                  <input 
                    required
                    value={newForm.name} 
                    onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Օր.՝ Արամ Պողոսյան"
                    className="sil-input text-xs w-full" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input 
                    type="email"
                    value={newForm.email} 
                    onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="aram@sil.am"
                    className="sil-input text-xs w-full" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Օգտանուն (Username) *</label>
                  <input 
                    required
                    value={newForm.username} 
                    onChange={e => setNewForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="Օր.՝ aram_p"
                    className="sil-input text-xs w-full" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Գաղտնաբառ *</label>
                  <input 
                    required
                    type="password"
                    value={newForm.password} 
                    onChange={e => setNewForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Գաղտնաբառ"
                    className="sil-input text-xs w-full" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Դեր (Role)</label>
                  <select 
                    value={newForm.role} 
                    onChange={e => setNewForm(f => ({ ...f, role: e.target.value }))}
                    className="sil-input text-xs w-full"
                  >
                    {roles.map(r => (
                      <option key={r} value={r}>{ROLE_NAMES[r] || r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Կարգավիճակ</label>
                  <select 
                    value={newForm.status} 
                    onChange={e => setNewForm(f => ({ ...f, status: e.target.value }))}
                    className="sil-input text-xs w-full"
                  >
                    <option value="active">Ակտիվ (Active)</option>
                    <option value="pending">Սպասող (Pending)</option>
                    <option value="disabled">Անջատված (Disabled)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Չեղարկել
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-5 py-2 bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition"
                >
                  {saving ? 'Պահպանվում է...' : 'Ստեղծել Օգտատեր'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Edit3 size={18} className="text-[#0066FF]" />
                Խմբագրել Օգտատիրոջը: @{editingUser.username}
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              await onUpdate(editingUser.id, {
                name: editingUser.name,
                email: editingUser.email,
                role: editingUser.role,
                status: editingUser.status
              });
              setEditingUser(null);
            }} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Անուն Ազգանուն</label>
                <input 
                  required
                  value={editingUser.name} 
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="sil-input text-xs w-full" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input 
                  type="email"
                  value={editingUser.email || ''} 
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="sil-input text-xs w-full" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Դեր (Role)</label>
                <select 
                  value={editingUser.role} 
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="sil-input text-xs w-full"
                >
                  {roles.map(r => (
                    <option key={r} value={r}>{ROLE_NAMES[r] || r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Կարգավիճակ</label>
                <select 
                  value={editingUser.status} 
                  onChange={e => setEditingUser({ ...editingUser, status: e.target.value })}
                  className="sil-input text-xs w-full"
                >
                  <option value="active">Ակտիվ (Active)</option>
                  <option value="pending">Սպասող (Pending)</option>
                  <option value="disabled">Անջատված (Disabled)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Չեղարկել
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition"
                >
                  Պահպանել Փոփոխությունները
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {passwordModalUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 border-b pb-3">
              <KeyRound size={20} className="text-[#0066FF]" />
              <h3 className="text-base font-black">
                Փոխել Գաղտնաբառը
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Մուտքագրեք նոր գաղտնաբառ <b>{passwordModalUser.name}</b> (@{passwordModalUser.username}) օգտատիրոջ համար:
            </p>

            <form onSubmit={handlePasswordReset} className="space-y-3">
              <input 
                required
                type="password"
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Մուտքագրեք նոր գաղտնաբառ..."
                className="sil-input text-xs w-full"
                autoFocus
              />

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setPasswordModalUser(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Չեղարկել
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow cursor-pointer transition"
                >
                  Հաստատել
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
function Approvals({users,onApprove}:{users:any[];onApprove:(id:string,ok:boolean)=>void}){const p=users.filter(u=>u.status==='pending');return <div className="sil-card p-6"><h2 className="text-xl font-black mb-4">Գրանցումների հաստատում</h2>{p.map(u=><div key={u.id} className="flex flex-wrap justify-between items-center gap-3 p-4 border rounded-2xl mb-2"><div><b>{u.name}</b><div className="text-xs text-slate-500">{u.username} · {u.email}</div></div><div className="flex gap-2"><button onClick={()=>onApprove(u.id,true)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold">Հաստատել</button><button onClick={()=>onApprove(u.id,false)} className="px-4 py-2 rounded-xl bg-red-50 text-red-700 font-bold">Մերժել</button></div></div>)}{!p.length&&<div className="p-5 rounded-2xl bg-emerald-50 text-emerald-800 font-bold">Սպասող գրանցումներ չկան։</div>}</div>}
function Logs({logs,allLogs,q,setQ,headers,onReload}:{logs:any[];allLogs:any[];q:string;setQ:(x:string)=>void;headers:any;onReload:()=>void}){
  const [days, setDays] = useState(9999);
  const [hasExported, setHasExported] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const now = Date.now();
  const filtered = logs.filter((e:any) => days === 9999 || (now - new Date(e.at).getTime()) <= days * 86400000);

  const handleExportCSV = () => {
    exportCSV(`sil_audit_logs_${new Date().toISOString().slice(0,10)}.csv`, allLogs);
    setHasExported(true);
  };

  const handleExportJSON = () => {
    exportJSON(`sil_audit_logs_${new Date().toISOString().slice(0,10)}.json`, allLogs);
    setHasExported(true);
  };

  const handleDeleteSingle = async (id: string) => {
    if (!window.confirm("Ցանկանո՞ւմ եք ջնջել այս գրառումը:")) return;
    try {
      await fetch(`/api/admin/audit/${id}`, { method: 'DELETE', headers });
      deleteClientAuditEvent(id);
      onReload();
    } catch {
      deleteClientAuditEvent(id);
      onReload();
    }
  };

  const handleClearAll = async () => {
    if (!hasExported) {
      alert("⚠️ Գործողությունը կասեցված է. Լոգերը ջնջելուց առաջ պարտադիր է նախ դուրս հանել (արտահանել Excel/JSON) ֆայլը:");
      return;
    }
    setClearing(true);
    try {
      await fetch('/api/admin/audit', { method: 'DELETE', headers });
      clearClientAuditLog();
      setShowClearModal(false);
      onReload();
      alert("✓ Լոգերը հաջողությամբ մաքրվեցին կայքից (պահուստային պատճենը արտահանված է):");
    } catch (err: any) {
      alert("Սխալ լոգերը մաքրելիս: " + err?.message);
    } finally {
      setClearing(false);
    }
  };

  return <div className="sil-card p-6 space-y-4">
    <div className="flex flex-wrap justify-between items-center gap-3">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-black">Աուդիտ և Գործողությունների Պատմություն (Audit Logs)</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
            Ընդհանուր՝ {allLogs.length} գրառում (Անսահմանափակ պահպանում)
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Բոլոր գործողությունները պահպանվում են ամբողջությամբ: Լոգերը կայքից ջնջելու համար նախ անհրաժեշտ է դուրս հանել (արտահանել) դրանք:
        </p>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <select value={days} onChange={e=>setDays(Number(e.target.value))} className="sil-input text-xs">
          <option value={9999}>Ամբողջ պատմությունը ({allLogs.length})</option>
          <option value={1}>Վերջին 1 օրը</option>
          <option value={7}>Վերջին 7 օրը</option>
          <option value={30}>Վերջին 30 օրը</option>
        </select>
        <button onClick={handleExportCSV} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow cursor-pointer transition">
          <Download size={14}/> Արտահանել Excel (CSV)
        </button>
        <button onClick={handleExportJSON} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition">
          <Download size={14}/> JSON
        </button>
        <button onClick={()=>setShowClearModal(true)} className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition">
          <Trash2 size={14}/> Մաքրել լոգերը
        </button>
      </div>
    </div>

    {hasExported && (
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
        <span>✓ Լոգերի պահուստային պատճենը դուրս է հանվել: Այժմ կարող եք անվտանգ մաքրել կամ թարմացնել գրառումները:</span>
      </div>
    )}

    <div className="flex justify-between items-center gap-4">
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Որոնել բոլոր գրառումներում (օգտատեր, գործողություն, ID, մանրամասներ)..." className="sil-input w-full max-w-md"/>
      <div className="text-xs text-slate-500 font-bold">
        Ցուցադրված է՝ {filtered.length} / {allLogs.length}
      </div>
    </div>

    <div className="max-h-[650px] overflow-auto space-y-2 pr-1">
      {filtered.map((e:any)=>(
        <div key={e.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs hover:border-blue-200 transition group flex justify-between items-start gap-3">
          <div className="space-y-1 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2">
              <b className="text-slate-800">{new Date(e.at).toLocaleString('hy-AM')}</b>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#075bd5] font-black">{e.action}</span>
              {e.entity && <span className="text-slate-600">օբյեկտ՝ <b>{e.entity}</b></span>}
              {e.entityId && <span className="font-mono text-[11px] text-slate-400">#{e.entityId}</span>}
              {e.userId && <span className="text-slate-500">· օգտատեր: <b className="text-slate-700">{e.userId}</b></span>}
            </div>
            {e.details && (
              <pre className="whitespace-pre-wrap mt-1 text-[11px] font-mono text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                {typeof e.details === 'string' ? e.details : JSON.stringify(e.details, null, 2)}
              </pre>
            )}
          </div>
          <button onClick={()=>handleDeleteSingle(e.id)} title="Ջնջել գրառումը" className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition shrink-0 cursor-pointer">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      {!filtered.length && <p className="text-sm text-slate-500 py-6 text-center">Համապատասխան գրանցումներ չկան։</p>}
    </div>

    {/* Clear Confirmation Modal */}
    {showClearModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle size={24} />
            <h3 className="text-lg font-black text-slate-900">Լոգերի Մաքրման Հաստատում</h3>
          </div>
          
          <p className="text-sm text-slate-600 leading-relaxed">
            Դուք պատրաստվում եք կայքից ջնջել բոլոր <b>{allLogs.length}</b> աուդիտ լոգերը:
          </p>

          {!hasExported ? (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-2">
              <p className="font-bold">⚠️ Պահանջվում է նախ արտահանել ֆայլը:</p>
              <p>Որպեսզի տվյալներ չկորեն, նախ ներբեռնեք լոգերի արխիվը:</p>
              <div className="flex gap-2 pt-1">
                <button onClick={handleExportCSV} className="px-3 py-1.5 bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center gap-1">
                  <Download size={12}/> Արտահանել CSV
                </button>
                <button onClick={handleExportJSON} className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-lg font-bold text-xs flex items-center gap-1">
                  <Download size={12}/> Արտահանել JSON
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold">
              ✓ Պահուստային պատճենը արտահանված է: Այժմ կարող եք հաստատել ջնջումը:
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={()=>setShowClearModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer">
              Չեղարկել
            </button>
            <button 
              onClick={handleClearAll}
              disabled={!hasExported || clearing}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs cursor-pointer transition shadow"
            >
              {clearing ? "Մաքրվում է..." : "Հաստատել և Մաքրել Բոլորը"}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
}
function Security({users,logs}:{users:any[];logs:any[]}){const failed=logs.filter((x:any)=>x.action==='auth.login.failed').length;return <div className="grid md:grid-cols-3 gap-4"><div className="sil-card p-5"><Shield className="text-emerald-600"/><b className="block mt-3">Նույնականացում (Authentication)</b><span className="text-xs text-slate-500">Սեսիաներն ու դերերը ակտիվ են</span></div><div className="sil-card p-5"><Lock className="text-[#075bd5]"/><b className="block mt-3">Ձախողված մուտքեր</b><span className="text-xs text-slate-500">{failed} դեպք</span></div><div className="sil-card p-5"><RefreshCw className="text-amber-600"/><b className="block mt-3">Օգտահաշիվներ</b><span className="text-xs text-slate-500">{users.filter(u=>u.status==='disabled').length} անջատված / {users.length} ընդհանուր</span></div></div>}
function Analytics({users,logs}:{users:any[];logs:any[]}){
  const byAction=logs.reduce((a:any,x:any)=>(a[x.action]=(a[x.action]||0)+1,a),{});
  const data: { name: string, count: number }[] = Object.entries(byAction).map(([name, count]) => ({ name, count: Number(count) })).sort((a,b)=>b.count-a.count).slice(0,7);
  const COLORS = ['#075bd5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];
  return <div className="sil-card p-6"><h2 className="text-xl font-black mb-5">Վերլուծություն և Գրաֆիկներ (Analytics)</h2><div className="grid md:grid-cols-3 gap-4 mb-8"><Metric title="Ընդհանուր գործողություններ" value={logs.length}/><Metric title="Ակտիվ օգտատերեր" value={users.filter((u:any)=>u.status==='active').length}/><Metric title="Տարբեր գործողություններ" value={Object.keys(byAction).length}/></div>
  <div className="grid lg:grid-cols-2 gap-8">
    <div><h3 className="font-bold mb-4 text-sm text-slate-500">Գործողությունների բաշխում</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{top:5,right:30,left:20,bottom:5}}><XAxis type="number" hide/><YAxis dataKey="name" type="category" width={120} tick={{fontSize:10}} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="count" fill="#075bd5" radius={[0,4,4,0]}><Cell fill="#075bd5"/></Bar></BarChart></ResponsiveContainer></div></div>
    <div><h3 className="font-bold mb-4 text-sm text-slate-500">Համամասնություն</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count">{data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div></div>
  </div>
  </div>}
function Metric({title,value}:{title:string;value:any}){return <div className="rounded-2xl bg-slate-50 p-5"><div className="text-2xl font-black">{value}</div><div className="text-xs text-slate-500 mt-1">{title}</div></div>}
function Templates(){
  const [selectedProd, setSelectedProd] = useState<string>(productKeys[0]);
  
  const getOfficialTemplate = (prod: string) => {
    const rule = FIXED_QUOTATION_RULES[prod as keyof typeof FIXED_QUOTATION_RULES];
    const name = rule?.nameArm || prod;
    return `«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ - ՊԱՇՏՈՆԱԿԱՆ ԳՆԱՌԱՋԱՐԿԻ ՁԵՎԱՆՄՈՒՇ
Ապահովագրական պրոդուկտ՝ ${name}

1. ԱՊԱՀՈՎԱԳՐԱԿԱՆ ՊԱՅՄԱՆՆԵՐ ԵՎ ՀԻՄՆԱԿԱՆ ՏՎՅԱԼՆԵՐ
- Ապահովադիր / Հաճախորդ: [Client Name]
- Ապահովագրական գումար / Արժեք: [Sum Insured]
- Ապահովագրական սակագին: [Tariff Rate]%
- Հաշվարկված Ապահովագրավճար: [Annual Premium] AMD
- Չհատուցվող գումար (Ֆրանշիզա): [Franchise Description]

2. ՆԵՌԱՌՎԱԾ ՌԻՍԿԵՐ ԵՎ ԾԱԾԿՈՒՅԹՆԵՐ
${(rule?.availableRisks || ['Հրդեհ', 'Պայթյուն', 'Բնական աղետներ', 'Երրորդ անձանց պատասխանատվություն']).map(r => `- ${r}`).join('\n')}

3. ՊԱՀԱՆՋՎՈՂ ՓԱՍՏԱԹՂԹԵՐ ԵՎ ՆԱԽԱՊԱՅՄԱՆՆԵՐ
${(rule?.requiredDocuments || ['Անձը հաստատող փաստաթուղթ', 'Գույքի կամ օբյեկտի սեփականության վկայական']).map(d => `- ${d}`).join('\n')}

4. ՀԱՏՈՒԿ ՊԱՅՄԱՆՆԵՐ ԵՎ ՎՃԱՐՄԱՆ ԿԱՐԳ
- Գնառաջարկն ուժի մեջ է 30 օր։
- Վճարումն իրականացվում է միանվագ կամ փուլային համաձայն կողմերի համաձայնության։

Կնքման ամսաթիվ՝ ${new Date().toLocaleDateString('hy-AM')}
Ապահովագրող՝ «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ`;
  };

  const [templateText, setTemplateText] = useState<string>(() => {
    return localStorage.getItem(`sil-custom-template-${productKeys[0]}`) || getOfficialTemplate(productKeys[0]);
  });
  const [savedMsg, setSavedMsg] = useState(false);
  const [loadMsg, setLoadMsg] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`sil-custom-template-${selectedProd}`);
    if (saved) {
      setTemplateText(saved);
    } else {
      setTemplateText(getOfficialTemplate(selectedProd));
    }
  }, [selectedProd]);

  const handleSave = () => {
    localStorage.setItem(`sil-custom-template-${selectedProd}`, templateText);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const handleLoadOfficial = () => {
    const official = getOfficialTemplate(selectedProd);
    setTemplateText(official);
    localStorage.setItem(`sil-custom-template-${selectedProd}`, official);
    setLoadMsg(true);
    setTimeout(() => setLoadMsg(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      alert("Word ֆայլերը (docx/doc) բարդ կառուցվածք ունեն։ Լավագույն արդյունքի համար խնդրում ենք բացել ձեր Word ֆայլը, պատճենել տեքստը (Copy) և փակցնել (Paste) ստորև բերված տեքստային դաշտում։");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setTemplateText(content);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  return (
    <div className="sil-card p-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-black">Quotation Templates (Ձևանմուշների Կառավարում)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Այստեղ կարող եք կառավարել, խմբագրել կամ բեռնել պաշտոնական ապահովագրական ձևանմուշների տեքստերը յուրաքանչյուր պրոդուկտի համար։
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadOfficial}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs border border-emerald-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>{loadMsg ? "Բեռնվեց ✓" : "📥 Բեռնել Պաշտոնականը"}</span>
          </button>
          <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-2 transition">
            <span>📂 Բեռնել Տեքստից (.txt)</span>
            <input type="file" accept=".txt,.md,.html" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-[#075bd5] hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow cursor-pointer transition"
          >
            <Save size={15} /> {savedMsg ? "Պահպանված է ✓" : "Պահպանել Ձևանմուշը"}
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-auto pb-2">
        {productKeys.map((k) => (
          <button
            key={k}
            onClick={() => setSelectedProd(k)}
            className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap cursor-pointer transition ${
              selectedProd === k ? "bg-[#075bd5] text-white shadow" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {FIXED_QUOTATION_RULES[k].nameArm}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">
          {FIXED_QUOTATION_RULES[selectedProd as keyof typeof FIXED_QUOTATION_RULES]?.nameArm} — Ձևանմուշի կառուցվածք և տեքստ
        </label>
        <textarea
          value={templateText}
          onChange={(e) => setTemplateText(e.target.value)}
          className="sil-input w-full min-h-[380px] font-mono text-xs leading-relaxed"
          placeholder="Մուտքագրեք կամ տեղադրեք ձևանմուշի տեքստը այստեղ..."
        />
        <p className="text-[11px] text-slate-400 mt-1">
          💡 Հուշում. Դուք կարող եք խմբագրել ցանկացած հատված։ Օգտագործեք [Client Name], [Sum Insured], [Annual Premium] փոխարինիները, որոնք ավտոմատ կերպով կլրացվեն գնառաջարկ գեներացնելիս։
        </p>
      </div>
    </div>
  );
}
function Rules({rules,setRules,product,setProduct,version,onHealth,health,onRegression,regression}:{rules:any;setRules:any;product:any;setProduct:any;version:string;onHealth:any;health:any;onRegression:any;regression:any}){const rule=rules[product];const patch=(p:any)=>setRules((r:any)=>({...r,[product]:{...r[product],...p}}));return <div className="space-y-5"><div className="sil-card p-6"><div className="flex gap-2 overflow-auto mb-5">{productKeys.map(k=><button key={k} onClick={()=>setProduct(k)} className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap ${k===product?'bg-[#075bd5] text-white':'bg-slate-100'}`}>{rules[k].nameArm}</button>)}</div><h2 className="text-xl font-black">{rule.nameArm} - Հաշվիչի կարգավորումներ</h2><div className="grid md:grid-cols-3 gap-4 mt-4"><Field l="Անվանում (Հայերեն)" v={rule.nameArm} c={(v:string)=>patch({nameArm:v})}/><Num l="Նվազագույն Ապահովագրական Գումար" v={rule.minInsuredAmount} c={(v:number)=>patch({minInsuredAmount:v})}/><Num l="Առավելագույն Ապահովագրական Գումար" v={rule.maxInsuredAmount||0} c={(v:number)=>patch({maxInsuredAmount:v||undefined})}/><Num l="Նվազագույն Սակագին (%)" v={rule.minTariff} c={(v:number)=>patch({minTariff:v})}/><Num l="Հիմնական Սակագին (%)" v={rule.defaultTariff} c={(v:number)=>patch({defaultTariff:v})}/><Num l="Առավելագույն Սակագին (%)" v={rule.maxTariff} c={(v:number)=>patch({maxTariff:v})}/></div><Text l="Հասանելի ռիսկեր (յուրաքանչյուրը նոր տողից)" v={(rule.availableRisks||[]).join('\n')} c={(v:string)=>patch({availableRisks:v.split('\n').filter(Boolean)})}/></div><div className="grid md:grid-cols-2 gap-5"><div className="sil-card p-6"><h3 className="font-black">CASCO Ստուգումներ (Regression)</h3><button onClick={onRegression} className="mt-3 px-4 py-2 rounded-xl bg-[#061A40] text-white font-bold">Սկսել ստուգումը ըստ Excel-ի</button>{regression&&<div className="mt-3 text-sm font-bold">{regression.filter((x:any)=>x.pass).length}/{regression.length} ԱՆՑԱՎ (PASS)</div>}</div><div className="sil-card p-6"><h3 className="font-black">Համակարգի Առողջություն</h3><button onClick={onHealth} className="mt-3 px-4 py-2 rounded-xl bg-[#061A40] text-white font-bold">Ստուգել առողջությունը</button>{health&&<div className="mt-3 space-y-1">{health.map((h:any)=><div key={h.key} className="text-xs">{h.status==='ok'?'✓':'⚠'} {h.label}: {h.detail}</div>)}</div>}</div></div></div>}
function SystemSettings({content,setContent}:{content:any;setContent:any}){return <div className="sil-card p-6"><h2 className="text-xl font-black mb-4">Համակարգի Կարգավորումներ (Site Content)</h2><div className="grid md:grid-cols-2 gap-4">{Object.entries(content).map(([k,v]:any)=><div key={k}><Field l={k} v={v} c={(x:string)=>setContent((c:any)=>({...c,[k]:x}))}/></div>)}</div></div>}
function Field({l,v,c}:{l:string;v:any;c:(v:string)=>void}){return <label className="text-sm font-bold block">{l}<input value={v??''} onChange={e=>c(e.target.value)} className="sil-input"/></label>}
function Num({l,v,c}:{l:string;v:any;c:(v:number)=>void}){return <label className="text-sm font-bold block">{l}<input type="number" value={v??0} onChange={e=>c(Number(e.target.value))} className="sil-input"/></label>}
function Text({l,v,c}:{l:string;v:any;c:(v:string)=>void}){return <label className="text-sm font-bold block mt-4">{l}<textarea value={v??''} onChange={e=>c(e.target.value)} className="sil-input min-h-32"/></label>}

function DatabasePanel({headers}:{headers:any}){
  const [downloading, setDownloading] = useState(false);
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/admin/download-sqlite', { headers });
      if (!res.ok) throw new Error("Տվյալների բազայի ֆայլը չգտնվեց կամ հասանելի չէ։");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sil_insurance_backup_${new Date().toISOString().slice(0,10)}.db`;
      a.click();
    } catch (err: any) {
      alert(err.message || "Ներբեռնման սխալ");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="sil-card p-6 space-y-6">
      <div>
        <h2 className="text-xl font-black flex items-center gap-2">
          <DatabaseIcon className="text-[#075bd5]" /> Տվյալների Բազայի Կառավարում (SQLite DB)
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Համակարգն օգտագործում է անվտանգ, տեղային SQLite SQL տվյալների բազա, որն ապահովում է կայուն աշխատանք, տվյալների պահպանում և բարձր արագագործություն:
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2">
          <h3 className="font-bold text-sm text-slate-700">Բազայի տեղեկություններ</h3>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Տեսակը՝</span>
              <span className="font-bold text-slate-800">SQLite (Embedded SQL)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Միացման ռեժիմ՝</span>
              <span className="font-bold text-emerald-600">WAL (Write-Ahead Logging)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Բեռնման ուղի (Production)՝</span>
              <span className="font-mono text-slate-600">/tmp/sil_insurance.db</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Բեռնման ուղի (Development)՝</span>
              <span className="font-mono text-slate-600">sil_insurance.db</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-700">Արտահանել SQL Ֆայլը</h3>
            <p className="text-xs text-slate-500 mt-1">
              Դուք կարող եք ներբեռնել ամբողջական տվյալների բազայի ֆայլը (.db ֆորմատով) և այն բացել ցանկացած SQLite client ծրագրով (օրինակ՝ DB Browser for SQLite կամ DBeaver)։
            </p>
          </div>
          <button 
            onClick={handleDownload}
            disabled={downloading}
            className="sil-primary w-full py-3 mt-4 rounded-xl font-black flex gap-2 items-center justify-center cursor-pointer shadow-lg disabled:opacity-50"
          >
            <Download size={18} /> {downloading ? 'Ներբեռնվում է...' : 'Ներբեռնել SQL Բազան (.db)'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConditionsPanel() {
  const [conditions, setConditions] = useState(getProductConditions());
  const prodKeys = Object.keys(conditions) as string[];
  const [selectedProd, setSelectedProd] = useState<string>(prodKeys[0]);
  const [saved, setSaved] = useState(false);

  const current = conditions[selectedProd] || {
    productId: selectedProd,
    titleArm: "",
    sourceDocName: "",
    sourceFile: "",
    summary: "",
    coveredPerils: [],
    exclusions: [],
    settlementAndFranchise: { typicalFranchise: "", franchiseType: "", settlementBasis: "", noticePeriodHours: 24, claimDocsRequired: [] },
    sampleScenarios: []
  };

  const updateCurrent = (patch: any) => {
    setConditions(prev => ({
      ...prev,
      [selectedProd]: { ...prev[selectedProd], ...patch }
    }));
  };

  const handleSave = () => {
    saveProductConditions(conditions);
    setSaved(true);
    addAuditEvent({ action: "admin.conditions.save", entity: "product-conditions", details: { productId: selectedProd } });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateCurrent({ sourceFile: file.name });
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        updateCurrent({ summary: text.slice(0, 2000) });
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  return (
    <div className="sil-card p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
        <div>
          <h2 className="text-xl font-black">Պայմաններ և ԱԲ Հիմք (Product Conditions & Word Files)</h2>
          <p className="text-xs text-slate-500 mt-1">
            Այս բաժնում կարող եք խմբագրել յուրաքանչյուր ապահովագրական պրոդուկտի պաշտոնական պայմանները, ռիսկերը, բացառությունները և Word ֆայլի հղումը, որոնք ծառայում են որպես հիմք Անդերռայթերի (ԱԲ) և գնառաջարկների համար:
          </p>
        </div>
        <button
          onClick={handleSave}
          className="sil-primary px-5 py-2.5 rounded-xl text-xs font-black flex gap-2 items-center cursor-pointer shadow-md"
        >
          <Save size={16} /> {saved ? "Պահպանված է ✓" : "Պահպանել Պայմանները"}
        </button>
      </div>

      <div className="flex gap-2 overflow-auto pb-2">
        {prodKeys.map(k => (
          <button
            key={k}
            onClick={() => setSelectedProd(k)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap cursor-pointer transition ${
              selectedProd === k ? "bg-[#075bd5] text-white shadow" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {conditions[k]?.titleArm ? conditions[k].titleArm.split(' ')[0] + ' ' + (conditions[k].titleArm.split(' ')[1] || '') : k}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Պրոդուկտի Անվանում (Հայերեն)</label>
          <input
            value={current.titleArm || ""}
            onChange={e => updateCurrent({ titleArm: e.target.value })}
            className="sil-input text-xs w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Պաշտոնական Փաստաթղթի Անվանում</label>
          <input
            value={current.sourceDocName || ""}
            onChange={e => updateCurrent({ sourceDocName: e.target.value })}
            className="sil-input text-xs w-full"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Word Ֆայլ / Աղբյուր (օր. .docx, .xlsx, .txt)
          </label>
          <div className="flex gap-2 items-center">
            <input
              value={current.sourceFile || ""}
              onChange={e => updateCurrent({ sourceFile: e.target.value })}
              className="sil-input text-xs w-full font-mono"
            />
            <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition">
              📂 Բեռնել Word/Տեքստ
              <input type="file" accept=".docx,.doc,.txt,.xlsx,.md" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          ԱԲ Հիմք և Ընդհանուր Նկարագրություն (AI Underwriting Basis Summary)
        </label>
        <textarea
          value={current.summary || ""}
          onChange={e => updateCurrent({ summary: e.target.value })}
          className="sil-input text-xs w-full min-h-[140px] leading-relaxed"
          placeholder="Մուտքագրեք պրոդուկտի պայմանների համառոտագրությունը, որն օգտագործվում է ԱԲ և գնառաջարկների վերլուծության համար..."
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
          <h3 className="font-bold text-xs text-slate-800">Հատուցման և Ֆրանշիզայի Պայմաններ</h3>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Տիպիկ Ֆրանշիզա</label>
            <input
              value={current.settlementAndFranchise?.typicalFranchise || ""}
              onChange={e => updateCurrent({
                settlementAndFranchise: { ...current.settlementAndFranchise, typicalFranchise: e.target.value }
              })}
              className="sil-input text-xs w-full"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Հատուցման Հիմք (Settlement Basis)</label>
            <input
              value={current.settlementAndFranchise?.settlementBasis || ""}
              onChange={e => updateCurrent({
                settlementAndFranchise: { ...current.settlementAndFranchise, settlementBasis: e.target.value }
              })}
              className="sil-input text-xs w-full"
            />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
          <h3 className="font-bold text-xs text-slate-800">Ծածկված Ռիսկերի Քանակ ({current.coveredPerils?.length || 0})</h3>
          <p className="text-[11px] text-slate-500">
            Այս ռիսկերը ավտոմատ կերպով ներառվում են պաշտոնական առաջարկներում և ԱԲ վերլուծության մեջ։
          </p>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {current.coveredPerils?.map((p: any, i: number) => (
              <div key={i} className="text-xs bg-white p-2 rounded-lg border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800">{p.name}</span>
                  <div className="text-[10px] text-slate-500">{p.desc}</div>
                </div>
                {p.isCore && <span className="px-1.5 py-0.5 bg-blue-50 text-[#075bd5] font-bold text-[9px] rounded">Հիմնական</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CBASettingsPanel() {
  const [rates, setRates] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchCBARates().then(setRates);
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetchCBARates(true);
      setRates(res);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOverride = async () => {
    if (!rates) return;
    setSaving(true);
    try {
      const res = await fetch("/api/cba-rates/admin-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rates }),
      });
      if (res.ok) {
        setSuccess(true);
        addAuditEvent({ action: "admin.cba.rates.save", entity: "exchange-rates", details: { rates } });
        setTimeout(() => setSuccess(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  const updateRate = (cur: string, val: number) => {
    if (!rates) return;
    setRates({
      ...rates,
      [cur]: {
        ...rates[cur],
        rateToAMD: val,
        lastUpdated: new Date().toISOString()
      }
    });
  };

  if (!rates) return <div className="sil-card p-6">Բեռնվում է ԿԲ փոխարժեքները...</div>;

  return (
    <div className="sil-card p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
        <div>
          <h2 className="text-xl font-black">ՀՀ ԿԲ & Live Արտարժույթի Փոխարժեքներ</h2>
          <p className="text-xs text-slate-500 mt-1">
            Կառավարեք և ստուգեք ՀՀ Կենտրոնական բանկի (CBA) և համաշխարհային շուկայի իրական փոխարժեքները, որոնք կիրառվում են ապահովագրական պայմանագրերում և վճարումներում։
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex gap-2 items-center cursor-pointer transition"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Թարմացնել Live (CBA/ECB)
          </button>
          <button
            onClick={handleSaveOverride}
            disabled={saving}
            className="sil-primary px-5 py-2.5 rounded-xl text-xs font-black flex gap-2 items-center cursor-pointer shadow-md"
          >
            <Save size={16} /> {success ? "Պահպանված է ✓" : "Պահպանել Փոխարժեքները"}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(rates).map(([code, item]: [string, any]) => {
          if (code === 'AMD') return null;
          return (
            <div key={code} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-black text-sm text-slate-900">{item.nameArm} ({code})</span>
                <span className="text-lg font-bold text-[#075bd5]">{item.symbol}</span>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Փոխարժեք (AMD - 1 {code})</label>
                <input
                  type="number"
                  step="0.01"
                  value={item.rateToAMD}
                  onChange={e => updateRate(code, parseFloat(e.target.value) || 0)}
                  className="sil-input text-xs w-full font-black text-slate-900"
                />
              </div>
              <div className="text-[10px] text-slate-400">
                Թարմացված է: {new Date(item.lastUpdated || Date.now()).toLocaleTimeString()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 space-y-2">
        <div className="font-bold flex items-center gap-1.5 text-[#075bd5]">
          <AlertTriangle size={15} /> Ծանուցում ԿԲ Փոխարժեքների մասին
        </div>
        <p className="leading-relaxed">
          Համակարգն ավտոմատ կերպով ստանում է իրական փոխարժեքները ՀՀ Կենտրոնական բանկի և Եվրոպական կենտրոնական բանկի (Frankfurter API / CBA.am) վերջին տվյալներից։ Անհրաժեշտության դեպքում Ադմինիստրատորը կարող է ուղղակիորեն խմբագրել և հաստատել փոխարժեքները վերը նշված դաշտերում և սեղմել «Պահպանել Փոխարժեքները»։
        </p>
      </div>
    </div>
  );
}
