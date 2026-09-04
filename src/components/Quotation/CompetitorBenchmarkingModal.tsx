import React, { useState } from "react";
import {
  X,
  Scale,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Award
} from "lucide-react";
import { QuotationProposal } from "../../types";
import { formatCurrency } from "../../utils/insuranceCalculator";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  proposal: QuotationProposal;
}

interface CompetitorProfile {
  id: string;
  nameArm: string;
  shortName: string;
  cascoAverageTariff: number; // e.g. 3.6%
  franchisePolicy: string;
  towingIncluded: boolean;
  glassWithoutPoliceLimit: string;
  dealerRepair: string;
  payoutSpeedDays: string;
  keyDisadvantages: string[];
}

const COMPETITORS: CompetitorProfile[] = [
  {
    id: "nairi",
    nameArm: "«ՆԱԻՐԻ ԻՆՇՈՒՐԱՆՍ» ԱՍՊԸ",
    shortName: "Նաիրի Ինշուրանս",
    cascoAverageTariff: 3.5,
    franchisePolicy: "Ստանդարտ 1.5% - 2% (չհատուցվող գումար բոլոր դեպքերում)",
    towingIncluded: true,
    glassWithoutPoliceLimit: "Մինչև 200,000 ֏ (տարեկան 1 անգամ)",
    dealerRepair: "Միայն հավելավճարով (+15-20% սակագնին)",
    payoutSpeedDays: "10-15 աշխատանքային օր",
    keyDisadvantages: [
      "Ֆրանշիզան ավելի բարձր է (1.5-2%)",
      "Պաշտոնական դիլերի վերանորոգման համար պահանջվում է զգալի հավելավճար",
      "Առանց ՃՈ ակտի հատուցման սահմանաչափը ցածր է (200,000 ֏)",
    ],
  },
  {
    id: "ingo",
    nameArm: "«ԻՆԳՈ ԱՐՄԵՆԻԱ» ԱՓԲԸ",
    shortName: "Ինգո Արմենիա",
    cascoAverageTariff: 3.8,
    franchisePolicy: "1% կամ 50,000 ֏ ֆիքսված",
    towingIncluded: true,
    glassWithoutPoliceLimit: "Մինչև 300,000 ֏",
    dealerRepair: "Միայն մինչև 3 տարեկան մեքենաների համար",
    payoutSpeedDays: "7-12 աշխատանքային օր",
    keyDisadvantages: [
      "Բարձր բազային սակագին (միջինը 3.8% ընդդեմ ՍԻԼ-ի 3.0-3.3%-ի)",
      "3 տարուց ավելի մեքենաներին չի տրամադրվում պաշտոնական սերվիս",
      "Կորպորատիվ հաճախորդների ճկուն զեղչերի ավելի սահմանափակ համակարգ",
    ],
  },
  {
    id: "liga",
    nameArm: "«ԼԻԳԱ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ (Նախկին Ռոսգոսստրախ)",
    shortName: "ԼԻԳԱ Ինշուրանս",
    cascoAverageTariff: 3.4,
    franchisePolicy: "Աճող ֆրանշիզա (2-րդ դեպքից սկսած կրկնապատկվում է)",
    towingIncluded: false,
    glassWithoutPoliceLimit: "Մինչև 150,000 ֏",
    dealerRepair: "Ընկերության գործընկեր արհեստանոցներում",
    payoutSpeedDays: "10-15 աշխատանքային օր",
    keyDisadvantages: [
      "Աճող ֆրանշիզա յուրաքանչյուր հաջորդ պատահարի համար",
      "Քարշակը և տեխօգնությունը ներառված չեն անվճար հիմունքներով",
      "Հատուցման դիմումների քննության ավելի երկար ժամկետ",
    ],
  },
  {
    id: "reso",
    nameArm: "«ՌԵՍՈ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ",
    shortName: "ՌԵՍՈ",
    cascoAverageTariff: 3.6,
    franchisePolicy: "1-2% պայմանական կամ ոչ պայմանական",
    towingIncluded: true,
    glassWithoutPoliceLimit: "Մինչև 250,000 ֏",
    dealerRepair: "Միայն հատուկ համաձայնագրով",
    payoutSpeedDays: "10-14 աշխատանքային օր",
    keyDisadvantages: [
      "Սակագինն ավելի բարձր է միջին դասի ավտոմեքենաների համար",
      "Գործակալական աջակցության ավելի դանդաղ արձագանք",
    ],
  },
];

