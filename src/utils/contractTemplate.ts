import { QuotationProposal } from "../types";
import { formatCurrency } from "./insuranceCalculator";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export interface ContractGenerationData {
  contractNumber: string;
  policyNumber: string;
  signDate: string;
  startDate: string;
  endDate: string;
  clientName: string;
  clientPassportOrTaxId: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  insuredObject: string;
  totalSumInsured: number | string;
  currency: string;
  annualPremium: number | string;
  paymentSchedule: string;
  franchiseDescription: string;
  beneficiaryDetails: string;
  coveredPerilsList: string[];
  specialConditions: string;
  productSpecificDetails?: Record<string, any>;
  productId: string;
  productNameArm: string;
  insurerSignatory?: string;
}

const esc = (value: unknown) => String(value ?? "—")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#039;");

export function contractTemplateCss(): string {
  return `
    .contract-container {
      font-family: 'Segoe UI', Arial, -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1a202c;
      line-height: 1.5;
      background: #fff;
    }
    .contract-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 36px 44px;
      background: #ffffff;
      box-sizing: border-box;
      position: relative;
    }
    .contract-header {
      border-bottom: 2px solid #003399;
      padding-bottom: 14px;
      margin-bottom: 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .contract-logo-title {
      font-size: 20px;
      font-weight: 900;
      color: #003399;
      letter-spacing: -0.5px;
    }
    .contract-logo-sub {
      font-size: 11px;
      color: #4a5568;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .contract-title-box {
      text-align: center;
      margin: 20px 0;
      padding: 10px 16px;
      background: #f0f5ff;
      border: 1px solid #cce0ff;
      border-radius: 8px;
    }
    .contract-main-title {
      font-size: 16px;
      font-weight: 800;
      color: #00235b;
      margin: 0 0 4px 0;
      text-transform: uppercase;
    }
    .contract-sub-title {
      font-size: 13px;
      color: #0066ff;
      font-weight: 700;
      margin: 0;
    }
    .contract-meta-bar {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 18px;
    }
    .contract-section {
      margin-bottom: 16px;
    }
    .contract-section-title {
      font-size: 13px;
      font-weight: 800;
      color: #003399;
      background: #f7fafc;
      padding: 5px 10px;
      border-left: 4px solid #003399;
      margin: 0 0 8px 0;
    }
    .contract-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 10px;
    }
    .contract-table th, .contract-table td {
      border: 1px solid #cbd5e0;
      padding: 7px 10px;
      text-align: left;
      vertical-align: top;
    }
    .contract-table th {
      background-color: #ebf4ff;
      color: #1a365d;
      font-weight: 700;
      width: 32%;
    }
    .contract-table td {
      background-color: #ffffff;
      color: #2d3748;
    }
    .contract-list {
      margin: 4px 0;
      padding-left: 20px;
      font-size: 12px;
    }
    .contract-list li {
      margin-bottom: 3px;
    }
    .contract-signatures {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px dashed #cbd5e0;
      font-size: 12px;
    }
    .contract-sig-block {
      width: 48%;
      line-height: 1.6;
    }
    .contract-sig-line {
      margin-top: 40px;
      border-bottom: 1px solid #2d3748;
      padding-bottom: 4px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #4a5568;
    }
    .contract-seal-box {
      margin-top: 10px;
      font-size: 10px;
      color: #718096;
      text-align: center;
      border: 1px dashed #cbd5e0;
      padding: 6px;
      border-radius: 4px;
    }
  `;
}

