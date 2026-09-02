import { InsuranceProductType, QuotationProposal } from "../types";
import { formatCurrency, formatPercent } from "./insuranceCalculator";
import horizontalLogo from "../assets/images/sil-logo-horizontal.png";

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
  property: { title: "Գույքի ապահովագրության առաջարկ", objectLabel: "Ապահովագրվող գույք", amountLabel: "Արժեք / ապահովագրական գումար", tariffLabel: "Տարեկան սակագին", premiumLabel: "Ապահովագրավճար", franchiseLabel: "Չհատուցվող գումար", riskLabel: "Գույքային ռիսկեր" },
  mortgage: { title: "Հիփոթեքային վարկառուների ապահովագրության առաջարկ", objectLabel: "Ապահովագրվող օբյեկտ / վարկառու", amountLabel: "Ապահովագրական գումար", tariffLabel: "Սակագին", premiumLabel: "Ապահովագրավճար", franchiseLabel: "Չհատուցվող գումար", riskLabel: "Հիփոթեքային ծածկույթներ" },
  casco: { title: "ԿԱՍԿՈ ապահովագրության առաջարկ", objectLabel: "Ապահովագրվող ավտոմեքենա", amountLabel: "Շուկայական արժեք / ապահովագրական գումար", tariffLabel: "Վերջնական սակագին", premiumLabel: "Ապահովագրավճար", franchiseLabel: "Ֆրանշիզա", riskLabel: "ԿԱՍԿՈ ծածկույթներ և ռիսկեր" },
  health: { title: "Առողջության ապահովագրության առաջարկ", objectLabel: "Ապահովագրվող անձինք / ծրագիր", amountLabel: "Ապահովագրական սահմանաչափ", tariffLabel: "Սակագին", premiumLabel: "Ապահովագրավճար", franchiseLabel: "Չհատուցվող գումար", riskLabel: "Բժշկական ծածկույթներ" },
  travel: { title: "Ճանապարհորդության ապահովագրության առաջարկ", objectLabel: "Ճանապարհորդ / ուղևորություն", amountLabel: "Ծածկույթի սահմանաչափ", tariffLabel: "Սակագին", premiumLabel: "Ապահովագրավճար", franchiseLabel: "Ֆրանշիզա", riskLabel: "Ճանապարհորդական ծածկույթներ" },
  cargo: { title: "Բեռների ապահովագրության առաջարկ", objectLabel: "Ապահովագրվող բեռ", amountLabel: "Բեռի արժեք / ապահովագրական գումար", tariffLabel: "Սակագին", premiumLabel: "Ապահովագրավճար", franchiseLabel: "Չհատուցվող գումար", riskLabel: "Բեռի ապահովագրական ռիսկեր" },
  liability: { title: "Պատասխանատվության ապահովագրության առաջարկ", objectLabel: "Ապահովագրվող գործունեություն / պատասխանատվություն", amountLabel: "Պատասխանատվության սահմանաչափ", tariffLabel: "Սակագին", premiumLabel: "Ապահովագրավճար", franchiseLabel: "Չհատուցվող գումար", riskLabel: "Պատասխանատվության ծածկույթներ" },
  construction: { title: "Շինմոնտաժային ապահովագրության առաջարկ", objectLabel: "Շինարարական / շինմոնտաժային աշխատանքներ", amountLabel: "Աշխատանքների / ապահովագրական գումար", tariffLabel: "Սակագին", premiumLabel: "Ապահովագրավճար", franchiseLabel: "Չհատուցվող գումար", riskLabel: "Շինմոնտաժային ռիսկեր" },
  accident: { title: "Դժբախտ պատահարների ապահովագրության առաջարկ", objectLabel: "Ապահովագրվող անձինք", amountLabel: "Ապահովագրական գումար", tariffLabel: "Սակագին", premiumLabel: "Ապահովագրավճար", franchiseLabel: "Ֆրանշիզա", riskLabel: "Դժբախտ պատահարների ծածկույթներ" },
  agro: { title: "Ագրոապահովագրության առաջարկ", objectLabel: "Ապահովագրվող մշակաբույս / հողատարածք", amountLabel: "Ապահովագրական արժեք", tariffLabel: "Սակագին", premiumLabel: "Ապահովագրավճար", franchiseLabel: "Չհատուցվող գումար", riskLabel: "Ագրոապահովագրական ռիսկեր" },
  financial: { title: "Ֆինանսական ռիսկերի ապահովագրության առաջարկ", objectLabel: "Ապահովագրվող ֆինանսական պարտավորություն", amountLabel: "Ապահովագրական գումար", tariffLabel: "Սակագին", premiumLabel: "Ապահովագրավճար", franchiseLabel: "Չհատուցվող գումար", riskLabel: "Ֆինանսական ռիսկեր" },
  aviation: { title: "Ավիացիոն ռիսկերի ապահովագրության առաջարկ", objectLabel: "Ապահովագրվող օդանավ / ավիացիոն գործունեություն", amountLabel: "Ապահովագրական գումար", tariffLabel: "Սակագին", premiumLabel: "Ապահովագրավճար", franchiseLabel: "Չհատուցվող գումար", riskLabel: "Ավիացիոն ռիսկեր" },
  bundle: { title: "Կորպորատիվ համալիր ապահովագրական առաջարկ", objectLabel: "Ապահովագրական փաթեթ / օբյեկտներ", amountLabel: "Ապահովագրական գումար", tariffLabel: "Սակագին", premiumLabel: "Ապահովագրավճար", franchiseLabel: "Չհատուցվող գումար", riskLabel: "Փաթեթում ներառված ծածկույթներ" },
};

