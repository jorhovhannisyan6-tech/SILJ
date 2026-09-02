import React, { useState, useEffect } from "react";
import { ArrowRight, Building2, CarFront, HeartPulse, Plane, ShieldCheck, Sparkles, Package, HardHat, Sprout, BarChart3, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { getSiteContent, getQuotationRules } from "../utils/rulesStore";
import { getClientRenewals, ClientRenewalLead } from "../utils/clientRenewalStore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

interface Props { 
  onNavigate: (tab: string) => void; 
  onStartQuotation: (productId: any) => void; 
  proposalReady: boolean; 
}

const cards = [
  {title:'ԿԱՍԿՈ',sub:'Ավտոմեքենայի համապարփակ պաշտպանություն',icon:CarFront,productId:'casco',tone:'sky'},
  {title:'Առողջություն',sub:'Անհատական և կորպորատիվ լուծումներ',icon:HeartPulse,productId:'health',tone:'mint'},
  {title:'Ճանապարհորդություն',sub:'Ճամփորդիր ապահով',icon:Plane,productId:'travel',tone:'blue'},
  {title:'Բեռներ',sub:'Բեռնափոխադրումների ապահովագրություն',icon:Package,productId:'cargo',tone:'violet'},
  {title:'Գույք',sub:'Անշարժ և շարժական գույքի պաշտպանություն',icon:Building2,productId:'property',tone:'gold'},
  {title:'Պատասխանատվություն',sub:'Բիզնեսի պատասխանատվության լուծումներ',icon:ShieldCheck,productId:'liability',tone:'navy'},
  {title:'Շինմոնտաժ',sub:'Շինարարական և մոնտաժային ռիսկեր',icon:HardHat,productId:'construction',tone:'teal'},
  {title:'Ագրո',sub:'Գյուղատնտեսական ռիսկերի պաշտպանություն',icon:Sprout,productId:'agro',tone:'rose'},
];

const toneClass = (t: string) => ({
  sky:'from-[#eaf7ff] to-[#bde9ff]',
  mint:'from-[#eafcf7] to-[#c8f2df]',
  blue:'from-[#e9f0ff] to-[#b9d0ff]',
  violet:'from-[#f2edff] to-[#d9ceff]',
  gold:'from-[#fff8e7] to-[#ffe4a3]',
  navy:'from-[#dce9ff] to-[#a9c6f4]',
  teal:'from-[#e7fbfb] to-[#b7e9e5]',
  rose:'from-[#fff0f4] to-[#ffd0dc]'
}[t] || 'from-slate-100 to-slate-200');

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function HomeDashboard({ onNavigate, onStartQuotation, proposalReady }: Props) {
  const count = Object.keys(getQuotationRules()).length;
  const content = getSiteContent();
  
  const [leads, setLeads] = useState<ClientRenewalLead[]>([]);

  useEffect(() => {
    setLeads(getClientRenewals());
    const handleUpdate = () => setLeads(getClientRenewals());
    window.addEventListener("sil-lead-updated", handleUpdate);
    return () => window.removeEventListener("sil-lead-updated", handleUpdate);
  }, []);

  // Process data for charts
  const monthlyData = [
    { name: 'Հուն', leads: 4 },
    { name: 'Փետ', leads: 6 },
    { name: 'Մարտ', leads: 8 },
    { name: 'Ապր', leads: 12 },
    { name: 'Մայ', leads: leads.length > 5 ? leads.length : 15 }, 
  ];

  const productsCount = leads.reduce((acc, lead) => {
    acc[lead.productType] = (acc[lead.productType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(productsCount).map(key => ({
    name: key.toUpperCase(),
    value: productsCount[key]
  }));
  
  if (pieData.length === 0) {
    pieData.push({ name: 'ԿԱՍԿՈ', value: 4 }, { name: 'ԳՈՒՅՔ', value: 2 }, { name: 'ԱՌՈՂՋՈՒԹՅՈՒՆ', value: 1 });
  }

  const successSales = leads.filter(l => l.status === 'closed').reduce((acc, l) => acc + (l.estimatedPremium || 0), 0);
  const totalPotential = leads.reduce((acc, l) => acc + (l.estimatedPremium || 0), 0);

  return (
    <div className="sil-home">
      <section className="sil-hero pb-8">
        <div className="sil-container sil-hero-grid">
          <div className="relative z-10 py-10 lg:py-16">
            <div className="sil-eyebrow"><span/> SIL INSURANCE · DIGITAL QUOTATION PORTAL</div>
            <h1>{content.heroTitle.split(" ").slice(0,2).join(" ")}<br/><em>{content.heroTitle.split(" ").slice(2).join(" ")}</em></h1>
            <p>{content.heroText}</p>
            <div className="flex flex-wrap gap-3 mt-7">
              <button onClick={() => onNavigate('quickQuote')} className="sil-hero-btn">Ստեղծել արագ գնառաջարկ <ArrowRight size={17}/></button>
              <button onClick={() => onNavigate('crm')} className="sil-hero-outline">Դիտել Հայտերը (CRM)</button>
            </div>
          </div>
          <div className="sil-hero-art" aria-hidden="true">
            <div className="sil-orbit one"/><div className="sil-orbit two"/>
            <div className="sil-figure">
              <div className="sil-figure-card top">Ապահովագրություն<div className="line"/><div className="line short"/></div>
              <div className="sil-figure-card bottom"><span className="dot"/> Գնառաջարկ պատրաստ է <strong>✓</strong></div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Dashboard */}
      <section className="sil-container py-8">
        <div className="sil-section-head mb-6">
          <div>
            <div className="sil-eyebrow dark"><span/> ԱՆԱԼԻՏԻԿԱ</div>
            <h2>Վաճառքների և Հայտերի Վիճակագրություն</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-700 text-sm">Ընդհանուր Հայտեր</h3>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <BarChart3 size={16} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900">{leads.length}</div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1"><span className="text-emerald-500 font-bold">+12%</span> այս ամիս</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-700 text-sm">Հաջողված Վաճառքներ (Closed)</h3>
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900">{successSales > 0 ? (successSales / 1000000).toFixed(1) + 'Մ' : '0'} ֏</div>
            <p className="text-xs text-slate-500 mt-2">Պոտենցիալ հայտեր՝ {(totalPotential / 1000000).toFixed(1)}Մ ֏</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-700 text-sm">Ակտիվ Ապահովագրատեսակներ</h3>
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <PieChartIcon size={16} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900">{pieData.length}</div>
            <p className="text-xs text-slate-500 mt-2">Ամենապահանջվածը՝ {pieData.sort((a,b)=>b.value - a.value)[0]?.name || 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-6">Հայտերի Դինամիկա (Ամսական)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="leads" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-800 text-sm mb-2">Հայտեր Ըստ Ապահովագրատեսակների</h3>
            <div className="flex-1 w-full flex items-center justify-center min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section className="sil-container py-12 lg:py-16">
        <div className="sil-section-head">
          <div>
            <div className="sil-eyebrow dark"><span/> ԾԱՌԱՅՈՒԹՅՈՒՆՆԵՐ</div>
            <h2>Ապահովագրական լուծումներ</h2>
          </div>
          <button onClick={() => onNavigate('catalog')} className="sil-more">Տեսնել բոլորը <ArrowRight size={16}/></button>
        </div>
        <div className="sil-service-grid">
          {cards.map(({title,sub,icon:Icon,productId,tone}) => (
            <button key={title} onClick={() => onStartQuotation(productId)} className="sil-service-card group">
              <div className={`sil-service-art bg-gradient-to-br ${toneClass(tone)}`}>
                <Icon size={34}/>
                <span>Առցանց պայմանագիր</span>
              </div>
              <div className="p-5">
                <h3>{title}</h3>
                <p>{sub}</p>
                <span className="sil-more">Տեսնել ավելին <ArrowRight size={14}/></span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="sil-process-wrap">
        <div className="sil-container py-12 lg:py-16">
          <div className="sil-section-head">
            <div>
              <div className="sil-eyebrow dark"><span/> ԱՐԱԳ ԳՆԱՌԱՋԱՐԿ</div>
              <h2>Մնացյալ ուղին մենք անցնում ենք Ձեզ հետ</h2>
            </div>
          </div>
          <div className="sil-process">
            <div><b>01</b><h3>Մուտքագրեք տվյալները</h3><p>Հաճախորդ, օբյեկտ, գումար, ռիսկեր և անհրաժեշտ պայմաններ։</p></div>
            <div><b>02</b><h3>Համեմատեք պայմանների հետ</h3><p>Համակարգը ստուգում է միայն Ձեր կողմից սահմանված կանոնները։</p></div>
            <div><b>03</b><h3>Ստացեք գնառաջարկ</h3><p>Համապատասխանության դեպքում հաշվարկվում է պրեմիան և ստեղծվում փաստաթուղթ։</p></div>
          </div>
        </div>
      </section>

      <section className="sil-container py-12">
        <div className="sil-agent">
          <div>
            <div className="sil-eyebrow"><span/> SIL AI AGENT</div>
            <h2>Օժանդակ AI՝ առանց սակագնային որոշման</h2>
            <p>AI-ը կարող է օգնել տվյալների կառուցվածքավորմանը և հարցերին, իսկ վերջնական underwriting-ը և գինը որոշվում են ֆիքսված կանոններով։</p>
          </div>
          <button onClick={() => onNavigate('chat')} className="sil-hero-btn">
            <Sparkles size={17}/> Բացել AI Agent
          </button>
        </div>
      </section>
    </div>
  );
}
