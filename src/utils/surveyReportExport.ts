import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { PropertySurveyReport } from "../types";

export type ExportLanguage = "hy" | "en" | "ru";

export interface DigitalSignatureAttachment {
  signatureDataUrl: string;
  signerName: string;
  signerRoleLabel: string;
  signedAt: string;
  verificationHash: string;
}

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
      padding: 28px 34px;
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
      padding-bottom: 8px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .sil-brand {
      font-size: 19px;
      font-weight: 900;
      color: #003399;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .survey-doc-title {
      font-size: 10px;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    .survey-meta-box {
      text-align: right;
      font-size: 10px;
      color: #475569;
    }
    .survey-act-number {
      font-size: 11.5px;
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
      font-size: 10.5px;
      font-weight: 900;
      color: #003399;
      background: #f1f5f9;
      padding: 4px 8px;
      border-left: 3.5px solid #003399;
      margin-top: 8px;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 7px;
      margin-bottom: 8px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 8px;
      text-align: center;
    }
    .kpi-label {
      font-size: 8.5px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
    }
    .kpi-value {
      font-size: 13px;
      font-weight: 900;
      color: #003399;
      margin: 1px 0;
    }
    .kpi-sub {
      font-size: 8.5px;
      color: #475569;
      font-weight: 600;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
      margin-bottom: 6px;
    }
    .data-table th, .data-table td {
      border: 1px solid #cbd5e1;
      padding: 3.5px 6px;
      text-align: left;
      vertical-align: middle;
    }
    .data-table th {
      background: #f8fafc;
      color: #334155;
      font-weight: 700;
      width: 26%;
    }
    .badge {
      display: inline-block;
      padding: 1.5px 5px;
      border-radius: 4px;
      font-size: 8.5px;
      font-weight: 800;
    }
    .badge-green { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .badge-amber { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .badge-red { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .badge-blue { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    .warranties-list {
      margin: 0;
      padding-left: 14px;
      font-size: 9px;
      color: #1e293b;
      line-height: 1.35;
    }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 7px;
      margin-top: 6px;
      margin-bottom: 8px;
    }
    .photo-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      background: #ffffff;
      padding: 4px;
    }
    .photo-img {
      width: 100%;
      height: 98px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      display: block;
      background: #f1f5f9;
    }
    .photo-tag {
      font-size: 8.5px;
      font-weight: 800;
      color: #003399;
      margin-top: 3px;
    }
    .photo-desc {
      font-size: 8px;
      color: #475569;
      line-height: 1.25;
      margin-top: 1px;
      max-height: 28px;
      overflow: hidden;
    }
    .sign-section {
      display: flex;
      justify-content: space-between;
      border-top: 1.5px solid #003399;
      padding-top: 8px;
      margin-top: 8px;
      font-size: 9px;
    }
    .sign-box {
      width: 48%;
    }
    .sign-line {
      border-bottom: 1px solid #475569;
      margin-top: 16px;
      font-size: 7.5px;
      color: #64748b;
    }
    .sig-img {
      max-height: 38px;
      object-fit: contain;
      display: block;
      margin-top: 4px;
    }
    .page-footer {
      font-size: 8px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 4px;
      margin-top: 6px;
      display: flex;
      justify-content: space-between;
    }
  `;
}

export function buildSurveyReportHtml(
  report: PropertySurveyReport,
  address?: string,
  estimatedArea?: number,
  language: ExportLanguage = "hy",
  signature?: DigitalSignatureAttachment
): string {
  const isEn = language === "en";
  const isRu = language === "ru";

  const t = {
    brand: isEn ? "SIL INSURANCE CJSC" : isRu ? "ЗАО «СИЛ ИНШУРАНС»" : "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ",
    docTitle: isEn
      ? "PROPERTY RISK ENGINEERING & PRE-RISK SURVEY ACT"
      : isRu
      ? "АКТ ПРЕДСТРАХОВОГО ОСМОТРА И ОЦЕНКИ РИСКОВ (СЮРВЕЙ)"
      : "ՏԵՂԱԶՆՆՈՒԹՅԱՆ ԵՎ ՌԻՍԿԵՐԻ ԳՆԱՀԱՏՄԱՆ (ՍՈՒՐՎԵՅԻ) ՊԱՇՏՈՆԱԿԱՆ ԱԿՏ",
    subTitle: isEn
      ? "Risk Engineering & International Reinsurance Assessment Report"
      : isRu
      ? "Отдел сюрвея и оценки имущественных рисков"
      : "Տեղազննության և Ռիսկերի Գնահատման Պաշտոնական Եզրակացություն",
    actNo: isEn ? "Act No." : isRu ? "Акт №" : "Ակտ N",
    date: isEn ? "Date:" : isRu ? "Дата:" : "Ամսաթիվ՝",
    address: isEn ? "Address:" : isRu ? "Адрес:" : "Հասցե՝",
    underwritingScore: isEn ? "Underwriting Score" : isRu ? "Скоринг Андеррайтинга" : "Անդեռռայթինգի Ինդեքս",
    renovationQuality: isEn ? "Quality Rating" : isRu ? "Качество Отделки" : "Հարդարման Որակ",
    tariffMultiplier: isEn ? "Tariff Multiplier" : isRu ? "Тарифный Коэффициент" : "Սակագնի Գործակից",
    deductible: isEn ? "Deductible:" : isRu ? "Франшиза:" : "Ֆրանշիզա՝",
    pml: isEn ? "Estimated PML" : isRu ? "Макс. Убыток (PML)" : "Հավանական Վնաս (PML)",
    sec1: isEn
      ? "1. Property Identification & Occupancy (AI Vision Analysis)"
      : isRu
      ? "1. Идентификация Имущества и Назначение (AI Vision)"
      : "1. Գույքի Նույնականացում և Ֆունկցիոնալ Դասակարգում (Computer Vision)",
    declaredType: isEn ? "Declared Property Type" : isRu ? "Заявленный тип объекта" : "Հայտարարագրված Տեսակ",
    category: isEn ? "Category" : isRu ? "Категория" : "Կատեգորիա",
    detectedType: isEn ? "AI Detected Occupancy" : isRu ? "AI Распознанное Назначение" : "AI Ճանաչված Նշանակություն",
    confidence: isEn ? "Recognition Confidence" : isRu ? "Уверенность распознавания" : "Ճանաչման Վստահություն",
    visualClues: isEn ? "Visual Evidence Clues" : isRu ? "Визуальные подтверждения" : "Տեսողական Փաստարկներ",
    structure: isEn ? "Building Structure" : isRu ? "Конструкция здания" : "Կոնստրուկտիվ Տիպ և Կրող Պատեր",
    acceptance: isEn ? "Acceptance Status" : isRu ? "Статус приемлемости" : "Ընդունելիություն",
    sec2: isEn ? "2. COPE International Risk Engineering Matrix" : isRu ? "2. Международный COPE Анализ Рисков" : "2. COPE Միջազգային Ռիսկ-Ինժեներական Վերլուծություն",
    cTitle: isEn ? "C — Construction (Building Integrity)" : isRu ? "C — Construction (Конструкция)" : "C — Construction (Կառուցվածք)",
    oTitle: isEn ? "O — Occupancy (Fire Load & Use)" : isRu ? "O — Occupancy (Эксплуатация)" : "O — Occupancy (Շահագործում)",
    pTitle: isEn ? "P — Protection (Fire & Security)" : isRu ? "P — Protection (Защита и ПБ)" : "P — Protection (Պաշտպանություն)",
    eTitle: isEn ? "E — Exposure (Surrounding Hazards)" : isRu ? "E — Exposure (Внешние Риски)" : "E — Exposure (Արտաքին Ռիսկեր)",
    sec3: isEn ? "3. Category Radar Risk Scores & Defect Audit" : isRu ? "3. Оценки Категорий Рисков и Дефекты" : "3. Ռիսկերի Կատեգորիաների Գնահատականներ և Դեֆեկտներ",
    sec4: isEn ? "4. Warranties & Mandatory Underwriting Requirements" : isRu ? "4. Обязательные Оговорки и Требования" : "4. Պարտադիր Երաշխիքներ և Անդեռռայթերի Հանձնարարականներ",
    sec5: isEn ? "5. Photographic Evidence & Visual Condition Log" : isRu ? "5. Фотодокументирование и Состояние" : "5. Լուսանկարների Տեխնիկական Փաստագրում (Photo Evidence)",
    sec6: isEn ? "6. Loss Expectancy PML/MFL & Sign-Off" : isRu ? "6. Оценка Максимального Убытка и Подписи" : "6. Կորուստների Ակնկալիք (Loss Expectancy) և Ստորագրություններ",
    surveyor: isEn ? "Risk Engineer / Surveyor:" : isRu ? "Инженер-сюрвейер:" : "Սուրվեյոր / Ռիսկ-Ինժեներ՝",
    underwriter: isEn ? "Chief Underwriter:" : isRu ? "Главный Андеррайтер:" : "Գլխավոր Անդեռռայթեր՝",
    clientSign: isEn ? "Insured / Client Signature:" : isRu ? "Подпись Страхователя:" : "Ապահովադիր / Հաճախորդ՝",
  };

  const riskLevelStr = report.underwritingRiskLevel || "Ցածր ռիսկ";
  let riskBadgeClass = "badge-green";
  if (riskLevelStr.includes("Բարձր") || riskLevelStr.includes("High") || riskLevelStr.includes("Высокий")) {
    riskBadgeClass = "badge-red";
  } else if (riskLevelStr.includes("Միջին") || riskLevelStr.includes("Medium") || riskLevelStr.includes("Средний")) {
    riskBadgeClass = "badge-amber";
  }

  const scores = report.categoryScores || {
    structuralScore: 90,
    fireProtectionScore: 82,
    utilitiesWaterScore: 85,
    securityTheftScore: 88,
    exposureNaturalHazardsScore: 84,
  };

  const lossExp = report.lossExpectancy || {
    pmlPercent: 18,
    pmlSummary: isEn
      ? "Probable Maximum Loss (PML) is estimated at 15-20% under standard brigade response"
      : isRu
      ? "Вероятный максимальный ущерб (PML) оценивается в 15-20%"
      : "Հավանական առավելագույն վնասը գնահատվում է 15-20%",
    mflPercent: 65,
    nlePercent: 7,
  };

  const visualCluesList = Array.isArray(report.purposeVisualClues) ? report.purposeVisualClues : [];
  const photos = Array.isArray(report.photoEvidence) ? report.photoEvidence : [];
  const hasPhotos = photos.length > 0;

  const warranties = [
    ...(report.warranties?.mandatoryPreInception || []),
    ...(report.warranties?.advisoryImprovement || []),
    ...(report.recommendations || []),
  ].slice(0, 4);

  return `
    <div class="survey-container">
      <!-- PAGE 1: Executive Summary, COPE & Risk Ratings -->
      <div class="survey-page">
        <div>
          <!-- Header -->
          <div class="survey-header">
            <div>
              <h1 class="sil-brand">${t.brand}</h1>
              <div class="survey-doc-title">${t.docTitle}</div>
              <div style="font-size: 8px; color: #64748b; margin-top: 2px;">
                ${t.subTitle}
              </div>
            </div>
            <div class="survey-meta-box">
              <div class="survey-act-number">${t.actNo} ${esc(report.id)}</div>
              <div><strong>${t.date}</strong> ${esc(report.createdAt || new Date().toLocaleDateString("hy-AM"))}</div>
              <div><strong>${t.address}</strong> ${esc(address || "ք․ Երևան")}</div>
            </div>
          </div>

          <!-- Executive KPI Cards -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">${t.underwritingScore}</div>
              <div class="kpi-value">${esc(report.underwritingScore)}/100</div>
              <div class="kpi-sub"><span class="badge ${riskBadgeClass}">${esc(report.underwritingRiskLevel)}</span></div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">${t.renovationQuality}</div>
              <div class="kpi-value">${esc(report.qualityScore)}/10</div>
              <div class="kpi-sub">${esc(report.renovationCondition)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">${t.tariffMultiplier}</div>
              <div class="kpi-value">x ${esc(report.recommendedTariffMultiplier)}</div>
              <div class="kpi-sub">${t.deductible} ${esc(report.recommendedFranchisePercent)}%</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">${t.pml}</div>
              <div class="kpi-value" style="color: #be123c;">${esc(lossExp.pmlPercent)}%</div>
              <div class="kpi-sub" style="color: #64748b;">MFL: ${esc(lossExp.mflPercent)}%</div>
            </div>
          </div>

          <!-- Section 1: Property Identity -->
          <div class="section-title">${t.sec1}</div>
          <table class="data-table">
            <tr>
              <th>${t.declaredType}</th>
              <td>${esc(report.propertyType)} ${estimatedArea ? `(${esc(estimatedArea)} sq.m)` : ""}</td>
              <th style="width: 20%;">${t.category}</th>
              <td><span class="badge badge-blue">${esc(report.propertyCategoryArm || "Commercial / Residential")}</span></td>
            </tr>
            <tr>
              <th>${t.detectedType}</th>
              <td><strong>${esc(report.detectedPropertyType || report.propertyType)}</strong> ${report.functionalSubtype ? `— ${esc(report.functionalSubtype)}` : ""}</td>
              <th>${t.confidence}</th>
              <td><strong>${esc(report.propertyPurposeConfidence || 95)}%</strong></td>
            </tr>
            ${visualCluesList.length > 0 ? `
            <tr>
              <th>${t.visualClues}</th>
              <td colspan="3">
                <ul style="margin: 0; padding-left: 12px; font-size: 8.5px; color: #334155;">
                  ${visualCluesList.map((c) => `<li>${esc(c)}</li>`).join("")}
                </ul>
              </td>
            </tr>
            ` : ""}
            <tr>
              <th>${t.structure}</th>
              <td>${esc(report.buildingStructure)}</td>
              <th>${t.acceptance}</th>
              <td><strong style="color: #047857;">«${esc(report.acceptanceStatus)}»</strong></td>
            </tr>
          </table>

          <!-- Section 2: COPE Analysis -->
          <div class="section-title">${t.sec2}</div>
          <table class="data-table">
            <tr>
              <th>${t.cTitle}</th>
              <td colspan="3">${esc(report.copeAnalysis?.construction.materials || report.materialsObserved)} — ${esc(report.structuralIntegritySummary)}</td>
            </tr>
            <tr>
              <th>${t.oTitle}</th>
              <td colspan="3">${esc(report.copeAnalysis?.occupancy.purpose || report.propertyType)} (Fire load: ${esc(report.copeAnalysis?.occupancy.fireLoadDensity || "Low / Medium")})</td>
            </tr>
            <tr>
              <th>${t.pTitle}</th>
              <td colspan="3">${esc(report.fireSafetyObserved)} • ${esc(report.securityObserved)} (Station ETA: ${esc(report.copeAnalysis?.protection.nearestFireStationEta || "4-6 min")})</td>
            </tr>
            <tr>
              <th>${t.eTitle}</th>
              <td colspan="3">${esc(report.copeAnalysis?.exposure.adjoiningBuildings || "No hazardous adjacent occupancies")} • ${esc(report.copeAnalysis?.exposure.environmentalFactors || "Standard environmental conditions")}</td>
            </tr>
          </table>

          <!-- Section 3: Risk Scores -->
          <div class="section-title">${t.sec3}</div>
          <table class="data-table">
            <tr>
              <th style="width: 20%;">${isEn ? "Structure" : isRu ? "Конструкция" : "Կառուցվածք"}</th>
              <td style="width: 13%;"><strong>${esc(scores.structuralScore)}/100</strong></td>
              <th style="width: 20%;">${isEn ? "Fire Safety" : isRu ? "Пож. Безопасность" : "Հակահրդեհային"}</th>
              <td style="width: 13%;"><strong>${esc(scores.fireProtectionScore)}/100</strong></td>
              <th style="width: 20%;">${isEn ? "Utilities & Water" : isRu ? "Инженерия и Вода" : "Ինժեներական/Ջուր"}</th>
              <td style="width: 14%;"><strong>${esc(scores.utilitiesWaterScore)}/100</strong></td>
            </tr>
            <tr>
              <th>${isEn ? "Security" : isRu ? "Безопасность" : "Անվտանգություն"}</th>
              <td><strong>${esc(scores.securityTheftScore)}/100</strong></td>
              <th>${isEn ? "Natural Hazards" : isRu ? "Стихийные Бедствия" : "Բնական Աղետներ"}</th>
              <td><strong>${esc(scores.exposureNaturalHazardsScore)}/100</strong></td>
              <th>PML / MFL</th>
              <td><strong>${esc(lossExp.pmlPercent)}% / ${esc(lossExp.mflPercent)}%</strong></td>
            </tr>
            <tr>
              <th>${isEn ? "Visible Defects" : isRu ? "Видимые Дефекты" : "Տեսանելի Դեֆեկտներ"}</th>
              <td colspan="5" style="color: #334155;">${esc(report.visibleDefects || "No critical structural defects observed.")}</td>
            </tr>
          </table>

          <!-- Section 4: Warranties -->
          <div class="section-title">${t.sec4}</div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 9px; margin-bottom: 5px;">
            <ul class="warranties-list">
              ${warranties.map((w) => `<li>• ${esc(w)}</li>`).join("")}
            </ul>
          </div>
        </div>

        <div>
          ${!hasPhotos ? `
          <div class="sign-section">
            <div class="sign-box">
              <div><strong>${t.surveyor}</strong> ${esc(report.signOff?.surveyorName || "Գ․ Գևորգյան")}</div>
              <div style="color: #64748b; font-size: 7.5px;">${esc(report.signOff?.surveyorTitle || "SIL Insurance CJSC Survey Department")}</div>
              <div class="sign-line">signature</div>
            </div>
            <div class="sign-box" style="text-align: right;">
              <div><strong>${t.underwriter}</strong> ${esc(report.signOff?.chiefUnderwriter || "Ա․ Մկրտչյան")}</div>
              <div style="color: #64748b; font-size: 7.5px;">Property Underwriting Division</div>
              ${signature?.signatureDataUrl ? `
                <img src="${signature.signatureDataUrl}" class="sig-img" style="margin-left: auto;" alt="Digital Signature" />
                <div style="font-size: 7.5px; color: #003399; font-weight: bold;">Verified: ${signature.signerName} (${signature.verificationHash})</div>
              ` : `
                <div class="sign-line" style="text-align: center;">official signature / stamp</div>
              `}
            </div>
          </div>
          ` : ""}

          <div class="page-footer">
            <span>${t.brand} • ${t.docTitle}</span>
            <span>Page 1 / ${hasPhotos ? "2" : "1"}</span>
          </div>
        </div>
      </div>

      <!-- PAGE 2: Photo Evidence & Loss Expectancy / Final Sign-Off -->
      ${hasPhotos ? `
      <div class="survey-page">
        <div>
          <!-- Header Page 2 -->
          <div class="survey-header">
            <div>
              <h1 class="sil-brand">${t.brand}</h1>
              <div class="survey-doc-title">${t.sec5}</div>
            </div>
            <div class="survey-meta-box">
              <div class="survey-act-number">${t.actNo} ${esc(report.id)}</div>
              <div>${t.date} ${esc(report.createdAt || new Date().toLocaleDateString("hy-AM"))}</div>
            </div>
          </div>

          <!-- Photos Grid -->
          <div class="photo-grid">
            ${photos.slice(0, 6).map((p, idx) => `
              <div class="photo-card">
                <img src="${p.dataUrl}" alt="Survey Photo ${idx + 1}" class="photo-img" />
                <div class="photo-tag">Photo #${idx + 1}: ${esc(p.tag || "Inspection")}</div>
                <div class="photo-desc">${esc(p.observation || "Technical condition verified.")}</div>
              </div>
            `).join("")}
          </div>

          <!-- Loss Expectancy Box -->
          <div class="section-title">${t.sec6}</div>
          <table class="data-table">
            <tr>
              <th style="width: 30%;">Probable Maximum Loss (PML)</th>
              <td><strong>${esc(lossExp.pmlPercent)}%</strong> — ${esc(lossExp.pmlSummary)}</td>
            </tr>
            <tr>
              <th>Maximum Foreseeable Loss (MFL)</th>
              <td><strong>${esc(lossExp.mflPercent)}%</strong> (Total loss scenario assuming active firefighting failure)</td>
            </tr>
            <tr>
              <th>Normal Loss Expectancy (NLE)</th>
              <td><strong>${esc(lossExp.nlePercent || 7)}%</strong> (Expected minor loss from localized incidents)</td>
            </tr>
          </table>
        </div>

        <div>
          <!-- Sign-Off Box -->
          <div class="sign-section">
            <div class="sign-box">
              <div><strong>${t.surveyor}</strong> ${esc(report.signOff?.surveyorName || "Գ․ Գևորգյան (Ավագ Ռիսկ-Ինժեներ)")}</div>
              <div style="color: #64748b; font-size: 7.5px;">${esc(report.signOff?.surveyorTitle || "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Տեղազննության Վարչություն")}</div>
              <div class="sign-line">signature</div>
            </div>
            <div class="sign-box" style="text-align: right;">
              <div><strong>${t.underwriter}</strong> ${esc(report.signOff?.chiefUnderwriter || "Ա․ Մկրտչյան")}</div>
              <div style="color: #64748b; font-size: 7.5px;">Property Underwriting Division</div>
              ${signature?.signatureDataUrl ? `
                <img src="${signature.signatureDataUrl}" class="sig-img" style="margin-left: auto;" alt="Digital Signature" />
                <div style="font-size: 7.5px; color: #003399; font-weight: bold;">Verified: ${signature.signerName} (${signature.verificationHash})</div>
              ` : `
                <div class="sign-line" style="text-align: center;">official signature / stamp</div>
              `}
            </div>
          </div>

          <div class="page-footer">
            <span>${t.brand} • ${t.docTitle}</span>
            <span>Page 2 / 2</span>
          </div>
        </div>
      </div>
      ` : ""}
    </div>
  `;
}

export async function downloadSurveyReportAsPdf(
  report: PropertySurveyReport,
  address?: string,
  estimatedArea?: number,
  language: ExportLanguage = "hy",
  signature?: DigitalSignatureAttachment
): Promise<void> {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.zIndex = "-9999";
  container.style.opacity = "0.01";
  container.style.pointerEvents = "none";
  container.style.backgroundColor = "#ffffff";

  const styleEl = document.createElement("style");
  styleEl.innerHTML = surveyReportTemplateCss();
  container.appendChild(styleEl);

  const wrapper = document.createElement("div");
  wrapper.innerHTML = buildSurveyReportHtml(report, address, estimatedArea, language, signature);
  container.appendChild(wrapper);

  document.body.appendChild(container);

  try {
    const images = Array.from(container.querySelectorAll("img"));
    if (images.length > 0) {
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => {
              img.src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23f1f5f9' width='100' height='100'/%3E%3Ctext fill='%2394a3b8' font-size='10' x='50' y='50' text-anchor='middle'%3EPhoto%3C/text%3E%3C/svg%3E";
              resolve();
            };
            setTimeout(resolve, 1500);
          });
        })
      );
    }

    const pages = Array.from(container.querySelectorAll(".survey-page")) as HTMLElement[];
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i];
      if (i > 0) pdf.addPage("a4", "portrait");

      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        width: 794,
        height: 1120,
        windowWidth: 794,
        windowHeight: 1120,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
    }

    const fileSuffix = language === "en" ? "EN" : language === "ru" ? "RU" : "HY";
    pdf.save(`SIL_Survey_Report_${report.id || "Act"}_${fileSuffix}.pdf`);
  } catch (err) {
    console.error("html2canvas PDF rendering failed, activating fallback:", err);
    directJsPdfSurveyFallback(report, address, estimatedArea, language);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

function directJsPdfSurveyFallback(
  report: PropertySurveyReport,
  address?: string,
  estimatedArea?: number,
  language: ExportLanguage = "hy"
): void {
  const isEn = language === "en";
  const isRu = language === "ru";
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(0, 51, 153);
  pdf.text(isEn ? "SIL INSURANCE CJSC" : isRu ? "ЗАО «СИЛ ИНШУРАНС»" : "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ", 15, 18);

  pdf.setFontSize(10);
  pdf.setTextColor(30, 41, 59);
  pdf.text(
    isEn
      ? "PROPERTY RISK ENGINEERING & PRE-RISK SURVEY ACT"
      : isRu
      ? "АКТ ПРЕДСТРАХОВОГО ОСМОТРА И ОЦЕНКИ РИСКОВ (СЮРВЕЙ)"
      : "ՏԵՂԱԶՆՆՈՒԹՅԱՆ ԵՎ ՌԻՍԿԵՐԻ ԳՆԱՀԱՏՄԱՆ ՊԱՇՏՈՆԱԿԱՆ ԱԿՏ",
    15,
    25
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.text(`Act No: ${report.id || "SIL-SURV"} | Date: ${report.createdAt || new Date().toISOString().split("T")[0]}`, 15, 31);
  pdf.text(`Address: ${address || "Yerevan, Armenia"} | Declared Type: ${report.propertyType} (${estimatedArea || 0} sq.m)`, 15, 36);

  pdf.line(15, 39, 195, 39);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);
  pdf.text("1. UNDERWRITING & COPE RISK EVALUATION", 15, 45);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(`- Underwriting Score: ${report.underwritingScore || 88}/100 (${report.underwritingRiskLevel || "Low Risk"})`, 15, 51);
  pdf.text(`- Detected Property Occupancy: ${report.detectedPropertyType || report.propertyType} (${report.functionalSubtype || "Standard"})`, 15, 56);
  pdf.text(`- Construction & Structure: ${report.buildingStructure || "Monolith"} | Renovation: ${report.renovationCondition || "Euro"}`, 15, 61);
  pdf.text(`- Recommended Tariff Multiplier: x${report.recommendedTariffMultiplier || 0.95} | Franchise: ${report.recommendedFranchisePercent || 0.5}%`, 15, 66);
  pdf.text(`- Probable Maximum Loss (PML): ${report.lossExpectancy?.pmlPercent || 18}% | MFL: ${report.lossExpectancy?.mflPercent || 65}%`, 15, 71);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);
  pdf.text("2. EXECUTIVE NARRATIVE REPORT", 15, 80);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  const narrative = report.fullNarrativeReport || "Survey completed successfully. Risk is acceptable under standard underwriting conditions.";
  const splitText = pdf.splitTextToSize(narrative, 180);
  pdf.text(splitText.slice(0, 35), 15, 86);

  const fileSuffix = language === "en" ? "EN" : language === "ru" ? "RU" : "HY";
  pdf.save(`SIL_Survey_Report_${report.id || "Act"}_${fileSuffix}.pdf`);
}

export function downloadSurveyReportAsWordDoc(
  report: PropertySurveyReport,
  address?: string,
  estimatedArea?: number,
  language: ExportLanguage = "hy",
  signature?: DigitalSignatureAttachment
): void {
  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>SIL Survey Report ${report.id}</title>
      <style>
        ${surveyReportTemplateCss()}
      </style>
    </head>
    <body>
      ${buildSurveyReportHtml(report, address, estimatedArea, language, signature)}
    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff" + htmlContent], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const fileSuffix = language === "en" ? "EN" : language === "ru" ? "RU" : "HY";
  a.download = `SIL_Survey_Report_${report.id || "Act"}_${fileSuffix}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copySurveyReportForWord(
  report: PropertySurveyReport,
  address?: string,
  estimatedArea?: number,
  language: ExportLanguage = "hy",
  signature?: DigitalSignatureAttachment
): Promise<boolean> {
  try {
    const html = buildSurveyReportHtml(report, address, estimatedArea, language, signature);
    const blobHtml = new Blob([html], { type: "text/html" });
    const blobText = new Blob([report.fullNarrativeReport || "Survey Report"], { type: "text/plain" });
    const data = [new ClipboardItem({ "text/html": blobHtml, "text/plain": blobText })];
    await navigator.clipboard.write(data);
    return true;
  } catch (err) {
    console.error("Clipboard copy failed, falling back to text:", err);
    try {
      await navigator.clipboard.writeText(report.fullNarrativeReport || "");
      return true;
    } catch {
      return false;
    }
  }
}

