import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../../types";
import { SIL_PRODUCTS_CATALOG } from "../../data/productsCatalog";
import { getQuotationRules } from "../../utils/rulesStore";
import {
  Bot,
  Send,
  User,
  HelpCircle,
  RefreshCw,
} from "lucide-react";

interface AgentChatProps {
  currentFormSummary?: string;
  onApplyPreset?: (presetName: string) => void;
}

export function AgentChat({
  currentFormSummary,
  onApplyPreset,
}: AgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-1",
      role: "assistant",
      content: `Ողջույն։ Ես «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ-ի AI ապահովագրական խորհրդատուն եմ։

Կօգնեմ՝

1️⃣ ընտրել Ձեր իրավիճակին համապատասխան ապահովագրության տեսակը,
2️⃣ հասկանալ հնարավոր ծածկույթներն ու ապահովագրական ռիսկերը,
3️⃣ հավաքել անհրաժեշտ տվյալները ռիսկի նախնական գնահատման համար,
4️⃣ կատարել նախնական հաշվարկ՝ ըստ տրամադրված տվյալների։

Վերջնական ապահովագրական պայմանները, ապահովագրավճարը, սահմանաչափերը, ֆրանշիզաները և բացառությունները որոշվում են SIL Insurance-ի գործող պայմաններով և ապահովագրողի կողմից իրականացվող ռիսկի գնահատմամբ։

Ի՞նչ գույք, բիզնես կամ ռիսկ եք ցանկանում ապահովագրել։`,
      timestamp: new Date().toLocaleTimeString("hy-AM", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    {
      label: "Գույքի ապահովագրություն",
      query:
        "Ունեմ ընկերություն ՀՀ-ում՝ գրասենյակով, արտադրամասով, հաստոցներով և պահեստով։ Գործունեությունս տպագրությունն է։ Ի՞նչ գույք և ռիսկեր կարող եմ ապահովագրել։",
    },
    {
      label: "Դժբախտ պատահար",
      query:
        "Ունեմ աշխատակիցներ արտադրամասում։ Բացատրիր դժբախտ պատահարներից խմբային ապահովագրությունը և ինչ ռիսկեր կարող են ներառվել։",
    },
    {
      label: "Պատասխանատվություն",
      query:
        "Տպագրական արտադրության ընկերության համար ի՞նչ երրորդ անձանց հանդեպ պատասխանատվության ռիսկեր կարող են ապահովագրվել։",
    },
    {
      label: "Գույք + պատասխանատվություն",
      query:
        "Ինձ պետք է տպագրական արտադրամասի համար գույքի և պատասխանատվության ապահովագրության համակցված տարբերակ։ Ի՞նչ տվյալներ են անհրաժեշտ։",
    },
    {
      label: "Հաշվարկի տվյալներ",
      query:
        "Ասա՝ ինչ տվյալներ պետք է տրամադրեմ, որպեսզի կարողանամ ստանալ գույքի ապահովագրության նախնական հաշվարկ։",
    },
  ];

  const formatTime = () =>
    new Date().toLocaleTimeString("hy-AM", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputValue;

    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend.trim(),
      timestamp: formatTime(),
    };

    const newMessages = [...messages, userMessage];

    setMessages(newMessages);

    if (!customText) {
      setInputValue("");
    }

    setLoading(true);

    try {
      /**
       * Only send the information that the AI actually needs.
       *
       * tariffRange is intentionally passed as a range and not as a
       * calculated final premium.
       */
      const currentRules = getQuotationRules();
      const products = SIL_PRODUCTS_CATALOG.map((product) => ({
        id: product.id,
        code: product.code,
        nameArm: product.nameArm,
        nameEng: product.nameEng,
        category: product.category,
        categoryArm: product.categoryArm,
        badge: product.badge,
        shortDesc: product.shortDesc,
        fullDesc: product.fullDesc,
        keyBenefits: product.keyBenefits,
        coveredRisks: product.coveredRisks,
        tariffRange: product.tariffRange,
        typicalFranchise: product.typicalFranchise,
        requiredDocuments: product.requiredDocuments,
        officialUrl: product.officialUrl,
      }));

      const underwritingRules = Object.values(currentRules).map((r) => ({ product: r.product, nameArm: r.nameArm, minInsuredAmount: r.minInsuredAmount, maxInsuredAmount: r.maxInsuredAmount, minTariff: r.minTariff, maxTariff: r.maxTariff, defaultTariff: r.defaultTariff, defaultFranchise: r.defaultFranchise, requiredRisks: r.requiredRisks, availableRisks: r.availableRisks, excludedActivities: r.excludedActivities, requiredDocuments: r.requiredDocuments }));

      const token = localStorage.getItem("sil-auth-token") || localStorage.getItem("sil_token") || "";
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),

          context: currentFormSummary || "",

          products,
          underwritingRules,

          instructions: {
            language: "hy-AM",

            role: "SIL Insurance AI Insurance Advisor",

            rules: [
              "Օգտագործիր միայն տրամադրված SIL Insurance կատալոգի տվյալները։",

              "Մի հորինիր ապահովագրական ծածկույթներ, սակագներ, "
                + "ֆրանշիզաներ, զեղչեր կամ սահմանաչափեր։",

              "tariffRange-ը ներկայացրու միայն որպես նախնական/հրապարակված "
                + "սակագնային միջակայք, ոչ որպես վերջնական ապահովագրավճար։",

              "AI-ի հաշվարկը երբեք մի ներկայացրու որպես SIL Insurance-ի "
                + "պաշտոնական գնառաջարկ։",

              "Վերջնական ապահովագրական պայմանները որոշվում են գործող "
                + "ապահովագրական պայմաններով և ռիսկի գնահատմամբ։",

              "Եթե տվյալը կատալոգում չկա, հստակ ասա, որ տվյալը պետք է "
                + "ճշտվի SIL Insurance-ի կողմից։",

              "Եթե հաճախորդը նկարագրում է բիզնես, նախ որոշիր համապատասխան "
                + "ապահովագրական արտադրանքները, հետո հարցրու բացակայող տվյալները։",

              "Եթե հաճախորդի ռիսկը վերաբերում է գույքին, կարող ես առաջարկել "
                + "property արտադրանքը։",

              "Եթե կան աշխատակիցներ և արտադրական ռիսկեր, կարող ես դիտարկել "
                + "accident արտադրանքը։",

              "Եթե հնարավոր է երրորդ անձանց կամ այլ անձանց գույքին վնասի ռիսկ, "
                + "կարող ես դիտարկել liability արտադրանքը։",

              "Պատասխանները տուր պարզ, պրոֆեսիոնալ և հասկանալի հայերենով։",

              "Մի պնդիր, որ որևէ ծածկույթ հաստատված է, եթե դա հստակ նշված չէ "
                + "տրամադրված կատալոգում։",
            ],
          },
        }),
      });

      const data = await response.json().catch(() => ({}));

      const reply =
        data.reply ||
        data.response ||
        data.message ||
        "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» AI Խորհրդատուն պատրաստ է պատասխանել Ձեր հարցերին։ Խնդրում ենք նշել, թե որ ապահովագրական արտադրանքի վերաբերյալ ունեք հարց։";

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        timestamp: formatTime(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AgentChat error:", error);

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Կներեք, կապի կամ սերվերի հետ կապված խնդիր առաջացավ։ " +
          "Խնդրում եմ կրկին փորձել մի փոքր անց։",
        timestamp: formatTime(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-lg flex flex-col h-[760px] max-h-[82vh] overflow-hidden">

        {/* ==================== HEADER ==================== */}

        <div className="bg-gradient-to-r from-[#00235B] via-[#002D72] to-[#003399] text-white p-4 border-b border-blue-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-[#0066FF] flex items-center justify-center text-white shadow-md border border-blue-400/30">
              <Bot className="w-6 h-6 text-cyan-200" />
            </div>

            <div>
              <div className="flex items-center gap-2">

                <h3 className="font-bold text-sm sm:text-base text-white">
                  «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» AI Խորհրդատու (ChatGPT & Gemini)
                </h3>

                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ChatGPT Free / Gemini Օնլայն
                </span>

              </div>

              <p className="text-xs text-blue-200">
                Ապահովագրական արտադրանքների նախնական խորհրդատվություն և ռիսկերի գնահատում ChatGPT / SIL Knowledge Base հիմքով
              </p>
            </div>
          </div>

          <div className="text-xs text-blue-200/70 hidden sm:block font-mono">
            SIL-AI
          </div>
        </div>

        {/* ==================== QUICK PROMPTS ==================== */}

        <div className="bg-slate-50 border-b border-slate-200 p-2.5 overflow-x-auto no-scrollbar flex items-center gap-2">

          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1 flex-shrink-0">
            <HelpCircle className="w-3.5 h-3.5 text-[#003399]" />
            Արագ հարցեր՝
          </span>

          {quickPrompts.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(item.query)}
              disabled={loading}
              className="text-[11px] bg-white hover:bg-blue-50 hover:text-[#003399] text-slate-700 font-medium px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs whitespace-nowrap transition cursor-pointer flex-shrink-0 disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}

        </div>

        {/* ==================== MESSAGES ==================== */}

        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/40">

          {messages.map((msg) => {

            const isAssistant = msg.role === "assistant";

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  isAssistant ? "justify-start" : "justify-end"
                }`}
              >

                {isAssistant && (
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#003399] flex items-center justify-center flex-shrink-0 shadow-xs mt-1 border border-blue-200">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isAssistant
                      ? "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                      : "bg-gradient-to-r from-[#003399] to-[#0066FF] text-white rounded-tr-xs shadow-md shadow-blue-900/10"
                  }`}
                >

                  <div className="whitespace-pre-line">
                    {msg.content}
                  </div>

                  <div
                    className={`text-[10px] mt-2 text-right ${
                      isAssistant
                        ? "text-slate-400"
                        : "text-blue-100"
                    }`}
                  >
                    {msg.timestamp}
                  </div>

                </div>

                {!isAssistant && (
                  <div className="w-8 h-8 rounded-lg bg-[#00235B] text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-1 border border-blue-900">
                    <User className="w-4 h-4" />
                  </div>
                )}

              </div>
            );
          })}

          {/* ==================== LOADING ==================== */}

          {loading && (
            <div className="flex gap-3 justify-start">

              <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#003399] flex items-center justify-center flex-shrink-0 shadow-xs border border-blue-200">
                <Bot className="w-4.5 h-4.5 animate-pulse" />
              </div>

              <div className="bg-white border border-slate-200 text-slate-600 rounded-2xl rounded-tl-xs p-3.5 text-xs flex items-center gap-2 shadow-xs">

                <RefreshCw className="w-4 h-4 animate-spin text-[#003399]" />

                <span>
                  AI-ը պատրաստում է պատասխանը...
                </span>

              </div>

            </div>
          )}

          <div ref={messagesEndRef} />

        </div>

        {/* ==================== INPUT ==================== */}

        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Գրեք Ձեր հարցը կամ նկարագրեք գույքի / բիզնեսի պայմանները..."
              disabled={loading}
              className="flex-1 text-xs sm:text-sm border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#003399] focus:border-[#003399] outline-hidden bg-white"
            />

            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="bg-gradient-to-r from-[#003399] to-[#0066FF] hover:from-[#002D72] hover:to-[#0052CC] text-white p-2.5 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-900/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >

              <Send className="w-4 h-4 text-white" />

              <span className="hidden sm:inline">
                Ուղարկել
              </span>

            </button>

          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">

            <span>
              AI խորհրդատվությունը նախնական է և չի փոխարինում SIL Insurance-ի վերջնական ռիսկի գնահատմանը։
            </span>

            <span className="hidden sm:inline">
              SIL Insurance AI
            </span>

          </div>

        </div>

      </div>
    </div>
  );
}