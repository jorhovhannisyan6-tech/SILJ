import { useState } from "react";
import { MortgageInsuranceData, QuotationProposal } from "../../types";
import {
  formatCurrency,
  formatPercent,
  calculateMortgageQuotation,
  buildMortgageProposal,
} from "../../utils/insuranceCalculator";
import {
  DEFAULT_MORTGAGE_PACKAGE_I,
  DEFAULT_MORTGAGE_PACKAGE_II,
  BANK_LIST,
} from "../../data/presets";
import {
  Home,
  Layers,
  Calculator,
  Building,
  User,
  Phone,
  FileCheck2,
  CheckCircle2,
  Info,
  ShieldAlert,
  Percent,
} from "lucide-react";

interface MortgageCalculatorProps {
  data: MortgageInsuranceData;
  onChange: (updater: (prev: MortgageInsuranceData) => MortgageInsuranceData) => void;
  onGenerateQuotation: (proposal: QuotationProposal) => void;
}

export function MortgageCalculator({
  data,
  onChange,
  onGenerateQuotation,
}: MortgageCalculatorProps) {
  const calc = calculateMortgageQuotation(data);

  const handleGenerate = () => {
    const proposal = buildMortgageProposal(data);
    onGenerateQuotation(proposal);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Banner in SIL Corporate Style */}
      <div className="bg-gradient-to-r from-[#00235B] via-[#003399] to-[#0052CC] text-white rounded-2xl p-6 sm:p-7 shadow-xl shadow-blue-950/15 mb-6 border border-blue-800/40 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-[#00A3FF]/15 blur-2xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-white/15 text-cyan-200 border border-white/20 text-xs px-3 py-0.5 rounded-full font-bold">
                «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Հիփոթեքային Ծածկույթ
              </span>
              <span className="text-blue-200 text-xs hidden sm:inline">| ՀՀ ԿԲ & Բանկային Ստանդարտներ</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Հիփոթեքային Վարկառուների և Գրավադրված Գույքի Ապահովագրություն
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-3xl mt-1">
              Հաշվարկեք ապահովագրավճարը ըստ ԱՀԸ (Փաթեթ I) կամ ԲԵ (Փաթեթ II) ստանդարտների: Ծածկույթը հաստատված է ՀՀ բոլոր առևտրային բանկերի կողմից:
            </p>
          </div>

          <div className="flex items-center bg-[#001D4A]/80 border border-blue-700/50 rounded-xl p-1 text-xs">
            <span className="text-blue-200 px-2 font-medium">Օրինակներ՝</span>
            <button
              onClick={() => onChange(() => DEFAULT_MORTGAGE_PACKAGE_I)}
              className="px-2.5 py-1.5 hover:bg-white/10 rounded-lg text-white font-medium transition cursor-pointer"
            >
              Փաթեթ I (ԱՀԸ)
            </button>
            <button
              onClick={() => onChange(() => DEFAULT_MORTGAGE_PACKAGE_II)}
              className="px-2.5 py-1.5 hover:bg-white/10 rounded-lg text-white font-medium transition cursor-pointer"
            >
              Փաթեթ II (ԲԵ)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Forms (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* PACKAGE SELECTOR (CRITICAL REQUIREMENT) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-5 h-5 text-[#003399]" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                1. Ընտրեք Հիփոթեքային Ապահովագրության Փաթեթը
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* PACKAGE I */}
              <div
                onClick={() =>
                  onChange((prev) => ({ ...prev, packageType: "PACKAGE_I" }))
                }
                className={`relative p-4 rounded-xl border-2 transition cursor-pointer ${
                  data.packageType === "PACKAGE_I"
                    ? "bg-blue-50/70 border-[#003399] shadow-md ring-2 ring-[#003399]/10"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                    ՓԱԹԵԹ I (ԱՀԸ Ստանդարտ)
                  </span>
                  {data.packageType === "PACKAGE_I" && (
                    <CheckCircle2 className="w-4 h-4 text-[#003399]" />
                  )}
                </div>
                <span className="text-[11px] font-bold text-[#003399] bg-blue-100 px-2 py-0.5 rounded inline-block mb-2">
                  «Ազգային Հիփոթեքային Ընկերություն»
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ապահովագրական գումարը ներառում է <strong>ՉԿԳ մայր գումարի մնացորդը</strong> և <strong>մինչև 2 տարվա հաշվարկված տոկոսները</strong>:
                </p>
                <div className="mt-3 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 font-mono">
                  Բանաձև՝ Մայր Գումար + (Մայր Գումար × % × 2)
                </div>
              </div>

              {/* PACKAGE II */}
              <div
                onClick={() =>
                  onChange((prev) => ({ ...prev, packageType: "PACKAGE_II" }))
                }
                className={`relative p-4 rounded-xl border-2 transition cursor-pointer ${
                  data.packageType === "PACKAGE_II"
                    ? "bg-sky-50/70 border-sky-600 shadow-md ring-2 ring-sky-600/10"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                    ՓԱԹԵԹ II (ԲԵ Ստանդարտ)
                  </span>
                  {data.packageType === "PACKAGE_II" && (
                    <CheckCircle2 className="w-4 h-4 text-sky-600" />
                  )}
                </div>
                <span className="text-[11px] font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded inline-block mb-2">
                  «Բնակարան Երիտասարդներին»
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ապահովագրական գումարը սահմանվում է խստորեն հավասար <strong>միայն ՉԿԳ մայր գումարի մնացորդին</strong>:
                </p>
                <div className="mt-3 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 font-mono">
                  Բանաձև՝ ՉԿԳ Մայր Գումարի Մնացորդ
                </div>
              </div>
            </div>
          </div>

          {/* LOAN & FINANCIAL DETAILS */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <Calculator className="w-5 h-5 text-[#003399]" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                2. Հիփոթեքային Վարկի և Գրավի Ֆինանսական Տվյալներ
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Գրավառու Բանկ / Շահառու *
                </label>
                <select
                  value={data.bankName}
                  onChange={(e) =>
                    onChange((prev) => ({ ...prev, bankName: e.target.value }))
                  }
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden bg-white"
                >
                  {BANK_LIST.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ՉԿԳ Մայր գումարի մնացորդ ({data.currency}) *
                </label>
                <input
                  type="number"
                  value={data.principalBalance || ""}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      principalBalance: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full text-xs sm:text-sm font-bold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  {formatCurrency(data.principalBalance, data.currency)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Վարկի տարեկան տոկոսադրույք (%): *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={data.annualInterestRate || ""}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      annualInterestRate: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full text-xs sm:text-sm font-bold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Օր․՝ 11.5% (կիրառվում է Փաթեթ I-ի տոկոսների հաշվարկում)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Գույքի շուկայական գնահատված արժեք
                </label>
                <input
                  type="number"
                  value={data.propertyMarketValue || ""}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      propertyMarketValue: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  {formatCurrency(data.propertyMarketValue, data.currency)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Գույքային ապահովագրության սակագին (%):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={data.propertyTariff || 0.16}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      propertyTariff: Number(e.target.value) || 0.16,
                    }))
                  }
                  className="w-full text-xs sm:text-sm font-semibold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Ստանդարտ՝ 0.15% - 0.20%
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Վարկային պայմանագրի N / Կոդ
                </label>
                <input
                  type="text"
                  value={data.loanContractNumber}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      loanContractNumber: e.target.value,
                    }))
                  }
                  placeholder="Օր․՝ MORT-2025/08-11"
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                />
              </div>
            </div>

            {/* Life Insurance Addon Toggle */}
            <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.lifeInsuranceIncluded}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      lifeInsuranceIncluded: e.target.checked,
                    }))
                  }
                  className="rounded text-blue-600 focus:ring-blue-600 focus:border-blue-600 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Վարկառուի Կյանքի & Դժբախտ Պատահարներից Ապահովագրություն
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Մահվան և 1-ին/2-րդ խմբի հաշմանդամության ռիսկերից (Սակագին՝ 0.15% մայր գումարից)
                  </span>
                </div>
              </label>

              {data.lifeInsuranceIncluded && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">Կյանքի սակագին՝</span>
                  <input
                    type="number"
                    step="0.01"
                    value={data.lifeTariff || 0.15}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        lifeTariff: Number(e.target.value) || 0.15,
                      }))
                    }
                    className="w-20 text-xs font-bold border border-slate-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden bg-white"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              )}
            </div>
          </div>

          {/* BORROWER & PROPERTY LOCATION */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                3. Վարկառուի և Գրավադրված Գույքի Տվյալներ
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Վարկառուի ԱԱՀ (Անուն, Ազգանուն, Հայրանուն) *
                </label>
                <input
                  type="text"
                  value={data.borrowerName}
                  onChange={(e) =>
                    onChange((prev) => ({ ...prev, borrowerName: e.target.value }))
                  }
                  placeholder="Օր․՝ Տիգրան Կարապետյան"
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Անձնագրի / ID քարտի տվյալներ
                </label>
                <input
                  type="text"
                  value={data.borrowerPassport}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      borrowerPassport: e.target.value,
                    }))
                  }
                  placeholder="AT 0894215, տրվ․ 004-ի կողմից"
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Հեռախոսահամար *
                </label>
                <input
                  type="text"
                  value={data.borrowerPhone}
                  onChange={(e) =>
                    onChange((prev) => ({ ...prev, borrowerPhone: e.target.value }))
                  }
                  placeholder="+374 (91) 40-55-66"
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Էլ․ հասցե (E-mail)
                </label>
                <input
                  type="email"
                  value={data.borrowerEmail}
                  onChange={(e) =>
                    onChange((prev) => ({ ...prev, borrowerEmail: e.target.value }))
                  }
                  placeholder="client@mail.am"
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Գրավադրված անշարժ գույքի հասցե *
                </label>
                <input
                  type="text"
                  value={data.propertyAddress}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      propertyAddress: e.target.value,
                    }))
                  }
                  placeholder="ՀՀ, ք․ Երևան, Արաբկիր, Կոմիտասի պող․ 35, բն․ 48"
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mortgage Calculation Summary & Output (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm sticky top-[140px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#003399] uppercase bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  {data.packageType === "PACKAGE_I" ? "ՓԱԹԵԹ I (ԱՀԸ)" : "ՓԱԹԵԹ II (ԲԵ)"}
                </span>
                <h3 className="font-black text-slate-900 text-base mt-1">
                  Հիփոթեքի Հաշվարկ
                </h3>
              </div>
              <Home className="w-5 h-5 text-[#003399]" />
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2.5 text-xs text-slate-600 mb-4">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Վարկառու՝</span>
                <span className="font-bold text-slate-900 truncate max-w-[170px]">
                  {data.borrowerName || "—"}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Շահառու Բանկ՝</span>
                <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                  {data.bankName}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Մայր գումարի մնացորդ՝</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(data.principalBalance, data.currency)}
                </span>
              </div>

              {data.packageType === "PACKAGE_I" && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-[#00235B] bg-blue-50/60 p-1.5 rounded">
                  <span>2 տարվա տոկոսներ (ԱՀԸ)՝</span>
                  <span className="font-bold">
                    +{formatCurrency(calc.interestTwoYearsAmount, data.currency)}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-slate-100 bg-slate-50 p-1.5 rounded">
                <span className="font-bold text-slate-800">
                  Գույքային ապահովագրական գումար՝
                </span>
                <span className="font-black text-slate-900">
                  {formatCurrency(calc.insuredSumProperty, data.currency)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Գույքի ապահովագրավճար ({formatPercent(data.propertyTariff)})՝</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(calc.propertyPremium, data.currency)}
                </span>
              </div>

              {data.lifeInsuranceIncluded && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-[#00235B]">
                  <span>Կյանքի ապահովագրավճար ({formatPercent(data.lifeTariff || 0.15)})՝</span>
                  <span className="font-semibold">
                    +{formatCurrency(calc.lifePremium, data.currency)}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-800 font-medium">
                <span>Ֆրանշիզա (Չհատուցվող գումար)՝</span>
                <span>0% (Անվերապահ)</span>
              </div>
            </div>

            {/* Total Annual Premium Highlight in SIL Royal Blue */}
            <div className="bg-gradient-to-br from-[#00235B] via-[#003399] to-[#004DB3] text-white rounded-xl p-5 shadow-lg shadow-blue-950/20 mb-4 border border-blue-700/50">
              <span className="text-[11px] text-cyan-200 font-bold block">
                Ընդամենը Տարեկան Ապահովագրավճար
              </span>
              <div className="text-2xl font-black text-white tracking-tight mt-0.5">
                {formatCurrency(calc.totalAnnualPremium, data.currency)}
              </div>
              <span className="text-[11px] text-blue-200 font-medium block mt-1">
                {data.lifeInsuranceIncluded ? "Գույք + Կյանք միասին" : "Միայն Գույքային ծածկույթ"}
              </span>
            </div>

            {/* Generate Quotation button */}
            <button
              onClick={handleGenerate}
              id="generate-mortgage-quote-btn"
              className="w-full bg-gradient-to-r from-[#003399] to-[#0066FF] hover:from-[#002D72] hover:to-[#0052CC] text-white font-black text-xs sm:text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-blue-900/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] border border-blue-400/20"
            >
              <FileCheck2 className="w-4 h-4 text-cyan-200" />
              Կազմել Հիփոթեքային Գնառաջարկ
            </button>
            <p className="text-[11px] text-center text-slate-500 mt-2">
              Պատրաստ կլինի MS Word (.doc) ներբեռնման և բանկ ներկայացնելու համար
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
