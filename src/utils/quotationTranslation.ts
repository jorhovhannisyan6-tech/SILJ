import { InsuranceProductType, QuotationProposal } from "../types";
import { QuotationLanguage } from "./quotationTemplate";

// Comprehensive insurance term translation dictionaries
export const PRODUCT_TITLES_LOCALIZED: Record<InsuranceProductType, { hy: string; en: string; ru: string }> = {
  property: {
    hy: "Գույքի ապահովագրության առաջարկ",
    en: "Commercial & Real Estate Property Insurance Quotation",
    ru: "Коммерческое предложение по страхованию имущества",
  },
  mortgage: {
    hy: "Հիփոթեքային վարկառուների ապահովագրության առաջարկ",
    en: "Mortgage Borrower Comprehensive Insurance Quotation",
    ru: "Коммерческое предложение по ипотечному страхованию",
  },
  casco: {
    hy: "ԿԱՍԿՈ ապահովագրության առաջարկ",
    en: "Comprehensive Motor Vehicle (CASCO) Insurance Quotation",
    ru: "Коммерческое предложение по автострахованию КАСКО",
  },
  health: {
    hy: "Առողջության ապահովագրության առաջարկ",
    en: "Voluntary Health & Medical (VMI) Insurance Quotation",
    ru: "Коммерческое предложение по добровольному медицинскому страхованию (ДМС)",
  },
  travel: {
    hy: "Ճանապարհորդության ապահովագրության առաջարկ",
    en: "Travel & Overseas Medical Emergency Insurance Quotation",
    ru: "Коммерческое предложение по страхованию выезжающих за рубеж",
  },
  cargo: {
    hy: "Բեռների ապահովագրության առաջարկ",
    en: "Cargo & Freight Transportation Insurance Quotation",
    ru: "Коммерческое предложение по страхованию грузов",
  },
  liability: {
    hy: "Պատասխանատվության ապահովագրության առաջարկ",
    en: "General & Professional Third-Party Liability Insurance Quotation",
    ru: "Коммерческое предложение по страхованию гражданской и профессиональной ответственности",
  },
  construction: {
    hy: "Շինմոնտաժային ապահովագրության առաջարկ",
    en: "Contractor's All Risks & Erection All Risks (CAR/EAR) Quotation",
    ru: "Коммерческое предложение по страхованию строительно-монтажных рисков (СМР)",
  },
  accident: {
    hy: "Դժբախտ պատահարների ապահովագրության առաջարկ",
    en: "Personal Accident & Accidental Injury Insurance Quotation",
    ru: "Коммерческое предложение по страхованию от несчастных случаев",
  },
  agro: {
    hy: "Ագրոապահովագրության առաջարկ",
    en: "Agricultural Crop & Yield Insurance Quotation",
    ru: "Коммерческое предложение по агрострахованию урожая",
  },
  financial: {
    hy: "Ֆինանսական ռիսկերի ապահովագրության առաջարկ",
    en: "Financial Guarantee, Bond & Cash-in-Transit Insurance Quotation",
    ru: "Коммерческое предложение по страхованию финансовых рисков и гарантий",
  },
  aviation: {
    hy: "Ավիացիոն ռիսկերի ապահովագրության առաջարկ",
    en: "Aviation Hull & Commercial Drone Insurance Quotation",
    ru: "Коммерческое предложение по страхованию авиационных рисков и дронов",
  },
  bundle: {
    hy: "Կորպորատիվ համալիր ապահովագրական առաջարկ",
    en: "Corporate Multi-Risk Comprehensive Insurance Package Quotation",
    ru: "Комплексное корпоративное страховое предложение",
  },
};

