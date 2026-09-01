import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Upload, RefreshCw, Sparkles, Play, Save, Trash2,
  FileEdit, History, AlertTriangle, FileSearch, Plus, CheckCircle2,
  LayoutGrid, RotateCcw, Download, Info, Check, ShieldCheck, ChevronRight, FileCheck
} from 'lucide-react';
import {
  SUPPORTED_TEMPLATE_PRODUCTS,
  CORE_SYSTEM_FIELDS,
  CONTRACT_CORE_SYSTEM_FIELDS,
  PRODUCT_SPECIFIC_FIELDS,
  PRODUCT_DRY_RUN_MOCKS,
  DEFAULT_PRODUCT_MAPPINGS,
  DEFAULT_CONTRACT_MAPPINGS,
  CONTRACT_MOCK_DATA,
  TemplateMappingItem,
  ProductTemplateMeta,
  TemplateKind
} from '../../data/productTemplateDefaults';

interface Props {
  token?: string;
}

interface ProductSummaryItem {
  id: string;
  nameArm: string;
  nameEn: string;
  icon: string;
  category: string;
  description: string;
  sourceDocxName: string;
  hasCustomDocx: boolean;
  mappingsCount: number;
  updatedAt: string | null;
  updatedBy: string | null;
  templateType?: string;
}

