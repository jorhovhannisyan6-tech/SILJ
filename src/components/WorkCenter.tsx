import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bell, CheckCircle2, Clock3, FileSearch, Search, ShieldCheck, Sparkles } from "lucide-react";
import { SIL_PRODUCTS_CATALOG } from "../data/productsCatalog";

interface Props { onNavigate:(tab:string)=>void; onStartQuotation:(id:any)=>void; quoteCount:number; pendingCount:number; }

export function WorkCenter({onNavigate,onStartQuotation,quoteCount,pendingCount}:Props){
 const [q,setQ]=useState("");
 useEffect(()=>{ const h=(e:KeyboardEvent)=>{ if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault(); document.getElementById("sil-global-search")?.focus();} }; window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h); },[]);
 const results=useMemo(()=>{ const x=q.trim().toLowerCase(); if(!x) return []; return SIL_PRODUCTS_CATALOG.filter(p=>`${p.nameArm} ${p.nameEng} ${p.shortDesc}`.toLowerCase().includes(x)).slice(0,6); },[q]);
 return <section className="sil-workcenter sil-container">
   <div className="sil-workbar">
    <div><span className="sil-eyebrow dark"><span/> WORK CENTER</span><h2>Այսօրվա աշխատանքը</h2></div>
    <div className="sil-command"><Search size={17}/><input id="sil-global-search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Որոնել պրոդուկտ, quote կամ հաճախորդ..."/><kbd>⌘ K</kbd>
      {results.length>0 && <div className="sil-search-results">{results.map(p=><button key={p.id} onClick={()=>{setQ("");onStartQuotation(p.id)}}><span><b>{p.nameArm}</b><small>{p.shortDesc}</small></span><ArrowRight size={15}/></button>)}</div>}
    </div>
   </div>
   <div className="sil-work-grid">
    <button className="sil-work-card primary" onClick={()=>onNavigate("quickQuote")}><div className="sil-work-icon"><Sparkles size={20}/></div><div><b>＋ Նոր գնառաջարկ</b><span>Սկսել զրոյից կամ ընտրել պրոդուկտ</span></div><ArrowRight/></button>
    <button className="sil-work-card" onClick={()=>onNavigate("history")}><div className="sil-work-icon"><FileSearch size={20}/></div><div><b>{quoteCount} գնառաջարկ</b><span>Պատմություն և տարբերակներ</span></div><ArrowRight/></button>
    <button className="sil-work-card" onClick={()=>onNavigate("chat")}><div className="sil-work-icon"><ShieldCheck size={20}/></div><div><b>AI Underwriting</b><span>Պայմանների հիմքով ստուգում</span></div><ArrowRight/></button>
    <div className="sil-work-card metric"><div className="sil-work-icon"><Bell size={20}/></div><div><b>{pendingCount} սպասող հայտ</b><span>Manual review / գործողություններ</span></div><Clock3 size={18}/></div>
   </div>
 </section>
}