// Common dictionary for insurance perils and conditions
const PERILS_DICTIONARY: Array<{ hyRegex: RegExp; en: string; ru: string }> = [
  { hyRegex: /հրդեհ/i, en: "Fire, Lightning & Gas Explosion", ru: "Пожар, удар молнии и взрыв газа" },
  { hyRegex: /կայծակ/i, en: "Lightning Strike", ru: "Удар молнии" },
  { hyRegex: /պայթյուն/i, en: "Explosion", ru: "Взрыв" },
  { hyRegex: /ջրի վնաս|ջրահեռաց|արտահոսք/i, en: "Water Damage & Plumbing Leakage", ru: "Повреждение водой из коммуникационных систем" },
  { hyRegex: /բնական աղետ|երկրաշարժ|հեղեղ|կարկուտ|փոթորիկ|սողանք/i, en: "Natural Disasters (Earthquake, Storm, Flood, Hail, Landslide)", ru: "Стихийные бедствия (землетрясение, буря, наводнение, град, оползень)" },
  { hyRegex: /գողություն|կողոպուտ|ավազակ/i, en: "Burglary, Robbery and Theft", ru: "Кража со взломом, грабеж и разбой" },
  { hyRegex: /վանդալիզմ|երրորդ անձ/i, en: "Malicious Damage & Vandalism by Third Parties", ru: "Вандализм и противоправные действия третьих лиц" },
  { hyRegex: /ապակ|հայել|վիտրաժ/i, en: "Glass, Window & Façade Breakage", ru: "Бой витринных стекол, зеркал и фасадного остекления" },
  { hyRegex: /խափանում|մեխանիկական/i, en: "Machinery Breakdown & Electrical Failure", ru: "Поломка машин и электронного оборудования" },
  { hyRegex: /ընդհատում|բիզնեսի/i, en: "Business Interruption Loss of Profit", ru: "Перерыв в хозяйственной деятельности" },
  { hyRegex: /ավտովթար|բախում/i, en: "Traffic Accident & Collision", ru: "Дорожно-транспортное происшествие и столкновение" },
  { hyRegex: /ամբողջական կորուստ/i, en: "Constructive Total Loss", ru: "Конструктивная полная гибель" },
  { hyRegex: /տարհանում|էվակուացիա/i, en: "24/7 Roadside Towing & Emergency Assistance", ru: "Круглосуточная эвакуация и техпомощь" },
  { hyRegex: /ստացիոնար/i, en: "Inpatient Hospitalization & Surgery", ru: "Стационарное лечение и хирургия" },
  { hyRegex: /ամբուլատոր/i, en: "Outpatient Medical Consultations & Diagnostic Tests", ru: "Амбулаторно-поликлиническая помощь и диагностика" },
  { hyRegex: /ատամնաբուժ/i, en: "Dental Care & Emergency Treatment", ru: "Стоматологическая помощь" },
  { hyRegex: /դեղորայք/i, en: "Prescription Medications Coverage", ru: "Оплата медикаментов" },
  { hyRegex: /բեռ/i, en: "Cargo Loss & Physical Damage during Transit (Institute Cargo Clauses)", ru: "Утрата и повреждение груза при транспортировке (Оговорки Института лондонских страховщиков)" },
  { hyRegex: /մասնագիտական/i, en: "Professional Negligence, Errors & Omissions", ru: "Профессиональные ошибки и упущения" },
  { hyRegex: /երաշխիք|կանխավճար/i, en: "Advance Payment Refund Guarantee Default", ru: "Невозврат авансового платежа / гарантийные обязательства" },
];