export const ProductTemplateMapper: React.FC<Props> = ({ token }) => {
  const [templateKind, setTemplateKind] = useState<TemplateKind>('quotation');
  const [selectedProductId, setSelectedProductId] = useState<string>('casco');
  const [productsSummary, setProductsSummary] = useState<ProductSummaryItem[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  
  const [mappings, setMappings] = useState<TemplateMappingItem[]>([]);
  const [isLoadingMappings, setIsLoadingMappings] = useState<boolean>(false);
  const [isSavingMappings, setIsSavingMappings] = useState<boolean>(false);
  const [mappingMessage, setMappingMessage] = useState<string>('');

  const [activeTemplateText, setActiveTemplateText] = useState<string>('');
  const [isCustomTemplate, setIsCustomTemplate] = useState<boolean>(false);
  const [activeDocxFileName, setActiveDocxFileName] = useState<string>('');

  const [isUploadingTemplate, setIsUploadingTemplate] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string>('');

  // AI Assistant states
  const [aiPromptText, setAiPromptText] = useState<string>('');
  const [isAnalyzingTemplate, setIsAnalyzingTemplate] = useState<boolean>(false);
  const [aiAnalysisMessage, setAiAnalysisMessage] = useState<string>('');
  const [proposedMappings, setProposedMappings] = useState<TemplateMappingItem[]>([]);

  // Version history states (per-product)
  const [versionHistory, setVersionHistory] = useState<any[]>([]);

  // Dry-run modal states
  const [showDryRunModal, setShowDryRunModal] = useState<boolean>(false);
  const [showMatrixModal, setShowMatrixModal] = useState<boolean>(false);
  const [dryRunMockData, setDryRunMockData] = useState<Record<string, any>>({});
  const [dryRunDownloadMessage, setDryRunDownloadMessage] = useState<string>('');

  const currentProductMeta: ProductTemplateMeta = useMemo(() => {
    return SUPPORTED_TEMPLATE_PRODUCTS.find(p => p.id === selectedProductId) || SUPPORTED_TEMPLATE_PRODUCTS[0];
  }, [selectedProductId]);

  // Combined system fields for the selected product
  const availableSystemFields = useMemo(() => {
    const core = templateKind === 'contract' ? CONTRACT_CORE_SYSTEM_FIELDS : CORE_SYSTEM_FIELDS;
    const specific = PRODUCT_SPECIFIC_FIELDS[selectedProductId] || [];
    return [
      { category: templateKind === 'contract' ? "Պայմանագրի Հիմնական Դաշտեր (Contract Core)" : "Գնառաջարկի Հիմնական Դաշտեր (Quotation Core)", fields: core },
      { category: `Հատուկ Դաշտեր (${currentProductMeta.nameArm})`, fields: specific }
    ];
  }, [selectedProductId, currentProductMeta, templateKind]);

  const flatSystemFields = useMemo(() => {
    const core = templateKind === 'contract' ? CONTRACT_CORE_SYSTEM_FIELDS : CORE_SYSTEM_FIELDS;
    const specific = PRODUCT_SPECIFIC_FIELDS[selectedProductId] || [];
    return [...core, ...specific];
  }, [selectedProductId, templateKind]);

  // 1. Fetch All Products Summary
  const fetchProductsSummary = async (kind: TemplateKind = templateKind) => {
    setIsLoadingSummary(true);
    try {
      const res = await fetch(`/api/admin/template-list?type=${kind}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.products && Array.isArray(data.products)) {
          setProductsSummary(data.products);
        }
      }
    } catch (err) {
      console.error("Failed to fetch products summary:", err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // 2. Fetch Selected Product Mappings and Template Text
  const fetchProductMappings = async (productId: string, kind: TemplateKind = templateKind) => {
    setIsLoadingMappings(true);
    setMappingMessage('');
    setUploadMessage('');
    setAiAnalysisMessage('');
    setProposedMappings([]);

    const defaultMappingsMap = kind === 'contract' ? DEFAULT_CONTRACT_MAPPINGS : DEFAULT_PRODUCT_MAPPINGS;

    try {
      // Fetch mappings
      const res = await fetch(`/api/admin/template-mappings?product=${encodeURIComponent(productId)}&type=${kind}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        setMappings(data.mappings || defaultMappingsMap[productId] || defaultMappingsMap.default);
      } else {
        setMappings(defaultMappingsMap[productId] || defaultMappingsMap.default);
      }

      // Fetch template text
      const textRes = await fetch(`/api/admin/template-text?product=${encodeURIComponent(productId)}&type=${kind}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (textRes.ok) {
        const textData = await textRes.json();
        setActiveTemplateText(textData.text || '');
        setIsCustomTemplate(textData.isCustomTemplate || false);
        setActiveDocxFileName(textData.fileName || (kind === 'contract' ? `SIL_Contract_Template_${productId}.docx` : `SIL_Quotation_Template_${productId}.docx`));
      }

      // Load product-specific version history from localStorage
      const cachedHistory = JSON.parse(localStorage.getItem(`sil-tmpl-history-${kind}-${productId}`) || "[]");
      setVersionHistory(cachedHistory);

      // Load initial dry run mock data for this product
      const initialMock = kind === 'contract'
        ? (CONTRACT_MOCK_DATA[productId] || CONTRACT_MOCK_DATA.default || {})
        : (PRODUCT_DRY_RUN_MOCKS[productId] || PRODUCT_DRY_RUN_MOCKS.default || {});
      setDryRunMockData({ ...initialMock });

    } catch (err) {
      console.error(`Failed to fetch data for product ${productId}:`, err);
      setMappings(defaultMappingsMap[productId] || defaultMappingsMap.default);
    } finally {
      setIsLoadingMappings(false);
    }
  };

  useEffect(() => {
    fetchProductsSummary(templateKind);
    fetchProductMappings(selectedProductId, templateKind);
  }, [templateKind]);

  useEffect(() => {
    fetchProductMappings(selectedProductId, templateKind);
  }, [selectedProductId]);

  // 3. Save Mappings for Selected Product
  const handleSaveMappings = async (customMappings?: TemplateMappingItem[]) => {
    const targetMappings = customMappings || mappings;
    setIsSavingMappings(true);
    setMappingMessage('');

    try {
      const res = await fetch("/api/admin/template-mappings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId: selectedProductId,
          type: templateKind,
          mappings: targetMappings
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMappingMessage("✅ " + (data.message || "Քարտեզագրումները պահպանվեցին Firestore-ում։"));

        // Save to version history snapshot
        const meUserStr = localStorage.getItem("sil-user") || "{}";
        let authorName = "Անդեռռայթեր";
        try {
          const meUser = JSON.parse(meUserStr);
          if (meUser && meUser.name) authorName = meUser.name;
        } catch {}

        const newSnapshot = {
          timestamp: new Date().toISOString(),
          mappings: [...targetMappings],
          updatedBy: authorName
        };
        const updatedHistory = [newSnapshot, ...versionHistory].slice(0, 15);
        setVersionHistory(updatedHistory);
        localStorage.setItem(`sil-tmpl-history-${templateKind}-${selectedProductId}`, JSON.stringify(updatedHistory));

        // Refresh overview
        fetchProductsSummary(templateKind);
      } else {
        setMappingMessage("❌ Չհաջողվեց պահպանել քարտեզագրումները։");
      }
    } catch {
      setMappingMessage("❌ Կապի սխալ։ Խնդրում ենք փորձել կրկին:");
    } finally {
      setIsSavingMappings(false);
    }
  };

  // 4. Reset Product Mappings to System Defaults
  const handleResetToDefaults = async () => {
    if (!confirm(`Իսկապե՞ս ցանկանում եք վերականգնել «${currentProductMeta.nameArm}» (${templateKind === 'contract' ? 'Պայմանագիր' : 'Գնառաջարկ'}) քարտեզագրումը լռելյայն համակարգային վիճակին:`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/template-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ productId: selectedProductId, type: templateKind })
      });

      if (res.ok) {
        const data = await res.json();
        const defaultMappingsMap = templateKind === 'contract' ? DEFAULT_CONTRACT_MAPPINGS : DEFAULT_PRODUCT_MAPPINGS;
        const defaultList = data.mappings || defaultMappingsMap[selectedProductId] || defaultMappingsMap.default;
        setMappings(defaultList);
        setMappingMessage("✅ " + data.message);
        fetchProductsSummary(templateKind);
      }
    } catch (e) {
      console.error(e);
      setMappingMessage("❌ Վերականգնումը ձախողվեց:");
    }
  };

  // 5. Upload Custom DOCX Template for Selected Product
  const handleUploadTemplate = async (file: File) => {
    if (!file) return;
    if (!file.name.endsWith(".docx")) {
      setUploadMessage("❌ Խնդրում ենք ընտրել վավեր .docx ֆայլ (Word փաստաթուղթ):");
      return;
    }

    setIsUploadingTemplate(true);
    setUploadMessage("");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Content = (reader.result as string).split(",")[1];
        const res = await fetch("/api/admin/upload-docx-template", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            productId: selectedProductId,
            type: templateKind,
            fileName: file.name,
            fileBase64: base64Content,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setUploadMessage("✅ " + (data.message || "Ձևանմուշը վերբեռնվեց:"));
          fetchProductMappings(selectedProductId, templateKind);
          fetchProductsSummary(templateKind);
        } else {
          setUploadMessage("❌ Չհաջողվեց վերբեռնել ձևանմուշը:");
        }
        setIsUploadingTemplate(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setUploadMessage("❌ Սխալ ֆայլը կարդալիս:");
      setIsUploadingTemplate(false);
    }
  };

  // 6. AI Template Assistant for Selected Product
  const handleAnalyzeWithAi = async (file: File | null, promptOverride?: string) => {
    setIsAnalyzingTemplate(true);
    setAiAnalysisMessage("");
    setProposedMappings([]);

    try {
      let fileBase64 = "";
      let fileName = "";
      if (file) {
        fileName = file.name;
        fileBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.readAsDataURL(file);
        });
      }

      const res = await fetch("/api/ai/analyze-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId: selectedProductId,
          type: templateKind,
          fileBase64,
          fileName,
          fileText: !fileBase64 ? (activeTemplateText || promptOverride || "") : undefined,
          prompt: promptOverride || "",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.proposedMappings && Array.isArray(data.proposedMappings)) {
          setProposedMappings(data.proposedMappings);
          setAiAnalysisMessage(`✨ ԱԲ-ն հաջողությամբ գտավ և քարտեզագրեց ${data.proposedMappings.length} փոփոխական «${currentProductMeta.nameArm}» (${templateKind === 'contract' ? 'Պայմանագիր' : 'Գնառաջարկ'}) համար:`);
        }
      } else {
        const data = await res.json();
        setAiAnalysisMessage("❌ " + (data.error || "ԱԲ վերլուծությունը ձախողվեց:"));
      }
    } catch (err: any) {
      console.error(err);
      setAiAnalysisMessage("❌ Կապի սխալ ԱԲ սերվերի հետ:");
    } finally {
      setIsAnalyzingTemplate(false);
    }
  };
  // 7. Mapping Table Handlers
  const handleMappingChange = (index: number, value: string) => {
    const updated = [...mappings];
    updated[index].systemField = value;
    setMappings(updated);
  };

  const handleMappingPlaceholderChange = (index: number, value: string) => {
    const updated = [...mappings];
    updated[index].placeholder = value.trim();
    setMappings(updated);
  };

  const handleMappingLabelChange = (index: number, value: string) => {
    const updated = [...mappings];
    updated[index].label = value;
    setMappings(updated);
  };

  const handleDeleteMappingRow = (index: number) => {
    const updated = mappings.filter((_, idx) => idx !== index);
    setMappings(updated);
  };

  const handleAddNewMappingRow = () => {
    setMappings([
      ...mappings,
      {
        placeholder: `NewField_${mappings.length + 1}`,
        systemField: "clientName",
        label: "Նոր դաշտ"
      }
    ]);
  };

  const handleApplySingleProposedMapping = (prop: TemplateMappingItem) => {
    const existsIdx = mappings.findIndex(m => m.placeholder.toLowerCase() === prop.placeholder.toLowerCase());
    if (existsIdx >= 0) {
      const updated = [...mappings];
      updated[existsIdx] = prop;
      setMappings(updated);
    } else {
      setMappings([...mappings, prop]);
    }
  };

  const handleApplyAllProposedMappings = () => {
    const updated = [...mappings];
    proposedMappings.forEach(prop => {
      const existsIdx = updated.findIndex(m => m.placeholder.toLowerCase() === prop.placeholder.toLowerCase());
      if (existsIdx >= 0) {
        updated[existsIdx] = prop;
      } else {
        updated.push(prop);
      }
    });
    setMappings(updated);
    setAiAnalysisMessage("✅ Բոլոր առաջարկված դաշտերը ավելացվեցին աղյուսակում: Խնդրում ենք սեղմել «Պահպանել»:");
  };

  // 8. Template Diagnostics
  const templateAnalysis = useMemo(() => {
    if (!activeTemplateText) return { discovered: [], unmapped: [], redundant: [], syntaxErrors: [] };

    const regex = /\{\{([a-zA-Z0-9_\.\-]+)\}\}/g;
    const discovered: string[] = [];
    let match;
    while ((match = regex.exec(activeTemplateText)) !== null) {
      if (!discovered.includes(match[1])) {
        discovered.push(match[1]);
      }
    }

    const syntaxErrors: string[] = [];
    const parts = activeTemplateText.split("{{");
    parts.slice(1).forEach((part, idx) => {
      if (!part.includes("}}")) {
        syntaxErrors.push(`Տող ${idx + 1} - Կիսատ բացված փակագիծ`);
      }
    });

    const mappedPlaceholders = mappings.map(m => m.placeholder);
    const unmapped = discovered.filter(p => !mappedPlaceholders.includes(p));
    const redundant = mappedPlaceholders.filter(p => !discovered.includes(p));

    return { discovered, unmapped, redundant, syntaxErrors };
  }, [activeTemplateText, mappings]);

  // 9. Dry-Run Simulator & Word (.doc) Exporter
  const handleDownloadDryRunDoc = () => {
    setDryRunDownloadMessage("");
    if (!activeTemplateText) {
      setDryRunDownloadMessage("⚠️ Ձևանմուշի տեքստը բեռնված չէ:");
      return;
    }

    let compiled = activeTemplateText;
    mappings.forEach(m => {
      const mockValue = dryRunMockData[m.systemField] !== undefined
        ? dryRunMockData[m.systemField]
        : (dryRunMockData[m.placeholder] !== undefined ? dryRunMockData[m.placeholder] : `[${m.placeholder}]`);
      const strVal = Array.isArray(mockValue) ? "\n- " + mockValue.join("\n- ") : String(mockValue);
      const safePlaceholder = m.placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\{\\{\\s*${safePlaceholder}\\s*\\\}\\}`, "gi");
      compiled = compiled.replace(regex, strVal);
    });

    const formattedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial, sans-serif; line-height: 1.6; padding: 25px;} h1{color: #061A40; border-bottom: 2px solid #075bd5; padding-bottom: 8px;} .meta {color: #666; font-size: 11px; margin-bottom: 20px;} .badge{background:#e2e8f0; padding:3px 8px; border-radius:4px; font-weight:bold; font-size:11px;}</style></head><body><h1>ՍԻԼ ԻՆՇՈՒՐԱՆՍ — ${currentProductMeta.nameArm.toUpperCase()}</h1><div class="meta">Փաստաթղթի Տեսակ՝ <b>Պաշտոնական Գնառաջարկի Թեստային Գեներացիա (Dry-Run)</b> | Ամսաթիվ՝ ${new Date().toLocaleString("hy-AM")} | Պրոդուկտ՝ <span class="badge">${currentProductMeta.nameEn} (${selectedProductId})</span></div><hr/><pre style="white-space: pre-wrap; font-family: inherit; font-size: 13px; line-height: 1.7; color: #1e293b;">${compiled}</pre></body></html>`;

    const blob = new Blob(["\ufeff" + formattedHtml], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SIL_Quotation_${selectedProductId.toUpperCase()}_Test.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDryRunDownloadMessage("✅ Փորձնական Word փաստաթուղթը (.doc) հաջողությամբ գեներացվեց և ներբեռնվեց:");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      
      {/* Top Header & Overview Bar */}
      <div className="sil-card p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-bold text-indigo-200">
              <Sparkles size={13} className="text-amber-400" />
              <span>Multi-Product Word DOCX Engine</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>📝</span> Ձևանմուշների Քարտեզագրման Համակարգ
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Կառավարեք յուրաքանչյուր ապահովագրական պրոդուկտի համար առանձին Word (.docx) ձևանմուշներ (գնառաջարկ և պայմանագիր), դաշտերի կապակցումներ, ԱԲ ավտոմատ ախտորոշում և թեստային գեներացում:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowMatrixModal(true)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 backdrop-blur-md transition cursor-pointer border border-white/15"
            >
              <LayoutGrid size={14} /> Բոլոր Պրոդուկտների Մատրից
            </button>
            <button
              onClick={() => setShowDryRunModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg transition cursor-pointer"
            >
              <Play size={13} fill="currentColor" /> 🧪 Փորձնական Գեներացում (Dry-Run)
            </button>
          </div>
        </div>

        {/* Template Type Mode Switcher: Quotation vs Contract */}
        <div className="bg-black/30 p-1.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-white/10">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setTemplateKind('quotation')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                templateKind === 'quotation'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText size={14} />
              <span>📄 Գնառաջարկի Ձևանմուշներ (Quotations)</span>
            </button>
            <button
              onClick={() => setTemplateKind('contract')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                templateKind === 'contract'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileCheck size={14} />
              <span>📜 Պայմանագրի / Վկայագրի Ձևանմուշներ (Contracts & Policies)</span>
            </button>
          </div>
          <div className="text-[11px] font-mono text-slate-300 px-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Ռեժիմ՝ <b>{templateKind === 'contract' ? 'Ապահովագրության Պայմանագիր' : 'Գնային Առաջարկ'}</b></span>
          </div>
        </div>

        {/* Product Selector Horizontal Slider */}
        <div className="pt-2 border-t border-white/10">
          <div className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Ընտրեք Ապահովագրատեսակը ({SUPPORTED_TEMPLATE_PRODUCTS.length})</span>
            <span className="text-[10px] text-slate-400 font-normal">Ակտիվ՝ {currentProductMeta.nameArm}</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20">
            {SUPPORTED_TEMPLATE_PRODUCTS.map((prod) => {
              const isSelected = prod.id === selectedProductId;
              const summaryItem = productsSummary.find(p => p.id === prod.id);
              const hasCustom = summaryItem?.hasCustomDocx || false;

              return (
                <button
                  key={prod.id}
                  onClick={() => setSelectedProductId(prod.id)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 cursor-pointer border shrink-0 ${
                    isSelected
                      ? "bg-white text-slate-900 shadow-md border-white ring-2 ring-indigo-400"
                      : "bg-white/5 hover:bg-white/15 text-slate-200 border-white/10"
                  }`}
                >
                  <span className="text-base">{prod.icon}</span>
                  <span>{prod.nameArm.split(" ")[0]}</span>
                  {hasCustom ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" title="Առկա է հատուկ Word ձևանմուշ" />
                  ) : (
                    <span className="text-[9px] opacity-60 font-mono">({prod.id})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product Information & Action Header */}
      <div className="sil-card p-5 border-l-4 border-l-[#075bd5] bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl border border-indigo-100 shrink-0">
            {currentProductMeta.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900">{currentProductMeta.nameArm}</h2>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100">
                {currentProductMeta.category}
              </span>
              {isCustomTemplate ? (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200 flex items-center gap-1">
                  <Check size={11} /> Կցված է Հատուկ DOCX
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-lg">
                  Համակարգային Լռելյայն
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentProductMeta.description}</p>
            <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-2">
              <span>Ֆայլ՝ <b>{activeDocxFileName}</b></span>
              <span>•</span>
              <span>Քարտեզագրված դաշտեր՝ <b>{mappings.length}</b></span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleResetToDefaults}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            title="Վերականգնել համակարգային ստանդարտ քարտեզագրումները"
          >
            <RotateCcw size={13} /> Վերականգնել Լռելյայնը
          </button>
          <button
            onClick={() => handleSaveMappings()}
            disabled={isSavingMappings}
            className="px-4 py-1.5 bg-[#061A40] hover:bg-[#075bd5] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer disabled:opacity-50"
          >
            <Save size={13} /> {isSavingMappings ? "Պահպանվում է..." : "Պահպանել"}
          </button>
        </div>
      </div>

      {/* Top Diagnostics & Highlights Bar */}
      {templateAnalysis.discovered.length > 0 && (
        <div className="sil-card p-5 space-y-4 border-l-4 border-l-indigo-600 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                <FileSearch size={16} className="text-indigo-600" />
                <span>Ախտորոշման Վահանակ ({currentProductMeta.nameArm})</span>
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Համակարգը ստուգում է ակտիվ ձևանմուշի placeholder-ների համապատասխանությունը ընտրված պրոդուկտի հետ:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Գտնված Placeholders</div>
              <div className="text-base font-black text-slate-800 mt-1 flex items-center gap-1.5">
                <FileText size={14} className="text-slate-400" />
                {templateAnalysis.discovered.length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Չքարտեզագրված (Unmapped)</div>
              <div className="text-base font-black text-amber-600 mt-1 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-500" />
                {templateAnalysis.unmapped.length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Ավելորդ (Redundant)</div>
              <div className="text-base font-black text-slate-500 mt-1">
                {templateAnalysis.redundant.length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Սխալներ (Syntax Errors)</div>
              <div className={`text-base font-black mt-1 ${templateAnalysis.syntaxErrors.length > 0 ? "text-red-600" : "text-emerald-600"}`}>
                {templateAnalysis.syntaxErrors.length}
              </div>
            </div>
          </div>

          {templateAnalysis.syntaxErrors.length > 0 && (
            <div className="p-3 bg-red-50 text-red-800 rounded-xl text-[10px] font-mono border border-red-100 space-y-1">
              <span className="font-bold">⚠️ Գտնվել են կառուցվածքային խնդիրներ ձևանմուշում.</span>
              <ul className="list-disc pl-4 space-y-0.5">
                {templateAnalysis.syntaxErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {templateAnalysis.unmapped.length > 0 && (
            <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-[10px] border border-amber-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="font-medium">
                💡 <b>Չքարտեզագրված placeholders.</b> {templateAnalysis.unmapped.map(p => `{{${p}}}`).join(", ")}
              </div>
              <button
                onClick={() => {
                  const newMappings = [...mappings];
                  templateAnalysis.unmapped.forEach(p => {
                    if (!newMappings.some(m => m.placeholder === p)) {
                      newMappings.push({ placeholder: p, systemField: "clientName", label: `Ավտո-գտնված ${p}` });
                    }
                  });
                  setMappings(newMappings);
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[9px] rounded-lg transition whitespace-nowrap self-end sm:self-auto cursor-pointer"
              >
                Ավելացնել Բոլորը
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Left Upload/AI, Right Mapping Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Upload & AI Assistant */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 1. Upload DOCX Template for Selected Product */}
          <div className="sil-card p-5 space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                <Upload size={15} className="text-[#075bd5]" />
                <span>Word Ձևանմուշի Փոխարինում ({currentProductMeta.nameArm})</span>
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">
                Վերբեռնեք հատուկ <b>{currentProductMeta.sourceDocxName}</b> ֆայլը այս պրոդուկտի համար:
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50 hover:bg-slate-100/80 transition cursor-pointer relative">
              <input
                type="file"
                accept=".docx"
                disabled={isUploadingTemplate}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadTemplate(file);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
                <FileText size={22} className="text-[#075bd5]" />
                <span className="text-xs font-bold text-slate-700">
                  {isUploadingTemplate ? "Վերբեռնվում է..." : `Ընտրել .docx (${currentProductMeta.nameArm})`}
                </span>
                <span className="text-[9px] text-slate-400">Ֆայլը կպահպանվի սերվերի վրա</span>
              </div>
            </div>

            {uploadMessage && (
              <div className="p-3 text-[10px] font-bold border rounded-xl bg-slate-50 whitespace-pre-line">
                {uploadMessage}
              </div>
            )}
          </div>

          {/* 2. AI Template Assistant for Selected Product */}
          <div className="sil-card p-5 space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                <Sparkles size={15} className="text-indigo-600" />
                <span>ԱԲ Ձևանմուշի Օգնական ({currentProductMeta.nameArm})</span>
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">
                ԱԲ-ն տեղյակ է «{currentProductMeta.nameArm}» պրոդուկտի բոլոր յուրահատուկ դաշտերից և ավտոմատ կառաջարկի ճիշտ քարտեզագրումներ:
              </p>
            </div>

            <div className="space-y-3">
              {/* File upload for AI analysis */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 hover:bg-slate-100/60 transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".docx,.doc,.txt,.json"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleAnalyzeWithAi(file, aiPromptText);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center gap-2 text-slate-600">
                  <Upload size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-bold text-slate-700">Վերբեռնել և վերլուծել նոր փաստաթուղթ</span>
                </div>
              </div>

              <div>
                <textarea
                  value={aiPromptText}
                  onChange={e => setAiPromptText(e.target.value)}
                  placeholder={`Կամ գրեք պահանջներ (օրինակ՝ "Կապիր ${selectedProductId === 'casco' ? 'VehicleModel-ը մեքենայի հետ' : 'հասցեի և գումարի դաշտերը'}...")`}
                  className="sil-input text-[11px] min-h-[60px] w-full"
                />
              </div>

              <button
                onClick={() => handleAnalyzeWithAi(null, aiPromptText)}
                disabled={isAnalyzingTemplate || (!aiPromptText.trim() && !activeTemplateText)}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <Sparkles size={13} /> {isAnalyzingTemplate ? "Վերլուծվում է..." : "Վերլուծել ԱԲ-ով"}
              </button>
            </div>

            {aiAnalysisMessage && (
              <div className="p-3 text-[10px] font-bold border rounded-xl bg-slate-50 whitespace-pre-line">
                {aiAnalysisMessage}
              </div>
            )}

            {/* Proposed Mappings */}
            {proposedMappings.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-indigo-700">ԱԲ-ի Առաջարկած Դաշտերը ({proposedMappings.length})</span>
                  <button
                    onClick={handleApplyAllProposedMappings}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg transition font-mono cursor-pointer"
                  >
                    Կիրառել Բոլորը
                  </button>
                </div>
                <div className="max-h-[160px] overflow-y-auto space-y-1.5 divide-y divide-slate-100 pr-1">
                  {proposedMappings.map((prop, idx) => (
                    <div key={idx} className="pt-1.5 flex items-start justify-between gap-2 text-[10px]">
                      <div className="space-y-0.5">
                        <div className="font-mono font-bold text-slate-800">{`{{${prop.placeholder}}}`}</div>
                        <div className="text-[9px] font-mono text-indigo-600">→ {prop.systemField}</div>
                        <div className="text-[9px] text-slate-500 font-medium">{prop.label}</div>
                      </div>
                      <button
                        onClick={() => handleApplySingleProposedMapping(prop)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-bold text-[9px] rounded-md transition font-mono cursor-pointer"
                      >
                        Կիրառել
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Version History Timeline for Selected Product */}
          <div className="sil-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                <History size={14} className="text-indigo-600" />
                <span>Պատմության Պահուստներ ({currentProductMeta.nameArm})</span>
              </h3>
              <span className="text-[9px] text-slate-400">{versionHistory.length} տարբերակ</span>
            </div>

            {versionHistory.length === 0 ? (
              <div className="py-4 text-center text-[10px] text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-100">
                Պահպանված պատմություն դեռ չկա:
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                {versionHistory.map((v, i) => (
                  <div key={i} className="p-2.5 rounded-xl border bg-white flex items-center justify-between gap-2 text-[10px] shadow-2xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800">{new Date(v.timestamp).toLocaleString()}</span>
                      <p className="text-[9px] text-slate-500 font-mono">{v.updatedBy} • {v.mappings.length} դաշտ</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Վերականգնե՞լ «${currentProductMeta.nameArm}» պրոդուկտի այս տարբերակը:`)) {
                          setMappings(v.mappings);
                          handleSaveMappings(v.mappings);
                        }
                      }}
                      className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold rounded-md transition text-[9px] cursor-pointer"
                    >
                      Հետ շրջել
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Dynamic Mappings Table */}
        <div className="lg:col-span-7 space-y-6">
          <div className="sil-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FileEdit size={17} className="text-[#075bd5]" />
                  <span>Քարտեզագրումների Աղյուսակ — {currentProductMeta.nameArm}</span>
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Սահմանեք, թե ինչպես են Word ձևանմուշի placeholder-ները լրացվում տվյալներով:
                </p>
              </div>
              <button
                onClick={handleAddNewMappingRow}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
              >
                <Plus size={13} /> Ավելացնել Դաշտ
              </button>
            </div>

            {isLoadingMappings ? (
              <div className="text-center py-12 text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw size={15} className="animate-spin text-indigo-600" /> Բեռնվում է...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border rounded-2xl overflow-hidden bg-white max-h-[560px] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 font-bold text-slate-700 border-b sticky top-0 z-10 text-[11px]">
                      <tr>
                        <th className="p-3">Placeholder (DOCX)</th>
                        <th className="p-3">Համակարգային Դաշտ</th>
                        <th className="p-3">Պիտակ / Նկարագրություն</th>
                        <th className="p-3 text-center">Գործողություն</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-800 text-[11px]">
                      {mappings.map((map, idx) => {
                        const isCustomField = !flatSystemFields.some(sf => sf.value === map.systemField);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition">
                            {/* Placeholder input */}
                            <td className="p-2 font-mono font-bold text-indigo-700">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400">{"{{"}</span>
                                <input
                                  type="text"
                                  value={map.placeholder}
                                  onChange={e => handleMappingPlaceholderChange(idx, e.target.value)}
                                  className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 py-0.5 px-1 font-mono font-bold w-full focus:outline-none"
                                />
                                <span className="text-slate-400">{"}}"}</span>
                              </div>
                            </td>

                            {/* System Field selector */}
                            <td className="p-2">
                              <div className="space-y-1">
                                <select
                                  value={isCustomField ? "custom" : map.systemField}
                                  onChange={e => {
                                    const val = e.target.value;
                                    if (val === "custom") {
                                      handleMappingChange(idx, "custom_field_path");
                                    } else {
                                      handleMappingChange(idx, val);
                                    }
                                  }}
                                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] w-full focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans cursor-pointer"
                                >
                                  {availableSystemFields.map((grp, gIdx) => (
                                    <optgroup key={gIdx} label={grp.category}>
                                      {grp.fields.map(f => (
                                        <option key={f.value} value={f.value}>{f.label}</option>
                                      ))}
                                    </optgroup>
                                  ))}
                                  <option value="custom">✍️ Այլ (Custom Path)...</option>
                                </select>

                                {isCustomField && (
                                  <input
                                    type="text"
                                    value={map.systemField}
                                    onChange={e => handleMappingChange(idx, e.target.value)}
                                    placeholder="Օրինակ՝ clientName"
                                    className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[9px] font-mono w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                )}
                              </div>
                            </td>

                            {/* Label */}
                            <td className="p-2">
                              <input
                                type="text"
                                value={map.label}
                                onChange={e => handleMappingLabelChange(idx, e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>

                            {/* Delete */}
                            <td className="p-2 text-center">
                              <button
                                onClick={() => handleDeleteMappingRow(idx)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                                title="Ջնջել դաշտը"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {mappingMessage && (
                  <div className="p-3 text-xs font-bold border rounded-xl bg-slate-50 whitespace-pre-line">
                    {mappingMessage}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleSaveMappings()}
                    disabled={isSavingMappings}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                  >
                    <Save size={14} /> {isSavingMappings ? "Պահպանվում է..." : `Պահպանել «${currentProductMeta.nameArm}» Քարտեզագրումները`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Visual Highlight Preview */}
      {activeTemplateText && (
        <div className="sil-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                <span>Տեսողական Քարտեզագրման Նախադիտում — {currentProductMeta.nameArm}</span>
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Ակտիվ ձևանմուշի տեքստը՝ տեսողական ընդգծմամբ։ <span className="text-emerald-600 font-bold">Կանաչով</span> նշված են ճիշտ քարտեզագրված փոփոխականները, իսկ <span className="text-red-500 font-bold">կարմիրով</span>՝ չքարտեզագրվածները:
              </p>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Տեքստի երկարություն՝ {activeTemplateText.length} նիշ</span>
          </div>

          <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-[11px] font-mono leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap border shadow-inner">
            {(() => {
              const text = activeTemplateText;
              const regex = /\{\{([a-zA-Z0-9_\.\-]+)\}\}/g;
              const parts: React.ReactNode[] = [];
              let lastIndex = 0;
              let match;
              let key = 0;

              while ((match = regex.exec(text)) !== null) {
                const placeholder = match[1];
                const isMapped = mappings.some(m => m.placeholder.toLowerCase() === placeholder.toLowerCase());

                if (match.index > lastIndex) {
                  parts.push(<span key={key++}>{text.substring(lastIndex, match.index)}</span>);
                }

                parts.push(
                  <span
                    key={key++}
                    className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                      isMapped
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-red-950 text-red-400 border border-red-800 animate-pulse"
                    }`}
                    title={isMapped ? `Կապված է` : `Չքարտեզագրված է`}
                  >
                    {"{{"}{placeholder}{"}}"}
                  </span>
                );
                lastIndex = regex.lastIndex;
              }

              if (lastIndex < text.length) {
                parts.push(<span key={key++}>{text.substring(lastIndex)}</span>);
              }

              return parts.length > 0 ? parts : <span>{activeTemplateText}</span>;
            })()}
          </div>
        </div>
      )}

      {/* 🧪 DRY-RUN COMPILER MODAL */}
      {showDryRunModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[88vh] overflow-y-auto space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Play size={18} className="text-emerald-600" fill="currentColor" />
                  <span>Փորձնական Գեներացման Սիմուլյատոր (Dry-Run Test Simulator)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ակտիվ պրոդուկտ՝ <b className="text-slate-800">{currentProductMeta.nameArm}</b> ({selectedProductId})
                </p>
              </div>
              <button
                onClick={() => setShowDryRunModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Mock Data Inputs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Թեստային Տվյալներ ({currentProductMeta.nameArm})</span>
                  <button
                    onClick={() => {
                      const initialMock = PRODUCT_DRY_RUN_MOCKS[selectedProductId] || PRODUCT_DRY_RUN_MOCKS.default || {};
                      setDryRunMockData({ ...initialMock });
                    }}
                    className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    Վերալիցքավորել Mock Տվյալները
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {mappings.map((m, idx) => {
                    const currentVal = dryRunMockData[m.systemField] !== undefined
                      ? dryRunMockData[m.systemField]
                      : (dryRunMockData[m.placeholder] || "");

                    return (
                      <div key={idx} className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 flex items-center justify-between">
                          <span>{m.label} ({`{{${m.placeholder}}}`})</span>
                          <span className="text-[9px] font-mono text-slate-400">{m.systemField}</span>
                        </label>
                        <input
                          type="text"
                          value={Array.isArray(currentVal) ? currentVal.join(", ") : currentVal}
                          onChange={e => {
                            setDryRunMockData({
                              ...dryRunMockData,
                              [m.systemField]: e.target.value,
                              [m.placeholder]: e.target.value
                            });
                          }}
                          className="sil-input text-xs py-1.5 w-full font-sans"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Live Replaced Text Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Գեներացված Տեքստի Նախադիտում</span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Իրական ժամանակում
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-[11px] font-mono leading-relaxed max-h-[380px] overflow-y-auto whitespace-pre-wrap border shadow-inner">
                  {(() => {
                    let compiled = activeTemplateText;
                    mappings.forEach(m => {
                      const mockValue = dryRunMockData[m.systemField] !== undefined
                        ? dryRunMockData[m.systemField]
                        : (dryRunMockData[m.placeholder] !== undefined ? dryRunMockData[m.placeholder] : `[${m.placeholder}]`);
                      const strVal = Array.isArray(mockValue) ? "\n- " + mockValue.join("\n- ") : String(mockValue);
                      const safePlaceholder = m.placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                      const regex = new RegExp(`\\{\\{\\s*${safePlaceholder}\\s*\\\}\\}`, "gi");
                      compiled = compiled.replace(regex, strVal);
                    });
                    return compiled || "Տեքստը բացակայում է";
                  })()}
                </div>
              </div>
            </div>

            {dryRunDownloadMessage && (
              <div className="p-3 text-xs font-bold border rounded-xl bg-slate-50 whitespace-pre-line text-emerald-800 border-emerald-200">
                {dryRunDownloadMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                onClick={() => setShowDryRunModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Փակել
              </button>
              <button
                onClick={handleDownloadDryRunDoc}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <Download size={14} /> Ներբեռնել Թեստային Word (.doc) Ֆայլը
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 GLOBAL ALL PRODUCTS MATRIX MODAL */}
      {showMatrixModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <LayoutGrid size={18} className="text-indigo-600" />
                  <span>Ապահովագրական Պրոդուկտների Ձևանմուշների Մատրից</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ընդհանուր տեսարան բոլոր 12+ պրոդուկտների ձևանմուշների և քարտեզագրման կարգավիճակի մասին
                </p>
              </div>
              <button
                onClick={() => setShowMatrixModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="border rounded-2xl overflow-hidden bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 font-bold text-slate-700 border-b text-[11px]">
                  <tr>
                    <th className="p-3">Պրոդուկտ</th>
                    <th className="p-3">Կատեգորիա</th>
                    <th className="p-3">Word Ֆայլ</th>
                    <th className="p-3 text-center">Կարգավիճակ</th>
                    <th className="p-3 text-center">Դաշտեր</th>
                    <th className="p-3 text-center">Գործողություն</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-800 text-[11px]">
                  {SUPPORTED_TEMPLATE_PRODUCTS.map((prod) => {
                    const summaryItem = productsSummary.find(p => p.id === prod.id);
                    const hasCustom = summaryItem?.hasCustomDocx || false;
                    const mappingsCount = summaryItem?.mappingsCount || (DEFAULT_PRODUCT_MAPPINGS[prod.id] || DEFAULT_PRODUCT_MAPPINGS.default).length;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                          <span className="text-lg">{prod.icon}</span>
                          <div>
                            <div>{prod.nameArm}</div>
                            <div className="text-[9px] text-slate-400 font-mono">{prod.id}</div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600">{prod.category}</td>
                        <td className="p-3 font-mono text-[10px] text-slate-700">
                          {summaryItem?.sourceDocxName || prod.sourceDocxName}
                        </td>
                        <td className="p-3 text-center">
                          {hasCustom ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-bold border border-emerald-200 inline-flex items-center gap-1">
                              <Check size={10} /> Հատուկ DOCX
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-medium inline-block">
                              Լռելյայն
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-indigo-700">
                          {mappingsCount} դաշտ
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedProductId(prod.id);
                              setShowMatrixModal(false);
                            }}
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold rounded-lg transition text-[10px] cursor-pointer"
                          >
                            Խմբագրել
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end pt-3 border-t">
              <button
                onClick={() => setShowMatrixModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Փակել
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
