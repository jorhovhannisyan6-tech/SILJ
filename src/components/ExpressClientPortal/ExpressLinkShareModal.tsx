import React, { useState } from "react";
import { X, Copy, Check, Share2, MessageCircle, ExternalLink, Car, Home, HeartPulse, Plane, Link as LinkIcon, Sparkles } from "lucide-react";

interface Props {
  onClose: () => void;
  onOpenExpressView?: (productType: string) => void;
}

export function ExpressLinkShareModal({ onClose, onOpenExpressView }: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";

  const expressLinks = [
    {
      id: "casco",
      title: "ԿԱՍԿՈ Express Հղում",
      subtitle: "Ավտոմեքենայի ապահովագրության արագ հայտ",
      icon: Car,
      color: "from-blue-600 to-indigo-600",
      url: `${baseUrl}?express=casco`,
    },
    {
      id: "property",
      title: "Անշարժ Գույք Express Հղում",
      subtitle: "Բնակարանի / Տան ապահովագրության հայտ",
      icon: Home,
      color: "from-purple-600 to-pink-600",
      url: `${baseUrl}?express=property`,
    },
    {
      id: "health",
      title: "Առողջություն Express Հղում",
      subtitle: "Կամավոր բժշկական ապահովագրություն",
      icon: HeartPulse,
      color: "from-emerald-600 to-teal-600",
      url: `${baseUrl}?express=health`,
    },
    {
      id: "travel",
      title: "Ճանապարհորդություն Express",
      subtitle: "Արտասահման մեկնողների ապահովագրություն",
      icon: Plane,
      color: "from-amber-500 to-orange-600",
      url: `${baseUrl}?express=travel`,
    },
  ];

  const handleCopy = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleWhatsApp = (url: string, title: string) => {
    const text = encodeURIComponent(`Բարև Ձեզ։ Լրացրեք «ՍԻԼ ԻՆՇՈՒՐԱՆՍ»-ի ${title}-ի տվյալները հղումով, և ես Ձեզ կուղարկեմ պատրաստի գնառաջարկը՝\n${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleTelegram = (url: string, title: string) => {
    const text = encodeURIComponent(`Բարև Ձեզ։ Լրացրեք «ՍԻԼ ԻՆՇՈՒՐԱՆՍ»-ի ${title}-ի տվյալները հղումով՝\n${url}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[140] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl border border-slate-200 text-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#061A40] to-[#0A4EA3] text-white flex items-center justify-center shadow-md">
            <LinkIcon className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600">Գործակալի CRM Գործիք</div>
            <h2 className="text-xl font-black text-slate-900">Արագ Հայտի Հղում Հաճախորդին (Public Client Link)</h2>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          Ուղարկեք այս կարճ հղումները Ձեր հաճախորդին WhatsApp-ով կամ Telegram-ով։ Հաճախորդը ինքնուրույն կլրացնի տվյալները, իսկ հայտը ակնթարթորեն կգրանցվի Ձեր CRM ցանկում։
        </p>

        <div className="space-y-4">
          {expressLinks.map((link) => {
            const Icon = link.icon;
            const isCopied = copiedKey === link.id;

            return (
              <div
                key={link.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.color} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-sm text-slate-900">{link.title}</div>
                    <div className="text-xs text-slate-500">{link.subtitle}</div>
                    <div className="text-[11px] text-blue-600 font-mono mt-0.5 truncate max-w-xs">{link.url}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleCopy(link.id, link.url)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{isCopied ? "Պատճենված է" : "Պատճենել"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWhatsApp(link.url, link.title)}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                    title="Ուղարկել WhatsApp-ով"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTelegram(link.url, link.title)}
                    className="px-2.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                    title="Ուղարկել Telegram-ով"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">TG</span>
                  </button>

                  {onOpenExpressView && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenExpressView(link.id);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                      title="Բացել Հաճախորդի Տեսքը"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
          <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Ինչպես է սա աշխատում.</div>
            <div>Հղումը բացելիս հաճախորդը տեսնում է միայն ապահովագրության պարզեցված հարցաշարը (առանց գործակալական ներքին սակագների): Հայտը լրացնելուց հետո դուք ծանուցում եք ստանում CRM բաժնում։</div>
          </div>
        </div>
      </div>
    </div>
  );
}