const SPECIAL_CONDITIONS_DICTIONARY: Array<{ hyRegex: RegExp; en: string; ru: string }> = [
  {
    hyRegex: /գնառաջարկը վավեր է (\d+)/i,
    en: "This quotation is valid for $1 calendar days from the date of issuance.",
    ru: "Данное коммерческое предложение действительно в течение $1 календарных дней с даты выдачи.",
  },
  {
    hyRegex: /ապահովադիրը պարտավոր է/i,
    en: "The Policyholder is required to observe all fire safety and property security standards.",
    ru: "Страхователь обязан соблюдать правила пожарной безопасности и нормы охраны объекта.",
  },
  {
    hyRegex: /հատուցումը վճարվում է/i,
    en: "Insurance compensation is disbursed within the statutory timeline upon submission of all required claim documents.",
    ru: "Выплата страхового возмещения осуществляется в установленные договором сроки после предоставления полного пакета документов.",
  },
  {
    hyRegex: /պայմանագրի կնքումից առաջ/i,
    en: "An on-site inspection or photographic survey may be conducted prior to final policy conclusion.",
    ru: "Перед заключением договора может быть проведен предстраховой осмотр объекта.",
  },
  {
    hyRegex: /ֆրանշիզան կիրառվում է/i,
    en: "The agreed deductible applies to each and every claim occurrence.",
    ru: "Согласованная франшиза применяется к каждому страховому случаю.",
  },
  {
    hyRegex: /նախնական առաջարկ/i,
    en: "This document constitutes an initial commercial quotation and is subject to the formal SIL Insurance policy wording.",
    ru: "Настоящий документ является предварительным коммерческим предложением и действует согласно правилам страхования ЗАО СПАО «СИЛ ИНШУРАНС».",
  },
  {
    hyRegex: /1\.\s*ԱՊԱՀՈՎԱԳՐԱԿԱՆ ԾԱԾԿՈՒՅԹ/i,
    en: "1. INSURANCE COVERAGE AND PERILS",
    ru: "1. СТРАХОВОЕ ПОКРЫТИЕ И РИСКИ",
  },
  {
    hyRegex: /2\.\s*ՊԱՀԱՆՋՎՈՂ ՓԱՍՏԱԹՂԹԵՐ/i,
    en: "2. REQUIRED DOCUMENTS AND PREREQUISITES",
    ru: "2. ТРЕБУЕМЫЕ ДОКУМЕНТЫ И ПРЕДУСЛОВИЯ",
  },
  {
    hyRegex: /3\.\s*ՀԱՏՈՒԿ ՊԱՅՄԱՆՆԵՐ|4\.\s*ՀԱՏՈՒԿ ՊԱՅՄԱՆՆԵՐ/i,
    en: "3. SPECIAL CONDITIONS AND PAYMENT PROCEDURE",
    ru: "3. ОСОБЫЕ УСЛОВИЯ И ПОРЯДОК ОПЛАТЫ",
  },
  {
    hyRegex: /Անձը հաստատող փաստաթուղթ/i,
    en: "Identification document (Passport / National ID Card)",
    ru: "Документ, удостоверяющий личность (Паспорт / ID-карта)",
  },
  {
    hyRegex: /Գույքի կամ օբյեկտի սեփականության վկայական/i,
    en: "Certificate of ownership / title deed for property",
    ru: "Свидетельство о праве собственности на недвижимость или имущество",
  },
  {
    hyRegex: /Կնքման ամսաթիվ/i,
    en: "Issuance Date",
    ru: "Дата оформления",
  },
  {
    hyRegex: /Ապահովագրող՝?\s*«?ՍԻԼ ԻՆՇՈՒՐԱՆՍ»?/i,
    en: "Insurer: SIL Insurance CJSC",
    ru: "Страховщик: СПАО «СИЛ ИНШУРАНС»",
  },
  {
    hyRegex: /Վճարումն իրականացվում է միանվագ կամ փուլային/i,
    en: "Payment is made in a single lump sum or in installments upon agreement.",
    ru: "Оплата производится единовременно либо поэтапно по согласованию сторон.",
  },
  {
    hyRegex: /Գնառաջարկն ուժի մեջ է (\d+) օր/i,
    en: "This quotation is valid for $1 calendar days.",
    ru: "Коммерческое предложение действительно в течение $1 дней.",
  },
];

