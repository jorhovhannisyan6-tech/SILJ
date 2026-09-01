import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Globe2, Menu, Phone, X, ArrowRight, CarFront, Building2, HeartPulse, Package, ShieldCheck, RefreshCw } from "lucide-react";
import { SilLogo } from "./SilLogo";
import { getSiteContent } from "../utils/rulesStore";
import { SIL_PRODUCTS_CATALOG } from "../data/productsCatalog";
import type { InsuranceProductType } from "../types";
import { fetchCBARates, subscribeCBARates, DEFAULT_CBA_RATES, type ExchangeRate } from "../utils/exchangeRates";

interface HeaderProps { onTabChange?: (tab: string) => void; onStartQuotation?: (productId: InsuranceProductType) => void; user?: {name:string; role:string}; onLogout?:()=>void; }

const GROUP_META: Record<string, { title: string; icon: any }> = {
  motor: { title: "Ավտոմեքենա", icon: CarFront },
  property: { title: "Գույք և ֆինանսներ", icon: Building2 },
  health: { title: "Առողջություն", icon: HeartPulse },
  travel: { title: "Ճանապարհորդություն", icon: ShieldCheck },
  corporate: { title: "Բիզնես և բեռներ", icon: Package },
  special: { title: "Հատուկ պրոդուկտներ", icon: ShieldCheck },
  financial: { title: "Ֆինանսական", icon: ShieldCheck },
};

