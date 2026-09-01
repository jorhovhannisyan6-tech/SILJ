import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, CheckCircle2, FileText, KeyRound, Lock, RefreshCw, Save, Shield, Users, XCircle, Settings2, BookOpen, Sparkles, Bot, Zap } from 'lucide-react';
import { FIXED_QUOTATION_RULES, type FixedProductRule } from '../data/quotationRules';
import { getDraftQuotationRules, getSiteContent, saveQuotationRules, saveSiteContent, publishQuotationRules } from '../utils/rulesStore';
import { getAuditLog, getRulesVersion, publishRules, addAuditEvent } from '../utils/auditStore';
import { runCascoRegression } from '../utils/cascoRegression';
import { runSystemHealthCheck, type HealthCheck } from '../utils/systemHealth';
import { getCurrentUser } from '../utils/authStore';
import { KnowledgeBaseAdmin } from './KnowledgeBaseAdmin';
import { SmartOperations } from './SmartOperations';

type Tab='dashboard'|'users'|'approvals'|'logs'|'kb'|'rules'|'templates'|'security'|'analytics'|'settings'|'database'|'ai-overview'|'ai-rules'|'ai-bot'|'ai-templates';
const roles=['agent','underwriter','manager','auditor','admin'];
const productKeys=Object.keys(FIXED_QUOTATION_RULES) as (keyof typeof FIXED_QUOTATION_RULES)[];
export function AdminSettings(){
 const localQuotes = useMemo(() => {
   try {
     return JSON.parse(localStorage.getItem('sil-quote-history') || '[]');
   } catch {
     return [];
   }
 }, []);
 const me=getCurrentUser(); const [tab,setTab]=useState<Tab>('dashboard'); const [users,setUsers]=useState<any[]>([]); const [logs,setLogs]=useState<any[]>(getAuditLog()); const [serverLogs,setServerLogs]=useState<any[]>([]); const [rules,setRules]=useState<any>(getDraftQuotationRules()); const [product,setProduct]=useState<any>(productKeys[0]); const [content,setContent]=useState<any>(getSiteContent()); const [health,setHealth]=useState<HealthCheck[]|null>(null); const [reg,setReg]=useState<any[]|null>(null); const [q,setQ]=useState(''); const [saved,setSaved]=useState(false); const [version,setVersion]=useState(getRulesVersion());
 const token=localStorage.getItem('sil-auth-token'); const headers:any=token?{Authorization:`Bearer ${token}`}:{};
 const load=async()=>{try{if(['admin','manager'].includes(me?.role||'')){const r=await fetch('/api/admin/users',{headers});if(r.ok)setUsers((await r.json()).users||[])} if(['admin','manager','auditor'].includes(me?.role||'')){const r=await fetch('/api/admin/audit',{headers});if(r.ok)setServerLogs((await r.json()).events||[])}}catch{}};
 useEffect(()=>{load()},[]);
 const rule=rules[product] as FixedProductRule; const save=()=>{saveQuotationRules(rules);saveSiteContent(content);setSaved(true);addAuditEvent({action:'admin.settings.save',entity:'settings',details:{product}});setTimeout(()=>setSaved(false),1200)};
 const publish=()=>{saveQuotationRules(rules);publishQuotationRules(rules);const v=publishRules();setVersion(v);setSaved(true)};
 const approve=async(id:string,ok:boolean)=>{const r=await fetch(`/api/admin/users/${id}/${ok?'approve':'reject'}`,{method:'POST',headers});if(r.ok){await load();addAuditEvent({action:ok?'user.approve':'user.reject',entity:'user',entityId:id});}};
 const updateUser=async(id:string,patch:any)=>{const r=await fetch(`/api/admin/users/${id}`,{method:'PATCH',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(patch)});if(r.ok)await load()};
 const filteredLogs=useMemo(()=>[...serverLogs,...logs].filter(x=>!q||JSON.stringify(x).toLowerCase().includes(q.toLowerCase())).slice(0,500),[serverLogs,logs,q]);
 const cards=[
  ['dashboard','Գլխավոր',Activity],
  ['ai-overview','ԱԲ Գլխավոր',Sparkles],
  ['ai-rules','AI Կանոնների Շարժիչ',Zap],
  ['ai-bot','Չատբոտի Սանդբոքս',Bot],
  ['ai-templates','Ձևանմուշի քարտեզագրում',FileText],
  ['users','Օգտատերեր',Users],
  ['approvals','Հաստատումներ',CheckCircle2],
  ['database','Տվյալների բազա',FileText],
  ['logs','Աուդիտի մատյան',FileText],
  ['kb','ԱԲ Գիտելիքների բազա',BookOpen],
  ['rules','Հաշվիչ / Կանոններ',Settings2],
  ['security','Անվտանգության կենտրոն',Shield],
  ['analytics','Վերլուծություն',BarChart3],
  ['settings','Համակարգի կարգավորումներ',Settings2]
 ] as const;
 return <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-8 space-y-6"><div className="rounded-[28px] bg-gradient-to-br from-[#061A40] to-[#075bd5] text-white p-7 shadow-xl"><div className="flex flex-wrap justify-between gap-5"><div><div className="text-cyan-200 text-xs font-black tracking-[.18em]">SIL CONTROL CENTER</div><h1 className="text-3xl font-black mt-2">Կառավարման կենտրոն</h1><p className="text-blue-100 text-sm mt-2">Օգտատերեր, approvals, audit, AI knowledge base, հաշվիչի կանոններ, templates և security՝ մեկ վայրում։</p></div><div className="rounded-2xl bg-white/10 px-4 py-3 text-sm"><b>{me?.name}</b><div className="text-blue-100 text-xs mt-1">{me?.role}</div></div></div></div><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 xl:grid-cols-14 gap-2">{cards.map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id as Tab)} className={`rounded-2xl border px-3 py-3 text-left transition hover:-translate-y-0.5 ${tab===id?'bg-[#075bd5] text-white border-[#075bd5] shadow-lg':'bg-white border-slate-200 hover:border-blue-300'}`}><Icon size={17}/><div className="text-xs font-black mt-2">{label}</div></button>)}</div>
 {tab==='dashboard'&&<Dashboard users={users} logs={filteredLogs} onTab={setTab} />}
 {tab==='ai-overview'&&<SmartOperations quotes={localQuotes} forcedTab="overview" />}
 {tab==='ai-rules'&&<SmartOperations quotes={localQuotes} forcedTab="rules-engine" />}
 {tab==='ai-bot'&&<SmartOperations quotes={localQuotes} forcedTab="bot-playground" />}
 {tab==='ai-templates'&&<SmartOperations quotes={localQuotes} forcedTab="template-mapper" />}
 {tab==='users'&&<UsersPanel users={users} onUpdate={updateUser}/>} 
 {tab==='approvals'&&<Approvals users={users} onApprove={approve}/>} 
 {tab==='database'&&<DatabaseConsole users={users} logs={logs} serverLogs={serverLogs} onUpdateUser={updateUser}/>}
 {tab==='logs'&&<Logs logs={filteredLogs} q={q} setQ={setQ}/>} 
 {tab==='kb'&&<KnowledgeBaseAdmin />} 
 {tab==='security'&&<Security users={users} logs={filteredLogs}/>} 
 {tab==='analytics'&&<Analytics users={users} logs={filteredLogs}/>} 
 {tab==='templates'&&<Templates/>}
 {tab==='rules'&&<Rules rules={rules} setRules={setRules} product={product} setProduct={setProduct} version={version} onHealth={async()=>setHealth(await runSystemHealthCheck())} health={health} onRegression={()=>setReg(runCascoRegression())} regression={reg}/>} 
 {tab==='settings'&&<SystemSettings content={content} setContent={setContent}/>} 
 {['rules','settings'].includes(tab)&&<div className="flex flex-wrap gap-3"><button onClick={save} className="sil-primary px-5 py-3 rounded-xl font-black flex gap-2 items-center"><Save size={17}/>{saved?'Պահպանված է':'Պահպանել Draft'}</button><button onClick={publish} className="px-5 py-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-black">Publish v{version}</button></div>}
 </div>
}
function Dashboard({users,logs,onTab}:{users:any[];logs:any[];onTab:(x:any)=>void}){const pending=users.filter(u=>u.status==='pending').length;return <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">{[['Օգտատերեր',users.length,Users,'users'],['Սպասող հաստատումներ',pending,CheckCircle2,'approvals'],['Աուդիտի գրանցումներ',logs.length,FileText,'logs'],['Անվտանգություն','Պաշտպանված',Shield,'security']].map(([a,b,I,t]:any)=><button onClick={()=>onTab(t)} key={a} className="sil-card p-6 text-left hover:-translate-y-0.5 transition"><I className="text-[#075bd5]"/><div className="text-2xl font-black mt-4">{b}</div><div className="text-xs text-slate-500 font-bold">{a}</div></button>)}</div>}

function DatabaseConsole({ users, logs, serverLogs, onUpdateUser }: { users: any[]; logs: any[]; serverLogs: any[]; onUpdateUser: (id: string, patch: any) => void }) {
  const [selectedTable, setSelectedTable] = useState<'users' | 'audit' | 'quotes'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [localQuotes, setLocalQuotes] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('sil_quote_history') || '[]');
    } catch {
      return [];
    }
  });

  const handleDeleteQuote = (id: string) => {
    if (confirm('Վստա՞հ եք, որ ցանկանում եք ջնջել այս գնառաջարկը տվյալների բազայից:')) {
      const updated = localQuotes.filter(q => q.id !== id);
      setLocalQuotes(updated);
      localStorage.setItem('sil_quote_history', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleClearAuditLogs = () => {
    if (confirm('Վստա՞հ եք, որ ցանկանում եք մաքրել բոլոր տեղային աուդիտի գրանցումները:')) {
      localStorage.removeItem('sil_audit_logs');
      window.location.reload();
    }
  };

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (selectedTable === 'users') {
      return users.filter(u => !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q));
    }
    if (selectedTable === 'audit') {
      return [...serverLogs, ...logs].filter(l => !q || l.action?.toLowerCase().includes(q) || JSON.stringify(l).toLowerCase().includes(q));
    }
    if (selectedTable === 'quotes') {
      return localQuotes.filter(quote => !q || quote.quotationNumber?.toLowerCase().includes(q) || quote.clientName?.toLowerCase().includes(q) || quote.productNameArm?.toLowerCase().includes(q));
    }
    return [];
  }, [selectedTable, searchQuery, users, logs, serverLogs, localQuotes]);

  return (
    <div className="sil-card p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Տվյալների Բազայի Ադմին Պանել</h2>
          <p className="text-xs text-slate-500">Դիտեք, որոնեք և կառավարեք համակարգի բոլոր աղյուսակները իրական ժամանակում:</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['users', 'audit', 'quotes'] as const).map(tbl => (
            <button
              key={tbl}
              onClick={() => { setSelectedTable(tbl); setSearchQuery(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${selectedTable === tbl ? 'bg-[#075bd5] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {tbl === 'users' ? '👤 Օգտատերեր' : tbl === 'audit' ? '📜 Աուդիտ' : '📄 Գնառաջարկներ'} ({
                tbl === 'users' ? users.length : tbl === 'audit' ? [...serverLogs, ...logs].length : localQuotes.length
              })
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Որոնել աղյուսակի տվյալներով..."
          className="sil-input max-w-sm text-xs"
        />
        {selectedTable === 'audit' && (
          <button onClick={handleClearAuditLogs} className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold ml-auto">
            Մաքրել տեղային գրանցումները
          </button>
        )}
      </div>

      <div className="overflow-x-auto border rounded-2xl">
        {selectedTable === 'users' && (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b font-bold text-slate-700">
              <tr>
                <th className="p-3">ID / Օգտանուն</th>
                <th className="p-3">Անուն / Էլ. հասցե</th>
                <th className="p-3">Դեր (Role)</th>
                <th className="p-3">Կարգավիճակ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredData.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-mono">{u.username}</td>
                  <td className="p-3 font-bold">{u.name}<div className="text-[10px] text-slate-500 font-normal">{u.email}</div></td>
                  <td className="p-3"><span className="bg-blue-50 text-[#075bd5] px-2 py-0.5 rounded-md font-bold">{u.role}</span></td>
                  <td className="p-3 font-semibold">{u.status === 'active' ? '🟢 Ակտիվ' : u.status === 'pending' ? '🟡 Սպասող' : '🔴 Անջատված'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {selectedTable === 'audit' && (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b font-bold text-slate-700">
              <tr>
                <th className="p-3">Ամսաթիվ</th>
                <th className="p-3">Գործողություն</th>
                <th className="p-3">Օբյեկտ</th>
                <th className="p-3">Մանրամասներ</th>
              </tr>
            </thead>
            <tbody className="divide-y font-sans">
              {filteredData.map((l: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="p-3 text-slate-500 whitespace-nowrap">{new Date(l.at).toLocaleString('hy-AM')}</td>
                  <td className="p-3 font-bold text-slate-900">{l.action}</td>
                  <td className="p-3 font-mono text-[10px] text-slate-600">{l.entity} {l.entityId ? `[${l.entityId}]` : ''}</td>
                  <td className="p-3 text-[10px] text-slate-500 max-w-xs truncate" title={JSON.stringify(l.details)}>{l.details ? JSON.stringify(l.details) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {selectedTable === 'quotes' && (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b font-bold text-slate-700">
              <tr>
                <th className="p-3">Համար</th>
                <th className="p-3">Հաճախորդ</th>
                <th className="p-3">Ապրանքատեսակ</th>
                <th className="p-3">Ապահովագրավճար</th>
                <th className="p-3">Կարգավիճակ</th>
                <th className="p-3 text-center">Գործողություն</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredData.map((q: any) => (
                <tr key={q.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-mono font-bold text-[#075bd5]">{q.quotationNumber}</td>
                  <td className="p-3 font-semibold">{q.clientName}</td>
                  <td className="p-3">{q.productNameArm}</td>
                  <td className="p-3 font-black text-slate-900">{q.totalPremium?.toLocaleString()} ֏</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${q.status === 'locked' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{q.status === 'locked' ? '🔒 Կնքված' : '📝 Դրաֆտ'}</span></td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleDeleteQuote(q.id)} className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold transition">Ջնջել</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {filteredData.length === 0 && (
          <div className="p-8 text-center text-slate-400 font-bold">Գրառումներ չեն գտնվել:</div>
        )}
      </div>
    </div>
  );
}
function UsersPanel({users,onUpdate}:{users:any[];onUpdate:(id:string,p:any)=>void}){return <div className="sil-card p-6"><h2 className="text-xl font-black mb-4">Օգտատերերի կառավարում</h2><div className="overflow-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="p-3">User</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Գործողություն</th></tr></thead><tbody>{users.map(u=><tr key={u.id} className="border-b border-slate-100"><td className="p-3"><b>{u.name}</b><div className="text-xs text-slate-500">{u.username} · {u.email}</div></td><td className="p-3"><select value={u.role} onChange={e=>onUpdate(u.id,{role:e.target.value})} className="rounded-lg border p-2">{roles.map(r=><option key={r}>{r}</option>)}</select></td><td className="p-3">{u.status}</td><td className="p-3 flex gap-2"><button onClick={()=>onUpdate(u.id,{status:u.status==='active'?'disabled':'active'})} className="px-3 py-2 rounded-lg border font-bold">{u.status==='active'?'Անջատել':'Ակտիվացնել'}</button><button onClick={()=>{const p=prompt('Նոր password');if(p)onUpdate(u.id,{password:p})}} className="px-3 py-2 rounded-lg border font-bold"><KeyRound size={15}/></button></td></tr>)}</tbody></table>{!users.length&&<p className="text-sm text-slate-500">Օգտատերեր չկան։ Admin-ի առաջին account-ը ստեղծվում է SIL_ADMIN_USERNAME/SIL_ADMIN_PASSWORD-ով։</p>}</div></div>}
function Approvals({users,onApprove}:{users:any[];onApprove:(id:string,ok:boolean)=>void}){const p=users.filter(u=>u.status==='pending');return <div className="sil-card p-6"><h2 className="text-xl font-black mb-4">Գրանցումների հաստատում</h2>{p.map(u=><div key={u.id} className="flex flex-wrap justify-between items-center gap-3 p-4 border rounded-2xl mb-2"><div><b>{u.name}</b><div className="text-xs text-slate-500">{u.username} · {u.email}</div></div><div className="flex gap-2"><button onClick={()=>onApprove(u.id,true)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold">Հաստատել</button><button onClick={()=>onApprove(u.id,false)} className="px-4 py-2 rounded-xl bg-red-50 text-red-700 font-bold">Մերժել</button></div></div>)}{!p.length&&<div className="p-5 rounded-2xl bg-emerald-50 text-emerald-800 font-bold">Սպասող գրանցումներ չկան։</div>}</div>}
function Logs({logs,q,setQ}:{logs:any[];q:string;setQ:(x:string)=>void}){return <div className="sil-card p-6"><div className="flex flex-wrap justify-between gap-3 mb-4"><h2 className="text-xl font-black">Audit Logs — ով ինչ է կատարել</h2><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Որոնել user / action / quote..." className="sil-input max-w-sm"/></div><div className="max-h-[600px] overflow-auto space-y-2">{logs.map((e:any)=><div key={e.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"><b>{new Date(e.at).toLocaleString('hy-AM')}</b> · <span className="font-black">{e.action}</span> · {e.entity||''} {e.entityId&&`· ${e.entityId}`} {e.userId&&<span className="text-slate-500">· user:{e.userId}</span>}<pre className="whitespace-pre-wrap mt-1 text-[10px] text-slate-500">{e.details?JSON.stringify(e.details):''}</pre></div>)}{!logs.length&&<p className="text-sm text-slate-500">Գրանցումներ չկան։</p>}</div></div>}
function Security({users,logs}:{users:any[];logs:any[]}){const failed=logs.filter(x=>x.action==='auth.login.failed').length;return <div className="grid md:grid-cols-3 gap-4"><div className="sil-card p-5"><Shield className="text-emerald-600"/><b className="block mt-3">Authentication</b><span className="text-xs text-slate-500">Session + role checks ակտիվ են</span></div><div className="sil-card p-5"><Lock className="text-[#075bd5]"/><b className="block mt-3">Failed logins</b><span className="text-xs text-slate-500">{failed} event</span></div><div className="sil-card p-5"><RefreshCw className="text-amber-600"/><b className="block mt-3">Accounts</b><span className="text-xs text-slate-500">{users.filter(u=>u.status==='disabled').length} disabled / {users.length} total</span></div></div>}
function Analytics({users,logs}:{users:any[];logs:any[]}){const byAction=logs.reduce((a:any,x:any)=>(a[x.action]=(a[x.action]||0)+1,a),{});return <div className="sil-card p-6"><h2 className="text-xl font-black mb-5">Գործունեության Analytics</h2><div className="grid md:grid-cols-3 gap-4"><Metric title="Ընդհանուր events" value={logs.length}/><Metric title="Ակտիվ users" value={users.filter(u=>u.status==='active').length}/><Metric title="Տարբեր գործողություններ" value={Object.keys(byAction).length}/></div><div className="mt-6 space-y-2">{Object.entries(byAction).sort((a:any,b:any)=>b[1]-a[1]).slice(0,15).map(([k,v]:any)=><div key={k} className="flex justify-between p-3 rounded-xl bg-slate-50"><span>{k}</span><b>{v}</b></div>)}</div></div>}
function Metric({title,value}:{title:string;value:any}){return <div className="rounded-2xl bg-slate-50 p-5"><div className="text-2xl font-black">{value}</div><div className="text-xs text-slate-500 mt-1">{title}</div></div>}
function Templates(){return <div className="sil-card p-6"><h2 className="text-xl font-black">Quotation Templates</h2><p className="text-sm text-slate-500 mt-2">Յուրաքանչյուր պրոդուկտի template-ը պահվում է առանձին և quotation engine-ը ընտրում է համապատասխան ձևը։</p><div className="grid md:grid-cols-3 gap-3 mt-5">{productKeys.map(k=><div key={k} className="rounded-2xl border p-4"><FileText className="text-[#075bd5]"/><b className="block mt-3">{FIXED_QUOTATION_RULES[k].nameArm}</b><span className="text-xs text-emerald-700">Product-specific template ✓</span></div>)}</div></div>}
function Rules({rules,setRules,product,setProduct,version,onHealth,health,onRegression,regression}:{rules:any;setRules:any;product:any;setProduct:any;version:string;onHealth:any;health:any;onRegression:any;regression:any}){const rule=rules[product];const patch=(p:any)=>setRules((r:any)=>({...r,[product]:{...r[product],...p}}));return <div className="space-y-5"><div className="sil-card p-6"><div className="flex gap-2 overflow-auto mb-5">{productKeys.map(k=><button key={k} onClick={()=>setProduct(k)} className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap ${k===product?'bg-[#075bd5] text-white':'bg-slate-100'}`}>{rules[k].nameArm}</button>)}</div><h2 className="text-xl font-black">{rule.nameArm}</h2><div className="grid md:grid-cols-3 gap-4 mt-4"><Field l="Անվանում" v={rule.nameArm} c={(v:string)=>patch({nameArm:v})}/><Num l="Min insured" v={rule.minInsuredAmount} c={(v:number)=>patch({minInsuredAmount:v})}/><Num l="Max insured" v={rule.maxInsuredAmount||0} c={(v:number)=>patch({maxInsuredAmount:v||undefined})}/><Num l="Min tariff %" v={rule.minTariff} c={(v:number)=>patch({minTariff:v})}/><Num l="Default tariff %" v={rule.defaultTariff} c={(v:number)=>patch({defaultTariff:v})}/><Num l="Max tariff %" v={rule.maxTariff} c={(v:number)=>patch({maxTariff:v})}/></div><Text l="Available risks" v={(rule.availableRisks||[]).join('\n')} c={(v:string)=>patch({availableRisks:v.split('\n').filter(Boolean)})}/></div><div className="grid md:grid-cols-2 gap-5"><div className="sil-card p-6"><h3 className="font-black">CASCO Regression Lab</h3><button onClick={onRegression} className="mt-3 px-4 py-2 rounded-xl bg-[#061A40] text-white font-bold">Run Excel regression</button>{regression&&<div className="mt-3 text-sm font-bold">{regression.filter((x:any)=>x.pass).length}/{regression.length} PASS</div>}</div><div className="sil-card p-6"><h3 className="font-black">System Health</h3><button onClick={onHealth} className="mt-3 px-4 py-2 rounded-xl bg-[#061A40] text-white font-bold">Run health check</button>{health&&<div className="mt-3 space-y-1">{health.map((h:any)=><div key={h.key} className="text-xs">{h.status==='ok'?'✓':'⚠'} {h.label}: {h.detail}</div>)}</div>}</div></div></div>}
function SystemSettings({content,setContent}:{content:any;setContent:any}){return <div className="sil-card p-6"><h2 className="text-xl font-black mb-4">System Settings</h2><div className="grid md:grid-cols-2 gap-4">{Object.entries(content).map(([k,v]:any)=><div key={k}><Field l={k} v={v} c={(x:string)=>setContent((c:any)=>({...c,[k]:x}))}/></div>)}</div></div>}
function Field({l,v,c}:{l:string;v:any;c:(v:string)=>void}){return <label className="text-sm font-bold block">{l}<input value={v??''} onChange={e=>c(e.target.value)} className="sil-input"/></label>}
function Num({l,v,c}:{l:string;v:any;c:(v:number)=>void}){return <label className="text-sm font-bold block">{l}<input type="number" value={v??0} onChange={e=>c(Number(e.target.value))} className="sil-input"/></label>}
function Text({l,v,c}:{l:string;v:any;c:(v:string)=>void}){return <label className="text-sm font-bold block mt-4">{l}<textarea value={v??''} onChange={e=>c(e.target.value)} className="sil-input min-h-32"/></label>}