const PROPERTY_ITEMS_MAP: Record<string, { en: string; ru: string }> = {
  "շենք": { en: "Building Structure & Constructive Elements", ru: "Конструктивные элементы здания" },
  "շենք-շինություն": { en: "Building / Real Estate Premises", ru: "Здание и основные строения" },
  "շինություն": { en: "Structures & Premises", ru: "Сооружения и строения" },
  "ներքին հարդարում": { en: "Interior Finishes, Decoration & Fixtures", ru: "Внутренняя отделка и инженерные коммуникации" },
  "կահույք": { en: "Furniture & Office Furnishings", ru: "Мебель и офисное оснащение" },
  "սարքավորում": { en: "Equipment, Machinery & Appliances", ru: "Производственное и торговое оборудование" },
  "կահույք և սարքավորումներ": { en: "Furniture, Fixtures & Equipment", ru: "Мебель и оборудование" },
  "ապրանքային պաշարներ": { en: "Commercial Goods & Inventory in Stock", ru: "Товарно-материальные запасы на складе" },
  "ապրանքանյութական արժեքներ": { en: "Inventory & Goods in Stock", ru: "Товарные запасы и сырье" },
  "տեխնիկա": { en: "Electronics, Computers & IT Equipment", ru: "Электронная и вычислительная техника" },
  "գովազդային վահանակներ": { en: "Outdoor Advertising Signage & Billboards", ru: "Рекламные щиты и наружные вывески" },
  "ապակեպատում": { en: "Glass Façades & Vitrines", ru: "Фасадное остекление и витрины" },
  "երրորդ անձանց պատասխանատվություն": { en: "Third Party Property & Bodily Injury Liability", ru: "Гражданская ответственность перед третьими лицами" },
  "հյուրերի պատճառած վնաս": { en: "Guest & Tenant Accidental Property Damage", ru: "Ущерб имуществу от гостей / арендаторов" },
};

const PAYMENT_TERMS_MAP: Record<string, { en: string; ru: string }> = {
  "միանվագ": { en: "Single 100% upfront lump-sum payment", ru: "Единовременная 100% оплата страховой премии" },
  "միանվագ 100%": { en: "Single 100% upfront lump-sum payment", ru: "Единовременная 100% оплата" },
  "2 փուլով": { en: "Two equal installments (50% / 50%)", ru: "В 2 равных этапа (50% / 50%)" },
  "4 փուլով": { en: "Four quarterly installments (25% each)", ru: "В 4 ежеквартальных этапа (по 25%)" },
  "4 եռամսյակային փուլով": { en: "Four quarterly installments (25% each)", ru: "В 4 ежеквартальных этапа (по 25%)" },
  "12 փուլով": { en: "Twelve monthly equal installments", ru: "В 12 ежемесячных этапов" },
};

const LEGAL_FORMS_MAP: Record<string, { en: string; ru: string }> = {
  "սպը": { en: "LLC", ru: "ООО" },
  "փբը": { en: "CJSC", ru: "ЗАО" },
  "բբը": { en: "OJSC", ru: "ОАО" },
  "ա/ձ": { en: "IE", ru: "ИП" },
  "հկ": { en: "NGO", ru: "ОО" },
  "հհ": { en: "RA", ru: "РА" },
};