export function Header({ onTabChange, onStartQuotation, user, onLogout }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [cbaRates, setCbaRates] = useState<Record<string, ExchangeRate>>(DEFAULT_CBA_RATES);
  const [loadingRates, setLoadingRates] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeCBARates((rates) => setCbaRates(rates));
    fetchCBARates();

    // Auto refresh CBA live rates every 5 minutes
    const interval = setInterval(() => {
      fetchCBARates();
    }, 5 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const refreshRates = async () => {
    setLoadingRates(true);
    await fetchCBARates();
    setLoadingRates(false);
  };

  const content = getSiteContent();
  const groupedProducts = useMemo(() => {
    const groups = new Map<string, typeof SIL_PRODUCTS_CATALOG>();
    SIL_PRODUCTS_CATALOG.forEach((p) => { const key = p.category; if (!groups.has(key)) groups.set(key, []); groups.get(key)!.push(p); });
    return Array.from(groups.entries()).map(([key, products]) => ({ key, products, ...(GROUP_META[key] || { title: "Ծառայություններ", icon: ShieldCheck }) }));
  }, []);
  const go = (tab: string) => { onTabChange?.(tab); setMobileOpen(false); setServicesOpen(false); };
  const start = (id: string) => {
    setServicesOpen(false);
    setMobileOpen(false);
    if (id === "mortgage") { onTabChange?.("mortgage"); return; }
    onStartQuotation?.(id as InsuranceProductType);
  };

  return (
    <header className="sil-site-header sticky top-0 z-[70] bg-white print:hidden">
      <div className="sil-topline">
        <div className="sil-container sil-topline-inner">
          <div className="flex items-center gap-3">
            <span>«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ</span>
            <span className="hidden md:inline-flex items-center gap-2 text-[11px] text-slate-400 font-medium bg-slate-800/60 px-2.5 py-0.5 rounded-full border border-slate-700">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                ՀՀ ԿԲ Live:
              </span>
              <span className="text-slate-200 font-semibold">USD: {cbaRates.USD?.rateToAMD || 388.5} ֏</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-200 font-semibold">EUR: {cbaRates.EUR?.rateToAMD || 424.2} ֏</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-200 font-semibold">RUB: {cbaRates.RUB?.rateToAMD || 4.35} ֏</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-200 font-semibold">GBP: {cbaRates.GBP?.rateToAMD || 508.9} ֏</span>
              <button
                onClick={refreshRates}
                disabled={loadingRates}
                title="Թարմացնել ԿԲ փոխարժեքները"
                className="ml-1 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <RefreshCw size={11} className={loadingRates ? "animate-spin text-emerald-400" : ""} />
              </button>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href={`tel:${content.phone}`}><Phone size={11} className="inline mr-1"/>{content.phone}</a>
            <a className="hidden sm:inline" href={`mailto:${content.email}`}>{content.email}</a>
          </div>
        </div>
      </div>
      <div className="sil-container sil-mainnav">
        <button className="sil-brand" onClick={() => go("home")} aria-label="SIL Insurance"><SilLogo size="lg" showSlogan={false} /></button>
        <nav className="hidden lg:flex items-center gap-1" aria-label="Գլխավոր մենյու">
          <div className="sil-services-wrap" onMouseEnter={() => setServicesOpen(true)} onMouseLeave={() => setServicesOpen(false)}>
            <button className={`sil-nav-link ${servicesOpen ? "is-open" : ""}`} onClick={() => go("catalog")} onFocus={() => setServicesOpen(true)} aria-expanded={servicesOpen}>Ծառայություններ <ChevronDown size={14} className={servicesOpen ? "rotate-180 transition-transform" : "transition-transform"}/></button>
            {servicesOpen && (
              <div className="sil-mega-menu" onMouseEnter={() => setServicesOpen(true)}>
                <div className="sil-mega-intro"><span className="sil-mega-kicker">SIL INSURANCE</span><h3>Ընտրեք ապահովագրական պրոդուկտ</h3><p>Մեկ սեղմումով անցեք համապատասխան գնառաջարկի կազմման հարթակ։</p><button onClick={() => go("catalog")} className="sil-mega-all">Բոլոր ծառայությունները <ArrowRight size={14}/></button></div>
                <div className="sil-mega-groups">
                  {groupedProducts.map(group => { const Icon = group.icon; return <div className="sil-mega-group" key={group.key}><div className="sil-mega-group-title"><Icon size={16}/>{group.title}</div>{group.products.map(p => <button key={p.id} onClick={() => start(p.id)} className="sil-mega-product"><span><b>{p.nameArm}</b><small>{p.shortDesc}</small></span><ArrowRight size={14}/></button>)}</div>; })}
                </div>
              </div>
            )}
          </div>
          <button className="sil-nav-link" onClick={() => go("quotation")}>Գնառաջարկներ</button>
          <button className="sil-nav-link" onClick={() => go("chat")}>ԱԲ Խորհրդատու</button>
          <button className="sil-nav-link" onClick={() => go("legal")}>Հաճախ տրվող հարցեր</button>
        </nav>
        <div className="hidden lg:flex items-center gap-3">
          {user && <div className="text-xs font-bold text-slate-600">{user.name} · {user.role}</div>}
          <button
            type="button"
            onClick={() => onTabChange?.("express-share")}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-cyan-200 text-xs font-extrabold flex items-center gap-1.5 shadow-xs border border-blue-700/50 transition cursor-pointer"
            title="Ուղարկել կարճ հղում հաճախորդին"
          >
            <span>🔗 Արագ Հայտի Հղում</span>
          </button>
          <button className="sil-lang"><Globe2 size={15}/> ՀԱՅ <ChevronDown size={12}/></button>
          <button onClick={() => go("quickQuote")} className="sil-cta">Արագ գնառաջարկ</button>
          {onLogout && <button onClick={onLogout} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold">Ելք</button>}
        </div>
        <button className="lg:hidden sil-mobile-button" onClick={() => setMobileOpen(v => !v)} aria-label="Մենյու">{mobileOpen ? <X/> : <Menu/>}</button>
      </div>
      {mobileOpen && <div className="lg:hidden border-t border-slate-100 bg-white sil-mobile-menu"><div className="sil-container py-3 flex flex-col"><div className="py-2"><div className="sil-mobile-section-title">Ծառայություններ</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-1">{SIL_PRODUCTS_CATALOG.map(p => <button key={p.id} onClick={() => start(p.id)} className="sil-mobile-product"><span>{p.nameArm}</span><ArrowRight size={14}/></button>)}<button onClick={() => start("mortgage")} className="sil-mobile-product"><span>Հիփոթեք</span><ArrowRight size={14}/></button></div></div><button onClick={() => go("quickQuote")} className="sil-mobile-link">Արագ գնառաջարկ</button><button onClick={() => go("quotation")} className="sil-mobile-link">Գնառաջարկներ</button><button onClick={() => go("chat")} className="sil-mobile-link">AI Agent</button><button onClick={() => go("legal")} className="sil-mobile-link">Հաճախ տրվող հարցեր</button></div></div>}
    </header>
  );
}