function getProductLabels(type: InsuranceProductType, lang: QuotationLanguage = "hy") {
  const base = PRODUCT_LABELS[type] || PRODUCT_LABELS.property;
  if (lang === "en") {
    return {
      title: `${type.toUpperCase()} Insurance Quotation Proposal`,
      objectLabel: "Insured Object / Details",
      amountLabel: "Sum Insured / Limit",
      tariffLabel: "Annual Tariff Rate",
      premiumLabel: "Insurance Premium",
      franchiseLabel: "Deductible / Franchise",
      riskLabel: "Insurance Coverage & Risks",
    };
  }
  if (lang === "ru") {
    return {
      title: `Предложение по страхованию ${type.toUpperCase()}`,
      objectLabel: "Объект страхования / Описание",
      amountLabel: "Страховая сумма / Лимит",
      tariffLabel: "Страховой тариф",
      premiumLabel: "Страховая премия",
      franchiseLabel: "Франшиза / Невозмещаемая сумма",
      riskLabel: "Покрываемые риски и условия",
    };
  }
  return base;
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
      push(isEn ? "Vehicle" : isRu ? "Автомобиль" : "Ավտոմեքենա", d.makeModel || d.vehicle || d.vehicleDescription);
      push(isEn ? "Manufacture Year" : isRu ? "Год выпуска" : "Թողարկման տարեթիվ", d.year);
      push(isEn ? "License Plate" : isRu ? "Гос. номер" : "Պետհամարանիշ", d.licensePlate);
      push(isEn ? "VIN Code" : isRu ? "VIN код" : "VIN ծածկագիր", d.vin);
      push(isEn ? "Registration Certificate" : isRu ? "Свидетельство о регистрации" : "Հաշվառման վկայագիր (Տեխպասպորտ)", d.registrationDoc);
      push(isEn ? "Usage Purpose" : isRu ? "Цель эксплуатации" : "Շահագործման նպատակ", d.usagePurpose === "personal" ? (isEn ? "Personal / Family" : isRu ? "Личное / Семейное" : "Անձնական / Ընտանեկան") : d.usagePurpose === "commercial" ? (isEn ? "Corporate / Business" : isRu ? "Служебное / Бизнес" : "Ծառայողական / Բիզնես") : d.usagePurpose === "taxi_rental" ? (isEn ? "Taxi / Rental / Commercial" : isRu ? "Такси / Прокат" : "Տաքսի / Վարձակալություն") : d.usagePurpose);
      push(isEn ? "Coverage Section" : isRu ? "Раздел покрытия" : "Ապահովագրական բաժին", d.sectionOption === "physical_only" ? (isEn ? "Section A: Physical Damage Only" : isRu ? "Раздел А: Только физический ущерб" : "Բաժին Ա. Միայն ֆիզիկական վնաս") : (isEn ? "Section A: Comprehensive (Physical Damage & Theft)" : isRu ? "Раздел А: Физический ущерб и Хищение" : "Բաժին Ա. Ֆիզիկական վնաս և Հափշտակություն"));
      if (d.accidentCoverIncluded) {
        push(isEn ? "Section B: Personal Accident" : isRu ? "Раздел Б: Несчастный случай (НС)" : "Բաժին Բ. Դժբախտ պատահարներ (ԴՊ)", isEn ? `${d.accidentSeats || 5} seats, up to ${formatCurrency(d.accidentLimitPerSeat || 1000000, proposal.currency)} / seat` : isRu ? `${d.accidentSeats || 5} мест, до ${formatCurrency(d.accidentLimitPerSeat || 1000000, proposal.currency)} / место` : `${d.accidentSeats || 5} նստատեղ, մինչև ${formatCurrency(d.accidentLimitPerSeat || 1000000, proposal.currency)} 1 նստատեղի համար`);
      }
      if (d.voluntaryTplIncluded) {
        push(isEn ? "Section C: Voluntary TPL" : isRu ? "Раздел В: Добровольная автогражданская ответственность (ДСАГО)" : "Բաժին Գ. Կամավոր ԱՊՊԱ (Պատասխանատվություն)", isEn ? `Limit: ${formatCurrency(d.voluntaryTplLimit || 5000000, proposal.currency)}` : isRu ? `Лимит: ${formatCurrency(d.voluntaryTplLimit || 5000000, proposal.currency)}` : `Սահմանաչափ՝ ${formatCurrency(d.voluntaryTplLimit || 5000000, proposal.currency)}`);
      }
      if (d.additionalEquipment) {
        push(isEn ? "Additional Non-Factory Equipment" : isRu ? "Дополнительное оборудование" : "Լրացուցիչ ոչ գործարանային սարքավորումներ", d.additionalEquipment);
      }
      push(isEn ? "Territory" : isRu ? "Территория" : "Ապահովագրության տարածք", d.territory);
      push(isEn ? "Authorized Drivers" : isRu ? "Водители" : "Լիազորված վարորդներ", d.driversOption);
      if (d.namedDrivers) {
        push(isEn ? "Named Drivers" : isRu ? "Список водителей" : "Վարորդների ցանկ", d.namedDrivers);
      }
      push(isEn ? "Warranty Dealer Service" : isRu ? "Официальный сервис дилера" : "Պաշտոնական դիլերի սերվիս", d.warrantyService);
      if (d.glassNoPolice || d.glassNoPoliceLimit) {
        push(isEn ? "Glass Claim without Police Act" : isRu ? "Выплата по стеклам без справок ГАИ" : "Առանց Ոստիկանության ակտի հատուցում", d.glassNoPoliceLimit ? (isEn ? `Up to ${formatCurrency(d.glassNoPoliceLimit, proposal.currency)}` : isRu ? `До ${formatCurrency(d.glassNoPoliceLimit, proposal.currency)}` : `Մինչև ${formatCurrency(d.glassNoPoliceLimit, proposal.currency)}`) : (isEn ? "Included (1-2 events/yr)" : isRu ? "Включено (1-2 раза в год)" : "Ներառված է (ապակիներ / մանր վնասներ)"));
      }
      if (d.towing) {
        push(isEn ? "Roadside Assistance / Towing" : isRu ? "Эвакуатор и техпомощь" : "Էվակուատոր / Ճանապարհային օգնություն", isEn ? "Free 24/7 in Armenia" : isRu ? "Бесплатно 24/7 по Армении" : "Անվճար 24/7 ՀՀ ամբողջ տարածքում");
      }
      push(isEn ? "Payment Method" : isRu ? "Способ оплаты" : "Վճարման եղանակ", d.paymentMethod);
      push(isEn ? "Electric / Hybrid Vehicle" : isRu ? "Электромобиль / Гибрид" : "Էլեկտրամոբիլ / Հիբրիդ", d.electricVehicle === true ? (isEn ? "Yes" : isRu ? "Да" : "Այո") : undefined);
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
      push(isEn ? "Clause Type" : isRu ? "Тип оговорки" : "Կլաուզա", d.clauseType || d.clause);
      push(isEn ? "Cargo Type" : isRu ? "Тип груза" : "Բեռի տեսակ", d.cargoType);
      push(isEn ? "Country of Origin" : isRu ? "Страна отправления" : "Ծագման երկիր", d.originCountry || d.origin);
      push(isEn ? "Destination Country" : isRu ? "Страна назначения" : "Նպատակակետ", d.destinationCountry || d.destination);
      push(isEn ? "Transport Mode" : isRu ? "Вид транспорта" : "Փոխադրման եղանակ", d.transportMode);
      break;
    case "construction":
      push(isEn ? "Project Name" : isRu ? "Название проекта" : "Նախագծի անվանում", d.projectName);
      push(isEn ? "Project Address" : isRu ? "Адрес объекта" : "Շինհրապարակի հասցե", d.projectAddress);
      push(isEn ? "Project Type" : isRu ? "Тип строительства" : "Շինարարության տեսակ", d.projectType);
      push(isEn ? "Contract Value" : isRu ? "Стоимость контракта" : "Պայմանագրային արժեք", d.contractValue ? formatCurrency(d.contractValue, proposal.currency) : undefined);
      push(isEn ? "Duration" : isRu ? "Срок работ" : "Շինարարության տևողություն", d.durationMonths ? `${d.durationMonths} ${isEn ? "months" : isRu ? "мес." : "ամիս"}` : undefined);
      push(isEn ? "Third Party Liability (TPL)" : isRu ? "Ответственность перед 3-ми лицами" : "TPL ծածկույթ", d.tplIncluded ? (isEn ? "Included" : isRu ? "Включено" : "Ներառված է") : (isEn ? "Not included" : isRu ? "Не включено" : "Չներառված"));
      break;
    case "liability":
      push(isEn ? "Liability Type" : isRu ? "Тип ответственности" : "Պատասխանատվության տեսակ", d.liabilityType);
      push(isEn ? "Business Sector" : isRu ? "Сфера деятельности" : "Գործունեության ոլորտ", d.businessField);
      push(isEn ? "Limit of Indemnity" : isRu ? "Лимит ответственности" : "Պատասխանատվության սահմանաչափ", d.limitOfIndemnity ? formatCurrency(d.limitOfIndemnity, proposal.currency) : undefined);
      push(isEn ? "Annual Turnover" : isRu ? "Годовой оборот" : "Տարեկան շրջանառություն", d.annualTurnover ? formatCurrency(d.annualTurnover, proposal.currency) : undefined);
      break;
    case "accident":
      push(isEn ? "Coverage Period" : isRu ? "Период действия" : "Ծածկույթի ռեժիմ", d.coverageType === "24_hours" ? (isEn ? "24/7 Worldwide" : isRu ? "24/7 Круглосуточно" : "24/7 Շուրջօրյա") : (isEn ? "Working Hours" : isRu ? "Рабочее время" : "Աշխատանքային ժամեր"));
      push(isEn ? "Number of Insured" : isRu ? "Кол-во застрахованных" : "Ապահովագրվածների քանակ", d.numberOfPersons);
      push(isEn ? "Sum per Person" : isRu ? "Сумма на человека" : "1 անձի սահմանաչափ", d.sumPerPerson ? formatCurrency(d.sumPerPerson, proposal.currency) : undefined);
      push(isEn ? "Risk Category" : isRu ? "Категория риска" : "Ռիսկայնության դաս", d.riskClass);
      break;
    case "agro":
      push(isEn ? "Crop Type" : isRu ? "Сельхозкультура" : "Մշակաբույս", d.cropType);
      push(isEn ? "Region" : isRu ? "Регион" : "Մարզ", d.region);
      push(isEn ? "Area (Hectares)" : isRu ? "Площадь (Га)" : "Մակերես (Հա)", d.hectares ? `${d.hectares} ${isEn ? "ha" : isRu ? "га" : "հա"}` : undefined);
      push(isEn ? "Yield (kg/ha)" : isRu ? "Урожайность (кг/га)" : "Բերքատվություն (կգ/հա)", d.yieldKgPerHa);
      push(isEn ? "Anti-Hail Net" : isRu ? "Противоградовая сетка" : "Հակակարկտային ցանց", d.antiHailNet ? (isEn ? "Yes" : isRu ? "Да" : "Այո") : (isEn ? "No" : isRu ? "Нет" : "Ոչ"));
      push(isEn ? "State Subsidy" : isRu ? "Госсубсидия" : "Պետական սուբսիդավորում", d.subsidyPercent ? `${d.subsidyPercent}%` : undefined);
      break;
    case "financial":
      push(isEn ? "Guarantee / Bond Type" : isRu ? "Тип гарантии" : "Երաշխիքի տեսակ", d.bondType);
      push(isEn ? "Beneficiary" : isRu ? "Бенефициар" : "Շահառու", d.beneficiary);
      push(isEn ? "Duration" : isRu ? "Срок" : "Ժամկետ", d.durationMonths ? `${d.durationMonths} ${isEn ? "months" : isRu ? "мес." : "ամիս"}` : undefined);
      push(isEn ? "Collateral Type" : isRu ? "Обеспечение" : "Ապահովման միջոց", d.collateralType);
      break;
    case "aviation":
      push(isEn ? "Aviation Object" : isRu ? "Объект авиации" : "Ավիացիոն օբյեկտ", d.aviationType);
      push(isEn ? "Model / Serial" : isRu ? "Модель / Серийный" : "Մոդել և սերիական համար", d.aircraftModel);
      push(isEn ? "Pilot Experience" : isRu ? "Опыт пилота" : "Օդաչուի փորձ (ժամ)", d.flightHours);
      break;
    case "property":
      push(isEn ? "Property Address" : isRu ? "Адрес имущества" : "Գույքի հասցե", d.address);
      push(isEn ? "Property Category" : isRu ? "Категория имущества" : "Գույքի կատեգորիա", d.propertyCategory);
      push(isEn ? "Occupancy / Activity" : isRu ? "Назначение / Деятельность" : "Շահագործման տեսակ", d.occupancyType);
      push(isEn ? "Structure Type" : isRu ? "Конструкция здания" : "Շինության կառուցվածք", d.structureType || d.constructionType);
      push(isEn ? "Total Area (sq.m)" : isRu ? "Общая площадь (кв.м)" : "Ընդհանուր մակերես", d.totalArea ? `${d.totalArea} քմ` : undefined);
      push(isEn ? "Building & Finish Value" : isRu ? "Стоимость здания" : "Շենք-շինություն / Հարդարանք", d.propertyValue ? formatCurrency(d.propertyValue, proposal.currency) : undefined);
      push(isEn ? "Contents & Goods Value" : isRu ? "Стоимость движимого имущества" : "Շարժական գույք / Ապրանքներ", d.contentsValue ? formatCurrency(d.contentsValue, proposal.currency) : undefined);
      push(isEn ? "Machinery & Equipment Value" : isRu ? "Стоимость оборудования" : "Սարքավորումներ / Մեքենաներ", d.equipmentValue ? formatCurrency(d.equipmentValue, proposal.currency) : undefined);
      push(isEn ? "Fire Protection" : isRu ? "Противопожарная система" : "Հակահրդեհային համակարգ", d.fireSecurity);
      push(isEn ? "Security & CCTV" : isRu ? "Охрана и видеонаблюдение" : "Պահպանություն և CCTV", d.burglarSecurity || d.securityLevel);
      if (d.hasMortgagePledge) {
        push(isEn ? "Bank Pledge Beneficiary" : isRu ? "Залогодержатель (Банк)" : "Գրավառու բանկ", d.pledgeBank || "Առկա է գրավառություն");
      }
      break;
    default:
      break;
  }
  return rows.map(([label, value]) => `<tr><td>${esc(label)}</td><td>${esc(value)}</td></tr>`).join("");
}