export function generateContractHtml(data: ContractGenerationData): string {
  const sumInsuredDisplay = typeof data.totalSumInsured === "number" 
    ? formatCurrency(data.totalSumInsured, data.currency as any)
    : `${data.totalSumInsured} ${data.currency}`;

  const premiumDisplay = typeof data.annualPremium === "number"
    ? formatCurrency(data.annualPremium, data.currency as any)
    : `${data.annualPremium} ${data.currency}`;

  const perilsListHtml = data.coveredPerilsList && data.coveredPerilsList.length > 0
    ? `<ul class="contract-list">${data.coveredPerilsList.map(p => `<li>${esc(p)}</li>`).join("")}</ul>`
    : esc("Համաձայն ապահովագրության ստանդարտ կանոնների և պայմանների");

  return `
    <div class="contract-container" id="contract-document">
      <div class="contract-page">
        <!-- HEADER -->
        <div class="contract-header">
          <div>
            <div class="contract-logo-title">SIL INSURANCE</div>
            <div class="contract-logo-sub">«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ • ՀՀ ԿԲ Լիցենզիա N 0004</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #4a5568;">
            <div>ՀՀ, ք. Երևան, Արամի 3</div>
            <div>Հեռ.՝ +374 (60) 54-00-00</div>
            <div>www.silinsurance.am</div>
          </div>
        </div>

        <!-- TITLE -->
        <div class="contract-title-box">
          <h1 class="contract-main-title">ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆԱԳԻՐ / ՎԿԱՅԱԳԻՐ N ${esc(data.contractNumber || data.policyNumber)}</h1>
          <div class="contract-sub-title">${esc(data.productNameArm.toUpperCase())}</div>
        </div>

        <!-- META BAR -->
        <div class="contract-meta-bar">
          <div>Կնքման վայր՝ ք. Երևան</div>
          <div>Կնքման ամսաթիվ՝ <strong>${esc(data.signDate)}</strong></div>
          <div>Պոլիսի N՝ <strong>${esc(data.policyNumber)}</strong></div>
        </div>

        <!-- PREAMBLE -->
        <p style="font-size: 12px; line-height: 1.5; color: #2d3748; margin-bottom: 16px; text-align: justify;">
          <strong>«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» Ապահովագրական ՓԲԸ-ն</strong> (այսուհետ՝ «Ապահովագրող»), ի դեմս Գլխավոր տնօրենի, ով գործում է Ընկերության կանոնադրության հիման վրա, մի կողմից, և <strong>${esc(data.clientName)}</strong>-ը (այսուհետ՝ «Ապահովադիր»), մյուս կողմից (միասին՝ «Կողմեր»), կնքեցին սույն Ապահովագրության Պայմանագիրը հետևյալ պայմաններով.
        </p>

        <!-- 1. PARTIES & INSURED OBJECT -->
        <div class="contract-section">
          <div class="contract-section-title">1. ԱՊԱՀՈՎԱԴԻՐ ԵՎ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՕԲՅԵԿՏ</div>
          <table class="contract-table">
            <tr>
              <th>Ապահովադիր</th>
              <td><strong>${esc(data.clientName)}</strong></td>
            </tr>
            <tr>
              <th>Անձնագիր / ՀԾՀ / ՀՎՀՀ</th>
              <td>${esc(data.clientPassportOrTaxId)}</td>
            </tr>
            <tr>
              <th>Հասցե և կոնտակտ</th>
              <td>${esc(data.clientAddress)} | ${esc(data.clientPhone)} | ${esc(data.clientEmail)}</td>
            </tr>
            <tr>
              <th>Ապահովագրության օբյեկտ</th>
              <td><strong>${esc(data.insuredObject)}</strong></td>
            </tr>
            ${data.beneficiaryDetails ? `
            <tr>
              <th>Շահառու</th>
              <td>${esc(data.beneficiaryDetails)}</td>
            </tr>` : ""}
          </table>
        </div>

        <!-- 2. FINANCIAL TERMS -->
        <div class="contract-section">
          <div class="contract-section-title">2. ԱՊԱՀՈՎԱԳՐԱԿԱՆ ԳՈՒՄԱՐ, ՍԱԿԱԳԻՆ ԵՎ ԱՊԱՀՈՎԱԳՐԱՎՃԱՐ</div>
          <table class="contract-table">
            <tr>
              <th>Ապահովագրական գումար</th>
              <td><strong style="color: #003399; font-size: 13px;">${sumInsuredDisplay}</strong></td>
            </tr>
            <tr>
              <th>Ապահովագրավճար</th>
              <td><strong style="color: #003399; font-size: 13px;">${premiumDisplay}</strong></td>
            </tr>
            <tr>
              <th>Վճարման կարգ և գրաֆիկ</th>
              <td>${esc(data.paymentSchedule)}</td>
            </tr>
            <tr>
              <th>Չհատուցվող գումար (Ֆրանշիզա)</th>
              <td>${esc(data.franchiseDescription)}</td>
            </tr>
          </table>
        </div>

        <!-- 3. PERIOD & COVERAGE -->
        <div class="contract-section">
          <div class="contract-section-title">3. ԳՈՐԾՈՂՈՒԹՅԱՆ ԺԱՄԿԵՏ ԵՎ ԱՊԱՀՈՎԱԳՐԱԿԱՆ ԾԱԾԿՈՒՅԹ</div>
          <table class="contract-table">
            <tr>
              <th>Գործողության ժամկետ</th>
              <td>Սկիզբ՝ <strong>${esc(data.startDate)}</strong> — Ավարտ՝ <strong>${esc(data.endDate)}</strong> ներառյալ</td>
            </tr>
            <tr>
              <th>Ծածկվող ռիսկեր</th>
              <td>${perilsListHtml}</td>
            </tr>
            ${data.specialConditions ? `
            <tr>
              <th>Հատուկ պայմաններ</th>
              <td>${esc(data.specialConditions)}</td>
            </tr>` : ""}
          </table>
        </div>

        <!-- 4. GENERAL TERMS -->
        <div class="contract-section">
          <div class="contract-section-title">4. ԸՆԴՀԱՆՈՒՐ ԴՐՈՒՅԹՆԵՐ ԵՎ ԻՐԱՎՈՒՆՔ</div>
          <p style="font-size: 11px; color: #4a5568; line-height: 1.4; margin: 4px 0; text-align: justify;">
            4.1. Ապահովագրական հատուցման վճարումն իրականացվում է Ապահովագրողի կանոնների և ՀՀ օրենսդրության համաձայն՝ պատահարի մասին պատշաճ ծանուցումից և անհրաժեշտ փաստաթղթերի ներկայացումից հետո:
            <br>
            4.2. Պայմանագրից բխող վեճերը լուծվում են բանակցությունների միջոցով, իսկ համաձայնության չգալու դեպքում՝ Ֆինանսական համակարգի հաշտարարի կամ ՀՀ դատարանների միջոցով:
          </p>
        </div>

        <!-- 5. SIGNATURES -->
        <div class="contract-signatures">
          <div class="contract-sig-block">
            <strong style="color: #003399;">ԱՊԱՀՈՎԱԳՐՈՂ՝</strong><br>
            <strong>«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ</strong><br>
            Հասցե՝ ՀՀ, ք. Երևան, Արամի 3<br>
            ՀՎՀՀ՝ 02542158, Հ/Հ՝ 11500123456789<br>
            Հեռ.՝ +374 (60) 54-00-00<br>
            <div class="contract-sig-line">
              <span>Ստորագրություն / Կնիք</span>
              <span>/ Լիազորված անձ /</span>
            </div>
            <div class="contract-seal-box">Կ.Տ. (Կնիքի տեղ)</div>
          </div>

          <div class="contract-sig-block">
            <strong style="color: #003399;">ԱՊԱՀՈՎԱԴԻՐ՝</strong><br>
            <strong>${esc(data.clientName)}</strong><br>
            Հասցե՝ ${esc(data.clientAddress)}<br>
            ՀՎՀՀ / Անձնագիր՝ ${esc(data.clientPassportOrTaxId)}<br>
            Հեռ.՝ ${esc(data.clientPhone)}<br>
            <div class="contract-sig-line">
              <span>Ստորագրություն</span>
              <span>/ ${esc(data.clientName)} /</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function compileContractFromProposal(
  proposal: QuotationProposal, 
  customOverrides?: Partial<ContractGenerationData>
): ContractGenerationData {
  const today = new Date().toLocaleDateString("hy-AM");
  const defaultPolNum = proposal.policyNumber || `SIL-POL-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const defaultContractNum = `SIL-CTR-${new Date().getFullYear()}/${proposal.quotationNumber.replace(/[^0-9]/g, "").slice(-4) || Math.floor(1000 + Math.random() * 9000)}`;

  let insuredObjectDesc = proposal.objectDescription || "";
  const d = proposal.productSpecificDetails || {};

  if (proposal.type === "casco") {
    insuredObjectDesc = [
      d.vehicleModel || d.vehicle || "Ավտոմեքենա",
      d.vehicleYear ? `${d.vehicleYear} թ.` : "",
      d.licensePlate ? `Հ/հ՝ ${d.licensePlate}` : "",
      d.vin ? `VIN՝ ${d.vin}` : ""
    ].filter(Boolean).join(", ");
  } else if (proposal.type === "property") {
    insuredObjectDesc = [
      d.propertyAddress || "Անշարժ գույք",
      d.propertyArea ? `${d.propertyArea} քմ` : "",
      d.purpose ? `Նշանակություն՝ ${d.purpose}` : ""
    ].filter(Boolean).join(", ");
  } else if (proposal.type === "cargo") {
    insuredObjectDesc = [
      d.cargoType || "Բեռ",
      d.routeFrom && d.routeTo ? `Երթուղի՝ ${d.routeFrom} ➔ ${d.routeTo}` : "",
      d.transportMode ? `Փոխադրամիջոց՝ ${d.transportMode}` : ""
    ].filter(Boolean).join(", ");
  }

  if (!insuredObjectDesc) {
    insuredObjectDesc = proposal.productNameArm;
  }

  const baseData: ContractGenerationData = {
    contractNumber: defaultContractNum,
    policyNumber: defaultPolNum,
    signDate: today,
    startDate: proposal.date || today,
    endDate: proposal.validUntil || new Date(Date.now() + 365 * 86400000).toLocaleDateString("hy-AM"),
    clientName: proposal.clientName || "Ապահովադիր",
    clientPassportOrTaxId: (d.taxId || d.passportId || "—"),
    clientAddress: (d.address || d.propertyAddress || "ՀՀ, ք. Երևան"),
    clientPhone: proposal.contactInfo || "",
    clientEmail: d.email || "",
    insuredObject: insuredObjectDesc,
    totalSumInsured: proposal.totalSumInsured,
    currency: proposal.currency,
    annualPremium: proposal.annualPremium,
    paymentSchedule: proposal.paymentTerms || "Միանվագ վճարում 3 բանկային օրվա ընթացքում",
    franchiseDescription: proposal.franchiseDescription || "Ֆրանշիզա չի կիրառվում",
    beneficiaryDetails: proposal.beneficiaryDetails || "Ապահովադիր",
    coveredPerilsList: proposal.coveredPerilsList || [],
    specialConditions: proposal.specialConditions?.join("; ") || "",
    productSpecificDetails: proposal.productSpecificDetails || {},
    productId: proposal.type,
    productNameArm: proposal.productNameArm,
  };

  return { ...baseData, ...(customOverrides || {}) };
}