// Transliterate Armenian proper nouns into Latin/Cyrillic
export function transliterateArmenian(text: string, targetLang: "en" | "ru"): string {
  if (!text) return "";
  
  // First check if text matches legal forms or words
  let processed = text;
  for (const [arm, rep] of Object.entries(LEGAL_FORMS_MAP)) {
    const reg = new RegExp(`«?${arm}»?`, "gi");
    processed = processed.replace(reg, targetLang === "en" ? rep.en : rep.ru);
  }

  // Armenian to Latin & Cyrillic character tables
  const armenianToLatin: Record<string, string> = {
    "Ա": "A", "ա": "a", "Բ": "B", "բ": "b", "Գ": "G", "գ": "g", "Դ": "D", "դ": "d",
    "Ե": "E", "ե": "e", "Զ": "Z", "զ": "z", "Է": "E", "է": "e", "Ը": "Y", "ը": "y",
    "Թ": "T", "թ": "t", "Ժ": "Zh", "ժ": "zh", "Ի": "I", "ի": "i", "Լ": "L", "լ": "l",
    "Խ": "Kh", "խ": "kh", "Ծ": "Ts", "ծ": "ts", "Կ": "K", "կ": "k", "Հ": "H", "հ": "h",
    "Ձ": "Dz", "ձ": "dz", "Ղ": "Gh", "ղ": "gh", "Ճ": "Ch", "ճ": "ch", "Մ": "M", "մ": "m",
    "Յ": "Y", "յ": "y", "Ն": "N", "ն": "n", "Շ": "Sh", "շ": "sh", "Ո": "O", "ո": "o",
    "Չ": "Ch", "չ": "ch", "Պ": "P", "պ": "p", "Ջ": "J", "ջ": "j", "Ռ": "R", "ռ": "r",
    "Ս": "S", "ս": "s", "Վ": "V", "վ": "v", "Տ": "T", "տ": "t", "Ր": "R", "ր": "r",
    "Ց": "Ts", "ց": "ts", "Ու": "U", "ու": "u", "Փ": "P", "փ": "p", "Ք": "Q", "ք": "q",
    "և": "ev", "Օ": "O", "օ": "o", "Ֆ": "F", "ֆ": "f"
  };

  const armenianToCyrillic: Record<string, string> = {
    "Ա": "А", "ա": "а", "Բ": "Б", "բ": "б", "Գ": "Г", "գ": "г", "Դ": "Д", "դ": "д",
    "Ե": "Е", "ե": "е", "Զ": "З", "զ": "з", "Է": "Э", "է": "э", "Ը": "Ы", "ը": "ы",
    "Թ": "Т", "թ": "т", "Ժ": "Ж", "ժ": "ж", "Ի": "И", "ի": "и", "Լ": "Л", "լ": "л",
    "Խ": "Х", "խ": "х", "Ծ": "Ц", "ծ": "ц", "Կ": "К", "կ": "к", "Հ": "А", "հ": "а",
    "Ձ": "Дз", "ձ": "дз", "Ղ": "Г", "ղ": "г", "Ճ": "Ч", "ճ": "ч", "Մ": "М", "մ": "м",
    "Յ": "Й", "յ": "й", "Ն": "Н", "ն": "н", "Շ": "Ш", "շ": "ш", "Ո": "О", "ո": "о",
    "Չ": "Ч", "չ": "ч", "Պ": "П", "պ": "п", "Ջ": "Дж", "ջ": "дж", "Ռ": "Р", "ռ": "р",
    "Ս": "С", "ս": "с", "Վ": "В", "վ": "в", "Տ": "Т", "տ": "т", "Ր": "Р", "ր": "р",
    "Ց": "Ц", "ց": "ц", "Ու": "У", "ու": "у", "Փ": "П", "փ": "п", "Ք": "К", "ք": "к",
    "և": "ев", "Օ": "О", "օ": "о", "Ֆ": "Ф", "ֆ": "ф"
  };

  const table = targetLang === "en" ? armenianToLatin : armenianToCyrillic;
  let result = "";
  for (let i = 0; i < processed.length; i++) {
    const twoChars = processed.slice(i, i + 2);
    if (table[twoChars]) {
      result += table[twoChars];
      i++;
      continue;
    }
    const oneChar = processed[i];
    result += table[oneChar] !== undefined ? table[oneChar] : oneChar;
  }
  return result;
}

