import { ArrowRight, Building2, CarFront, HeartPulse, Plane, ShieldCheck, Sparkles, WalletCards, FileCheck2, Package, HardHat, Sprout } from "lucide-react";
import { FIXED_QUOTATION_RULES } from "../data/quotationRules";
import { getSiteContent, getQuotationRules } from "../utils/rulesStore";
interface Props { onNavigate:(tab:string)=>void; onStartQuotation:(productId:any)=>void; proposalReady:boolean; }
const cards=[
 {title:'ԿԱՍԿՈ',sub:'Ավտոմեքենայի համապարփակ պաշտպանություն',icon:CarFront,productId:'casco',tone:'sky'},
 {title:'Առողջություն',sub:'Անհատական և կորպորատիվ լուծումներ',icon:HeartPulse,productId:'health',tone:'mint'},
 {title:'Ճանապարհորդություն',sub:'Ճամփորդիր ապահով',icon:Plane,productId:'travel',tone:'blue'},
 {title:'Բեռներ',sub:'Բեռնափոխադրումների ապահովագրություն',icon:Package,productId:'cargo',tone:'violet'},
 {title:'Գույք',sub:'Անշարժ և շարժական գույքի պաշտպանություն',icon:Building2,productId:'property',tone:'gold'},
 {title:'Պատասխանատվություն',sub:'Բիզնեսի պատասխանատվության լուծումներ',icon:ShieldCheck,productId:'liability',tone:'navy'},
 {title:'Շինմոնտաժ',sub:'Շինարարական և մոնտաժային ռիսկեր',icon:HardHat,productId:'construction',tone:'teal'},
 {title:'Ագրո',sub:'Գյուղատնտեսական ռիսկերի պաշտպանություն',icon:Sprout,productId:'agro',tone:'rose'},
];
const toneClass=(t:string)=>({sky:'from-[#eaf7ff] to-[#bde9ff]',mint:'from-[#eafcf7] to-[#c8f2df]',blue:'from-[#e9f0ff] to-[#b9d0ff]',violet:'from-[#f2edff] to-[#d9ceff]',gold:'from-[#fff8e7] to-[#ffe4a3]',navy:'from-[#dce9ff] to-[#a9c6f4]',teal:'from-[#e7fbfb] to-[#b7e9e5]',rose:'from-[#fff0f4] to-[#ffd0dc]'}[t]||'from-slate-100 to-slate-200');
export function HomeDashboard({onNavigate,onStartQuotation,proposalReady}:Props){
 const count=Object.keys(getQuotationRules()).length; const content=getSiteContent();
 return <div className="sil-home">
  <section className="sil-hero">
   <div className="sil-container sil-hero-grid">
    <div className="relative z-10 py-10 lg:py-16">
      <div className="sil-eyebrow"><span/> SIL INSURANCE · DIGITAL QUOTATION PORTAL</div>
      <h1>{content.heroTitle.split(" ").slice(0,2).join(" ")}<br/><em>{content.heroTitle.split(" ").slice(2).join(" ")}</em></h1>
      <p>{content.heroText}</p>
      <div className="flex flex-wrap gap-3 mt-7"><button onClick={()=>onNavigate('quickQuote')} className="sil-hero-btn">Ստեղծել արագ գնառաջարկ <ArrowRight size={17}/></button><button onClick={()=>onNavigate('catalog')} className="sil-hero-outline">Դիտել ծառայությունները</button></div>
      <div className="sil-hero-stats"><div><b>{count}+</b><span>պրոդուկտ / կանոն</span></div><div><b>01</b><span>մուտքագրում → ստուգում</span></div><div><b>PDF</b><span>գնառաջարկի արդյունք</span></div></div>
    </div>
    <div className="sil-hero-art" aria-hidden="true"><div className="sil-orbit one"/><div className="sil-orbit two"/><div className="sil-figure"><div className="sil-figure-card top">Ապահովագրություն<div className="line"/><div className="line short"/></div><div className="sil-figure-card bottom"><span className="dot"/> Գնառաջարկ պատրաստ է <strong>✓</strong></div></div></div>
   </div>
  </section>

  <section className="sil-container py-12 lg:py-16">
    <div className="sil-section-head"><div><div className="sil-eyebrow dark"><span/> ԾԱՌԱՅՈՒԹՅՈՒՆՆԵՐ</div><h2>Ապահովագրական լուծումներ</h2></div><button onClick={()=>onNavigate('catalog')} className="sil-more">Տեսնել բոլորը <ArrowRight size={16}/></button></div>
    <div className="sil-service-grid">{cards.map(({title,sub,icon:Icon,productId,tone})=><button key={title} onClick={()=>onStartQuotation(productId)} className="sil-service-card group"><div className={`sil-service-art bg-gradient-to-br ${toneClass(tone)}`}><Icon size={34}/><span>Առցանց պայմանագիր</span></div><div className="p-5"><h3>{title}</h3><p>{sub}</p><span className="sil-more">Տեսնել ավելին <ArrowRight size={14}/></span></div></button>)}</div>
  </section>

  <section className="sil-process-wrap"><div className="sil-container py-12 lg:py-16"><div className="sil-section-head"><div><div className="sil-eyebrow dark"><span/> ԱՐԱԳ ԳՆԱՌԱՋԱՐԿ</div><h2>Մնացյալ ուղին մենք անցնում ենք Ձեզ հետ</h2></div></div><div className="sil-process"><div><b>01</b><h3>Մուտքագրեք տվյալները</h3><p>Հաճախորդ, օբյեկտ, գումար, ռիսկեր և անհրաժեշտ պայմաններ։</p></div><div><b>02</b><h3>Համեմատեք պայմանների հետ</h3><p>Համակարգը ստուգում է միայն Ձեր կողմից սահմանված կանոնները։</p></div><div><b>03</b><h3>Ստացեք գնառաջարկ</h3><p>Համապատասխանության դեպքում հաշվարկվում է պրեմիան և ստեղծվում փաստաթուղթ։</p></div></div></div></section>

  <section className="sil-container py-12"><div className="sil-agent"><div><div className="sil-eyebrow"><span/> SIL AI AGENT</div><h2>Օժանդակ AI՝ առանց սակագնային որոշման</h2><p>AI-ը կարող է օգնել տվյալների կառուցվածքավորմանը և հարցերին, իսկ վերջնական underwriting-ը և գինը որոշվում են ֆիքսված կանոններով։</p></div><button onClick={()=>onNavigate('chat')} className="sil-hero-btn"><Sparkles size={17}/> Բացել AI Agent</button></div></section>

  <section className="sil-container pb-16"><div className="sil-quote-banner"><div><span>{proposalReady?'✓ Գնառաջարկը պատրաստ է':'Արագ գործընթաց'}</span><h2>{proposalReady?'Բացեք և ստուգեք ընթացիկ գնառաջարկը':'Պատրաստեք հաջորդ գնառաջարկը մի քանի քայլով'}</h2></div><button onClick={()=>onNavigate(proposalReady?'quotation':'quickQuote')} className="sil-dark-btn">{proposalReady?'Բացել գնառաջարկը':'Սկսել հիմա'} <ArrowRight size={16}/></button></div></section>
 </div>
}
