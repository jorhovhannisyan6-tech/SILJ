import React, { useState } from "react";
import { Sparkles, Send, Bot, User, HelpCircle, FileText, CheckCircle2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { product: string; document: string }[];
  proposalDraft?: any;
}

interface AiAdvisorWidgetProps {
  onLoadProposal?: (proposal: any) => void;
}

export function AiAdvisorWidget({ onLoadProposal }: AiAdvisorWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Բարև ձեզ։ Ես SIL Insurance-ի AI խորհրդատուն եմ։ Կարող եք տալ ցանկացած հարց մեր ապահովագրական պրոդուկտների, ծածկույթների, բացառությունների կամ վնասների կարգավորման վերաբերյալ։",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "Ի՞նչ փաստաթղթեր են պետք ԿԱՍԿՈ հատուցման համար",
    "Արդյո՞ք ջրհեղեղը ներառված է բնակարանի ապահովագրության մեջ",
    "Ինչպե՞ս է հաշվարկվում ֆրանշիզան բեռների փոխադրման ժամանակ",
    "Որո՞նք են մասնագիտական պատասխանատվության բացառությունները",
  ];

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim()) return;

    const userMsg: Message = { role: "user", content: q };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("sil-auth-token") || localStorage.getItem("sil_token") || "";
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          context: "SIL Insurance Portal AI Advisor session with draft quoting ability",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawContent = data.reply || data.response || "Պատասխանը ստացված է։";
        
        let cleanContent = rawContent;
        let proposalDraft: any = null;

        // Extract JSON code block
        const jsonMatch = rawContent.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.type === "proposal_draft" && parsed.proposal) {
              proposalDraft = parsed.proposal;
              cleanContent = rawContent.replace(/```json\s*\{[\s\S]*?\}\s*```/g, "").trim();
            }
          } catch (err) {
            console.warn("Failed to parse JSON proposal block:", err);
          }
        } else {
          const rawJsonMatch = rawContent.match(/(\{[\s\S]*?"type"\s*:\s*"proposal_draft"[\s\S]*?\})/);
          if (rawJsonMatch) {
            try {
              const parsed = JSON.parse(rawJsonMatch[1]);
              if (parsed.type === "proposal_draft" && parsed.proposal) {
                proposalDraft = parsed.proposal;
                cleanContent = rawContent.replace(/\{[\s\S]*?"type"\s*:\s*"proposal_draft"[\s\S]*?\}/g, "").trim();
              }
            } catch (err) {
              console.warn("Failed to parse raw JSON proposal block:", err);
            }
          }
        }

        setMessages(prev => [...prev, {
          role: "assistant",
          content: cleanContent,
          sources: data.sources,
          proposalDraft
        }]);
      } else {
        const errJson = await res.json().catch(() => ({}));
        const replyText = errJson.reply || errJson.response || "Ցավոք, այս պահին հնարավոր չեղավ կապվել AI սերվերի հետ։ Խնդրում ենք կրկին փորձել ավելի ուշ։";
        setMessages(prev => [...prev, { role: "assistant", content: replyText }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Կապի սխալ։ Ստուգեք ցանցային միացումը։" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[650px] max-w-4xl mx-auto my-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Sparkles size={22}/>
          </div>
          <div>
            <h3 className="text-lg font-black tracking-wide">SIL Insurance AI Խորհրդատու</h3>
            <p className="text-xs text-slate-400">Հիմնված ChatGPT & SIL Insurance պաշտոնական փաստաթղթերի վրա</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
          <CheckCircle2 size={14}/> Active Engine: ChatGPT Free / Gemini
        </div>
      </div>

      {/* Quick Suggestions */}
      <div className="bg-slate-50 border-b border-slate-200 p-3 overflow-x-auto flex gap-2 shrink-0">
        <span className="text-xs font-bold text-slate-500 self-center shrink-0 ml-1">Արագ հարցեր.</span>
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="text-xs bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors shadow-2xs"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
              m.role === "user" ? "bg-slate-900 text-white" : "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
            }`}>
              {m.role === "user" ? <User size={18}/> : <Bot size={18}/>}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
              m.role === "user" ? "bg-slate-900 text-white rounded-tr-xs" : "bg-white text-slate-800 border border-slate-200 shadow-sm rounded-tl-xs"
            }`}>
              <div className="whitespace-pre-wrap">{m.content}</div>

              {m.proposalDraft && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs">
                    <Sparkles size={14} className="text-emerald-600 animate-pulse" />
                    ԱԲ-Ի ԿՈՂՄԻՑ ԿԱԶՄՎԱԾ ԳՆԱՌԱՋԱՐԿԻ ՆԱԽԱԳԻԾ
                  </div>
                  <div className="text-xs space-y-1.5 text-slate-700">
                    <div><strong>Հաճախորդ՝</strong> {m.proposalDraft.clientName || "—"}</div>
                    <div><strong>Ապահովագրատեսակ՝</strong> {m.proposalDraft.productNameArm || "—"}</div>
                    <div><strong>Ապահովագրական Գումար՝</strong> {m.proposalDraft.totalSumInsured?.toLocaleString() || "0"} {m.proposalDraft.currency || "AMD"}</div>
                    <div><strong>Տարեկան ապահովագրավճար՝</strong> <span className="font-bold text-emerald-700">{m.proposalDraft.annualPremium?.toLocaleString() || "0"} {m.proposalDraft.currency || "AMD"}</span></div>
                    {m.proposalDraft.franchiseDescription && <div><strong>Ֆրանշիզա՝</strong> {m.proposalDraft.franchiseDescription}</div>}
                  </div>
                  {onLoadProposal && (
                    <button
                      onClick={() => {
                        const finalProposal = {
                          ...m.proposalDraft,
                          id: m.proposalDraft.id && !m.proposalDraft.id.includes("[id]") ? m.proposalDraft.id : `ai-draft-${Date.now()}`,
                          quotationNumber: m.proposalDraft.quotationNumber && !m.proposalDraft.quotationNumber.includes("[number]") ? m.proposalDraft.quotationNumber : `AI-QD-${Math.floor(100000 + Math.random() * 900000)}`,
                          totalSumInsured: Number(m.proposalDraft.totalSumInsured) || 5000000,
                          annualPremium: Number(m.proposalDraft.annualPremium) || 125000,
                          finalTariff: Number(m.proposalDraft.finalTariff) || 2.5,
                          baseTariff: Number(m.proposalDraft.baseTariff) || 2.5,
                          status: "ready",
                        };
                        onLoadProposal(finalProposal);
                      }}
                      className="w-full mt-2 bg-[#075bd5] hover:bg-blue-600 text-white text-xs font-black py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <FileText size={14} />
                      📥 Բեռնել Պորտալ և Խմբագրել Ձեռքով
                    </button>
                  )}
                </div>
              )}

              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Հիմնված է՝</span>
                  {m.sources.map((src, sIdx) => (
                    <span key={sIdx} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-100">
                      <FileText size={11}/> {src.product} ({src.document})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold animate-pulse">
              <Bot size={18}/>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]"></span>
              <span>AI խորհրդատուն ուսումնասիրում է պայմանները...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-white border-t border-slate-200 flex gap-3 items-center">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Գրեք Ձեր հարցը ապահովագրական պայմանների կամ հատուցումների վերաբերյալ..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shrink-0 shadow-md"
        >
          <span>Ուղարկել</span>
          <Send size={16}/>
        </button>
      </div>
    </div>
  );
}
