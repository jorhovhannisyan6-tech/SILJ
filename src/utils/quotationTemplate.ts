import { InsuranceProductType, QuotationProposal } from "../types";
import { formatCurrency, formatPercent } from "./insuranceCalculator";
import horizontalLogo from "../assets/images/sil-logo-horizontal.png";
import { translatePhraseLocally, PRODUCT_TITLES_LOCALIZED } from "./quotationTranslation";
import { SIL_PRODUCT_CONDITIONS, OfficialConditionInfo } from "../data/productConditionsData";
import { transliterateLatinToArmenian } from "./transliteration";

const esc = (value: unknown) => String(value ?? "—")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#039;");

const list = (items: string[], ordered = false) => {
  const tag = ordered ? "ol" : "ul";
  return `<${tag} class="template-list">${(items || []).map((x) => `<li>${esc(x)}</li>`).join("")}</${tag}>`;
};

const PRODUCT_LABELS: Record<InsuranceProductType, {
  title: string;
  objectLabel: string;
  amountLabel: string;
  tariffLabel: string;
  premiumLabel: string;
  franchiseLabel: string;
  riskLabel: string;
}> = {
  property: {
    title: "Գույքի ապահովագրության առաջարկ",
    objectLabel: "Ապահովագրվող գույք (Շենք, Սարքավորումներ, Ապրանքներ)",
    amountLabel: "Գույքի արժեք / Ապահովագրական գումար",
    tariffLabel: "Տարեկան գույքային սակագին",
    premiumLabel: "Ապահովագրավճար",
    franchiseLabel: "Գույքային ֆրանշիզա (Չհատուցվող գումար)",
    riskLabel: "Գույքային ապահովագրական ռիսկեր (FLEXA, Ջրի վնաս, ԵԱԱԳ, Աղետներ)",
  },
  mortgage: {
    title: "Հիփոթեքային վարկառուների ապահովագրության առաջարկ",
    objectLabel: "Գրավադրված անշարժ գույք և վարկառու",
    amountLabel: "Վարկի մնացորդ / Ապահովագրական գումար",
    tariffLabel: "Հիփոթեքային սակագին (ԱՀԸ / ԲԵ / Բանկ)",
    premiumLabel: "Ապահովագրավճար",
    franchiseLabel: "Չհատուցվող գումար",
    riskLabel: "Հիփոթեքային համալիր ծածկույթ (Գույք + Կյանք/ԴՊ)",
  },
  casco: {
    title: "ԿԱՍԿՈ ավտոտրանսպորտային միջոցների ապահովագրության առաջարկ",
    objectLabel: "Ապահովագրվող ավտոտրանսպորտային միջոց",
    amountLabel: "Շուկայական արժեք / Ապահովագրական գումար",
    tariffLabel: "ԿԱՍԿՈ վերջնական սակագին",
    premiumLabel: "Ապահովագրավճար",
    franchiseLabel: "ԿԱՍԿՈ ֆրանշիզա (Չհատուցվող գումար)",
    riskLabel: "ԿԱՍԿՈ ապահովագրական ծածկույթներ (ՃՏՊ, Հրդեհ, ԵԱԱԳ, Գողություն)",
  },
  health: {
    title: "Կամավոր բժշկական ապահովագրության առաջարկ (ԿԲԱ)",
    objectLabel: "Ապահովագրվող անձնակազմ / Բժշկական ծրագիր",
    amountLabel: "Տարեկան բժշկական ծածկույթի սահմանաչափ",
    tariffLabel: "Բժշկական սակագին / Անձի վճար",
    premiumLabel: "Ընդհանուր ապահովագրավճար",
    franchiseLabel: "Ծառայությունների ֆրանշիզա",
    riskLabel: "Բժշկական ծածկույթներ (Ստացիոնար, Ամբուլատոր, Դեղորայք, Ատամնաբուժություն)",
  },
  travel: {
    title: "Ճանապարհորդության (Արտերկիր մեկնողների) ապահովագրության առաջարկ",
    objectLabel: "Ճանապարհորդ(ներ) / Երթուղի և ժամանակահատված",
    amountLabel: "Արտերկրում բժշկական ծախսերի սահմանաչափ",
    tariffLabel: "Օրական սակագին",
    premiumLabel: "Ապահովագրավճար",
    franchiseLabel: "Ճամփորդական ֆրանշիզա",
    riskLabel: "Արտերկրում անհետաձգելի բժշկական ծածկույթներ և տարհանում",
  },
  cargo: {
    title: "Բեռնափոխադրումների ապահովագրության առաջարկ",
    objectLabel: "Ապահովագրվող բեռ և փոխադրամիջոց",
    amountLabel: "Բեռի ինվոյսային արժեք / Ապահովագրական գումար",
    tariffLabel: "Բեռնափոխադրման սակագին",
    premiumLabel: "Ապահովագրավճար",
    franchiseLabel: "Բեռի ֆրանշիզա (Չհատուցվող գումար)",
    riskLabel: "Բեռնափոխադրման ռիսկեր (ICC A / B / C Կլաուզաներ)",
  },
  liability: {
    title: "Պատասխանատվության ապահովագրության առաջարկ",
    objectLabel: "Ապահովագրվող գործունեություն / Պատասխանատվության ոլորտ",
    amountLabel: "Պատասխանատվության առավելագույն սահմանաչափ (TPL / PI)",
    tariffLabel: "Պատասխանատվության սակագին",
    premiumLabel: "Ապահովագրավճար",
    franchiseLabel: "Ֆրանշիզա յուրաքանչյուր պահանջի համար",
    riskLabel: "Քաղաքացիական և մասնագիտական պատասխանատվության ծածկույթներ",
  },
  construction: {
    title: "Շինմոնտաժային ռիսկերի համալիր (CAR / EAR) առաջարկ",
    objectLabel: "Շինարարական օբյեկտ և կապալառուի աշխատանքներ",
    amountLabel: "Կապալի պայմանագրային արժեք / Ապահովագրական գումար",
    tariffLabel: "Շինմոնտաժային սակագին",
    premiumLabel: "Ապահովագրավճար",
    franchiseLabel: "Շինմոնտաժային ֆրանշիզա",
    riskLabel: "Շինարարական, մոնտաժային և երրորդ անձանց (TPL) ռիսկեր",
  },
  accident: {
    title: "Դժբախտ պատահարներից ապահովագրության առաջարկ (ԴՊ)",
    objectLabel: "Ապահովագրվող աշխատակիցներ / Անձնակազմ",
    amountLabel: "Ապահովագրական գումար 1 անձի համար",
    tariffLabel: "ԴՊ սակագին",
    premiumLabel: "Ընդհանուր ապահովագրավճար",
    franchiseLabel: "Ֆրանշիզա (Չի կիրառվում)",
    riskLabel: "Դժբախտ պատահարների ծածկույթներ (Մահ, Հաշմանդամություն, Բուժծախսեր)",
  },
  agro: {
    title: "Գյուղատնտեսական (Ագրո) ապահովագրության առաջարկ",
    objectLabel: "Ապահովագրվող մշակաբույս և այգետարածք",
    amountLabel: "Բերքի ապահովագրական արժեք",
    tariffLabel: "Ագրոապահովագրական սակագին",
    premiumLabel: "Ապահովագրավճար (ներառյալ 50% սուբսիդիան)",
    franchiseLabel: "Ոչ պայմանական ֆրանշիզա",
    riskLabel: "Ագրոռիսկեր (Կարկուտ, Գարնանային ցրտահարություն, Հրդեհ)",
  },
  financial: {
    title: "Ֆինանսական ռիսկերի և կանխավճարի երաշխիքի առաջարկ",
    objectLabel: "Ապահովագրվող պայմանագիր / Ֆինանսական պարտավորություն",
    amountLabel: "Երաշխիքի / Կանխավճարի գումար",
    tariffLabel: "Երաշխիքային սակագին",
    premiumLabel: "Ապահովագրավճար",
    franchiseLabel: "Չհատուցվող գումար (Առանց ֆրանշիզայի)",
    riskLabel: "Ֆինանսական ռիսկեր և երաշխիքային պարտավորություններ",
  },
  aviation: {
    title: "Ավիացիոն ռիսկերի և դրոնների (ԱԹՍ) ապահովագրության առաջարկ",
    objectLabel: "Ապահովագրվող թռչող սարք (Hull) / Կոմերցիոն դրոն",
    amountLabel: "Թռչող սարքի արժեք / TPL պատասխանատվության լիմիտ",
    tariffLabel: "Ավիացիոն սակագին",
    premiumLabel: "Ապահովագրավճար",
    franchiseLabel: "Ավիացիոն ֆրանշիզա",
    riskLabel: "Ավիացիոն ռիսկեր (Օդանավի վթար, Ավիացիոն TPL, Օդաչուների ԴՊ)",
  },
  bundle: {
    title: "Կորպորատիվ համալիր (All-In-One) ապահովագրական առաջարկ",
    objectLabel: "Համալիր կորպորատիվ փաթեթ (Գույք + TPL + ԴՊ + Բեռներ)",
    amountLabel: "Համախառն ապահովագրական գումար",
    tariffLabel: "Համալիր միջինացված սակագին",
    premiumLabel: "Ընդհանուր համալիր ապահովագրավճար",
    franchiseLabel: "Համակցված ֆրանշիզա",
    riskLabel: "Կորպորատիվ համալիր փաթեթի ծածկույթներ",
  },
};

