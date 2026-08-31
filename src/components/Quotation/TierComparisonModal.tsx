import React from "react";
import { Check, X, Shield, Sparkles, Award } from "lucide-react";

export interface InsuranceTier {
  id: "standard" | "comfort" | "platinum";
  nameArm: string;
  tagline: string;
  multiplier: number;
  badge?: string;
  features: { nameArm: string; included: boolean; detail?: string }[];
}

interface TierComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTier: (tierId: string, multiplier: number) => void;
  productName?: string;
}

export const INSURANCE_TIERS: InsuranceTier[] = [
  {
    id: "standard",
    nameArm: "Բազային (Standard)",
    tagline: "Անհրաժեշտ նվազագույն ծածկույթ լավագույն գնով",
    multiplier: 1.0,
    features: [
      { nameArm: "Հիմնական ռիսկերի ծածկույթ", included: true },
      { nameArm: "Ստանդարտ ֆրանշիզա", included: true, detail: "Ոչ զրոյական" },
      { nameArm: "24/7 հեռախոսային աջակցություն", included: true },
      { nameArm: "Առանց մաշվածության փոխհատուցում", included: false },
      { nameArm: "Անձնական ապահովագրական մենեջեր", included: false },
      { nameArm: "Ավտոօգնություն / Էվակուատոր", included: false },
    ],
  },
  {
    id: "comfort",
    nameArm: "Օպտիմալ (Comfort)",
    tagline: "Ամենահաճախ ընտրվող հավասարակշռված փաթեթ",
    multiplier: 1.22,
    badge: "Ամենահայտնի",
    features: [
      { nameArm: "Հիմնական ռիսկերի ծածկույթ", included: true },
      { nameArm: "Նվազեցված / ճկուն ֆրանշիզա", included: true, detail: "Կիսով չափ" },
      { nameArm: "24/7 հեռախոսային և օպերատիվ աջակցություն", included: true },
      { nameArm: "Առանց մաշվածության փոխհատուցում", included: true },
      { nameArm: "Անձնական ապահովագրական մենեջեր", included: false },
      { nameArm: "Ավտոօգնություն / Էվակուատոր (տարին 2 անգամ)", included: true },
    ],
  },
  {
    id: "platinum",
    nameArm: "Պլատինում (VIP All-Risks)",
    tagline: "Ամբողջական և անհոգ պաշտպանություն առանց սահմանափակումների",
    multiplier: 1.48,
    badge: "Առավելագույն",
    features: [
      { nameArm: "Հիմնական և լրացուցիչ բոլոր ռիսկեր", included: true },
      { nameArm: "Զրոյական ֆրանշիզա (0 AMD)", included: true },
      { nameArm: "Առաջնահերթ 24/7 VIP աջակցություն", included: true },
      { nameArm: "Ամբողջական փոխհատուցում առանց մաշվածության", included: true },
      { nameArm: "Անձնական ապահովագրական մենեջեր", included: true },
      { nameArm: "Անսահմանափակ ավտոօգնություն / VIP սպասարկում", included: true },
    ],
  },
];

export function TierComparisonModal({ isOpen, onClose, onSelectTier, productName }: TierComparisonModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-1">
              <Sparkles size={13}/> SIL Insurance Փաթեթների Համեմատություն
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Ընտրեք Ձեզ հարմար ապահովագրական փաթեթը {productName ? `— ${productName}` : ""}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-slate-200/60 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body Matrix */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {INSURANCE_TIERS.map((tier) => (
            <div 
              key={tier.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 relative ${
                tier.id === "comfort" 
                  ? "border-emerald-500 bg-emerald-50/10 shadow-lg ring-2 ring-emerald-500/20" 
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              {tier.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                  {tier.badge}
                </span>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                    tier.id === "platinum" ? "bg-amber-100 text-amber-800" : tier.id === "comfort" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                  }`}>
                    {tier.id === "platinum" ? <Award size={18}/> : tier.id === "comfort" ? <Shield size={18}/> : "1"}
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{tier.nameArm}</h3>
                </div>
                <p className="text-xs text-slate-500 mb-6 min-h-[32px]">{tier.tagline}</p>

                <div className="space-y-3 mb-6">
                  {tier.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      {feat.included ? (
                        <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <X size={16} className="text-slate-300 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className={feat.included ? "font-semibold text-slate-800" : "text-slate-400 line-through"}>
                          {feat.nameArm}
                        </span>
                        {feat.detail && <div className="text-[10px] text-emerald-700 font-bold mt-0.5">{feat.detail}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-auto">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-slate-500 font-medium">Գործակից՝</span>
                  <span className="text-sm font-black text-slate-900">×{tier.multiplier}</span>
                </div>
                <button
                  onClick={() => {
                    onSelectTier(tier.id, tier.multiplier);
                    onClose();
                  }}
                  className={`w-full py-3 rounded-xl text-xs font-black transition-all shadow-sm ${
                    tier.id === "comfort" || tier.id === "platinum"
                      ? "bg-slate-900 hover:bg-slate-800 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                  }`}
                >
                  Ընտրել այս փաթեթը
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
          Բոլոր փաթեթները գործում են SIL Insurance պայմանների և Կենտրոնական բանկի կանոնակարգերի համաձայն։
        </div>
      </div>
    </div>
  );
}
