import React from "react";
import { TUN_SERVICE_PACKAGES, PropertyPackageId } from "../../data/tunServicePackages";
import { PropertyInsuranceFormState } from "../../types";
import { formatCurrency, formatPercent } from "../../utils/insuranceCalculator";
import { Shield, Sparkles, Home, CheckCircle2, BedDouble, Key, Building } from "lucide-react";

interface PropertyPackageSelectorProps {
  currentPackage: PropertyPackageId;
  onSelectPackage: (packageId: PropertyPackageId) => void;
  currency: "AMD" | "USD";
}

export function PropertyPackageSelector({
  currentPackage,
  onSelectPackage,
  currency,
}: PropertyPackageSelectorProps) {
  const packageList: PropertyPackageId[] = ["start", "standard", "standard_plus", "premium", "custom"];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-[#003399] font-black text-xs px-2.5 py-0.5 rounded-md">
              Tun Service Offer (PR+LB)
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Ընտրեք Գույքի Ապահովագրության Փաթեթը
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Հարմարեցված է բնակարանների, առանձնատների և Airbnb / Booking օրավարձով տրվող տների պայմաններին:
          </p>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <Key className="w-3.5 h-3.5 text-blue-600" />
          <span>Ներառում է Շինություն, Կահույք, Հյուրերի վնաս և 3-րդ անձ</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {packageList.map((pkgId) => {
          const pkg = TUN_SERVICE_PACKAGES[pkgId];
          const isSelected = currentPackage === pkgId;

          if (pkgId === "custom") {
            return (
              <div
                key={pkgId}
                onClick={() => onSelectPackage(pkgId)}
                className={`relative rounded-xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-blue-500/50"
                    : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? "bg-white/20 text-cyan-200" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {pkg.badge}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                  </div>

                  <h3 className={`font-black text-sm ${isSelected ? "text-white" : "text-slate-900"}`}>
                    {pkg.name}
                  </h3>
                  <p className={`text-[11px] mt-1 line-clamp-2 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                    {pkg.tagline}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/20">
                  <div className={`text-[11px] font-bold ${isSelected ? "text-cyan-300" : "text-[#003399]"}`}>
                    Ազատ 13 Բաժիններ
                  </div>
                  <div className={`text-[10px] ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                    Կոմերցիոն և խոշոր օբյեկտներ
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={pkgId}
              onClick={() => onSelectPackage(pkgId)}
              className={`relative rounded-xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-gradient-to-b from-[#00235B] to-[#003399] border-[#00235B] text-white shadow-lg shadow-blue-950/20 ring-2 ring-blue-400"
                  : "bg-white hover:border-blue-300 hover:shadow-sm border-slate-200 text-slate-800"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-white/20 text-cyan-200 border border-white/20"
                        : pkg.isRentalOptimized
                        ? "bg-amber-100 text-amber-900 font-black border border-amber-300"
                        : "bg-blue-50 text-blue-800 border border-blue-200"
                    }`}
                  >
                    {pkg.badge}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-300" />}
                </div>

                <h3 className={`font-black text-base ${isSelected ? "text-white" : "text-slate-900"}`}>
                  {pkg.name}
                </h3>
                <p className={`text-[11px] mt-0.5 line-clamp-2 ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                  {pkg.tagline}
                </p>

                <div className="mt-3 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className={isSelected ? "text-blue-200" : "text-slate-500"}>Շինություն՝</span>
                    <span className="font-bold">
                      {formatCurrency(pkg.buildingSumInsuredAMD, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isSelected ? "text-blue-200" : "text-slate-500"}>Շարժ․ գույք՝</span>
                    <span className="font-bold">
                      {formatCurrency(pkg.contentsSumInsuredAMD, currency)}
                    </span>
                  </div>
                  {pkg.guestDamageSumInsuredAMD > 0 && (
                    <div className={`flex justify-between font-bold ${isSelected ? "text-amber-300" : "text-amber-700"}`}>
                      <span>Հյուրերի վնաս՝</span>
                      <span>{formatCurrency(pkg.guestDamageSumInsuredAMD, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className={isSelected ? "text-blue-200" : "text-slate-500"}>3-րդ անձ (հարևան)՝</span>
                    <span className="font-bold">
                      {formatCurrency(pkg.liabilitySumInsuredAMD, currency)}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`mt-3 pt-2.5 border-t ${isSelected ? "border-white/20" : "border-slate-100"}`}>
                <div className="text-[10px] text-slate-400">Տարեկան ապահովագրավճար</div>
                <div className={`text-base font-black tracking-tight ${isSelected ? "text-white" : "text-[#003399]"}`}>
                  {formatCurrency(pkg.annualPremiumAMD, currency)}
                  <span className={`text-[10px] font-normal ml-1 ${isSelected ? "text-blue-200" : "text-slate-500"}`}>
                    /տարի
                  </span>
                </div>
                <div className={`text-[10px] ${isSelected ? "text-cyan-200" : "text-slate-500"}`}>
                  Միջին սակագին՝ {formatPercent(pkg.averageTariffPercent)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