function getProductLabels(type: InsuranceProductType, lang: QuotationLanguage = "hy") {
  const base = PRODUCT_LABELS[type] || PRODUCT_LABELS.property;
  if (lang === "en") {
    return {
      title: `${type.toUpperCase()} Insurance Quotation Proposal`,
      objectLabel: "Insured Object / Scope",
      amountLabel: "Sum Insured / Limit of Indemnity",
      tariffLabel: "Annual Tariff Rate",
      premiumLabel: "Insurance Premium",
      franchiseLabel: "Deductible / Franchise",
      riskLabel: "Insurance Coverage & Perils",
    };
  }
  if (lang === "ru") {
    return {
      title: `Предложение по страхованию ${type.toUpperCase()}`,
      objectLabel: "Объект страхования / Спецификация",
      amountLabel: "Страховая сумма / Лимит ответственности",
      tariffLabel: "Страховой тариф",
      premiumLabel: "Страховая премия",
      franchiseLabel: "Франшиза / Невозмещаемая сумма",
      riskLabel: "Покрываемые риски и страховое покрытие",
    };
  }
  return base;
}
export { getProductLabels };


export function getLocalizedFranchise(proposal: QuotationProposal, lang: QuotationLanguage = "hy"): string {
  const desc = proposal.franchiseDescription || "";
  if (lang === "hy") {
    if (desc) return desc;
    if (proposal.franchiseAmount && proposal.franchiseAmount > 0) {
      return `Ֆիքսված ֆրանշիզա՝ ${formatCurrency(proposal.franchiseAmount, proposal.currency)} (յուրաքանչյուր պատահարի համար)`;
    }
    return "0% (Առանց ֆրանշիզայի / Լրիվ ծածկույթ)";
  }

  // English localization
  if (lang === "en") {
    if (desc.includes("0%") || desc.includes("Առանց ֆրանշիզայի") || desc.includes("Անհատույց")) {
      return "0% (Zero Deductible / Full Coverage)";
    }
    if (desc.includes("Ֆրանշիզայի կիսում")) {
      return proposal.franchiseAmount && proposal.franchiseAmount > 0
        ? `50% Reduced Deductible: ${formatCurrency(proposal.franchiseAmount, proposal.currency)}`
        : "50% Reduced Deductible (Shared per CASCO terms)";
    }
    if (desc.includes("Մինիմալ ֆրանշիզա")) {
      return proposal.franchiseAmount && proposal.franchiseAmount > 0
        ? `Minimal Deductible: ${formatCurrency(proposal.franchiseAmount, proposal.currency)}`
        : "Minimal Deductible (per policy conditions)";
    }
    if (proposal.franchiseAmount && proposal.franchiseAmount > 0) {
      return `Fixed Deductible: ${formatCurrency(proposal.franchiseAmount, proposal.currency)} per event`;
    }
    if (desc.includes("Ստանդարտ") || desc.includes("անփոփոխ")) {
      return "Standard Deductible: 0.5% (per CASCO policy conditions)";
    }
    if (desc.includes("ապահովագրական գումարից")) {
      const pct = desc.match(/\d+(\.\d+)?%/)?.[0] || "";
      return `${pct} of sum insured (per occurrence)`;
    }
    return desc || "Per policy terms";
  }

  // Russian localization
  if (lang === "ru") {
    if (desc.includes("0%") || desc.includes("Առանց ֆրանշիզայի") || desc.includes("Անհատույց")) {
      return "0% (Без франшизы / Полное покрытие)";
    }
    if (desc.includes("Ֆրանշիզայի կիսում")) {
      return proposal.franchiseAmount && proposal.franchiseAmount > 0
        ? `Франшиза с разделением (50%): ${formatCurrency(proposal.franchiseAmount, proposal.currency)}`
        : "Уменьшенная на 50% франшиза (согласно условиям КАСКО)";
    }
    if (desc.includes("Մինիմալ ֆրանշիզա")) {
      return proposal.franchiseAmount && proposal.franchiseAmount > 0
        ? `Минимальная франшиза: ${formatCurrency(proposal.franchiseAmount, proposal.currency)}`
        : "Минимальная безусловная франшиза";
    }
    if (proposal.franchiseAmount && proposal.franchiseAmount > 0) {
      return `Фиксированная франшиза: ${formatCurrency(proposal.franchiseAmount, proposal.currency)} за каждый случай`;
    }
    if (desc.includes("Ստանդարտ") || desc.includes("անփոփոխ")) {
      return "Стандартная франшиза: 0.5% (согласно условиям КАСКО)";
    }
    if (desc.includes("ապահովագրական գումարից")) {
      const pct = desc.match(/\d+(\.\d+)?%/)?.[0] || "";
      return `${pct} от страховой суммы (за каждый случай)`;
    }
    return desc || "Согласно условиям договора";
  }

  return desc || "—";
}