function breakdownRows(proposal: QuotationProposal, lang: QuotationLanguage = "hy"): string {
  if (proposal.cascoBreakdown?.length) {
    return proposal.cascoBreakdown.map((r) => {
      let displayName = r.sectionName;
      if (lang === "en") {
        if (r.sectionKey === "section_a") displayName = "Section A: Vehicle Hull Insurance";
        else if (r.sectionKey === "section_b") displayName = "Section B: Personal Accident (PA)";
        else if (r.sectionKey === "section_c") displayName = "Section C: Voluntary TPL (Liability)";
        else if (r.sectionKey === "additional_equipment") displayName = "Additional Equipment";
      } else if (lang === "ru") {
        if (r.sectionKey === "section_a") displayName = "Раздел А: Страхование ТС (Автокаско)";
        else if (r.sectionKey === "section_b") displayName = "Раздел Б: Несчастный случай (НС)";
        else if (r.sectionKey === "section_c") displayName = "Раздел В: Добровольная автогражданская ответственность";
        else if (r.sectionKey === "additional_equipment") displayName = "Дополнительное оборудование";
      }
      return `<tr><td class="blue-cell">${esc(displayName)}</td><td class="num">${esc(formatCurrency(r.sumInsured, proposal.currency))}</td><td class="center">${esc(formatPercent(r.tariff))}</td><td class="num">${esc(formatCurrency(r.premium, proposal.currency))}</td><td>${esc(r.franchise || "—")}</td></tr>`;
    }).join("");
  }
  if (proposal.bundleBreakdown?.length) {
    return proposal.bundleBreakdown.map((r) => `<tr><td class="blue-cell">${esc(r.productName)}</td><td class="num">${esc(formatCurrency(r.sumInsured, proposal.currency))}</td><td class="center">${esc(formatPercent(r.tariff))}</td><td class="num">${esc(formatCurrency(r.premium, proposal.currency))}</td><td>${esc(r.details)}</td></tr>`).join("");
  }
  if (proposal.propertyBreakdown?.length) {
    return proposal.propertyBreakdown.map((r) => `<tr><td class="blue-cell">${esc(r.item)}</td><td class="num">${esc(formatCurrency(r.value, proposal.currency))}</td><td class="center">${esc(formatPercent(r.tariff))}</td><td class="num">${esc(formatCurrency(r.premium, proposal.currency))}</td><td>${esc(proposal.franchiseDescription || "—")}</td></tr>`).join("");
  }
  return `<tr><td class="blue-cell">${esc(proposal.objectDescription || proposal.productNameArm)}</td><td class="num">${esc(formatCurrency(proposal.totalSumInsured, proposal.currency))}</td><td class="center">${esc(formatPercent(proposal.finalTariff))}</td><td class="num">${esc(formatCurrency(proposal.annualPremium, proposal.currency))}</td><td>${esc(proposal.franchiseDescription || "—")}</td></tr>`;
}