export function translatePhraseLocally(text: string, targetLang: QuotationLanguage): string {
  if (!text || targetLang === "hy") return text;
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Check direct property item matches
  for (const [key, val] of Object.entries(PROPERTY_ITEMS_MAP)) {
    if (lower === key || lower.includes(key)) {
      return targetLang === "en" ? val.en : val.ru;
    }
  }

  // 2. Check payment terms
  for (const [key, val] of Object.entries(PAYMENT_TERMS_MAP)) {
    if (lower.includes(key)) {
      return targetLang === "en" ? val.en : val.ru;
    }
  }

  // 3. Check perils dictionary
  for (const item of PERILS_DICTIONARY) {
    if (item.hyRegex.test(clean)) {
      return targetLang === "en" ? item.en : item.ru;
    }
  }

  // 4. Check special conditions
  for (const item of SPECIAL_CONDITIONS_DICTIONARY) {
    if (item.hyRegex.test(clean)) {
      const match = clean.match(item.hyRegex);
      let res = targetLang === "en" ? item.en : item.ru;
      if (match && match[1]) {
        res = res.replace("$1", match[1]);
      }
      return res;
    }
  }

  // 5. Common agent titles
  if (lower.includes("գլխավոր մասնագետ") || lower.includes("անդեռռայթ")) {
    return targetLang === "en"
      ? "Chief Underwriting & Risk Assessment Specialist"
      : "Главный специалист отдела андеррайтинга и оценки рисков";
  }
  if (lower.includes("տնօրեն") || lower.includes("վարչության պետ")) {
    return targetLang === "en"
      ? "Head of Corporate Underwriting Department"
      : "Начальник департамента корпоративного страхования";
  }

  // 6. Common bank names
  if (lower.includes("ամերիաբանկ")) {
    return targetLang === "en" ? "Ameriabank CJSC (Pledgee / Beneficiary)" : "ЗАО «Америабанк» (Залогодержатель / Выгодоприобретатель)";
  }
  if (lower.includes("արդշինբանկ")) {
    return targetLang === "en" ? "Ardshinbank CJSC (Pledgee / Beneficiary)" : "ЗАО «Ардшинбанк» (Залогодержатель / Выгодоприобретатель)";
  }
  if (lower.includes("ինեկոբանկ")) {
    return targetLang === "en" ? "Inecobank CJSC (Pledgee / Beneficiary)" : "ЗАО «Инекобанк» (Залогодержатель / Выгодоприобретатель)";
  }
  if (lower.includes("ակբա")) {
    return targetLang === "en" ? "Acba Bank OJSC (Pledgee / Beneficiary)" : "ОАО «Акба Банк» (Залогодержатель / Выгодоприобретатель)";
  }

  // 7. General address / object transliteration / formatting
  if (lower.includes("երևան") || lower.includes("ք․") || lower.includes("փողոց") || lower.includes("շենք")) {
    let ad = clean
      .replace(/ք․\s*Երևան/gi, targetLang === "en" ? "Yerevan" : "г. Ереван")
      .replace(/Կենտրոն/gi, targetLang === "en" ? "Kentron" : "Кентрон")
      .replace(/Արաբկիր/gi, targetLang === "en" ? "Arabkir" : "Арабкир")
      .replace(/փողոց/gi, targetLang === "en" ? "street" : "ул.")
      .replace(/փ\./gi, targetLang === "en" ? "str." : "ул.")
      .replace(/շենք/gi, targetLang === "en" ? "bldg." : "д.")
      .replace(/բնակարան/gi, targetLang === "en" ? "apt." : "кв.");
    return transliterateArmenian(ad, targetLang);
  }

  // Fallback: Transliterate Armenian text with proper case
  return transliterateArmenian(clean, targetLang);
}

/**
 * Fast offline dictionary-based proposal translator.
 * Guaranteed to return instantly (0ms latency) without network overhead.
 */
