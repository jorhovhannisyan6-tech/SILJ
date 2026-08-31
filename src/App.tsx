import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Header } from "./components/Header";
import { NavigationTabs } from "./components/NavigationTabs";
import { PropertyInsuranceForm } from "./components/PropertyForm/PropertyInsuranceForm";
import { MortgageCalculator } from "./components/Mortgage/MortgageCalculator";
import { ProductCatalogView } from "./components/Products/ProductCatalogView";
import { QuotationView } from "./components/Quotation/QuotationView";
import { AgentChat } from "./components/AgentChat/AgentChat";
import { AiAdvisorWidget } from "./components/AgentChat/AiAdvisorWidget";
import { LegalView } from "./components/Legal/LegalView";
import { QuickQuoteView } from "./components/QuickQuote/QuickQuoteView";
import { HomeDashboard } from "./components/HomeDashboard";
import { WorkCenter } from "./components/WorkCenter";
import { AdminSettings } from "./components/AdminSettings";
import { QuoteHistory } from "./components/QuoteHistory";
import { SmartOperations } from "./components/SmartOperations";
import { SilLogo } from "./components/SilLogo";
import { addAuditEvent, getRulesVersion } from "./utils/auditStore";
import { SalesAnalyticsDashboard } from "./components/Analytics/SalesAnalyticsDashboard";
import { ClientRenewalCrm } from "./components/CRM/ClientRenewalCrm";
import { LoginScreen } from "./components/LoginScreen";
import { getCurrentUser, setCurrentUser, type PortalUser, can } from "./utils/authStore";
import { assertQuotationReady } from "./utils/quoteValidation";
import { ExpressLinkShareModal } from "./components/ExpressClientPortal/ExpressLinkShareModal";
import { PublicExpressQuoteView } from "./components/ExpressClientPortal/PublicExpressQuoteView";
import {
  PropertyInsuranceFormState,
  MortgageInsuranceData,
  QuotationProposal,
} from "./types";
import {
  DEFAULT_PROPERTY_STATE,
  DEFAULT_MORTGAGE_PACKAGE_I,
} from "./data/presets";