function detailsRows(proposal: QuotationProposal, lang: QuotationLanguage = "hy"): string {
  const isEn = lang === "en";
  const isRu = lang === "ru";
  const d = proposal.productSpecificDetails || {};
  const rows: Array<[string, unknown]> = [];
  const push = (label: string, value: unknown) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") rows.push([label, value]);
  };

  switch (proposal.type) {
    case "casco":
      push(isEn ? "Vehicle" : isRu ? "Автомобиль" : "Ավտոմեքենա", d.vehicle || d.vehicleDescription);
      push(isEn ? "Coverage Type" : isRu ? "Тип покрытия" : "Ծածկույթի տեսակ", d.coverageType);
      push(isEn ? "Territory" : isRu ? "Территория" : "Տարածք", d.territory);
      push(isEn ? "Theft Coverage" : isRu ? "Покрытие угона" : "Գողության ծածկույթ", d.theftCoverage);
      push(isEn ? "Warranty Service" : isRu ? "Гарантийное обслуживание" : "Երաշխիքային սպասարկում", d.warrantyService);
      push(isEn ? "Drivers Option" : isRu ? "Водители" : "Վարորդների տարբերակ", d.driverCountOption);
      push(isEn ? "Payment Method" : isRu ? "Способ оплаты" : "Վճարման եղանակ", d.paymentMethod);
      push(isEn ? "Electric Vehicle" : isRu ? "Электромобиль" : "Էլեկտրամոբիլ", d.electricVehicle === true ? (isEn ? "Yes" : isRu ? "Да" : "Այո") : d.electricVehicle === false ? (isEn ? "No" : isRu ? "Нет" : "Ոչ") : undefined);
      break;
    case "mortgage":
      push(isEn ? "Package" : isRu ? "Пакет" : "Փաթեթ", d.packageLabel || proposal.mortgageBreakdown?.packageLabel);
      push(isEn ? "Bank" : isRu ? "Банк" : "Բանկ", proposal.mortgageBreakdown?.bankName);
      push(isEn ? "Loan Contract" : isRu ? "Кредитный договор" : "Վարկի պայմանագիր", d.loanContractNumber);
      push(isEn ? "Co-Borrower" : isRu ? "Созаемщик" : "Համատեղ վարկառու", d.jointBorrowerName);
      break;
    case "health":
      push(isEn ? "Number of Insured" : isRu ? "Кол-во застрахованных" : "Ապահովագրվողների քանակ", d.count);
      push(isEn ? "Plan Level" : isRu ? "Уровень программы" : "Ծրագիր", d.planLevel);
      push(isEn ? "Limit Per Person" : isRu ? "Лимит на человека" : "1 անձի սահմանաչափ", d.limitPerPerson ? formatCurrency(d.limitPerPerson, proposal.currency) : undefined);
      break;
    case "travel":
      push(isEn ? "Destination" : isRu ? "Направление" : "Ուղղություն", d.destination);
      push(isEn ? "Trip Duration" : isRu ? "Длительность поездки" : "Ուղևորության տևողություն", d.tripDurationDays ? (isEn ? `${d.tripDurationDays} days` : isRu ? `${d.tripDurationDays} дней` : `${d.tripDurationDays} օր`) : undefined);
      push(isEn ? "Travelers Count" : isRu ? "Количество путешественников" : "Ճանապարհորդների քանակ", d.travelerCount);
      break;
    case "cargo":
      push(isEn ? "Clause Type" : isRu ? "Тип оговорки" : "Կլաուզա", d.clauseType);
      push(isEn ? "Country of Origin" : isRu ? "Страна отправления" : "Ծագման երկիր", d.originCountry);
      push(isEn ? "Destination Country" : isRu ? "Страна назначения" : "Նպատակակետ", d.destinationCountry);
      push(isEn ? "Transport Mode" : isRu ? "Вид транспорта" : "Փոխադրման եղանակ", d.transportMode);
      break;
    case "property":
      push(isEn ? "Insurance Package" : isRu ? "Страховой пакет" : "Ապահովագրական փաթեթ", d.packageName || d.packageId);
      push(isEn ? "Usage / Rental Mode" : isRu ? "Режим использования" : "Շահագործման / Վարձակալության ձև", d.rentalType === "short_term_rental" ? (isEn ? "Short-term / Airbnb" : isRu ? "Посуточная аренда / Airbnb" : "Օրավարձով / Կարճաժամկետ (Airbnb/Booking)") : d.rentalType === "long_term_rental" ? (isEn ? "Long-term rental" : isRu ? "Долгосрочная аренда" : "Երկարաժամկետ վարձակալություն") : (isEn ? "Owner occupied / Standard" : isRu ? "Собственное проживание" : "Սեփականատիրոջ բնակություն / Ստանդարտ"));
      push(isEn ? "Booking Platform" : isRu ? "Платформа бронирования" : "Վարձակալական հարթակ", d.platform !== "—" ? d.platform : undefined);
      if (d.hasGuestDamage && d.guestDamageSumInsured > 0) {
        push(isEn ? "Guest Damage Limit" : isRu ? "Лимит ущерба от гостей" : "Հյուրերի պատճառած վնասի լիմիտ", formatCurrency(d.guestDamageSumInsured, proposal.currency));
      }
      if (d.liabilitySumInsured > 0) {
        push(isEn ? "Third Party Liability" : isRu ? "Ответственность перед 3-ми лицами" : "3-րդ անձանց պատասխանատվություն", formatCurrency(d.liabilitySumInsured, proposal.currency));
      }
      break;
    default:
      break;
  }
  return rows.map(([label, value]) => `<tr><td>${esc(label)}</td><td>${esc(value)}</td></tr>`).join("");
}

