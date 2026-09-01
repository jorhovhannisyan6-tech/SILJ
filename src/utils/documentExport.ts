import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { QuotationProposal } from "../types";
import { generateQuotationTemplateHtml, quotationTemplateCss, QuotationLanguage } from "./quotationTemplate";

export function generateDocxCompatibleHtml(proposal: QuotationProposal, lang: QuotationLanguage = "hy"): string {
  const body = generateQuotationTemplateHtml(proposal, lang);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SIL Insurance Quotation ${proposal.quotationNumber}</title><style>${quotationTemplateCss()} body{margin:0;background:#fff}.quote-page{margin:0 auto}</style></head><body>${body}</body></html>`;
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

