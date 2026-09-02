import React, { useState, useEffect } from "react";
import { Shield, Car, Home, HeartPulse, Plane, CheckCircle2, ArrowRight, User, Phone, Mail, FileText, Send, Sparkles, AlertCircle } from "lucide-react";
import horizontalLogo from "../../assets/images/sil-logo-horizontal.png";
import { addClientRenewal, getClientRenewals } from "../../utils/clientRenewalStore";

interface Props {
  initialProductType?: string; // "casco" | "property" | "health" | "travel"
  onCloseExpressMode?: () => void;
}

export function PublicExpressQuoteView({ initialProductType = "casco", onCloseExpressMode }: Props) {
  const [productType, setProductType] = useState<string>(initialProductType);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form inputs
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // CASCO fields
  const [makeModel, setMakeModel] = useState("Toyota Camry");
  const [year, setYear] = useState(2021);
  const [estimatedValueUSD, setEstimatedValueUSD] = useState(18000);

  // Property fields
  const [propertyDistrict, setPropertyDistrict] = useState("Կենտրոն");
  const [propertyArea, setPropertyArea] = useState(85);
  const [renovation, setRenovation] = useState("Եվրոնորոգում");

  // Health fields
  const [insuredCount, setInsuredCount] = useState(1);
  const [age, setAge] = useState(32);

  // Travel fields
  const [destination, setDestination] = useState("Եվրոպա (Շենգեն)");
  const [days, setDays] = useState(10);

  // Accident fields
  const [accCoverageType, setAccCoverageType] = useState("24_hours");
  const [accPersons, setAccPersons] = useState(1);
  const [accSum, setAccSum] = useState(3000000);

  useEffect(() => {
    if (initialProductType) {
      setProductType(initialProductType);
    }
  }, [initialProductType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !phone.trim()) {
      setError("Խնդրում ենք լրացնել Ձեր Անունը և Հեռախոսահամարը։");
      return;
    }

    setLoading(true);
    setError(null);

    // Save lead to CRM store
    let objectSummary = "";
    let estimatedSum = 0;

    if (productType === "casco") {
      objectSummary = `Ավտոմեքենա՝ ${makeModel} (${year}թ.), Շուկայական՝ $${estimatedValueUSD.toLocaleString()}`;
      estimatedSum = estimatedValueUSD * 388.5;
    } else if (productType === "property") {
      objectSummary = `Անշարժ գույք՝ ${propertyDistrict}, ${propertyArea} քմ, ${renovation}`;
      estimatedSum = propertyArea * 1250 * 388.5;
    } else if (productType === "health") {
      objectSummary = `Առողջություն՝ ${insuredCount} անձ, Տարիք՝ ${age}`;
      estimatedSum = 10000000;
    } else if (productType === "accident") {
      objectSummary = `Դժբախտ պատահար՝ ${accPersons} անձ, ${accCoverageType === "24_hours" ? "24 ժամ" : "Աշխատանքային ժամերին"}, ${accSum.toLocaleString()} ֏ մեկ անձի համար`;
      estimatedSum = accPersons * accSum;
    } else {
      objectSummary = `Ճանապարհորդություն՝ ${destination}, ${days} օր`;
      estimatedSum = 15000000;
    }

    try {
      addClientRenewal({
        clientName: clientName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        productType: productType as any,
        policyNumber: `EXP-${Date.now().toString().slice(-5)}`,
        expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
        estimatedPremium: 0,
        status: "pending",
        lastContactedDate: new Date().toISOString().split("T")[0],
        notes: `✨ [Արագ Հայտ (Client Link)] ${objectSummary}`,
        vehicleOrPropertyDetails: objectSummary,
      });

      setSubmitted(true);
    } catch (err: any) {
      setError("Չհաջողվեց ուղարկել հայտը։ Խնդրում ենք փորձել նորից։");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#061A40] to-slate-900 text-slate-800 p-4 sm:p-8 flex flex-col items-center justify-center relative">
      {onCloseExpressMode && (
        <button
          type="button"
          onClick={onCloseExpressMode}
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer backdrop-blur-xs border border-white/20"
        >
          ← Վերադառնալ Գործակալի Պորտալ
        </button>
      )}

      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-6">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-[#061A40] via-[#092B6B] to-[#0A4EA3] p-6 sm:p-8 text-white text-center relative">
          <img src={horizontalLogo} alt="SIL Insurance" className="h-10 mx-auto mb-3 object-contain brightness-0 invert" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-cyan-200 text-xs font-bold mb-2 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Ապահովագրական Արագ Հայտի Պորտալ</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» Գնառաջարկի Հայտ</h1>
          <p className="text-xs text-blue-100 mt-1 max-w-md mx-auto">
            Լրացրեք տվյալները 1 րոպեում, և մեր ապահովագրական մասնագետը կուղարկի Ձեզ լավագույն պայմաններով գնառաջարկը։
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Product Selection Tabs */}
            <div>
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider block mb-2">
                1. Ընտրեք Ապահովագրատեսակը
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "casco", label: "ԿԱՍԿՈ", icon: Car },
                  { id: "property", label: "Գույք", icon: Home },
                  { id: "health", label: "Առողջություն", icon: HeartPulse },
                  { id: "travel", label: "Ճամփորդություն", icon: Plane },
                  { id: "accident", label: "Դժբախտ Պատ.", icon: Activity },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = productType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setProductType(item.id)}
                      className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                        isSelected
                          ? "bg-[#061A40] text-white border-[#061A40] shadow-md font-bold"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? "text-cyan-300" : "text-slate-500"}`} />
                      <span className="text-xs font-extrabold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Product Input Fields */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>
                  2. {productType === "casco" ? "Ավտոմեքենայի Տվյալներ" : productType === "property" ? "Գույքի Տվյալներ" : productType === "health" ? "Առողջապահական Տվյալներ" : productType === "accident" ? "Դժբախտ Պատահարների Տվյալներ" : "Ճանապարհորդության Տվյալներ"}
                </span>
              </div>

              {productType === "casco" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Մակնիշ և Մոդել *</label>
                    <input
                      type="text"
                      className="sil-input"
                      placeholder="Օր․՝ Toyota Camry"
                      value={makeModel}
                      onChange={(e) => setMakeModel(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Տարեթիվ</label>
                      <input
                        type="number"
                        min="1990"
                        max="2026"
                        className="sil-input"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Մոտավոր Արժեք ($ USD)</label>
                      <input
                        type="number"
                        step="500"
                        className="sil-input font-bold"
                        value={estimatedValueUSD}
                        onChange={(e) => setEstimatedValueUSD(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {productType === "property" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Վարչական Շրջան / Հասցե</label>
                    <input
                      type="text"
                      className="sil-input"
                      placeholder="Օր․՝ Կենտրոն, Արաբկիր, Դավթաշեն..."
                      value={propertyDistrict}
                      onChange={(e) => setPropertyDistrict(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Մակերես (քմ)</label>
                      <input
                        type="number"
                        className="sil-input font-bold"
                        value={propertyArea}
                        onChange={(e) => setPropertyArea(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Վերանորոգում</label>
                      <select
                        className="sil-input font-bold"
                        value={renovation}
                        onChange={(e) => setRenovation(e.target.value)}
                      >
                        <option value="Եվրոնորոգում">Եվրոնորոգում</option>
                        <option value="Լյուքս / Դիզայներական">Լյուքս</option>
                        <option value="Էկոնոմ (ստանդարտ)">Էկոնոմ</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {productType === "health" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Ապահովագրվող անձանց քանակ</label>
                    <input
                      type="number"
                      min="1"
                      className="sil-input font-bold"
                      value={insuredCount}
                      onChange={(e) => setInsuredCount(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Ավագ անձի տարիքը</label>
                    <input
                      type="number"
                      min="1"
                      max="85"
                      className="sil-input font-bold"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                    />
                  </div>
                </div>
              )}

              {productType === "travel" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Ուղղություն / Երկիր</label>
                    <input
                      type="text"
                      className="sil-input"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Տևողություն (Օրեր)</label>
                    <input
                      type="number"
                      min="1"
                      className="sil-input font-bold"
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                    />
                  </div>
                </div>
              )}
              {productType === "accident" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Ծածկույթի տեսակ</label>
                    <select
                      className="sil-input font-bold"
                      value={accCoverageType}
                      onChange={(e) => setAccCoverageType(e.target.value)}
                    >
                      <option value="24_hours">24 Ժամ (Ամբողջական)</option>
                      <option value="workplace">Միայն աշխատանքային ժամերին</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Անձանց քանակ</label>
                      <input
                        type="number"
                        min="1"
                        className="sil-input font-bold"
                        value={accPersons}
                        onChange={(e) => setAccPersons(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Գումար (մեկ անձի)</label>
                      <input
                        type="number"
                        min="100000"
                        step="100000"
                        className="sil-input font-bold"
                        value={accSum}
                        onChange={(e) => setAccSum(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Client Personal Contact Info */}
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                3. Ձեր Կոնտակտային Տվյալները
              </label>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Անուն Ազգանուն *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    className="sil-input pl-9 font-semibold"
                    placeholder="Օր․՝ Արմեն Գրիգորյան"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Հեռախոսահամար *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      required
                      className="sil-input pl-9 font-semibold"
                      placeholder="+374 91 00-00-00"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Էլ․ Փոստ (կամավոր)</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      className="sil-input pl-9"
                      placeholder="client@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Send className="w-5 h-5" />
              <span>Ուղարկել Գործակալին (Ստանալ Գնառաջարկ)</span>
            </button>
          </form>
        ) : (
          <div className="p-8 sm:p-12 text-center space-y-4 animate-in fade-in duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-black text-slate-900">Շնորհակալություն, {clientName}։</h2>

            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Ձեր հայտը հաջողությամբ փոխանցվեց «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ապահովագրական մասնագետին։ Մեր գործակալը ուսումնասիրելու է Ձեր տվյալները և կարճ ժամանակում կապ կհաստատի <strong>{phone}</strong> հեռախոսահամարով։
            </p>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setClientName("");
                  setPhone("");
                }}
                className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
              >
                Լրացնել նոր հայտ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