function breakdownRows(proposal: QuotationProposal, lang: QuotationLanguage = "hy"): string {
  const franchiseText = getLocalizedFranchise(proposal, lang);
  if (proposal.bundleBreakdown?.length) {
    return proposal.bundleBreakdown.map((r) => `<tr><td class="blue-cell">${esc(r.productName)}</td><td class="num">${esc(formatCurrency(r.sumInsured, proposal.currency))}</td><td class="center">${esc(formatPercent(r.tariff))}</td><td class="num">${esc(formatCurrency(r.premium, proposal.currency))}</td><td>${esc(r.details)}</td></tr>`).join("");
  }
  if (proposal.propertyBreakdown?.length) {
    return proposal.propertyBreakdown.map((r) => `<tr><td class="blue-cell">${esc(r.item)}</td><td class="num">${esc(formatCurrency(r.value, proposal.currency))}</td><td class="center">${esc(formatPercent(r.tariff))}</td><td class="num">${esc(formatCurrency(r.premium, proposal.currency))}</td><td>${esc(r.franchise || franchiseText)}</td></tr>`).join("");
  }
  return `<tr><td class="blue-cell">${esc(proposal.objectDescription || proposal.productNameArm)}</td><td class="num">${esc(formatCurrency(proposal.totalSumInsured, proposal.currency))}</td><td class="center">${esc(formatPercent(proposal.finalTariff))}</td><td class="num">${esc(formatCurrency(proposal.annualPremium, proposal.currency))}</td><td>${esc(franchiseText)}</td></tr>`;
}

const financialTable = (proposal: QuotationProposal, title: string, lang: QuotationLanguage = "hy") => {
  const defaultLabels = getProductLabels(proposal.type);
  const labels = lang === "hy" ? defaultLabels : getProductLabels(proposal.type, lang);
  const totalText = lang === "en" ? "Total" : lang === "ru" ? "Итого" : "Ընդամենը";
  const franchiseText = getLocalizedFranchise(proposal, lang);

  return `<h2 class="center-title financial-title">${esc(title)}</h2>
  <table class="offer-table"><thead><tr>
    <th>${esc(labels.objectLabel)}</th><th>${esc(labels.amountLabel)}</th><th>${esc(labels.tariffLabel)}</th><th>${esc(labels.premiumLabel)}</th><th>${esc(labels.franchiseLabel)}</th>
  </tr></thead><tbody>${breakdownRows(proposal, lang)}<tr class="total-row"><td class="blue-cell">${totalText}</td><td class="num">${esc(formatCurrency(proposal.totalSumInsured, proposal.currency))}</td><td></td><td class="num">${esc(formatCurrency(proposal.annualPremium, proposal.currency))}</td><td>${esc(franchiseText)}</td></tr></tbody></table>`;
};

export function quotationTemplateCss() { return `
  * { box-sizing: border-box; }
  .sil-template { width: 100%; background: #fff; color:#111; font-family: Arial, "DejaVu Sans", sans-serif; }
  .quote-page { width: 794px; min-height: 1123px; margin: 0 auto; background:#fff; padding: 58px 58px 48px; position:relative; overflow:hidden; page-break-after:always; break-after:page; }
  .quote-page:last-child { page-break-after:auto; break-after:auto; }
  .cover { display:flex; flex-direction:column; padding-top:52px; }
  .source-badge { align-self:flex-start; margin-top:16px; font-size:10px; font-weight:800; border:1px solid #222; padding:5px 8px; letter-spacing:.3px; }
  .cover-header { display:flex; justify-content:flex-end; }
  .cover-logo { width:245px; height:auto; object-fit:contain; }
  .contact { text-align:right; font-size:13px; line-height:1.55; margin-top:8px; }
  .contact a { color:#0645d8; text-decoration:underline; }
  .cover-title { margin-top:270px; text-align:center; font-size:22px; font-weight:800; text-transform:uppercase; }
  .presented { margin-top:265px; text-align:center; font-size:18px; font-weight:700; }
  .cover-year { margin-top:auto; text-align:center; font-size:18px; font-weight:800; line-height:1.2; }
  .general-table, .risk-table, .offer-table { width:100%; border-collapse:collapse; table-layout:fixed; }
  .general-table td, .risk-table td, .offer-table td, .offer-table th { border:1px solid #222; padding:6px 8px; vertical-align:top; font-size:12px; line-height:1.2; }
  .general-table td:first-child { width:38%; background:#b8d2e9; font-weight:700; }
  .general-table td:last-child { width:62%; }
  .detail-table td:first-child { width:38%; background:#b8d2e9; font-weight:700; }
  .detail-table { margin-top:12px; }
  .section-heading { text-align:center; font-size:18px; font-weight:800; margin:28px 0 14px; text-transform:uppercase; }
  .risk-intro { font-style:italic; font-size:12px; line-height:1.35; margin:0 0 4px; }
  .risk-table td:first-child { width:28%; background:#b8d2e9; font-weight:700; }
  .risk-table td:last-child { width:72%; }
  .blue-cell { background:#b8d2e9 !important; }
  .center-title { text-align:center; font-weight:800; }
  .financial-title { font-size:16px; margin:18px 0 10px; }
  .offer-table th { background:#b8d2e9; text-align:center; font-weight:800; vertical-align:middle; }
  .offer-table th:nth-child(1){width:20%}.offer-table th:nth-child(2){width:22%}.offer-table th:nth-child(3){width:18%}.offer-table th:nth-child(4){width:21%}.offer-table th:nth-child(5){width:19%}
  .offer-table .num { text-align:right; vertical-align:middle; }
  .offer-table .center { text-align:center; vertical-align:middle; }
  .total-row td { vertical-align:middle; font-weight:700; }
  .note { font-size:12px; font-style:italic; line-height:1.35; margin:14px 8px; }
  .body-text { font-size:13px; line-height:1.42; text-align:justify; }
  .body-text p { margin: 0 0 8px; }
  .template-list { margin: 6px 0 0 20px; padding:0; font-size:13px; line-height:1.4; }
  .template-list li { margin: 3px 0; }
  .flow { display:flex; align-items:center; justify-content:center; gap:10px; margin:42px 0 36px; }
  .flow .oval { width:175px; height:92px; border:1.5px solid #111; border-radius:50%; display:flex; align-items:center; justify-content:center; text-align:center; font-size:13px; padding:10px; }
  .flow .box { width:220px; min-height:78px; border:1.5px solid #111; display:flex; align-items:center; justify-content:center; text-align:center; font-size:13px; padding:10px; }
  .arrow { font-size:22px; }
  .signature { display:flex; justify-content:space-between; margin-top:45px; font-size:12px; }
  .signature > div { width:45%; }
  .line { margin-top:40px; border-top:1px solid #111; padding-top:5px; }
  .footer { position:absolute; left:58px; right:58px; bottom:22px; text-align:center; font-size:9px; color:#555; }
  .muted { color:#555; }
  @media screen and (max-width: 820px) { .quote-page { transform-origin:top left; width:794px; margin:0; } }
  @media print { .quote-page { margin:0; box-shadow:none!important; } }
`; }

