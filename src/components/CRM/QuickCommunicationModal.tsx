import React, { useState } from "react";
import {
  MessageSquare,
  Phone,
  Mail,
  Copy,
  Check,
  Send,
  Sparkles,
  ExternalLink,
  Shield,
  CreditCard,
  AlertCircle
} from "lucide-react";

interface QuickCommunicationModalProps {
  clientName: string;
  phone: string;
  email?: string;
  policyNumber?: string;
  productType?: string;
  premium?: number;
  expiryDate?: string;
  onClose: () => void;
}

type TemplateType = "renewal_discount" | "quote_ready" | "payment_reminder" | "claim_update" | "vip_greeting";

export const QuickCommunicationModal: React.FC<QuickCommunicationModalProps> = ({
  clientName,
  phone,
  email,
  policyNumber = "SIL-2026-POL",
  productType = "ԿԱՍԿՈ",
  premium = 180000,
  expiryDate = "2026-09-20",
  onClose,
}) => {
  const [template, setTemplate] = useState<TemplateType>("renewal_discount");
  const [copied, setCopied] = useState(false);
  const [customNotes, setCustomNotes] = useState("");

  const formattedPhone = phone.replace(/[^0-9]/g, "");
  const internationalPhone = formattedPhone.startsWith("374")
    ? formattedPhone
    : formattedPhone.startsWith("0")
    ? `374${formattedPhone.slice(1)}`
    : `374${formattedPhone}`;

  const getMessageText = () => {
    switch (template) {
      case "renewal_discount":
        return `Հարգելի ${clientName}, «ՍԻԼ ԻՆՇՈՒՐԱՆՍ»-ը տեղեկացնում է, որ Ձեր № ${policyNumber} (${productType}) պայմանագրի ժամկետը ավարտվում է ${expiryDate}-ին։\n\nՈրպես մեր հավատարիմ հաճախորդ՝ Ձեզ համար արդեն հաշվարկվել է նոր տարվա երկարաձգումը հատուկ 10% Loyalty զեղչով՝ ընդամենը ${premium.toLocaleString()} ՀՀ դրամ։\n\nՊայմանագիրը հաստատելու կամ հարցերի դեպքում կարող եք պատասխանել այս հաղորդագրությանը։\n«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ՓԲԸ, Հեռ․՝ +374 60 54 00 00`;

      case "quote_ready":
        return `Բարև Ձեզ, հարգելի ${clientName}։ Ձեր հարցման հիման վրա «ՍԻԼ ԻՆՇՈՒՐԱՆՍ»-ի մասնագետները պատրաստել են ${productType} ապահովագրության շահավետ գնառաջարկը։\n\nՏարեկան ապահովագրավճար՝ ${premium.toLocaleString()} ՀՀ դրամ (ներառյալ 0% ֆրանշիզա ՃՏՊ-ների համար և 24/7 աջակցություն)։\n\nՄանրամասների և պայմանագիրը կնքելու համար պատրաստ ենք աջակցել։`;

      case "payment_reminder":
        return `Հարգելի ${clientName}, հիշեցնում ենք, որ № ${policyNumber} պայմանագրի հերթական վճարման ժամկետն է ${expiryDate}։ Գումարը՝ ${premium.toLocaleString()} ՀՀ դրամ։\n\nՎճարումը կարող եք կատարել առցանց՝ Telcell, Idram, EasyPay հավելվածներով կամ բանկային փոխանցմամբ։\n«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ՓԲԸ`;

      case "claim_update":
        return `Հարգելի ${clientName}, տեղեկացնում ենք, որ Ձեր № ${policyNumber} գործով ապահովագրական հատուցման գործընթացը հաստատված է։ Գումարը փոխանցվելու է նշված բանկային հաշվեհամարին 1 աշխատանքային օրվա ընթացքում։\nՇնորհակալություն «ՍԻԼ ԻՆՇՈՒՐԱՆՍ»-ին վստահելու համար։`;

      case "vip_greeting":
        return `Հարգելի ${clientName}, «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ընկերության ողջ թիմի անունից շնորհակալություն ենք հայտնում մեր հուսալի գործընկերը լինելու համար։\nՁեր անձնական ապահովագրական խորհրդատուն մշտապես հասանելի է ցանկացած հարցով։ Մաղթում ենք անվտանգ և հաջող ընթացք։`;
    }
  };

  const finalMessage = customNotes ? `${getMessageText()}\n\nՀ․Գ․ ${customNotes}` : getMessageText();

  const handleCopy = () => {
    navigator.clipboard.writeText(finalMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openWhatsApp = () => {
    const url = `https://wa.me/${internationalPhone}?text=${encodeURIComponent(finalMessage)}`;
    window.open(url, "_blank");
  };

  const openViber = () => {
    const url = `viber://chat?number=%2B${internationalPhone}`;
    window.open(url, "_blank");
  };

  const openMail = () => {
    if (!email) return;
    const url = `mailto:${email}?subject=${encodeURIComponent(`«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» — ${productType} Տեղեկատվություն`)}&body=${encodeURIComponent(finalMessage)}`;
    window.location.href = url;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 text-white max-w-2xl w-full space-y-5 shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Արագ Հաղորդակցություն (Omnichannel Hub)</h3>
              <p className="text-xs text-slate-400">
                Հաճախորդ՝ <strong className="text-slate-200">{clientName}</strong> ({phone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Template Selector Pills */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">Ընտրեք Ծանուցման Ձևանմուշը (Template)՝</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={() => setTemplate("renewal_discount")}
              className={`p-2.5 rounded-xl text-left border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                template === "renewal_discount"
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <Sparkles size={14} className="text-amber-400" />
              <span>Երկարաձգում + Զեղչ</span>
            </button>

            <button
              onClick={() => setTemplate("quote_ready")}
              className={`p-2.5 rounded-xl text-left border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                template === "quote_ready"
                  ? "bg-blue-600 text-white border-blue-500 shadow-md"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <Shield size={14} className="text-cyan-400" />
              <span>Գնառաջարկը Պատրաստ է</span>
            </button>

            <button
              onClick={() => setTemplate("payment_reminder")}
              className={`p-2.5 rounded-xl text-left border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                template === "payment_reminder"
                  ? "bg-amber-600 text-white border-amber-500 shadow-md"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <CreditCard size={14} className="text-amber-300" />
              <span>Վճարման Հիշեցում</span>
            </button>

            <button
              onClick={() => setTemplate("claim_update")}
              className={`p-2.5 rounded-xl text-left border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                template === "claim_update"
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <AlertCircle size={14} className="text-indigo-300" />
              <span>Հատուցման Կարգավիճակ</span>
            </button>

            <button
              onClick={() => setTemplate("vip_greeting")}
              className={`p-2.5 rounded-xl text-left border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                template === "vip_greeting"
                  ? "bg-purple-600 text-white border-purple-500 shadow-md"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <Sparkles size={14} className="text-purple-300" />
              <span>VIP Ողջույն / Շնորհակալություն</span>
            </button>
          </div>
        </div>

        {/* Message Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300">Հաղորդագրության տեքստը՝</label>
            <span className="text-[11px] text-slate-400">{finalMessage.length} նիշ</span>
          </div>
          <textarea
            rows={6}
            value={finalMessage}
            readOnly
            className="w-full bg-slate-800/90 border border-slate-700 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans focus:outline-none"
          />
        </div>

        {/* Extra Note input */}
        <div>
          <input
            type="text"
            placeholder="Ավելացնել անհատական նշում / Հ․Գ․ (օր․՝ Զանգահարեք ցանկացած պահի)․․․"
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* 1-Click Action Buttons */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition cursor-pointer"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              <span>{copied ? "Պատճենված է!" : "Պատճենել (SMS)"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openWhatsApp}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
            >
              <Send size={15} />
              <span>Բացել WhatsApp</span>
              <ExternalLink size={12} className="opacity-80" />
            </button>

            <button
              onClick={openViber}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition cursor-pointer"
            >
              <MessageSquare size={15} />
              <span>Viber</span>
              <ExternalLink size={12} className="opacity-80" />
            </button>

            {email && (
              <button
                onClick={openMail}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
              >
                <Mail size={15} />
                <span>Էլ․ Փոստ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
