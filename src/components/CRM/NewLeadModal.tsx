import React, { useState } from "react";
import {
  ClientRenewalLead,
  addClientRenewal,
  ProductType,
  getClients360
} from "../../utils/clientRenewalStore";
import { Plus, UserPlus, AlertCircle, Sparkles, Check, Phone, Mail, Car, Building } from "lucide-react";

interface NewLeadModalProps {
  onClose: () => void;
  onLeadCreated: () => void;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({ onClose, onLeadCreated }) => {
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("+374 ");
  const [email, setEmail] = useState("");
  const [productType, setProductType] = useState<ProductType>("casco");
  const [estimatedPremium, setEstimatedPremium] = useState(180000);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("high");
  const [channelSource, setChannelSource] = useState<ClientRenewalLead["channelSource"]>("phone_call");
  const [vehicleOrPropertyDetails, setVehicleOrPropertyDetails] = useState("");
  const [notes, setNotes] = useState("");

  // Check for duplicate client
  const existingClients = getClients360();
  const duplicateClient = existingClients.find(
    (c) => c.phone.replace(/[^0-9]/g, "") === phone.replace(/[^0-9]/g, "") && phone.replace(/[^0-9]/g, "").length > 6
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !phone.trim()) return;

    addClientRenewal({
      clientName: clientName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      productType,
      policyNumber: `LEAD-${Date.now().toString().slice(-6)}`,
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      estimatedPremium: Number(estimatedPremium) || 0,
      status: "pending",
      lastContactedDate: new Date().toISOString().split("T")[0],
      notes: notes.trim() || "Նոր մուտքագրված հայտ CRM-ում",
      vehicleOrPropertyDetails: vehicleOrPropertyDetails.trim() || undefined,
      leadScore: Math.floor(Math.random() * 20) + 80,
      priority,
      channelSource,
      assignedAgent: "Աննա Գրիգորյան",
    });

    onLeadCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 text-white max-w-xl w-full space-y-5 shadow-2xl animate-scaleUp">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Նոր Հայտի Գրանցում (Quick Intake)</h3>
              <p className="text-xs text-slate-400">Գրանցեք հեռախոսազանգից կամ գրասենյակ այցելած հաճախորդի հայտը</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Duplicate detection warning */}
        {duplicateClient && (
          <div className="bg-amber-500/15 border border-amber-500/30 p-3 rounded-xl flex items-center gap-3 text-xs text-amber-200">
            <AlertCircle size={18} className="text-amber-400 shrink-0" />
            <div>
              <strong>Առկա Հաճախորդ՝</strong> «{duplicateClient.name}» (LTV: {duplicateClient.ltvAmount.toLocaleString()} ֏)։
              Հայտը ավտոմատ կկապվի նրա պատմության հետ։
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Հաճախորդի Անուն / Ընկերություն *</label>
              <input
                type="text"
                required
                placeholder="Արմեն Պետրոսյան կամ «ԱԼՖԱ» ՍՊԸ"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Հեռախոսահամար *</label>
              <input
                type="text"
                required
                placeholder="+374 91 000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Ապահովագրատեսակ</label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value as ProductType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="casco">🚗 ԿԱՍԿՈ</option>
                <option value="property">🏢 Գույք</option>
                <option value="mortgage">🏠 Հիփոթեք</option>
                <option value="health">🩺 Առողջություն</option>
                <option value="cargo">📦 Բեռներ</option>
                <option value="travel">✈️ Ճամփորդություն</option>
                <option value="liability">⚖️ Պատասխանատվություն</option>
                <option value="accident">🛡️ Դժբախտ Պատահարներ</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Գնահատված Վճար (AMD)</label>
              <input
                type="number"
                value={estimatedPremium}
                onChange={(e) => setEstimatedPremium(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Առաջնահերթություն</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="high">🔴 Բարձր (High)</option>
                <option value="medium">🟡 Միջին (Medium)</option>
                <option value="low">🔵 Ցածր (Low)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Ապահովագրության Օբյեկտի Տվյալներ (Մեքենա / Գույք / Բեռ)
            </label>
            <input
              type="text"
              placeholder="Օր․՝ Toyota Prado 2023 (շուկայական $38,000) կամ Բնակարան Կենտրոնում"
              value={vehicleOrPropertyDetails}
              onChange={(e) => setVehicleOrPropertyDetails(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Գործակալի Նշումներ / Պահանջներ</label>
            <textarea
              rows={2}
              placeholder="Հաճախորդը ցանկանում է 0% ֆրանշիզա, զանգահարել ուրբաթ..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Չեղարկել
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>Ավելացնել Հայտը</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
