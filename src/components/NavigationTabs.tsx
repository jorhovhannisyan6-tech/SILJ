import { Building2, Home, Bot, FileCheck, BookOpen, Layers, Zap, Settings2, History, Sparkles, BarChart3, Users } from "lucide-react";
import { getCurrentUser, can } from "../utils/authStore";

interface Props { activeTab:string; onTabChange:(tab:string)=>void; proposalReady:boolean; }
export function NavigationTabs({activeTab,onTabChange,proposalReady}:Props){
  const user = getCurrentUser();
  const allTabs = [
    { id: 'quickQuote', label: 'Արագ գնառաջարկ', icon: Zap, permission: 'quotes' },
    { id: 'catalog', label: 'Ծառայություններ', icon: Layers, permission: 'quotes' },
    { id: 'property', label: 'Գույք', icon: Building2, permission: 'quotes' },
    { id: 'mortgage', label: 'Հիփոթեք', icon: Home, permission: 'quotes' },
    { id: 'quotation', label: proposalReady ? 'Պատրաստ գնառաջարկ' : 'Գնառաջարկ', icon: FileCheck, permission: 'quotes' },
    { id: 'analytics', label: 'Վերլուծություն KPI', icon: BarChart3, permission: 'analytics' },
    { id: 'crm', label: 'Հաճախորդներ և Երկարաձգում', icon: Users, permission: 'quotes' },
    { id: 'history', label: 'Գնառաջարկների պատմություն', icon: History, permission: 'quotes' },
    { id: 'chat', label: 'ԱԲ Օգնական', icon: Bot, permission: 'ai' },
    { id: 'legal', label: 'FAQ / Իրավական', icon: BookOpen, permission: 'quotes' },
    { id: 'admin', label: 'Կառավարում', icon: Settings2, permission: 'users' }
  ];

  const visibleTabs = allTabs.filter(t => !user || can(user, t.permission));

  return (
    <div className="sil-portal-nav print:hidden">
      <div className="sil-container overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 min-w-max py-2">
          {visibleTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`sil-portal-tab ${activeTab === id ? 'is-active' : ''}`}
            >
              <Icon size={16}/>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