export type QuotationLanguage = "hy" | "en" | "ru";

export function generateQuotationTemplateHtml(proposal: QuotationProposal, lang: QuotationLanguage = "hy"): string {
  const isEn = lang === "en";
  const isRu = lang === "ru";

  const t = {
    mainData: isEn ? "MAIN INSURANCE DETAILS" : isRu ? "ОСНОВНЫԵ ДАННЫЕ СТРАХОВАНИЯ" : "ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՀԻՄՆԱԿԱՆ ՏՎՅԱԼՆԵՐ",
    specialData: isEn ? "PRODUCT SPECIFIC DETAILS" : isRu ? "СПЕЦИАЛЬНЫЕ УСЛОВИЯ ПРОДУКТА" : "ՊՐՈԴՈՒԿՏԻ ՀԱՏՈՒԿ ՏՎՅԱԼՆԵՐ",
    financialOffer: isEn ? "FINANCIAL PROPOSAL" : isRu ? "ФИНАНСОВОЕ ПРЕДЛОЖЕНИЕ" : "ՖԻՆԱՆՍԱԿԱՆ ԱՌԱՋԱՐԿ",
    financialTerms: isEn ? "MAIN FINANCIAL TERMS" : isRu ? "ОСНОВНЫЕ ФИНАНСОВЫЕ УСЛОВИЯ" : "ՀԻՄՆԱԿԱՆ ՖԻՆԱՆՍԱԿԱՆ ՊԱՅՄԱՆՆԵՐ",
    provisions: isEn ? "COVERAGE PROVISIONS" : isRu ? "ОСНОВНЫЕ ПОЛОЖЕНИЯ ПОКРЫТИЯ" : "ՀԱՊԱՏԱՍԽԱՆ ԾԱԾԿՈՒՅԹԻ ՀԻՄՆԱԿԱՆ ԴՐՈՒՅԹՆԵՐ",
    claimsProc: isEn ? "CLAIM REPORTING PROCEDURE" : isRu ? "ПОРЯДОК УРЕГУЛИРОВАНИЯ УБЫТКОВ" : "ՀԱՅՏԻ ՆԵՐԿԱՅԱՑՄԱՆ ԵՎ ԿԱՐԳԱՎՈՐՄԱՆ ԿԱՐԳԸ",
    payout: isEn ? "CLAIM INDEMNIFICATION" : isRu ? "ВЫПЛАТА СТРАХОВОГО ВОЗМЕЩЕНИЯ" : "ԱՊԱՀՈՎԱԳՐԱԿԱՆ ՀԱՏՈՒՑՄԱՆ ՎՃԱՐՈՒՄԸ",
    specialConditions: isEn ? "SPECIAL CONDITIONS" : isRu ? "ОСОБЫЕ УСЛОВИЯ" : "ՀԱՏՈՒԿ ՊԱՅՄԱՆՆԵՐ",
    requiredDocs: isEn ? "REQUIRED DOCUMENTS" : isRu ? "НЕОБХОДИМЫЕ ДОКУМЕНТЫ" : "ԱՆՀՐԱԺԵՇՏ ՓԱՍՏԱԹՂԹԵՐ",
    importantNote: isEn ? "IMPORTANT NOTICE" : isRu ? "ВАЖНОЕ ПРИМЕЧАНИЕ" : "ԿԱՐԵՎՈՐ ՆՇՈՒՄ",
    insurer: isEn ? "Insured by SIL Insurance CJSC" : isRu ? "ЗАО СПАО «СИЛ ИНШУРАНС»" : "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ",
    policyholder: isEn ? "Policyholder" : isRu ? "Страхователь" : "Ապահովադիր",
    beneficiary: isEn ? "Beneficiary" : isRu ? "Выгодоприобретатель" : "Շահառու",
    insuranceType: isEn ? "Insurance Type" : isRu ? "Вид страхования" : "Ապահովագրության տեսակ",
    object: isEn ? "Insured Object" : isRu ? "Объект страхования" : "Ապահովագրության օբյեկտ",
    territory: isEn ? "Territory of Cover" : isRu ? "Территория страхования" : "Ապահովագրության տարածք",
    period: isEn ? "Period of Insurance" : isRu ? "Срок страхования" : "Ապահովագրության ժամանակահատված",
    sumInsured: isEn ? "Sum Insured" : isRu ? "Страховая сумма" : "Ապահովագրական գումար",
    tariff: isEn ? "Tariff Rate" : isRu ? "Страховой тариф" : "Ապահովագրական սակագին",
    premium: isEn ? "Insurance Premium" : isRu ? "Страховая премия" : "Ապահովագրավճար",
    deductible: isEn ? "Deductible / Franchise" : isRu ? "Франшиза" : "Չհատուցվող գումար / Ֆրանշիզա",
    paymentTerms: isEn ? "Payment Terms" : isRu ? "Условия оплаты" : "Վճարման պայմաններ",
    presentedTo: isEn ? "Presented to:" : isRu ? "Представляется:" : "Ներկայացվում է՝",
    quoteHeader: isEn ? "QUOTATION PROPOSAL" : isRu ? "КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ" : "ԳՆԱՌԱՋԱՐԿ",
    total: isEn ? "Total" : isRu ? "Итого" : "Ընդամենը",
    silRepresentative: isEn ? "For SIL Insurance CJSC:" : isRu ? "От имени ЗАО СПАО «СИЛ ИНШУРАНС»:" : "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ-ի կողմից՝",
    clientSignature: isEn ? "CUSTOMER / POLICYHOLDER:" : isRu ? "КЛИЕНТ (СТРАХОВАТЕЛЬ):" : "ՀԱՃԱԽՈՐԴԻ (ԱՊԱՀՈՎԱԴՐԻ) ԿՈՂՄԻՑ՝",
  };

  const labels = getProductLabels(proposal.type, lang);
  const localizedTitles = PRODUCT_TITLES_LOCALIZED[proposal.type];
  const officialCond = SIL_PRODUCT_CONDITIONS[proposal.type] || SIL_PRODUCT_CONDITIONS.property;
  const rawTitle = proposal.productNameArm || officialCond?.titleArm;
  const product = isEn
    ? (localizedTitles?.en || `${proposal.type.toUpperCase()} Insurance Quotation`)
    : isRu
    ? (localizedTitles?.ru || `Коммерческое предложение по страхованию ${proposal.type.toUpperCase()}`)
    : (rawTitle || localizedTitles?.hy || "Գնառաջարկ");

  const defaultPerilsSource = officialCond?.coveredPerils?.length
    ? officialCond.coveredPerils.map((p) => `${p.name}: ${p.desc}`)
    : [isEn ? "Standard perils per SIL Insurance policy conditions." : isRu ? "Стандартные риски согласно условиям страхования." : "Ռիսկերի և ծածկույթների վերջնական ցանկը սահմանվում է ընտրված պրոդուկտի գործող պայմաններով։"];

  const rawPerils = proposal.coveredPerilsList?.length
    ? proposal.coveredPerilsList
    : defaultPerilsSource;

  const perils = isEn || isRu
    ? rawPerils.map((p) => translatePhraseLocally(p, lang))
    : rawPerils;

  const officialTermsHtml = `
    <section class="quote-page">
      <h2 class="section-heading">${isEn ? "OFFICIAL PRODUCT TERMS & CONDITIONS" : isRu ? "ОФИЦИАЛЬНЫЕ УСЛОВИЯ И ПРАВИЛА ПРОДУКТА" : "ՊՐՈԴՈՒԿՏԻ ՊԱՇՏՈՆԱԿԱՆ ՊԱՅՄԱՆՆԵՐ ԵՎ ԿԱՆՈՆՆԵՐ"}</h2>
      <div style="font-size: 11px; color: #00235B; margin-bottom: 10px; font-weight: 800; text-transform: uppercase; text-align: center;">
        ${esc(officialCond.sourceDocName)}
      </div>
      <div class="body-text" style="font-size: 11px; line-height: 1.4; margin-bottom: 12px; background: #f8fafc; padding: 10px 14px; border-left: 3px solid #00235B; border-radius: 4px;">
        ${esc(officialCond.summary)}
      </div>

      <h3 style="font-size: 12px; font-weight: 800; margin: 10px 0 4px; text-transform: uppercase; color: #00235B;">
        ${isEn ? "1. Covered Perils & Risks" : isRu ? "1. Покрываемые риски" : "1. Ապահովագրական ռիսկեր և ծածկույթներ (կոնկրետ պրոդուկտի բառապաշարով)"}
      </h3>
      <ul class="template-list" style="margin: 0 0 8px 16px; font-size: 11px; line-height: 1.35;">
        ${officialCond.coveredPerils.map((p) => `<li><strong>${esc(p.name)}:</strong> ${esc(p.desc)}</li>`).join("")}
      </ul>

      <h3 style="font-size: 12px; font-weight: 800; margin: 10px 0 4px; text-transform: uppercase; color: #00235B;">
        ${isEn ? "2. General Exclusions" : isRu ? "2. Исключения из страхования" : "2. Հիմնական բացառություններ ըստ պրոդուկտի կանոնների"}
      </h3>
      <ul class="template-list" style="margin: 0 0 8px 16px; font-size: 11px; line-height: 1.35;">
        ${officialCond.exclusions.map((e) => `<li><strong>${esc(e.name)}:</strong> ${esc(e.reason)}</li>`).join("")}
      </ul>

      <h3 style="font-size: 12px; font-weight: 800; margin: 10px 0 4px; text-transform: uppercase; color: #00235B;">
        ${isEn ? "3. Settlement Basis & Franchise" : isRu ? "3. Урегулирование и франшиза" : "3. Հատուցման հիմքեր, ֆրանշիզա և պահանջվող փաստաթղթեր"}
      </h3>
      <table class="general-table" style="font-size: 11px;"><tbody>
        <tr><td>${isEn ? "Franchise Terms" : isRu ? "Условия франшизы" : "Ֆրանշիզայի պայմաններ"}</td><td>${esc(officialCond.settlementAndFranchise.typicalFranchise)}</td></tr>
        <tr><td>${isEn ? "Settlement Basis" : isRu ? "Порядок урегулирования" : "Հատուցման հիմքեր"}</td><td>${esc(officialCond.settlementAndFranchise.settlementBasis)}</td></tr>
        <tr><td>${isEn ? "Notice Period" : isRu ? "Срок уведомления" : "Ծանուցման ժամկետ"}</td><td>${esc(officialCond.settlementAndFranchise.noticePeriodHours)} ${isEn ? "hours" : isRu ? "часов" : "ժամ"}</td></tr>
        <tr><td>${isEn ? "Required Claim Docs" : isRu ? "Необходимые документы" : "Պահանջվող փաստաթղթեր"}</td><td>${officialCond.settlementAndFranchise.claimDocsRequired.join("; ")}</td></tr>
      </tbody></table>
    </section>
  `;

  const rawConditions = proposal.specialConditions?.length
    ? proposal.specialConditions
    : [isEn ? "Quotation is valid for 30 days based on supplied data." : isRu ? "Предложение действительно в течение 30 дней." : "Գնառաջարկը ներկայացվում է մուտքագրված տվյալների և ընտրված պրոդուկտի գործող պայմանների հիման վրա։"];
  const conditions = isEn || isRu
    ? rawConditions.map((c) => translatePhraseLocally(c, lang))
    : rawConditions;

  const rawObject = proposal.objectDescription || "—";
  const object = isEn || isRu ? translatePhraseLocally(rawObject, lang) : rawObject;

  const rawClient = proposal.clientName || "—";
  const client = isEn || isRu 
    ? translatePhraseLocally(rawClient, lang) 
    : transliterateLatinToArmenian(rawClient);

  const rawPayment = proposal.paymentTerms || "—";
  const payment = isEn || isRu ? translatePhraseLocally(rawPayment, lang) : rawPayment;

  const franchise = getLocalizedFranchise(proposal, lang);
  const rawBeneficiary = proposal.beneficiaryDetails || (isEn ? "N/A" : isRu ? "Не применяется" : "Չի կիրառվում");
  const beneficiary = isEn || isRu ? translatePhraseLocally(rawBeneficiary, lang) : rawBeneficiary;

  const rawTerritory = proposal.productSpecificDetails?.territory || (isEn ? "Republic of Armenia" : isRu ? "Республика Армения" : "Ըստ ընտրված պրոդուկտի և պայմանագրի");
  const territory = isEn || isRu ? translatePhraseLocally(rawTerritory, lang) : rawTerritory;

  const rawPeriod = proposal.productSpecificDetails?.period || (isEn ? "1 Year (12 Months)" : isRu ? "1 Год (12 Месяцев)" : "Ըստ պայմանագրի");
  const period = isEn || isRu ? translatePhraseLocally(rawPeriod, lang) : rawPeriod;

  const agentTitle = isEn || isRu ? translatePhraseLocally(proposal.agentTitle, lang) : proposal.agentTitle;
  const agentName = isEn || isRu ? translatePhraseLocally(proposal.agentName, lang) : proposal.agentName;

  const row = (label: string, value: unknown) => `<tr><td>${esc(label)}</td><td>${esc(value)}</td></tr>`;

  const productRows = [
    row(t.insurer, "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ"),
    row(t.policyholder, client),
    row(t.beneficiary, beneficiary),
    row(t.insuranceType, product),
    row(t.object, object),
    row(t.territory, territory),
    row(t.period, period),
    row(t.sumInsured, formatCurrency(proposal.totalSumInsured, proposal.currency)),
    row(t.tariff, formatPercent(proposal.finalTariff)),
    row(t.premium, formatCurrency(proposal.annualPremium, proposal.currency)),
    row(t.deductible, franchise),
  ].join("");

  const detailRows = detailsRows(proposal, lang);

  let customTemplateHtml = "";
  const rawCustom =
    proposal.customTemplateText ||
    (typeof window !== "undefined" ? localStorage.getItem(`sil-custom-template-${proposal.type}`) : "");

  if (rawCustom && rawCustom.trim()) {
    let textToProcess = rawCustom;
    if (lang !== "hy" && !proposal.customTemplateText) {
      textToProcess = textToProcess
        .split("\n")
        .map((l) => translatePhraseLocally(l, lang))
        .join("\n");
    }

    const processed = textToProcess
      .replace(/\[Client Name\]/gi, client)
      .replace(/\[Sum Insured\]/gi, formatCurrency(proposal.totalSumInsured, proposal.currency))
      .replace(/\[Premium\]/gi, formatCurrency(proposal.annualPremium, proposal.currency))
      .replace(/\[Annual Premium\]/gi, formatCurrency(proposal.annualPremium, proposal.currency))
      .replace(/\[Tariff Rate\]/gi, formatPercent(proposal.finalTariff))
      .replace(/\[Tariff\]/gi, formatPercent(proposal.finalTariff))
      .replace(/\[Franchise Description\]/gi, franchise)
      .replace(/\[Quotation Number\]/gi, proposal.quotationNumber || "—");

    const lines = processed.split("\n");
    let formattedBody = "";
    let inList = false;

    for (const line of lines) {
      let trimmed = line.trim();
      if (!trimmed) {
        if (inList) {
          formattedBody += `</ul>`;
          inList = false;
        }
        continue;
      }

      if (lang !== "hy") {
        trimmed = translatePhraseLocally(trimmed, lang);
      }

      if (/^\d+\.\s+/.test(trimmed) || (trimmed.toUpperCase() === trimmed && trimmed.length > 4 && !trimmed.startsWith("-"))) {
        if (inList) {
          formattedBody += `</ul>`;
          inList = false;
        }
        formattedBody += `<h3 style="font-size: 13px; font-weight: 800; margin: 14px 0 6px; text-transform: uppercase; color: #00235B;">${esc(trimmed)}</h3>`;
      } else if (trimmed.startsWith("-") || trimmed.startsWith("•")) {
        if (!inList) {
          formattedBody += `<ul class="template-list" style="margin: 4px 0 8px 16px;">`;
          inList = true;
        }
        formattedBody += `<li>${esc(trimmed.replace(/^[-•]\s*/, ""))}</li>`;
      } else {
        if (inList) {
          formattedBody += `</ul>`;
          inList = false;
        }
        formattedBody += `<p style="margin: 0 0 6px; font-size: 12px; line-height: 1.45; text-align: justify;">${esc(trimmed)}</p>`;
      }
    }
    if (inList) {
      formattedBody += `</ul>`;
    }

    customTemplateHtml = `
    <section class="quote-page">
      <h2 class="section-heading">${isEn ? "Special Template Conditions & Policy Clauses" : isRu ? "Индивидуальные шаблонные условия и оговорки" : "Անհատական Ձևանմուշային Պայմաններ"}</h2>
      <div class="body-text" style="padding-top: 6px;">
        ${formattedBody}
      </div>
    </section>`;
  }

  return `
  <style>${quotationTemplateCss()}</style>
  <div class="sil-template">
    <section class="quote-page cover">
      <div class="cover-header"><div>
        <img class="cover-logo" src="${horizontalLogo}" alt="Sil insurance" />
        <div class="contact">ՀՀ, ք. Երևան, Արամի 3,5<br/>hեռ․՝ (+374 60) 54 00 00<br/>info@silinsurance.am | www.silinsurance.am</div>
      </div></div>
      <div class="cover-title">${esc(product)}</div>
      <div class="presented">${t.presentedTo}<br/>«${esc(client)}»</div>
      <div class="cover-year">YEREVAN ${esc(new Date().getFullYear())}<br/>${t.quoteHeader} (${lang.toUpperCase()})</div>
    </section>

    <section class="quote-page">
      <h2 class="section-heading">${t.mainData}</h2>
      <table class="general-table"><tbody>${productRows}</tbody></table>
      ${detailRows ? `<h2 class="section-heading">${t.specialData}</h2><table class="general-table detail-table"><tbody>${detailRows}</tbody></table>` : ""}

      <h2 class="section-heading">${esc(labels.riskLabel)}</h2>
      <table class="risk-table"><tbody><tr><td>${isEn ? "Covered Perils" : isRu ? "Покрываемые риски" : "Ապահովագրական ռիսկեր"}</td><td>${list(perils)}</td></tr></tbody></table>
    </section>

    <section class="quote-page">
      ${financialTable(proposal, `${t.financialOffer} — ${product}`, lang)}
      <h2 class="section-heading">${t.financialTerms}</h2>
      <table class="risk-table"><tbody>
        <tr><td>${t.sumInsured}</td><td>${esc(formatCurrency(proposal.totalSumInsured, proposal.currency))}</td></tr>
        <tr><td>${t.tariff}</td><td>${esc(formatPercent(proposal.finalTariff))}</td></tr>
        <tr><td>${t.premium}</td><td><strong>${esc(formatCurrency(proposal.annualPremium, proposal.currency))}</strong></td></tr>
        <tr><td>${t.deductible}</td><td>${esc(franchise)}</td></tr>
        <tr><td>${t.paymentTerms}</td><td>${esc(payment)}</td></tr>
      </tbody></table>
    </section>

    ${customTemplateHtml}

    ${officialTermsHtml}

    ${proposal.aiAnalysisText ? `
    <section class="quote-page">
      <h2 class="section-heading">${isEn ? "UNDERWRITING & RISK ASSESSMENT OPINION" : isRu ? "АНДЕРРАЙТИНГОВОЕ И ЭКСПЕРТНОЕ ЗАКЛЮЧЕНИЕ" : "ԱՆԴԵՌՌԱՅԹԻՆԳԱՅԻՆ ԵՎ ՌԻՍԿԵՐԻ ԳՆԱՀԱՏՄԱՆ ԵԶՐԱԿԱՑՈՒԹՅՈՒՆ"}</h2>
      <div class="body-text" style="font-size: 11.5px; line-height: 1.5; color: #222; margin-bottom: 16px; white-space: pre-line; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 16px;">
        ${esc(proposal.aiAnalysisText)}
      </div>
      <div style="font-size: 10px; color: #64748b; font-style: italic; margin-top: 8px;">
        ${isEn ? "* Expert underwriting analysis generated based on SIL Insurance CJSC underwriting guidelines and risk underwriting matrix." : isRu ? "* Экспертное андеррайтинговое заключение сформировано на основе правил и матрицы рисков СПАО «СИЛ ИНШУРАНС»." : "* Փորձագիտական եզրակացությունը կազմված է «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ-ի անդեռռայթինգային կանոնների և ռիսկերի գնահատման չափանիշների հիման վրա։"}
      </div>
    </section>` : ""}

    <section class="quote-page">
      <h2 class="section-heading">${isEn ? "BRIEF SERVICE INFORMATION" : isRu ? "КРАТКАЯ ИНФОРМАЦИЯ ОБ УСЛУГЕ" : "ՀԱԿԻՐՃ ՏԵՂԵԿՈՒԹՅՈՒՆՆԵՐ ԾԱՌԱՅՈՒԹՅԱՆ ՄԱՍԻՆ"}</h2>
      <div class="body-text" style="font-size: 11.5px; line-height: 1.5; color: #333; margin-bottom: 16px;">
        <p>${isEn ? "SIL Insurance CJSC provides comprehensive risk protection with dedicated 24/7 client support and rapid claims resolution throughout the Republic of Armenia and internationally according to policy terms." : isRu ? "ЗАО СПАО «СИЛ ИНШУРАНС» обеспечивает надежную страховую защиту с круглосуточной поддержкой клиентов и оперативным урегулированием страховых случаев." : "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ-ն ապահովում է հուսալի և բազմակողմանի ապահովագրական պաշտպանություն, շուրջօրյա 24/7 աջակցություն և վնասների արագ կարգավորում ՀՀ ողջ տարածքում և միջազգային համաձայնագրերով սահմանված կարգով։"}</p>
      </div>

      <h2 class="section-heading">${isEn ? "INSURANCE CLAIM INDEMNIFICATION" : isRu ? "ВЫПЛАТА СТРАХОВОГО ВОЗМЕЩЕНИЯ" : "Ապահովագրական հատուցման վճարումը"}</h2>
      <div class="body-text" style="font-size: 11.5px; line-height: 1.5; color: #333; margin-bottom: 16px;">
        <p>${isEn ? "Insurance compensation is processed and paid within standard business days following receipt and verification of all required documentation and expert assessment." : isRu ? "Выплата страхового возмещения производится в установленные договором сроки после предоставления всех необходимых документов и составления акта о страховом случае." : "Ապահովագրական հատուցման վճարումն իրականացվում է ապահովագրական պատահարի վերաբերյալ բոլոր անհրաժեշտ փաստաթղթերի ներկայացումից և փորձագիտական ակտի կազմումից հետո՝ սահմանված ժամկետներում և կարգով։"}</p>
      </div>

      <h2 class="section-heading">${t.specialConditions}</h2>
      ${list(conditions, true)}
      <h2 class="section-heading">${t.importantNote}</h2>
      <div class="body-text">
        <p>${isEn ? "This document is a formal insurance quotation issued by SIL Insurance CJSC." : isRu ? "Настоящий документ является официальным коммерческим предложением ЗАО СПАО «СИЛ ИНШУРАНС»." : "Սույն գնառաջարկը տեղեկատվական և նախնական առաջարկ է և ինքնին չի հանդիսանում ապահովագրական պայմանագիր։"}</p>
      </div>
      <div class="signature">

        <div><strong>${t.silRepresentative}</strong><br/>${esc(agentName)}<br/><span class="muted">${esc(agentTitle)}</span><div class="line">${isEn ? "Signature / Stamp" : isRu ? "Подпись / Печать" : "Ստորագրություն / Կնիք (Կ․Տ․)"}</div></div>
        <div><strong>${t.clientSignature}</strong><br/>${esc(client)}<br/><span class="muted">${isEn ? "Read and accepted" : isRu ? "Ознакомлен" : "Ծանոթացել եմ գնառաջարկի պայմաններին"}</span><div class="line">${isEn ? "Signature" : isRu ? "Подпись" : "Ստորագրություն"}</div></div>
      </div>
      <div class="footer">SIL Insurance CJSC • Yerevan, Arami 3,5 • Tel: (+374 60) 54-00-00 • info@silinsurance.am • www.silinsurance.am</div>
    </section>
  </div>`;
}