export function generateContractDocxCompatibleHtml(data: ContractGenerationData): string {
  const body = generateContractHtml(data);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SIL Insurance Contract ${data.contractNumber}</title><style>${contractTemplateCss()} body{margin:0;background:#fff}.contract-page{margin:0 auto}</style></head><body>${body}</body></html>`;
}

export async function copyContractForWord(data: ContractGenerationData): Promise<boolean> {
  try {
    const html = generateContractDocxCompatibleHtml(data);
    const blob = new Blob([html], { type: "text/html" });
    const textBlob = new Blob([`SIL Insurance Contract ${data.contractNumber}\n${data.clientName}`], { type: "text/plain" });

    if (navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": blob,
          "text/plain": textBlob,
        }),
      ]);
      return true;
    } else {
      const listener = (e: ClipboardEvent) => {
        e.clipboardData?.setData("text/html", html);
        e.clipboardData?.setData("text/plain", `${data.contractNumber} - ${data.clientName}`);
        e.preventDefault();
      };
      document.addEventListener("copy", listener);
      document.execCommand("copy");
      document.removeEventListener("copy", listener);
      return true;
    }
  } catch (err) {
    console.error("Copy contract failed:", err);
    return false;
  }
}

export function downloadContractAsWordDoc(data: ContractGenerationData): void {
  const html = generateContractDocxCompatibleHtml(data);
  const blob = new Blob(["\ufeff" + html], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SIL_Contract_${data.contractNumber.replace(/[\/\\]/g, "_")}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadContractAsPdf(data: ContractGenerationData): Promise<void> {
  const element = document.getElementById("contract-document");
  if (!element) throw new Error("Պայմանագրի փաստաթուղթը չի գտնվել։");
  try { await (document as Document & { fonts?: FontFaceSet }).fonts?.ready; } catch {}

  const pages = Array.from(element.querySelectorAll(".contract-page")) as HTMLElement[];
  if (!pages.length) throw new Error("Պայմանագրի էջերը չեն գտնվել։");

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const canvas = await html2canvas(page, {
      scale: Math.min(2, Math.max(1, window.devicePixelRatio || 1)),
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 15000,
    });
    if (!canvas.width || !canvas.height) throw new Error(`Չհաջողվեց պատրաստել PDF-ի ${i + 1}-րդ էջը։`);
    if (i > 0) pdf.addPage();
    const image = canvas.toDataURL("image/jpeg", 0.96);
    pdf.addImage(image, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
  }

  const safeNumber = data.contractNumber.replace(/[\\/]/g, "_");
  pdf.save(`SIL_Contract_${safeNumber}.pdf`);
}
