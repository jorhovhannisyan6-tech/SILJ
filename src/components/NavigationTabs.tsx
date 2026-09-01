import { Building2, Home, Bot, FileCheck, BookOpen, Layers, Zap, Settings2, History, Sparkles, BarChart3, Users } from "lucide-react";
interface Props { activeTab:string; onTabChange:(tab:string)=>void; proposalReady:boolean; }
export function NavigationTabs({activeTab,onTabChange,proposalReady}:Props){
 const tabs=[
  ['quickQuote','Արագ գնառաջարկ',Zap],
  ['catalog','Ծառայություններ',Layers],
  ['property','Գույք',Building2],
  ['mortgage','Հիփոթեք',Home],
  ['quotation',proposalReady?'Պատրաստ գնառաջարկ':'Գնառաջարկ',FileCheck],
  ['analytics','Վերլուծություն KPI',BarChart3],
  ['crm','Հաճախորդներ և Երկարաձգում',Users],
  ['history','Գնառաջարկների պատմություն',History],
  ['chat','ԱԲ Օգնական',Bot],
  ['legal','FAQ / Իրավական',BookOpen],
  ['admin','Կառավարում',Settings2]
 ] as const;
 return <div className="sil-portal-nav print:hidden"><div className="sil-container overflow-x-auto no-scrollbar"><div className="flex items-center gap-1 min-w-max py-2">{tabs.map(([id,label,Icon])=><button key={id} onClick={()=>onTabChange(id)} className={`sil-portal-tab ${activeTab===id?'is-active':''}`}><Icon size={16}/>{label}</button>)}</div></div></div>
}