export default function App() {
  const [user, setUser] = useState<PortalUser|null>(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>("home");
  const [selectedProductForQuote, setSelectedProductForQuote] = useState<string | null>(null);
  const [propertyState, setPropertyState] = useState<PropertyInsuranceFormState>(
    DEFAULT_PROPERTY_STATE
  );
  const [mortgageState, setMortgageState] = useState<MortgageInsuranceData>(
    DEFAULT_MORTGAGE_PACKAGE_I
  );
  const [currentProposal, setCurrentProposal] = useState<QuotationProposal | null>(() => { try { const raw = localStorage.getItem("sil-current-proposal"); return raw ? JSON.parse(raw) : null; } catch { return null; } });
  const [quoteHistory, setQuoteHistory] = useState<QuotationProposal[]>(() => { try { const raw = localStorage.getItem("sil-quote-history"); return raw ? JSON.parse(raw) : []; } catch { return []; } });
  const [floatingChatOpen, setFloatingChatOpen] = useState(false);
  const [expressShareModalOpen, setExpressShareModalOpen] = useState(false);
  const [expressClientType, setExpressClientType] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("express") || params.get("quote") || null;
    }
    return null;
  });

  useEffect(() => {
    if (activeTab === "express-share") {
      setExpressShareModalOpen(true);
      setActiveTab("home");
    }
  }, [activeTab]);

  useEffect(()=>{ if(user) localStorage.setItem("sil-active-user", JSON.stringify(user)); },[user]);
  useEffect(()=>{ (async()=>{ if(!user)return; const token=localStorage.getItem("sil-auth-token"); if(!token)return; try{ const r=await fetch("/api/auth/me",{headers:{Authorization:`Bearer ${token}`}}); if(!r.ok){localStorage.removeItem("sil-auth-token");setCurrentUser(null);setUser(null);} }catch{} })(); },[]);
  useEffect(()=>{ if(activeTab === "admin" && !can(user,"users")) setActiveTab("home"); },[activeTab,user]);

  // If URL has ?express=casco or user opened public express portal view
  if (expressClientType) {
    return (
      <PublicExpressQuoteView
        initialProductType={expressClientType}
        onCloseExpressMode={() => {
          setExpressClientType(null);
          if (typeof window !== "undefined" && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }}
      />
    );
  }

  const logout = async()=>{ try { const token=localStorage.getItem("sil-session-token"); if(token) await fetch("/api/auth/logout",{method:"POST",headers:{Authorization:`Bearer ${token}`}}); } catch {} localStorage.removeItem("sil-session-token"); setCurrentUser(null); setUser(null); setActiveTab("home"); };
  if (!user) return <LoginScreen onLoggedIn={(u)=>{setUser(u); const raw=localStorage.getItem("sil-auth-token"); if(raw) localStorage.setItem("sil-session-token",raw);}} />;

  const startQuotation = (productId: string) => {
    setSelectedProductForQuote(productId);
    if (productId === "property") { setActiveTab("property"); return; }
    if (productId === "mortgage") { setActiveTab("mortgage"); return; }
    setActiveTab("quickQuote");
  };

  const handleGenerateQuotation = (proposal: QuotationProposal) => {
    try {
      assertQuotationReady(proposal);
    } catch (error: any) {
      window.alert(`Գնառաջարկը չի կարող ստեղծվել։\n\n${error?.message || "Անվավեր տվյալներ"}`);
      return;
    }
    const now = new Date().toISOString();
    const enriched: QuotationProposal = {
      ...proposal,
      status: proposal.status || "ready",
      version: proposal.version || 1,
      rulesVersion: getRulesVersion(),
      calculatorVersion: proposal.type === "casco" ? "CASCO-EXCEL-2024-v1" : "RULES-2026-v1",
      sourceVersion: getRulesVersion(),
      createdAt: proposal.createdAt || now,
      updatedAt: now,
      underwriting: proposal.underwriting || { status: "approved", reasons: [] },
    };
    addAuditEvent({ action: "quote.create", entity: "quotation", entityId: enriched.id, details: { quotationNumber: enriched.quotationNumber, product: enriched.type, version: enriched.version } });
    setCurrentProposal(enriched);
    localStorage.setItem("sil-current-proposal", JSON.stringify(enriched));
    setQuoteHistory(prev => { const next = [enriched, ...prev.filter(p => p.id !== enriched.id)].slice(0, 200); localStorage.setItem("sil-quote-history", JSON.stringify(next)); return next; });
    setActiveTab("quotation");
  };

  const openQuote = (proposal: QuotationProposal) => { setCurrentProposal(proposal); localStorage.setItem("sil-current-proposal", JSON.stringify(proposal)); setActiveTab("quotation"); };
  const duplicateQuote = (proposal: QuotationProposal) => {
    const baseNumber = proposal.quotationNumber.replace(/-V\d+$/, "");
    const nextVersion = quoteHistory.filter(p => p.quotationNumber === baseNumber || p.quotationNumber.startsWith(`${baseNumber}-V`)).length + 1;
    const copy: QuotationProposal = {
      ...proposal,
      id: `copy-${Date.now()}`,
      quotationNumber: `${baseNumber}-V${nextVersion}`,
      date: new Date().toLocaleDateString("hy-AM"),
      status: "ready",
      version: 1,
      lockedAt: undefined,
      lockedBy: undefined,
      aiAnalysisText: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    handleGenerateQuotation(copy);
  };
  const deleteQuote = (id: string) => { setQuoteHistory(prev => { const next = prev.filter(p=>p.id !== id); localStorage.setItem("sil-quote-history", JSON.stringify(next)); return next; }); };

  const getFormSummaryForChat = () => {
    if (currentProposal) {
      return `Ակտիվ Գնառաջարկ N ${currentProposal.quotationNumber} (${currentProposal.productNameArm}), Ապահովադիր: ${currentProposal.clientName}, Գումար: ${currentProposal.totalSumInsured} ${currentProposal.currency}, Ապահովագրավճար: ${currentProposal.annualPremium} ${currentProposal.currency}`;
    }
    if (activeTab === "property") {
      return `Ընկերություն: ${propertyState.company.name || "Լրացված չէ"}, Հասցե: ${
        propertyState.objectData.address || "Լրացված չէ"
      }, Շինություն: ${propertyState.values.buildingValue} ${propertyState.values.currency}, Հաստոցներ: ${
        propertyState.values.machineryValue
      } ${propertyState.values.currency}, Ապրանքներ: ${propertyState.values.stockValue} ${
        propertyState.values.currency
      }, Շահառու: ${propertyState.beneficiary.isPledged ? propertyState.beneficiary.bankName : "Ապահովադիր"}`;
    } else {
      return `Հիփոթեքային փաթեթ: ${
        mortgageState.packageType === "PACKAGE_I" ? "ՓԱԹԵԹ I (ԱՀԸ)" : "ՓԱԹԵԹ II (ԲԵ)"
      }, Վարկառու: ${mortgageState.borrowerName}, Բանկ: ${mortgageState.bankName}, Մայր գումար: ${
        mortgageState.principalBalance
      } ${mortgageState.currency}, Տոկոսադրույք: ${mortgageState.annualInterestRate}%`;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* Official Top Branding Header */}
      <Header onTabChange={setActiveTab} onStartQuotation={startQuotation} user={user} onLogout={logout} />

      {/* Main Tab Navigation */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        proposalReady={Boolean(currentProposal)}
        user={user}
      />

      {/* Dynamic View Content */}
      <main className="flex-1 pb-16">
        {activeTab === "home" && (
          <>
            <HomeDashboard onNavigate={setActiveTab} onStartQuotation={startQuotation} proposalReady={Boolean(currentProposal)} />
            <WorkCenter onNavigate={setActiveTab} onStartQuotation={startQuotation} quoteCount={quoteHistory.length} pendingCount={quoteHistory.filter(q => q.underwriting?.status === "manual_review").length} />
          </>
        )}

        {activeTab === "quickQuote" && (
          <QuickQuoteView onGenerateQuotation={handleGenerateQuotation} initialProduct={selectedProductForQuote as any} />
        )}

        {activeTab === "catalog" && (
          <ProductCatalogView
            onSelectProductForQuotation={handleGenerateQuotation}
            onStartQuotation={startQuotation}
            onNavigateToProperty={() => setActiveTab("property")}
            onNavigateToMortgage={() => setActiveTab("mortgage")}
          />
        )}

        {activeTab === "property" && (
          <PropertyInsuranceForm
            state={propertyState}
            onChange={setPropertyState}
            onGenerateQuotation={handleGenerateQuotation}
          />
        )}

        {activeTab === "mortgage" && (
          <MortgageCalculator
            data={mortgageState}
            onChange={setMortgageState}
            onGenerateQuotation={handleGenerateQuotation}
          />
        )}

        {activeTab === "quotation" && (
          <QuotationView
            proposal={currentProposal}
            onEdit={() => {
              if (!currentProposal) return;
              if (currentProposal.type === "property") {
                setPropertyState(prev => ({
                  ...prev,
                  company: {
                    ...prev.company,
                    name: currentProposal.clientName || prev.company.name,
                    phone: currentProposal.contactInfo || prev.company.phone,
                  },
                  objectData: {
                    ...prev.objectData,
                    address: currentProposal.objectDescription || prev.objectData.address,
                  },
                  values: {
                    ...prev.values,
                    buildingValue: currentProposal.totalSumInsured || prev.values.buildingValue,
                    currency: (currentProposal.currency as any) || prev.values.currency,
                  },
                }));
                setActiveTab("property");
              } else if (currentProposal.type === "mortgage") {
                setMortgageState(prev => ({
                  ...prev,
                  borrowerName: currentProposal.clientName || prev.borrowerName,
                  borrowerPhone: currentProposal.contactInfo || prev.borrowerPhone,
                  principalBalance: currentProposal.mortgageBreakdown?.principal || currentProposal.totalSumInsured || prev.principalBalance,
                  currency: (currentProposal.currency as any) || prev.currency,
                  bankName: currentProposal.mortgageBreakdown?.bankName || prev.bankName,
                }));
                setActiveTab("mortgage");
              } else if (currentProposal.type === "casco") {
                if (currentProposal.productSpecificDetails) {
                  localStorage.setItem("sil-casco-excel-draft", JSON.stringify(currentProposal.productSpecificDetails));
                }
                setSelectedProductForQuote("casco");
                setActiveTab("quickQuote");
              } else {
                const draft = {
                  clientName: currentProposal.clientName,
                  phone: currentProposal.contactInfo,
                  product: currentProposal.type,
                  currency: currentProposal.currency,
                  insuredAmount: currentProposal.totalSumInsured,
                  objectDescription: currentProposal.objectDescription,
                  customTariff: currentProposal.baseTariff,
                  franchisePercent: currentProposal.franchiseAmount,
                  productDetails: currentProposal.productSpecificDetails || {},
                };
                localStorage.setItem("sil-quick-quote-draft", JSON.stringify(draft));
                setSelectedProductForQuote(currentProposal.type);
                setActiveTab("quickQuote");
              }
            }}
            onUpdateProposal={(updated) => {
              if (currentProposal?.status === "locked") {
                window.alert("Այս գնառաջարկը փակված է։ Փոփոխության համար ստեղծեք նոր տարբերակ։");
                return;
              }
              try { assertQuotationReady(updated); } catch (error: any) {
                window.alert(`Փոփոխությունը չի պահպանվել։\n\n${error?.message || "Անվավեր տվյալներ"}`);
                return;
              }
              const enriched = { ...updated, updatedAt: new Date().toISOString() };
              setCurrentProposal(enriched);
              localStorage.setItem("sil-current-proposal", JSON.stringify(enriched));
              setQuoteHistory(prev => { const next = [enriched, ...prev.filter(p => p.id !== enriched.id)].slice(0, 200); localStorage.setItem("sil-quote-history", JSON.stringify(next)); return next; });
              addAuditEvent({ action: enriched.status === "locked" ? "quote.lock" : "quote.update", entity: "quotation", entityId: enriched.id, details: { quotationNumber: enriched.quotationNumber, status: enriched.status, version: enriched.version } });
            }}
            onBackToCatalog={() => setActiveTab("catalog")}
          />
        )}

        {activeTab === "analytics" && <SalesAnalyticsDashboard quoteHistory={quoteHistory} />}
        {activeTab === "crm" && (
          <ClientRenewalCrm
            onGenerateRenewalQuote={(data) => {
              handleGenerateQuotation(data);
              setActiveTab("quotation");
            }}
          />
        )}
        {activeTab === "history" && <QuoteHistory proposals={quoteHistory} onOpen={openQuote} onDuplicate={duplicateQuote} onDelete={deleteQuote} />}
        {activeTab === "smart" && <SmartOperations quotes={quoteHistory} />}

        {activeTab === "chat" && (
          <AiAdvisorWidget />
        )}

        {activeTab === "legal" && <LegalView />}
        {activeTab === "admin" && <AdminSettings />}
      </main>

      {/* Official silinsurance.am Footer */}
      <footer className="bg-[#001433] text-white border-t border-blue-900/60 print:hidden mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Column 1: Brand & Slogan */}
            <div className="space-y-3">
              <div className="space-y-3">
                <SilLogo stacked size="md" className="brightness-110" />
                <div className="font-black text-sm text-white tracking-tight">«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ</div>
                <div className="text-[10px] text-cyan-300 italic font-semibold">Safe to be free</div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Հիմնադրված 2000 թվականին: Հուսալի, նորարար և թվային ապահովագրական լուծումներ ֆիզիկական և իրավաբանական անձանց համար:
              </p>
              <div className="text-[11px] text-blue-200 bg-white/5 border border-white/10 rounded-xl p-2.5">
                <div className="font-bold text-white">ՀՀ ԿԲ Լիցենզիա թիվ 0004 (0033)</div>
                <div className="text-slate-400 text-[10px] mt-0.5">Տրված 02.03.2000թ.</div>
              </div>
            </div>

            {/* Column 2: Products */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-cyan-300 mb-3">
                Ապահովագրություն
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li><button onClick={() => setActiveTab("catalog")} className="hover:text-cyan-300 transition text-left">ԿԱՍԿՈ & ԱՊՊԱ</button></li>
                <li><button onClick={() => setActiveTab("catalog")} className="hover:text-cyan-300 transition text-left">Առողջության Ապահովագրություն</button></li>
                <li><button onClick={() => setActiveTab("property")} className="hover:text-cyan-300 transition text-left">Գույքի Համապարփակ (13 բաժին)</button></li>
                <li><button onClick={() => setActiveTab("mortgage")} className="hover:text-cyan-300 transition text-left">Հիփոթեքային Վարկառուների</button></li>
                <li><button onClick={() => setActiveTab("catalog")} className="hover:text-cyan-300 transition text-left">Բեռների (ICC A/B/C) & Շինմոնտաժ</button></li>
                <li><button onClick={() => setActiveTab("catalog")} className="hover:text-cyan-300 transition text-left">Ճամփորդական & Պատասխանատվություն</button></li>
              </ul>
            </div>

            {/* Column 3: Contact info */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-cyan-300 mb-3">
                Շուրջօրյա Կապ & Գրասենյակ
              </h4>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">Շուրջօրյա Թեժ Գիծ՝</span>
                  <a href="tel:8100" className="text-white font-extrabold bg-[#0066FF] hover:bg-[#0052CC] px-2.5 py-0.5 rounded-full text-xs transition">
                    81-00
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Հեռախոսներ՝</span>
                  <div className="font-semibold text-white">(+374 10) 58-00-00, 54-00-00</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Հասցե՝</span>
                  <div className="text-slate-300">ՀՀ, ք. Երևան 0010, Արամի փողոց 3 և 5</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Էլ. փոստ՝</span>
                  <a href="mailto:info@silinsurance.am" className="text-cyan-300 hover:underline block font-medium">
                    info@silinsurance.am
                  </a>
                </div>
              </div>
            </div>

            {/* Column 4: Quick Links */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-cyan-300 mb-3">
                Կարգավորում & Իրավական
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li><button onClick={() => setActiveTab("legal")} className="hover:text-cyan-300 transition text-left">ՀՀ Կենտրոնական Բանկ</button></li>
                <li><button onClick={() => setActiveTab("legal")} className="hover:text-cyan-300 transition text-left">Ֆինանսական Համակարգի Հաշտարար</button></li>
                <li><button onClick={() => setActiveTab("legal")} className="hover:text-cyan-300 transition text-left">Հայաստանի Ավտոապահովագրողների Բյուրո</button></li>
                <li><button onClick={() => setActiveTab("legal")} className="hover:text-cyan-300 transition text-left">Գաղտնիության Քաղաքականություն</button></li>
              </ul>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] text-emerald-300 font-medium">Առցանց Անդեռռայթինգը գործում է</span>
              </div>
            </div>
          </div>

          {/* Bottom Copyright bar */}
          <div className="pt-6 border-t border-blue-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              © 2000–2025 «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ: Բոլոր իրավունքները պաշտպանված են:
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <a href="https://silinsurance.am" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
                silinsurance.am
              </a>
              <span>•</span>
              <span className="text-slate-400">ISO 9001:2015 Հավաստագրված Որակ</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Persistent AI Always-in-Touch Floating Button */}
      <div className="fixed bottom-6 right-6 z-[90] print:hidden">
        <button
          onClick={() => setFloatingChatOpen(true)}
          className="group relative bg-slate-900 hover:bg-emerald-600 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all duration-300 hover:scale-105 border border-white/20 cursor-pointer"
        >
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Sparkles size={18} />
          </div>
          <div className="text-left">
            <div className="text-xs font-black tracking-wide">SIL AI Խորհրդատու</div>
            <div className="text-[10px] text-emerald-400 font-medium">Միշտ առցանց • Հարցրեք հիմա</div>
          </div>
        </button>
      </div>

      {/* Express Link Share Modal */}
      {expressShareModalOpen && (
        <ExpressLinkShareModal
          onClose={() => setExpressShareModalOpen(false)}
          onOpenExpressView={(type) => setExpressClientType(type)}
        />
      )}

      {/* Persistent Floating Chat Modal */}
      {floatingChatOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden relative border border-slate-200">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setFloatingChatOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-2">
              <AiAdvisorWidget />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
