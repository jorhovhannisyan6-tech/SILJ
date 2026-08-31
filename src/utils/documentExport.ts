import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { QuotationProposal } from "../types";
import { generateQuotationTemplateHtml, quotationTemplateCss, QuotationLanguage } from "./quotationTemplate";

export function generateDocxCompatibleHtml(proposal: QuotationProposal, lang: QuotationLanguage = "hy"): string {
  const body = generateQuotationTemplateHtml(proposal, lang);
  return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <title>SIL Insurance Quotation ${proposal.quotationNumber}</title>
  <style>
    @page Section1 {
      size: 595.3pt 841.9pt;
      margin: 36pt 36pt 36pt 36pt;
      mso-header-margin: 35.4pt;
      mso-footer-margin: 35.4pt;
      mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
    body { font-family: Arial, "Helvetica Neue", sans-serif; font-size: 10.5pt; color: #111; margin: 0; padding: 0; background: #fff; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; }
    td, th { border: 1pt solid #222222; padding: 5pt 7pt; vertical-align: top; font-size: 10pt; }
    th, .blue-cell { background-color: #b8d2e9 !important; font-weight: bold; }
    .quote-page { page-break-after: always; mso-break-type: section-break; margin-bottom: 24pt; }
    ${quotationTemplateCss()}
  </style>
</head>
<body>
  <div class="Section1">
    ${body}
  </div>
</body>
</html>`;
}

export async function copyProposalForWord(proposal: QuotationProposal, lang: QuotationLanguage = "hy"): Promise<boolean> {
  try {
    const html = generateDocxCompatibleHtml(proposal, lang);
    const blob = new Blob([html], { type: "text/html" });
    const textBlob = new Blob([proposal.quotationNumber + "\n" + proposal.clientName], { type: "text/plain" });

    if (navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": blob,
          "text/plain": textBlob,
        }),
      ]);
      return true;
    } else {
      // Fallback
      const listener = (e: ClipboardEvent) => {
        e.clipboardData?.setData("text/html", html);
        e.clipboardData?.setData("text/plain", `${proposal.quotationNumber} - ${proposal.clientName}`);
        e.preventDefault();
      };
      document.addEventListener("copy", listener);
      document.execCommand("copy");
      document.removeEventListener("copy", listener);
      return true;
    }
  } catch (err) {
    console.error("Copy failed:", err);
    return false;
  }
}

export function downloadProposalAsWordDoc(proposal: QuotationProposal, lang: QuotationLanguage = "hy"): void {
  const html = generateDocxCompatibleHtml(proposal, lang);
  const blob = new Blob(["\ufeff" + html], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SIL_Quotation_${proposal.quotationNumber.replace(/[\/\\]/g, "_")}_${lang.toUpperCase()}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


/**
 * Creates a real downloadable PDF from the quotation document already rendered in the UI.
 * This does not rely on window.print(), browser print dialogs, or the AI Studio preview frame.
 */
export async function downloadProposalAsPdf(proposal: QuotationProposal): Promise<void> {
  const element = document.getElementById("quotation-document");
  if (!element) throw new Error("Գնառաջարկի փաստաթուղթը չի գտնվել։");
  try { await (document as Document & { fonts?: FontFaceSet }).fonts?.ready; } catch {}

  const pages = Array.from(element.querySelectorAll(".quote-page")) as HTMLElement[];
  if (!pages.length) throw new Error("Գնառաջարկի էջերը չեն գտնվել։");

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
      onclone: (doc) => {
        const cloned = doc.querySelectorAll(".quote-page") as NodeListOf<HTMLElement>;
        cloned.forEach((el) => { el.style.margin = "0"; el.style.boxShadow = "none"; });
      },
    });
    if (!canvas.width || !canvas.height) throw new Error(`Չհաջողվեց պատրաստել PDF-ի ${i + 1}-րդ էջը։`);
    if (i > 0) pdf.addPage();
    const image = canvas.toDataURL("image/jpeg", 0.96);
    pdf.addImage(image, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
  }

  const safeNumber = proposal.quotationNumber.replace(/[\\/]/g, "_");
  pdf.save(`SIL_Quotation_${safeNumber}.pdf`);
}

