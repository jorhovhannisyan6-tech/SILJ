import React from "react";
import { PropertyInsuranceFormState, PropertyRentalDetails } from "../../types";
import { formatCurrency } from "../../utils/insuranceCalculator";
import { TUN_SERVICE_PACKAGES, PropertyPackageId } from "../../data/tunServicePackages";
import { BedDouble, Shield, Key, AlertTriangle, Check, Users, Sparkles, Building } from "lucide-react";

interface ShortTermRentalSectionProps {
  state: PropertyInsuranceFormState;
  onChange: (updater: (prev: PropertyInsuranceFormState) => PropertyInsuranceFormState) => void;
}

export function ShortTermRentalSection({ state, onChange }: ShortTermRentalSectionProps) {
  const rental = state.rentalDetails || {
    rentalType: "owner_occupied",
    platform: "Airbnb / Booking.com",
    hasGuestDamageCoverage: false,
    guestDamageLimit: 2000000,
    securityDeposit: 0,
    maxGuestsCount: 4,
  };

  const isRental = rental.rentalType === "short_term_rental" || rental.rentalType === "long_term_rental";
  const currency = state.values.currency;
  const pkgId = state.propertyPackage as PropertyPackageId;
  const pkg = TUN_SERVICE_PACKAGES[pkgId];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <BedDouble className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <span>Վարձակալության և Օրավարձի Հատուկ Պայմաններ</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-extrabold">
                Tun Service Offer PR+LB
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Օրավարձով բնակարանների, Airbnb / Booking հյուրերի ընդունման և պատասխանատվության կարգավորումներ
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Usage Mode Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-2">
            Գույքի շահագործման և բնակեցման ռեժիմ՝
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                id: "owner_occupied",
                label: "Սեփական բնակություն",
                desc: "Մշտական բնակվում է սեփականատերը կամ ընտանիքը",
              },
              {
                id: "short_term_rental",
                label: "Օրավարձ / Կարճաժամկետ (Airbnb)",
                desc: "Օրավարձով տրվող բնակարան կամ հյուրատուն",
                highlight: true,
              },
              {
                id: "long_term_rental",
                label: "Երկարաժամկետ վարձակալություն",
                desc: "Պայմանագրով ամսական վարձակալություն (1+ ամիս)",
              },
            ].map((opt) => {
              const isSelected = rental.rentalType === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      rentalDetails: {
                        ...(prev.rentalDetails || rental),
                        rentalType: opt.id as any,
                        hasGuestDamageCoverage: opt.id === "short_term_rental" ? true : prev.rentalDetails?.hasGuestDamageCoverage || false,
                      },
                    }))
                  }
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                    isSelected
                      ? "bg-blue-50/90 border-[#003399] text-[#003399] font-bold shadow-xs ring-1 ring-[#003399]"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-slate-900">{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#003399]" />}
                  </div>
                  <div className="text-[11px] text-slate-500">{opt.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Short term rental details if enabled */}
        {rental.rentalType === "short_term_rental" && (
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Platform */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Հիմնական վարձակալական հարթակներ՝
                </label>
                <select
                  value={rental.platform || "Airbnb / Booking.com"}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      rentalDetails: {
                        ...(prev.rentalDetails || rental),
                        platform: e.target.value,
                      },
                    }))
                  }
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                >
                  <option value="Airbnb / Booking.com">Airbnb / Booking.com / VRBO</option>
                  <option value="Direct / List.am">Ուղիղ հայտարարություններ (List.am, Instagram)</option>
                  <option value="Property Management">Կառավարող ընկերություն (Property Manager)</option>
                </select>
              </div>

              {/* Max Guests */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Հյուրերի առավելագույն քանակ՝
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={rental.maxGuestsCount || 4}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      rentalDetails: {
                        ...(prev.rentalDetails || rental),
                        maxGuestsCount: Number(e.target.value) || 2,
                      },
                    }))
                  }
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
            </div>

            {/* Guest Damage Coverage Toggle & Limits */}
            <div className="pt-2 border-t border-amber-200/80">
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span>Հյուրերի կողմից գույքին հասցված վնասի ծածկույթ (Guest Damage)</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Հատուցում է վարձակալների կողմից կահույքին, տեխնիկային և հարդարմանը պատճառված վնասները (ֆրանշիզա՝ 30,000 ֏):
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={Boolean(rental.hasGuestDamageCoverage || state.insuredProperty.guestDamage || pkg?.guestDamageSumInsuredAMD)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      onChange((prev) => ({
                        ...prev,
                        insuredProperty: {
                          ...prev.insuredProperty,
                          guestDamage: checked,
                        },
                        values: {
                          ...prev.values,
                          guestDamageValue: checked ? (prev.values.guestDamageValue || 2000000) : 0,
                        },
                        rentalDetails: {
                          ...(prev.rentalDetails || rental),
                          hasGuestDamageCoverage: checked,
                        },
                      }));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003399]"></div>
                </label>
              </div>

              {(rental.hasGuestDamageCoverage || state.insuredProperty.guestDamage || (pkg?.guestDamageSumInsuredAMD || 0) > 0) && (
                <div className="mt-3 p-3 bg-white rounded-xl border border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Հյուրերի վնասի առավելագույն լիմիտ ({currency})՝
                    </label>
                    <input
                      type="number"
                      value={state.values.guestDamageValue || (pkg?.guestDamageSumInsuredAMD || 2000000)}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          values: {
                            ...prev.values,
                            guestDamageValue: Number(e.target.value) || 0,
                          },
                        }))
                      }
                      className="w-full text-xs font-bold border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Չհատուցվող գումար (Ֆրանշիզա)՝
                    </label>
                    <div className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                      30,000 ֏ յուրաքանչյուր պատահարի համար
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Third Party Liability for Short Term Rentals */}
            <div className="pt-2 border-t border-amber-200/80">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="text-xs font-bold text-slate-900">
                  Քաղաքացիական Պատասխանատվություն 3-րդ անձանց (հարևաններին)՝
                </div>
                <span className="text-[11px] text-blue-700 font-bold">
                  Ջրալցում և հրդեհ
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Պատասխանատվության ապահովագրական գումար ({currency})՝
                  </label>
                  <input
                    type="number"
                    value={state.values.thirdPartyLiabilityValue || (pkg?.liabilitySumInsuredAMD || 2000000)}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        values: {
                          ...prev.values,
                          thirdPartyLiabilityValue: Number(e.target.value) || 0,
                        },
                      }))
                    }
                    className="w-full text-xs font-bold border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-600 outline-hidden bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Ֆրանշիզա 3-րդ անձանց գծով՝
                  </label>
                  <div className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                    30,000 ֏ յուրաքանչյուր պատահարի համար
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
