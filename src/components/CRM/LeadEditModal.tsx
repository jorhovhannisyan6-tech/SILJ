import React, { useState } from "react";
import { X, Save, User, Phone, Mail, FileText, DollarSign, Calendar, Tag, AlertCircle } from "lucide-react";
import { ClientRenewalLead } from "../../utils/clientRenewalStore";

interface Props {
  lead?: ClientRenewalLead | null; // If null, creating a new lead
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadData: Partial<ClientRenewalLead>) => Promise<void>;
}

export const LeadEditModal: React.FC<Props> = ({ lead, isOpen, onClose, onSave }) => {
  const isEditing = !!lead;

  const [clientName, setClientName] = useState(lead?.clientName || "");
  const [phone, setPhone] = useState(lead?.phone || "+374 ");
  const [email, setEmail] = useState(lead?.email || "");
  const [productType, setProductType] = useState<ClientRenewalLead["productType"]>(lead?.productType || "casco");
  const [policyNumber, setPolicyNumber] = useState(lead?.policyNumber || `EXP-${Date.now().toString().slice(-6)}`);
  const [estimatedPremium, setEstimatedPremium] = useState<number>(lead?.estimatedPremium || 150000);
  const [status, setStatus] = useState<ClientRenewalLead["status"]>(lead?.status || "pending");
  const [expiryDate, setExpiryDate] = useState(lead?.expiryDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
  const [notes, setNotes] = useState(lead?.notes || "");
  const [vehicleOrPropertyDetails, setVehicleOrPropertyDetails] = useState(lead?.vehicleOrPropertyDetails || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setError("Հաճախորդի անունը պարտադիր է");
      return;
    }
    if (!phone.trim() || phone.trim() === "+374") {
      setError("Հեռախոսահամարը պարտադիր է");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        clientName: clientName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        productType,
        policyNumber: policyNumber.trim(),
        estimatedPremium: Number(estimatedPremium) || 0,
        status,
        expiryDate,
        notes: notes.trim(),
        vehicleOrPropertyDetails: vehicleOrPropertyDetails.trim(),
        lastContactedDate: new Date().toISOString().split("T")[0],
      });
      onClose();
    } catch (err: any) {
      setError("Չհաջողվեց պահպանել տվյալները");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 relative shadow-2xl border border-slate-200 text-slate-800 my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#061A40] to-[#0A4EA3] text-white flex items-center justify-center shadow-md">
            <FileText className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {isEditing ? "Հայտի Խմբագրում" : "Նոր Հայտի Ավելացում"}
            </h2>
            <p className="text-xs text-slate-500">
              {isEditing ? `Կոդ՝ ${lead?.policyNumber || lead?.id}` : "Մուտքագրեք հաճախորդի և գործարքի տվյալները"}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Հաճախորդի Անուն / Կազմակերպություն *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  className="sil-input pl-9 font-bold"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Արմեն Կարապետյան"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Հեռախոսահամար *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="tel"
                  required
                  className="sil-input pl-9 font-bold"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+374 91 000000"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Էլ․ Փոստ</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  className="sil-input pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@mail.am"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Ապահովագրատեսակ</label>
              <select
                className="sil-input font-bold"
                value={productType}
                onChange={(e) => setProductType(e.target.value as any)}
              >
                <option value="casco">ԿԱՍԿՈ Ավտո</option>
                <option value="property">Անշարժ Գույք</option>
                <option value="mortgage">Հիփոթեքային</option>
                <option value="health">Առողջություն</option>
                <option value="travel">Ճանապարհորդություն</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Հայտի Կարգավիճակ</label>
              <select
                className="sil-input font-bold"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="pending">🟡 Նոր հայտ (Pending)</option>
                <option value="contacted">🔵 Կապ է հաստատվել</option>
                <option value="quote_sent">🟣 Գնառաջարկն ուղարկված է</option>
                <option value="closed">🟢 Կնքված (Won / Closed)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Կանխատեսվող Վճար (֏)</label>
              <input
                type="number"
                step="5000"
                className="sil-input font-black text-slate-900"
                value={estimatedPremium}
                onChange={(e) => setEstimatedPremium(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Վավերականության Ամսաթիվ</label>
              <input
                type="date"
                className="sil-input"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Օբյեկտի Բնութագիր (Ավտոմեքենա / Գույք / Ուղղություն)</label>
            <input
              type="text"
              className="sil-input font-medium"
              placeholder="Օր․՝ Toyota Camry 2.5 (2022թ.), Կենտրոն բնակարան 90քմ..."
              value={vehicleOrPropertyDetails}
              onChange={(e) => setVehicleOrPropertyDetails(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Նշումներ և Լրացուցիչ Տեղեկություն</label>
            <textarea
              rows={3}
              className="sil-input font-medium resize-none"
              placeholder="Գործարքի նշումներ, հաճախորդի պահանջներ, բանկի պայմաններ..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Չեղարկել
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <Save size={16} />
              <span>{saving ? "Պահպանվում է..." : "Պահպանել Փոփոխությունները"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