export const CompetitorBenchmarkingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  proposal,
}) => {
  const [selectedCompId, setSelectedCompId] = useState<string>("nairi");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentComp = COMPETITORS.find((c) => c.id === selectedCompId) || COMPETITORS[0];

  // Estimate competitor premium based on tariff difference
  const competitorEstimatedPremium = Math.round(
    (proposal.totalSumInsured * currentComp.cascoAverageTariff) / 100
  );
  const silPremium = proposal.annualPremium;
  const difference = competitorEstimatedPremium - silPremium;

  const comparisonPitchText = `Հարգելի ${proposal.clientName},
Ձեր ապահովագրության համար կատարել ենք շուկայի առաջատարների մանրամասն համեմատություն.

🏛️ «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» Առաջարկ N ${proposal.quotationNumber}:
• Ապահովագրական գումար՝ ${formatCurrency(proposal.totalSumInsured, proposal.currency)}
• Տարեկան վճար՝ ${formatCurrency(silPremium, proposal.currency)}
• Ֆրանշիզա՝ ${proposal.franchiseDescription}
• Անվճար 24/7 Քարշակ և Տեխօգնություն ՀՀ ողջ տարածքում:
• Ապակիների վնասներ՝ ԱՌԱՆՑ ՃՈ ակտի հատուցում մինչև 500,000 ֏:
• Վերանորոգում՝ Պաշտոնական դիլերային սերվիս կենտրոններում:
• Հատուցման ժամկետ՝ 5-10 աշխատանքային օր:

🏢 Համեմատություն ${currentComp.shortName}-ի հետ.
• Գնային տարբերություն՝ ${difference > 0 ? `ՍԻԼ-ն ավելի մատչելի է ${formatCurrency(difference, proposal.currency)}-ով` : "Համարժեք սակագին՝ բայց ՍԻԼ-ն ունի ավելի լայն ծածկույթ"}:
• ՍԻԼ-ի առավելությունը՝ ֆիքսված ցածր ֆրանշիզա, ավելի արագ հատուցում և 24/7 հուսալի աջակցություն (060 54 00 00):`;

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(comparisonPitchText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#001D4A] to-[#003399] text-white p-6 rounded-t-3xl flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
              <Scale size={20} />
            </div>
            <div>
              <h3 className="text-base font-black">
                Շուկայի Մրցակիցների Համեմատական Վերլուծություն (Benchmarking)
              </h3>
              <p className="text-xs text-blue-200">
                ՍԻԼ ԻՆՇՈՒՐԱՆՍ-ի մրցակցային առավելությունները ՀՀ առաջատար ապահովագրողների նկատմամբ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Competitor Selector Tabs */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="text-xs font-bold text-slate-500 mb-2">Ընտրեք մրցակից ընկերությունը՝</div>
          <div className="flex flex-wrap gap-2">
            {COMPETITORS.map((c) => {
              const active = selectedCompId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCompId(c.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition border cursor-pointer ${
                    active
                      ? "bg-[#003399] text-white border-[#003399] shadow-md"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {c.shortName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Comparison Matrix Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="p-3.5 font-bold text-slate-500 w-1/3">Չափանիշ / Պայման</th>
                  <th className="p-3.5 font-black text-blue-900 bg-blue-50/80 w-1/3">
                    ✨ «ՍԻԼ ԻՆՇՈՒՐԱՆՍ»
                  </th>
                  <th className="p-3.5 font-bold text-slate-700 w-1/3">
                    🏢 {currentComp.shortName}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3.5 font-bold text-slate-700">Ապահովագրավճար (Տարեկան)</td>
                  <td className="p-3.5 font-black text-emerald-700 bg-blue-50/40">
                    {formatCurrency(silPremium, proposal.currency)}
                    {difference > 0 && (
                      <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                        -{formatCurrency(difference, proposal.currency)} մատչելի
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-600">
                    մոտ {formatCurrency(competitorEstimatedPremium, proposal.currency)} (սակագին՝ ~{currentComp.cascoAverageTariff}%)
                  </td>
                </tr>

                <tr>
                  <td className="p-3.5 font-bold text-slate-700">Ֆրանշիզայի քաղաքականություն</td>
                  <td className="p-3.5 font-bold text-blue-900 bg-blue-50/40 flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>Ֆիքսված ցածր ֆրանշիզա, ապակիներն առանց ֆրանշիզայի</span>
                  </td>
                  <td className="p-3.5 text-slate-600">{currentComp.franchisePolicy}</td>
                </tr>

                <tr>
                  <td className="p-3.5 font-bold text-slate-700">24/7 Քարշակ և Տեխօգնություն</td>
                  <td className="p-3.5 font-bold text-blue-900 bg-blue-50/40 flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>ԱՆՎՃԱՐ ՀՀ ամբողջ տարածքում</span>
                  </td>
                  <td className="p-3.5 text-slate-600">
                    {currentComp.towingIncluded ? "Ներառված է" : "❌ Լրացուցիչ վճարով"}
                  </td>
                </tr>

                <tr>
                  <td className="p-3.5 font-bold text-slate-700">Ապակիներ առանց ՃՈ ակտի</td>
                  <td className="p-3.5 font-bold text-blue-900 bg-blue-50/40 flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>Մինչև 500,000 ֏ կամ առանց սահմանափակման</span>
                  </td>
                  <td className="p-3.5 text-slate-600">{currentComp.glassWithoutPoliceLimit}</td>
                </tr>

                <tr>
                  <td className="p-3.5 font-bold text-slate-700">Պաշտոնական դիլերի սերվիս</td>
                  <td className="p-3.5 font-bold text-blue-900 bg-blue-50/40 flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>Գործարանային պաշտոնական սերվիսներում</span>
                  </td>
                  <td className="p-3.5 text-slate-600">{currentComp.dealerRepair}</td>
                </tr>

                <tr>
                  <td className="p-3.5 font-bold text-slate-700">Հատուցման արագություն</td>
                  <td className="p-3.5 font-bold text-blue-900 bg-blue-50/40 flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>5-10 աշխատանքային օր (արագ կարգավորում)</span>
                  </td>
                  <td className="p-3.5 text-slate-600">{currentComp.payoutSpeedDays}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Key Selling Arguments Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <h4 className="text-xs font-black text-emerald-900 flex items-center gap-1.5 mb-2">
              <Award size={16} className="text-emerald-700" />
              ՍԻԼ-ի Հաղթող Փաստարկները {currentComp.shortName}-ի համեմատ.
            </h4>
            <ul className="space-y-1.5">
              {currentComp.keyDisadvantages.map((dis, idx) => (
                <li key={idx} className="text-xs text-emerald-800 flex items-start gap-2 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  <span>{dis}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Copyable Message Box for Client */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-cyan-400" />
                Պատրաստի Տեքստ Հաճախորդի WhatsApp / Telegram-ի համար.
              </span>
              <button
                onClick={handleCopyPitch}
                className="px-3 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Պատճենված է!" : "Պատճենել"}
              </button>
            </div>
            <pre className="text-xs text-slate-300 font-sans whitespace-pre-wrap bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              {comparisonPitchText}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-3xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
          >
            Փակել
          </button>
        </div>
      </div>
    </div>
  );
};