const financialTable = (proposal: QuotationProposal, title: string, lang: QuotationLanguage = "hy") => {
  const labels = getProductLabels(proposal.type, lang);
  const totalText = lang === "en" ? "Total" : lang === "ru" ? "Итого" : "Ընդամենը";
  return `<h2 class="center-title financial-title">${esc(title)}</h2>
  <table class="offer-table"><thead><tr>
    <th>${esc(labels.objectLabel)}</th><th>${esc(labels.amountLabel)}</th><th>${esc(labels.tariffLabel)}</th><th>${esc(labels.premiumLabel)}</th><th>${esc(labels.franchiseLabel)}</th>
  </tr></thead><tbody>${breakdownRows(proposal, lang)}<tr class="total-row"><td class="blue-cell">${totalText}</td><td class="num">${esc(formatCurrency(proposal.totalSumInsured, proposal.currency))}</td><td></td><td class="num">${esc(formatCurrency(proposal.annualPremium, proposal.currency))}</td><td>${esc(proposal.franchiseDescription || "—")}</td></tr></tbody></table>`;
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
    mainData: isEn ? "MAIN INSURANCE DETAILS" : isRu ? "ОСНОВНЫЕ ДАННЫЕ СТРАХОВАНИЯ" : "ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՀԻՄՆԱԿԱՆ ՏՎՅԱԼՆԵՐ",
    specialData: isEn ? "PRODUCT SPECIFIC DETAILS" : isRu ? "СПЕЦИАЛЬНЫЕ УСЛОВИЯ ПРОДУКТА" : "ՊՐՈԴՈՒԿՏԻ ՀԱՏՈՒԿ ՏՎՅԱԼՆԵՐ",
    financialOffer: isEn ? "FINANCIAL PROPOSAL" : isRu ? "ФИНАНСОВОЕ ПРЕДЛОЖЕНИЕ" : "ՖԻՆԱՆՍԱԿԱՆ ԱՌԱՋԱՐԿ",
    financialTerms: isEn ? "MAIN FINANCIAL TERMS" : isRu ? "ОСНОВНЫЕ ФИНАНСОВЫЕ УСЛОВИЯ" : "ՀԻՄՆԱԿԱՆ ՖԻՆԱՆՍԱԿԱՆ ՊԱՅՄԱՆՆԵՐ",
    provisions: isEn ? "COVERAGE PROVISIONS" : isRu ? "ОСНОВНЫЕ ПОЛОЖЕНИЯ ПОКРЫТИЯ" : "ՀԱՊԱՏԱՍԽԱՆ ԾԱԾԿՈՒՅԹԻ ՀԻՄՆԱԿԱՆ ԴՐՈՒՅԹՆԵՐ",
    claimsProc: isEn ? "CLAIM REPORTING PROCEDURE" : isRu ? "ПОРЯДОК УРЕГУЛИРОВАНИЯ УБЫТКОВ" : "ՀԱՅՏԻ ՆԵՐԿԱՅԱՑՄԱՆ ԵՎ ԿԱՐԳԱՎՈՐՄԱՆ ԿԱՐԳԸ",
    payout: isEn ? "CLAIM INDEMNIFICATION" : isRu ? "ВЫПЛАТА СТРАХОВОГО ВОЗМЕЩЕНИЯ" : "ԱՊԱՀՈՎԱԳՐԱԿԱՆ ՀԱՏՈՒՑՄԱՆ ՎՃԱՐՈՒՄԸ",
    specialConditions: isEn ? "SPECIAL CONDITIONS" : isRu ? "ОСОБЫЕ УСЛОВИЯ" : "ՀԱՏՈՒԿ ՊԱՅՄԱՆՆԵՐ",
    requiredDocs: isEn ? "REQUIRED DOCUMENTS" : isRu ? "НЕОБХОДИМЫЕ ДОКУМЕНТЫ" : "ԱՆՀՐԱԺԵՇՏ ՓԱՍՏԱԹՂԹԵՐ",
    importantNote: isEn ? "IMPORTANT NOTICE" : isRu ? "ВАЖНОЕ ПРИМЕЧАНИЕ" : "ԿԱՐԵՎՈՐ ՆՇՈՒՄ",
    insurerLabel: isEn ? "Insurer" : isRu ? "Страховщик" : "Ապահովագրող",
    insurerName: isEn ? "SIL INSURANCE CJSC" : isRu ? "СЗАО «СИЛ ИНШУРАНС»" : "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ",
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
    silRepresentative: isEn ? "For SIL Insurance CJSC:" : isRu ? "От имени СЗАО «СИЛ ИНШУРАНС»:" : "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ-ի կողմից՝",
    clientSignature: isEn ? "CUSTOMER / POLICYHOLDER:" : isRu ? "КЛИЕНТ (СТРАХОВАТЕЛЬ):" : "ՀԱՃԱԽՈՐԴԻ (ԱՊԱՀՈՎԱԴՐԻ) ԿՈՂՄԻՑ՝",
  };

  const labels = getProductLabels(proposal.type, lang);
  const rawTitle = proposal.productNameArm || labels.title;
  const product = isEn
    ? proposal.type.toUpperCase() + " Insurance Proposal"
    : isRu
    ? "Предложение по страхованию " + proposal.type.toUpperCase()
    : rawTitle;

  const perils = proposal.coveredPerilsList?.length
    ? proposal.coveredPerilsList
    : [isEn ? "Standard perils per SIL Insurance policy conditions." : isRu ? "Стандартные риски согласно условиям страхования." : "Ռիսկերի և ծածկույթների վերջնական ցանկը սահմանվում է ընտրված պրոդուկտի գործող պայմաններով։"];
  const conditions = proposal.specialConditions?.length
    ? proposal.specialConditions
    : [isEn ? "Quotation is valid for 30 days based on supplied data." : isRu ? "Предложение действительно в течение 30 дней." : "Գնառաջարկը ներկայացվում է մուտքագրված տվյալների և ընտրված պրոդուկտի գործող պայմանների հիման վրա։"];
  const object = proposal.objectDescription || "—";
  const client = proposal.clientName || "—";
  const payment = proposal.paymentTerms || "—";
  const franchise = proposal.franchiseDescription || "—";
  const beneficiary = proposal.beneficiaryDetails || (isEn ? "N/A" : isRu ? "Не применяется" : "Չի կիրառվում");
  const territory = proposal.productSpecificDetails?.territory || (isEn ? "Republic of Armenia" : isRu ? "Республика Армения" : "Ըստ ընտրված պրոդուկտի և պայմանագրի");
  const period = proposal.productSpecificDetails?.period || (isEn ? "1 Year (12 Months)" : isRu ? "1 Год (12 Месяцев)" : "Ըստ պայմանագրի");

  const row = (label: string, value: unknown) => `<tr><td>${esc(label)}</td><td>${esc(value)}</td></tr>`;

  const productRows = [
    row(t.insurerLabel, t.insurerName),
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

  const contactHtml = isEn
    ? `3, 5 Arami str., Yerevan, RA<br/>Tel: (+374 60) 54 00 00<br/><a href="mailto:info@silinsurance.am">info@silinsurance.am</a> | <a href="https://www.silinsurance.am">www.silinsurance.am</a>`
    : isRu
    ? `РА, г. Ереван, ул. Арами 3, 5<br/>Тел.: (+374 60) 54 00 00<br/><a href="mailto:info@silinsurance.am">info@silinsurance.am</a> | <a href="https://www.silinsurance.am">www.silinsurance.am</a>`
    : `ՀՀ, ք. Երևան, Արամի 3,5<br/>hեռ․՝ (+374 60) 54 00 00<br/><a href="mailto:info@silinsurance.am">info@silinsurance.am</a> | <a href="https://www.silinsurance.am">www.silinsurance.am</a>`;

  let agentNameDisplay = proposal.agentName || t.insurerName;
  if (agentNameDisplay === "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ" || !agentNameDisplay) {
    agentNameDisplay = t.insurerName;
  } else if (isEn) {
    agentNameDisplay = agentNameDisplay
      .replace(/«?ՍԻԼ\s*ԻՆՇՈՒՐԱՆՍ»?\s*Ապահովագրական\s*ՓԲԸ/gi, "SIL INSURANCE Insurance CJSC")
      .replace(/«?ՍԻԼ\s*ԻՆՇՈՒՐԱՆՍ»?\s*ԱՓԲԸ/gi, "SIL INSURANCE CJSC")
      .replace(/«?ՍԻԼ\s*ԻՆՇՈՒՐԱՆՍ»?/gi, "SIL Insurance");
  } else if (isRu) {
    agentNameDisplay = agentNameDisplay
      .replace(/«?ՍԻԼ\s*ԻՆՇՈՒՐԱՆՍ»?\s*Ապահովագրական\s*ՓԲԸ/gi, "СЗАО «СИЛ ИНШУРАНС»")
      .replace(/«?ՍԻԼ\s*ԻՆՇՈՒՐԱՆՍ»?\s*ԱՓԲԸ/gi, "СЗАО «СИЛ ИНШՈՒՐԱՆՍ»")
      .replace(/«?ՍԻԼ\s*ԻՆՇՈՒՐԱՆՍ»?/gi, "«СИЛ ИНШՈՒՐԱՆՍ»");
  }

  let agentTitleDisplay = proposal.agentTitle || (isEn ? "Insurance Company" : isRu ? "Страховая компания" : "Ապահովագրական Ընկերություն");
  if (isEn) {
    agentTitleDisplay = agentTitleDisplay
      .replace(/Ապահովագրական\s*Ընկերություն/gi, "Insurance Company")
      .replace(/Անդեռռայթեր/gi, "Underwriter")
      .replace(/Ագենտ/gi, "Insurance Agent")
      .replace(/Գլխավոր\s*Անդեռռայթեր/gi, "Chief Underwriter");
  } else if (isRu) {
    agentTitleDisplay = agentTitleDisplay
      .replace(/Ապահովագրական\s*Ընկերություն/gi, "Страховая компания")
      .replace(/Անդեռռայթեր/gi, "Андеррайтер")
      .replace(/Ագենտ/gi, "Страховой Агент")
      .replace(/Գլխավոր\s*Անդեռռայթեր/gi, "Главный Андеррайтер");
  }

  const footerText = isEn
    ? `SIL Insurance CJSC • 3, 5 Arami str., Yerevan, RA • Tel: (+374 60) 54-00-00 • info@silinsurance.am • www.silinsurance.am`
    : isRu
    ? `СЗАО «СИЛ ИНШУРАНՍ» • РА, г. Ереван, ул. Арами 3, 5 • Тел.: (+374 60) 54-00-00 • info@silinsurance.am • www.silinsurance.am`
    : `«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ • ՀՀ, ք. Երևան, Արամի 3,5 • Հեռ.՝ (+374 60) 54 00 00 • info@silinsurance.am • www.silinsurance.am`;

  const importantNoticeP = isEn
    ? "This document is a formal insurance quotation issued by SIL Insurance CJSC."
    : isRu
    ? "Настоящий документ является официальным коммерческим предложением СЗАО «СИЛ ИНШУРАНС»."
    : "Սույն գնառաջարկը տեղեկատվական և նախնական առաջարկ է և ինքնին չի հանդիսանում ապահովագրական պայմանագիր։";

  return `
  <style>${quotationTemplateCss()}</style>
  <div class="sil-template">
    <section class="quote-page cover">
      <div class="cover-header"><div>
        <img class="cover-logo" src="${horizontalLogo}" alt="Sil insurance" />
        <div class="contact">${contactHtml}</div>
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

    <section class="quote-page">
      <h2 class="section-heading">${t.specialConditions}</h2>
      ${list(conditions, true)}
      <h2 class="section-heading">${t.importantNote}</h2>
      <div class="body-text">
        <p>${importantNoticeP}</p>
      </div>
      <div class="signature">
        <div><strong>${t.silRepresentative}</strong><br/>${esc(agentNameDisplay)}<br/><span class="muted">${esc(agentTitleDisplay)}</span><div class="line">${isEn ? "Signature / Stamp" : isRu ? "Подпись / Печать" : "Ստորագրություն / Կնիք (Կ․Տ․)"}</div></div>
        <div><strong>${t.clientSignature}</strong><br/>${esc(client)}<br/><span class="muted">${isEn ? "Read and accepted" : isRu ? "Ознакомлен" : "Ծանոթացել եմ գնառաջարկի պայմաններին"}</span><div class="line">${isEn ? "Signature" : isRu ? "Подпись" : "Ստորագրություն"}</div></div>
      </div>
      <div class="footer">${footerText}</div>
    </section>
  </div>`;
}
