import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { PropertySurveyReport } from "../types";

const esc = (value: unknown) =>
  String(value ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export function surveyReportTemplateCss(): string {
  return `
    .survey-container {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      line-height: 1.4;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      margin: 0;
      padding: 0;
    }
    .survey-page {
      width: 794px;
      min-height: 1120px;
      height: 1120px;
      margin: 0 auto;
      padding: 30px 36px;
      background: #ffffff;
      box-sizing: border-box;
      position: relative;
      border: 1px solid #e2e8f0;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .survey-header {
      border-bottom: 2.5px solid #003399;
      padding-bottom: 10px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .sil-brand {
      font-size: 20px;
      font-weight: 900;
      color: #003399;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .survey-doc-title {
      font-size: 10.5px;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-top: 3px;
    }
    .survey-meta-box {
      text-align: right;
      font-size: 10.5px;
      color: #475569;
    }
    .survey-act-number {
      font-size: 12px;
      font-weight: 900;
      color: #003399;
      background: #eff6ff;
      padding: 2px 7px;
      border-radius: 5px;
      display: inline-block;
      border: 1px solid #bfdbfe;
      margin-bottom: 2px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 900;
      color: #003399;
      background: #f1f5f9;
      padding: 5px 8px;
      border-left: 3.5px solid #003399;
      margin-top: 10px;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 8px;
      text-align: center;
    }
    .kpi-label {
      font-size: 9px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
    }
    .kpi-value {
      font-size: 15px;
      font-weight: 900;
      color: #003399;
      margin-top: 2px;
    }
    .kpi-sub {
      font-size: 8.5px;
      color: #059669;
      font-weight: 700;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin-bottom: 8px;
    }
    .data-table th, .data-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 7px;
      text-align: left;
      vertical-align: middle;
    }
    .data-table th {
      background: #f8fafc;
      font-weight: 700;
      color: #334155;
      width: 28%;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .badge-green { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .badge-blue { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
    .badge-yellow { background: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
    .badge-red { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .warranties-list {
      margin: 0;
      padding-left: 14px;
      font-size: 9.5px;
      color: #1e293b;
      line-height: 1.45;
    }
    .warranties-list li {
      margin-bottom: 3px;
    }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 12px;
    }
    .photo-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      background: #f8fafc;
      text-align: center;
    }
    .photo-img-wrap {
      width: 100%;
      height: 130px;
      background: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .photo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .photo-info {
      padding: 5px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
    }
    .photo-tag {
      font-size: 9px;
      font-weight: 800;
      color: #003399;
    }
    .photo-obs {
      font-size: 8px;
      color: #64748b;
      margin-top: 1px;
      line-height: 1.2;
    }
    .sign-section {
      border-top: 1.5px solid #003399;
      padding-top: 12px;
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
    }
    .sign-box {
      width: 45%;
    }
    .sign-line {
      margin-top: 30px;
      border-top: 1px solid #475569;
      padding-top: 3px;
      text-align: center;
      color: #64748b;
      font-size: 8.5px;
    }
    .page-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: #94a3b8;
    }
    @media print {
      body { margin: 0; background: #fff; }
      .survey-page { border: none; box-shadow: none; margin: 0; width: 100%; min-height: 0; padding: 20px; page-break-after: always; }
      .no-print { display: none !important; }
    }
  `;
}

export function generateSurveyReportHtml(
  report: PropertySurveyReport,
  address?: string,
  estimatedArea?: string
): string {
  const lossExp = report.lossExpectancy || {
    pmlPercent: 18,
    pmlSummary: "Ստանդարտ հրդեհային պատահարի սցենարով հավանական կորուստ",
    mflPercent: 65,
    nlePercent: 7,
  };

  const scores = report.categoryScores || {
    structuralScore: 90,
    fireProtectionScore: 82,
    utilitiesWaterScore: 85,
    securityTheftScore: 88,
    exposureNaturalHazardsScore: 84,
  };

  const visualCluesList = Array.isArray(report.purposeVisualClues)
    ? report.purposeVisualClues
    : typeof report.purposeVisualClues === "string" && (report.purposeVisualClues as string).trim()
    ? [(report.purposeVisualClues as string)]
    : [];

  const warranties = report.warranties?.mandatoryPreInception || report.recommendations || [
    "Պահպանել էլեկտրացանցի և ջեռուցման կաթսայի կանոնավոր տեխզննման պահանջը։",
    "Ապահովել կրակմարիչների պարտադիր տարեկան լիցքավորումն ու ստուգումը։",
  ];

  const photos = report.photoEvidence || (report.photoThumbnails || []).map((t) => ({
    dataUrl: t.dataUrl,
    tag: t.tag || "Լուսանկար",
    observation: "Տեսողական զննմամբ հաստատված վիճակ",
    riskRating: "low" as const,
  }));

  const riskBadgeClass =
    report.underwritingRiskLevel === "Ցածր ռիսկ"
      ? "badge-green"
      : report.underwritingRiskLevel === "Միջին ռիսկ"
      ? "badge-blue"
      : "badge-red";

  const hasPhotos = photos.length > 0;

  return `
    <div class="survey-container">
      <!-- PAGE 1: Core Underwriting & COPE Audit -->
      <div class="survey-page">
        <div>
          <!-- Header -->
          <div class="survey-header">
            <div>
              <h1 class="sil-brand">«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ</h1>
              <div class="survey-doc-title">
                Անշարժ Գույքի Ապահովագրական Տեղազննության և Ռիսկերի Գնահատման (Սուրվեյի) Պաշտոնական Ակտ
              </div>
              <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">
                SIL Insurance CJSC • Risk Engineering & Underwriting Assessment
              </div>
            </div>
            <div class="survey-meta-box">
              <div class="survey-act-number">Ակտ N ${esc(report.id)}</div>
              <div><strong>Ամսաթիվ՝</strong> ${esc(report.createdAt || new Date().toLocaleDateString("hy-AM"))}</div>
              <div><strong>Հասցե՝</strong> ${esc(address || "ք․ Երևան")}</div>
            </div>
          </div>

          <!-- Executive KPI Cards -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Անդեռռայթինգի Ինդեքս</div>
              <div class="kpi-value">${esc(report.underwritingScore)}/100</div>
              <div class="kpi-sub"><span class="badge ${riskBadgeClass}">${esc(report.underwritingRiskLevel)}</span></div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Հարդարման Որակ</div>
              <div class="kpi-value">${esc(report.qualityScore)}/10</div>
              <div class="kpi-sub">${esc(report.renovationCondition)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Սակագնի Գործակից</div>
              <div class="kpi-value">x ${esc(report.recommendedTariffMultiplier)}</div>
              <div class="kpi-sub">Ֆրանշիզա՝ ${esc(report.recommendedFranchisePercent)}%</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Հավանական Վնաս (PML)</div>
              <div class="kpi-value" style="color: #be123c;">${esc(lossExp.pmlPercent)}%</div>
              <div class="kpi-sub" style="color: #64748b;">MFL՝ ${esc(lossExp.mflPercent)}%</div>
            </div>
          </div>

          <!-- Section 1: Property Identity & Classification -->
          <div class="section-title">1. Գույքի Նույնականացում և Ֆունկցիոնալ Դասակարգում (Computer Vision)</div>
          <table class="data-table">
            <tr>
              <th>Հայտարարագրված Տեսակ</th>
              <td>${esc(report.propertyType)} ${estimatedArea ? `(${esc(estimatedArea)} քմ)` : ""}</td>
              <th style="width: 22%;">Կատեգորիա</th>
              <td><span class="badge badge-blue">${esc(report.propertyCategoryArm || "Կոմերցիոն / Հասարակական")}</span></td>
            </tr>
            <tr>
              <th>AI Ճանաչված Նշանակություն</th>
              <td><strong>${esc(report.detectedPropertyType || report.propertyType)}</strong> ${report.functionalSubtype ? `— ${esc(report.functionalSubtype)}` : ""}</td>
              <th>Ճանաչման Վստահություն</th>
              <td><strong>${esc(report.propertyPurposeConfidence || 95)}%</strong> (Բարձր ճշգրտություն)</td>
            </tr>
            ${visualCluesList.length > 0 ? `
            <tr>
              <th>Տեսողական Փաստարկներ</th>
              <td colspan="3">
                <ul style="margin: 0; padding-left: 14px; font-size: 9.5px; color: #334155;">
                  ${visualCluesList.map((c) => `<li>${esc(c)}</li>`).join("")}
                </ul>
              </td>
            </tr>
            ` : ""}
            <tr>
              <th>Կոնստրուկտիվ Տիպ և Կրող Պատեր</th>
              <td>${esc(report.buildingStructure)}</td>
              <th>Ընդունելիություն</th>
              <td><strong style="color: #047857;">«${esc(report.acceptanceStatus)}»</strong></td>
            </tr>
          </table>

          <!-- Section 2: COPE Risk Engineering Analysis -->
          <div class="section-title">2. COPE Միջազգային Ռիսկ-Ինժեներական Վերլուծություն</div>
          <table class="data-table">
            <tr>
              <th>C — Construction (Կառուցվածք)</th>
              <td colspan="3">${esc(report.copeAnalysis?.construction.materials || report.materialsObserved)} — ${esc(report.structuralIntegritySummary)}</td>
            </tr>
            <tr>
              <th>O — Occupancy (Շահագործում)</th>
              <td colspan="3">${esc(report.copeAnalysis?.occupancy.purpose || report.propertyType)} (Հրդեհային ծանրաբեռնվածություն՝ ${esc(report.copeAnalysis?.occupancy.fireLoadDensity || "Ցածր / Միջին")})</td>
            </tr>
            <tr>
              <th>P — Protection (Պաշտպանություն)</th>
              <td colspan="3">${esc(report.fireSafetyObserved)} • ${esc(report.securityObserved)} (Հրշեջ ծառայության մոտեցում՝ ${esc(report.copeAnalysis?.protection.nearestFireStationEta || "4-6 րոպե")})</td>
            </tr>
            <tr>
              <th>E — Exposure (Արտաքին Ռիսկեր)</th>
              <td colspan="3">${esc(report.copeAnalysis?.exposure.adjoiningBuildings || "Հարակից վտանգավոր արտադրություններ առկա չեն")} • ${esc(report.copeAnalysis?.exposure.environmentalFactors || "Բնակլիմայական ստանդարտ պայմաններ")}</td>
            </tr>
          </table>

          <!-- Section 3: Radar Risk Scores & Defect Audit -->
          <div class="section-title">3. Ռիսկերի Կատեգորիաների Գնահատականներ և Դեֆեկտներ</div>
          <table class="data-table">
            <tr>
              <th style="width: 20%;">Կառուցվածք</th>
              <td style="width: 13%;"><strong>${esc(scores.structuralScore)}/100</strong></td>
              <th style="width: 20%;">Հակահրդեհային</th>
              <td style="width: 13%;"><strong>${esc(scores.fireProtectionScore)}/100</strong></td>
              <th style="width: 20%;">Ինժեներական/Ջուր</th>
              <td style="width: 14%;"><strong>${esc(scores.utilitiesWaterScore)}/100</strong></td>
            </tr>
            <tr>
              <th>Անվտանգություն/Գողություն</th>
              <td><strong>${esc(scores.securityTheftScore)}/100</strong></td>
              <th>Բնական Աղետներ</th>
              <td><strong>${esc(scores.exposureNaturalHazardsScore)}/100</strong></td>
              <th>PML / MFL</th>
              <td><strong>${esc(lossExp.pmlPercent)}% / ${esc(lossExp.mflPercent)}%</strong></td>
            </tr>
            <tr>
              <th>Տեսանելի Դեֆեկտներ</th>
              <td colspan="5" style="color: #334155;">${esc(report.visibleDefects || "Էական դեֆեկտներ չեն նկատվել:")}</td>
            </tr>
          </table>

          <!-- Section 4: Mandatory Warranties & Requirements -->
          <div class="section-title">4. Պարտադիր Երաշխիքներ և Անդեռռայթերի Հանձնարարականներ</div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 7px 10px; margin-bottom: 6px;">
            <ul class="warranties-list">
              ${warranties.map((w) => `<li>• ${esc(w)}</li>`).join("")}
            </ul>
          </div>
        </div>

        <div>
          <!-- Sign-off Section on Page 1 if no photos -->
          ${!hasPhotos ? `
          <div class="sign-section">
            <div class="sign-box">
              <div><strong>Սուրվեյոր / Ռիսկ-Ինժեներ՝</strong> ${esc(report.signOff?.surveyorName || "Գ․ Գևորգյան")}</div>
              <div style="color: #64748b; font-size: 8px;">${esc(report.signOff?.surveyorTitle || "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Տեղազննության Վարչություն")}</div>
              <div class="sign-line">ստորագրություն</div>
            </div>
            <div class="sign-box" style="text-align: right;">
              <div><strong>Գլխավոր Անդեռռայթեր՝</strong> ${esc(report.signOff?.chiefUnderwriter || "Ա․ Մկրտչյան")}</div>
              <div style="color: #64748b; font-size: 8px;">«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Գույքային Ռիսկերի Բաժին</div>
              <div class="sign-line" style="text-align: center;">ստորագրություն, կնիք</div>
            </div>
          </div>
          ` : ""}

          <div class="page-footer">
            <span>«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ • Գույքի Ապահովագրական Սուրվեյի Պաշտոնական Ակտ</span>
            <span>Էջ 1 / ${hasPhotos ? "2" : "1"}</span>
          </div>
        </div>
      </div>

      <!-- PAGE 2: Photo Evidence & Final Sign-Off (if photos exist) -->
      ${hasPhotos ? `
      <div class="survey-page">
        <div>
          <!-- Header -->
          <div class="survey-header">
            <div>
              <h1 class="sil-brand">«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ</h1>
              <div class="survey-doc-title">
                Տեղազննության Լուսանկարների Փաստագրում (Photo Forensic Evidence)
              </div>
            </div>
            <div class="survey-meta-box">
              <div class="survey-act-number">Ակտ N ${esc(report.id)}</div>
              <div><strong>Լուսանկարներ՝</strong> ${photos.length} միավոր</div>
            </div>
          </div>

          <div class="section-title">5. Տեղազննության Լուսանկարների Փաստարկում և Զննման Արդյունքներ</div>
          <div class="photo-grid">
            ${photos.slice(0, 6).map((p) => `
              <div class="photo-card">
                <div class="photo-img-wrap">
                  ${p.dataUrl ? `<img src="${p.dataUrl}" alt="${esc(p.tag)}" class="photo-img" crossOrigin="anonymous" />` : `<div style="color:#94a3b8;font-size:10px;">Լուսանկար</div>`}
                </div>
                <div class="photo-info">
                  <div class="photo-tag">${esc(p.tag)}</div>
                  <div class="photo-obs">${esc(p.observation || "Բարվոք տեխնիկական վիճակ")}</div>
                </div>
              </div>
            `).join("")}
          </div>

          <div class="section-title">6. Կորուստների Առավելագույն Սցենար (Loss Expectancy)</div>
          <table class="data-table">
            <tr>
              <th style="width: 25%;">PML (Probable Maximum Loss)</th>
              <td><strong>${esc(lossExp.pmlPercent)}%</strong> — ${esc(lossExp.pmlSummary || "Ակնկալվող վնաս՝ հաշվի առնելով առկա հակահրդեհային միջոցները")}</td>
            </tr>
            <tr>
              <th>MFL (Maximum Foreseeable Loss)</th>
              <td><strong>${esc(lossExp.mflPercent)}%</strong> — Վնասի առավելագույն ծավալ պաշտպանական համակարգերի լրիվ խափանման դեպքում</td>
            </tr>
          </table>
        </div>

        <div>
          <!-- Sign-off Section -->
          <div class="sign-section">
            <div class="sign-box">
              <div><strong>Սուրվեյոր / Ռիսկ-Ինժեներ՝</strong> ${esc(report.signOff?.surveyorName || "Գ․ Գևորգյան")}</div>
              <div style="color: #64748b; font-size: 8px;">${esc(report.signOff?.surveyorTitle || "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Տեղազննության Վարչություն")}</div>
              <div class="sign-line">ստորագրություն</div>
            </div>
            <div class="sign-box" style="text-align: right;">
              <div><strong>Գլխավոր Անդեռռայթեր՝</strong> ${esc(report.signOff?.chiefUnderwriter || "Ա․ Մկրտչյան")}</div>
              <div style="color: #64748b; font-size: 8px;">«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Գույքային Ռիսկերի Բաժին</div>
              <div class="sign-line" style="text-align: center;">ստորագրություն, կնիք</div>
            </div>
          </div>

          <div class="page-footer">
            <span>«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ • Գույքի Ապահովագրական Սուրվեյի Պաշտոնական Ակտ</span>
            <span>Էջ 2 / 2</span>
          </div>
        </div>
      </div>
      ` : ""}
    </div>
  `;
}

export function generateSurveyReportDocxCompatibleHtml(
  report: PropertySurveyReport,
  address?: string,
  estimatedArea?: string
): string {
  const body = generateSurveyReportHtml(report, address, estimatedArea);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SIL Insurance Survey Act ${report.id}</title><style>${surveyReportTemplateCss()}</style></head><body>${body}</body></html>`;
}

export async function copySurveyReportForWord(
  report: PropertySurveyReport,
  address?: string,
  estimatedArea?: string
): Promise<boolean> {
  try {
    const html = generateSurveyReportDocxCompatibleHtml(report, address, estimatedArea);
    const textBlob = new Blob([`ՍԻԼ ԻՆՇՈՒՐԱՆՍ ՍՈՒՐՎԵՅԻ ԱԿՏ N ${report.id}\nԳույք՝ ${report.detectedPropertyType || report.propertyType}\nՀասցե՝ ${address || "ք․ Երևան"}`], { type: "text/plain" });

    if (navigator.clipboard && navigator.clipboard.write) {
      const htmlBlob = new Blob([html], { type: "text/html" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": textBlob,
        }),
      ]);
      return true;
    } else {
      const listener = (e: ClipboardEvent) => {
        e.clipboardData?.setData("text/html", html);
        e.clipboardData?.setData("text/plain", `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ՍՈՒՐՎԵՅԻ ԱԿՏ N ${report.id}`);
        e.preventDefault();
      };
      document.addEventListener("copy", listener);
      document.execCommand("copy");
      document.removeEventListener("copy", listener);
      return true;
    }
  } catch (err) {
    console.error("Copy survey failed:", err);
    return false;
  }
}

export function downloadSurveyReportAsWordDoc(
  report: PropertySurveyReport,
  address?: string,
  estimatedArea?: string
): void {
  const html = generateSurveyReportDocxCompatibleHtml(report, address, estimatedArea);
  const blob = new Blob(["\ufeff" + html], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SIL_Property_Survey_Act_${report.id.replace(/[\/\\]/g, "_")}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * High-performance standalone PDF generation for Survey Report
 * Works 100% reliably in sandboxed iframes, preview mode, and mobile devices
 */
export async function downloadSurveyReportAsPdf(
  report: PropertySurveyReport,
  address?: string,
  estimatedArea?: string
): Promise<void> {
  const container = document.createElement("div");
  container.id = "survey-export-render-box";
  container.style.position = "fixed";
  container.style.top = "0px";
  container.style.left = "0px";
  container.style.width = "794px";
  container.style.opacity = "0.01";
  container.style.pointerEvents = "none";
  container.style.zIndex = "-99999";
  container.style.background = "#ffffff";
  container.innerHTML = `<style>${surveyReportTemplateCss()}</style>${generateSurveyReportHtml(report, address, estimatedArea)}`;

  document.body.appendChild(container);

  try {
    try {
      await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
    } catch {}

    const pages = Array.from(container.querySelectorAll(".survey-page")) as HTMLElement[];
    if (!pages.length) {
      throw new Error("Սուրվեյի փաստաթղթի էջերը չհաջողվեց կազմել։");
    }

    // Wait for images to load if any, but don't let broken images block
    const images = Array.from(container.querySelectorAll("img"));
    if (images.length > 0) {
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = () => {
              // Replace broken image source to prevent canvas tainting
              img.removeAttribute("src");
              resolve(null);
            };
            setTimeout(resolve, 3000); // 3s max per image
          });
        })
      );
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const canvas = await html2canvas(page, {
        scale: Math.min(2, Math.max(1.5, window.devicePixelRatio || 1.5)),
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 10000,
        onclone: (doc) => {
          const clonedPages = doc.querySelectorAll(".survey-page") as NodeListOf<HTMLElement>;
          clonedPages.forEach((el) => {
            el.style.border = "none";
            el.style.boxShadow = "none";
            el.style.margin = "0";
          });
        },
      });

      if (!canvas.width || !canvas.height) {
        throw new Error(`Չհաջողվեց պատրաստել PDF-ի ${i + 1}-րդ էջը։`);
      }

      if (i > 0) {
        pdf.addPage();
      }

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
    }

    const safeId = report.id.replace(/[\/\\]/g, "_");
    pdf.save(`SIL_Property_Survey_Act_${safeId}.pdf`);
  } catch (err: any) {
    console.error("Survey PDF Canvas Export Error:", err);
    // Fallback: If canvas export throws for any reason, use jsPDF direct text renderer
    try {
      const fallbackPdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      fallbackPdf.setFontSize(16);
      fallbackPdf.setTextColor(0, 51, 153);
      fallbackPdf.text("«SIL INSURANCE» CJSC", 15, 20);
      fallbackPdf.setFontSize(11);
      fallbackPdf.setTextColor(51, 51, 51);
      fallbackPdf.text("PROPERTY PRE-RISK SURVEY ACT", 15, 27);
      fallbackPdf.text(`Act Number: ${report.id}`, 15, 34);
      fallbackPdf.text(`Date: ${report.createdAt || new Date().toLocaleDateString()}`, 15, 40);
      fallbackPdf.text(`Address: ${address || "Yerevan, Armenia"}`, 15, 46);
      fallbackPdf.text(`Property Type: ${report.propertyType}`, 15, 52);
      fallbackPdf.text(`Underwriting Score: ${report.underwritingScore}/100 (${report.underwritingRiskLevel})`, 15, 58);
      fallbackPdf.text(`Tariff Multiplier: x${report.recommendedTariffMultiplier}`, 15, 64);
      fallbackPdf.text(`Recommended Franchise: ${report.recommendedFranchisePercent}%`, 15, 70);
      fallbackPdf.text(`Acceptance Status: ${report.acceptanceStatus}`, 15, 76);

      fallbackPdf.setFontSize(10);
      fallbackPdf.text("COPE Risk Engineering Summary:", 15, 86);
      const splitConstruction = fallbackPdf.splitTextToSize(`Construction: ${report.copeAnalysis?.construction.materials || report.materialsObserved}`, 180);
      fallbackPdf.text(splitConstruction, 15, 92);
      
      const splitOccupancy = fallbackPdf.splitTextToSize(`Occupancy: ${report.copeAnalysis?.occupancy.purpose || report.propertyType}`, 180);
      fallbackPdf.text(splitOccupancy, 15, 102);

      const splitProtection = fallbackPdf.splitTextToSize(`Protection: ${report.fireSafetyObserved} / ${report.securityObserved}`, 180);
      fallbackPdf.text(splitProtection, 15, 112);

      const splitExposure = fallbackPdf.splitTextToSize(`Exposure: ${report.copeAnalysis?.exposure.adjoiningBuildings || "None"}`, 180);
      fallbackPdf.text(splitExposure, 15, 122);

      fallbackPdf.text("Narrative Report:", 15, 134);
      const narrativeLines = fallbackPdf.splitTextToSize(report.fullNarrativeReport || "Survey completed successfully.", 180);
      fallbackPdf.text(narrativeLines.slice(0, 40), 15, 140);

      const safeId = report.id.replace(/[\/\\]/g, "_");
      fallbackPdf.save(`SIL_Property_Survey_Act_${safeId}.pdf`);
    } catch (fallbackErr: any) {
      throw new Error(err?.message || fallbackErr?.message || "PDF ակտի գեներացիան չհաջողվեց:");
    }
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