export function translateQuotationProposalLocally(
  proposal: QuotationProposal,
  targetLang: QuotationLanguage
): QuotationProposal {
  if (targetLang === "hy") return proposal;

  const titles = PRODUCT_TITLES_LOCALIZED[proposal.type] || {
    hy: proposal.productNameArm,
    en: `${proposal.type.toUpperCase()} Insurance Quotation`,
    ru: `Коммерческое предложение по страхованию ${proposal.type.toUpperCase()}`,
  };

  const isEn = targetLang === "en";

  // Translate client name
  const translatedClient = translatePhraseLocally(proposal.clientName, targetLang);

  // Translate object description
  const translatedObject = proposal.objectDescription
    ? translatePhraseLocally(proposal.objectDescription, targetLang)
    : isEn ? "Specified Insurance Object per Schedule" : "Объект согласно страховому полису";

  // Translate covered perils list
  const translatedPerils = (proposal.coveredPerilsList || []).map((p) =>
    translatePhraseLocally(p, targetLang)
  );

  // Translate special conditions
  const translatedConditions = (proposal.specialConditions || []).map((c) =>
    translatePhraseLocally(c, targetLang)
  );

  // Translate payment terms
  const translatedPayment = translatePhraseLocally(proposal.paymentTerms, targetLang);

  // Translate beneficiary details
  const translatedBeneficiary = proposal.beneficiaryDetails
    ? translatePhraseLocally(proposal.beneficiaryDetails, targetLang)
    : "";

  // Translate agent title
  const translatedAgentTitle = translatePhraseLocally(proposal.agentTitle, targetLang);

  // Translate property breakdown items if present
  const translatedPropertyBreakdown = proposal.propertyBreakdown?.map((item) => ({
    ...item,
    item: translatePhraseLocally(item.item, targetLang),
    franchise: item.franchise ? translatePhraseLocally(item.franchise, targetLang) : item.franchise,
  }));

  // Translate bundle breakdown items if present
  const translatedBundleBreakdown = proposal.bundleBreakdown?.map((b) => ({
    ...b,
    productName: translatePhraseLocally(b.productName, targetLang),
    details: translatePhraseLocally(b.details, targetLang),
  }));

  // Translate product specific details
  const translatedProductSpecificDetails: Record<string, any> = {};
  if (proposal.productSpecificDetails) {
    for (const [k, v] of Object.entries(proposal.productSpecificDetails)) {
      if (typeof v === "string") {
        translatedProductSpecificDetails[k] = translatePhraseLocally(v, targetLang);
      } else {
        translatedProductSpecificDetails[k] = v;
      }
    }
  }

  // Translate custom template text if present or available in storage
  const rawCustomTemplate =
    proposal.customTemplateText ||
    (typeof window !== "undefined" ? localStorage.getItem(`sil-custom-template-${proposal.type}`) || "" : "");
  let translatedCustomTemplateText = "";
  if (rawCustomTemplate) {
    translatedCustomTemplateText = rawCustomTemplate
      .split("\n")
      .map((line) => translatePhraseLocally(line, targetLang))
      .join("\n");
  }

  return {
    ...proposal,
    productNameArm: isEn ? titles.en : titles.ru,
    categoryNameArm: isEn ? "SIL Insurance Official Proposal" : "Официальное предложение СПАО «СИЛ ИНШУРАНС»",
    clientName: translatedClient,
    objectDescription: translatedObject,
    coveredPerilsList: translatedPerils,
    specialConditions: translatedConditions,
    customTemplateText: translatedCustomTemplateText || proposal.customTemplateText,
    paymentTerms: translatedPayment,
    beneficiaryDetails: translatedBeneficiary,
    agentTitle: translatedAgentTitle,
    propertyBreakdown: translatedPropertyBreakdown,
    bundleBreakdown: translatedBundleBreakdown,
    productSpecificDetails: translatedProductSpecificDetails,
  };
}

// In-memory cache for translated proposals
const translationCache = new Map<string, QuotationProposal>();

/**
 * Full AI Deep Translator that queries Gemini server-side endpoint.
 * Translates custom free-form Armenian input with high fidelity and falls back
 * automatically to the comprehensive local translation dictionary.
 */
export async function translateQuotationProposalWithAI(
  proposal: QuotationProposal,
  targetLang: QuotationLanguage
): Promise<{ proposal: QuotationProposal; isAi: boolean }> {
  if (targetLang === "hy") {
    return { proposal, isAi: false };
  }

  const cacheKey = `${proposal.id || proposal.quotationNumber}_${targetLang}_${proposal.clientName}_${proposal.totalSumInsured}`;
  if (translationCache.has(cacheKey)) {
    return { proposal: translationCache.get(cacheKey)!, isAi: true };
  }

  // Pre-translate locally first
  const localTranslation = translateQuotationProposalLocally(proposal, targetLang);

  try {
    const res = await fetch("/api/gemini/translate-proposal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(typeof window !== "undefined" && localStorage.getItem("sil-auth-token")
          ? { Authorization: `Bearer ${localStorage.getItem("sil-auth-token")}` }
          : {}),
      },
      body: JSON.stringify({
        proposal,
        targetLang,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.proposal) {
        translationCache.set(cacheKey, data.proposal);
        return { proposal: data.proposal, isAi: true };
      }
    }
  } catch (e) {
    console.warn("AI translation server call failed, using local dictionary engine:", e);
  }

  // Save local fallback to cache and return
  translationCache.set(cacheKey, localTranslation);
  return { proposal: localTranslation, isAi: false };
}
