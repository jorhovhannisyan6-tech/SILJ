/**
 * Tun Service Offer (PR+LB) Insurance Packages & Conditions
 * Extracted from authoritative source document: Tun Servic Offer PR+LB.docx
 * Designed for residential properties, apartments, and short-term / long-term rentals.
 */

export type PropertyPackageId = "custom" | "start" | "standard" | "standard_plus" | "premium";

export interface PropertyPackageDefinition {
  id: PropertyPackageId;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  isRentalOptimized: boolean;
  buildingSumInsuredAMD: number;
  buildingTariffPercent: number;
  contentsSumInsuredAMD: number;
  contentsTariffPercent: number;
  guestDamageSumInsuredAMD: number;
  guestDamageTariffPercent: number;
  liabilitySumInsuredAMD: number;
  liabilityTariffPercent: number;
  totalSumInsuredAMD: number;
  annualPremiumAMD: number;
  averageTariffPercent: number;
  franchisePropertyText: string;
  franchiseGuestDamageText: string;
  franchiseLiabilityText: string;
  fullFranchiseSummary: string;
  features: string[];
  recommendedFor: string;
}

export const TUN_SERVICE_PACKAGES: Record<PropertyPackageId, PropertyPackageDefinition> = {
  custom: {
    id: "custom",
    name: "Անհատական 13 Բաժիններ",
    badge: "Ճկուն Կարգավորում",
    tagline: "Խոշոր առևտրային, պահեստային և արդյունաբերական օբյեկտներ",
    description: "Լրացրեք գույքի, պաշարների, կոմունալ համակարգերի և հակահրդեհային միջոցների բոլոր 13 բաժինները ըստ անհատական պարամետրերի:",
    isRentalOptimized: false,
    buildingSumInsuredAMD: 0,
    buildingTariffPercent: 0.15,
    contentsSumInsuredAMD: 0,
    contentsTariffPercent: 0.23,
    guestDamageSumInsuredAMD: 0,
    guestDamageTariffPercent: 0.35,
    liabilitySumInsuredAMD: 0,
    liabilityTariffPercent: 0.25,
    totalSumInsuredAMD: 0,
    annualPremiumAMD: 0,
    averageTariffPercent: 0.15,
    franchisePropertyText: "0.5% (համաձայնեցվող)",
    franchiseGuestDamageText: "—",
    franchiseLiabilityText: "—",
    fullFranchiseSummary: "0.5% ապահովագրական գումարից (կամ ըստ պայմանագրի)",
    features: [
      "Լիարժեք անդեռռայթինգ 13 բաժիններով",
      "Շինություն, սարքավորումներ, պաշարներ, ցուցանակներ",
      "Անվտանգության համակարգերի զեղչային սանդղակ",
      "Գրավադրված գույքի բանկային ձևակերպում",
    ],
    recommendedFor: "Արտադրական, գրասենյակային, պահեստային համալիրներ և առևտրային խոշոր տարածքներ",
  },
  start: {
    id: "start",
    name: "START",
    badge: "Բազային Փաթեթ",
    tagline: "Հիմնական պաշտպանություն մատչելի տարեկան վճարով",
    description: "Շինության, շարժական գույքի և 3-րդ անձանց (հարևաններին) պատասխանատվության բազային ապահովագրություն:",
    isRentalOptimized: false,
    buildingSumInsuredAMD: 20_000_000,
    buildingTariffPercent: 0.13,
    contentsSumInsuredAMD: 4_000_000,
    contentsTariffPercent: 0.23,
    guestDamageSumInsuredAMD: 0,
    guestDamageTariffPercent: 0,
    liabilitySumInsuredAMD: 1_000_000,
    liabilityTariffPercent: 0.28,
    totalSumInsuredAMD: 25_000_000,
    annualPremiumAMD: 38_000,
    averageTariffPercent: 0.152,
    franchisePropertyText: "0.5% (մին․ 20,000 ֏)",
    franchiseGuestDamageText: "Չի ներառված",
    franchiseLiabilityText: "30,000 ֏",
    fullFranchiseSummary: "Գույքային՝ 0.5% (մին․ 20,000 ֏), Պատասխանատվություն՝ 30,000 ֏",
    features: [
      "Շինություն՝ 20,000,000 ֏ (սակագին՝ 0.13%)",
      "Շարժական գույք / Կահույք՝ 4,000,000 ֏ (սակագին՝ 0.23%)",
      "Քաղ․ Պատասխանատվություն (3-րդ անձ)՝ 1,000,000 ֏ (սակագին՝ 0.28%)",
      "Հրդեհ, պայթյուն, ջրալցում և բնական աղետներ",
    ],
    recommendedFor: "Փոքր բնակարաններ, անհատական բնակելի տարածքներ",
  },
  standard: {
    id: "standard",
    name: "STANDARD",
    badge: "Հանրաճանաչ",
    tagline: "Հավասարակշռված լիմիտներ միջին մակերեսի բնակարանների համար",
    description: "Ընդլայնված ծածկույթ շինության (30 մլն ֏), կահույքի/տեխնիկայի (6 մլն ֏) և հարևանների պատասխանատվության (2 մլն ֏) համար:",
    isRentalOptimized: false,
    buildingSumInsuredAMD: 30_000_000,
    buildingTariffPercent: 0.12,
    contentsSumInsuredAMD: 6_000_000,
    contentsTariffPercent: 0.23,
    guestDamageSumInsuredAMD: 0,
    guestDamageTariffPercent: 0,
    liabilitySumInsuredAMD: 2_000_000,
    liabilityTariffPercent: 0.25,
    totalSumInsuredAMD: 38_000_000,
    annualPremiumAMD: 54_800,
    averageTariffPercent: 0.1442,
    franchisePropertyText: "0.5% (մին․ 20,000 ֏)",
    franchiseGuestDamageText: "Չի ներառված",
    franchiseLiabilityText: "30,000 ֏",
    fullFranchiseSummary: "Գույքային՝ 0.5% (մին․ 20,000 ֏), Պատասխանատվություն՝ 30,000 ֏",
    features: [
      "Շինություն՝ 30,000,000 ֏ (սակագին՝ 0.12%)",
      "Շարժական գույք / Կահույք՝ 6,000,000 ֏ (սակագին՝ 0.23%)",
      "Քաղ․ Պատասխանատվություն (3-րդ անձ)՝ 2,000,000 ֏ (սակագին՝ 0.25%)",
      "Ջրալցման և հրդեհային պատահարների համապարփակ հատուցում",
    ],
    recommendedFor: "2-3 սենյականոց ստանդարտ բնակարաններ և առանձնատներ",
  },
  standard_plus: {
    id: "standard_plus",
    name: "STANDARD PLUS",
    badge: "Օրավարձ / Airbnb",
    tagline: "Հատուկ օրավարձով և կարճաժամկետ վարձակալության համար",
    description: "Ներառում է Հյուրերի կողմից գույքին հասցված վնասի ծածկույթ (2 մլն ֏) + Շինություն, Շարժական գույք և Հարևանների պատասխանատվություն:",
    isRentalOptimized: true,
    buildingSumInsuredAMD: 30_000_000,
    buildingTariffPercent: 0.12,
    contentsSumInsuredAMD: 6_000_000,
    contentsTariffPercent: 0.23,
    guestDamageSumInsuredAMD: 2_000_000,
    guestDamageTariffPercent: 0.35,
    liabilitySumInsuredAMD: 2_000_000,
    liabilityTariffPercent: 0.25,
    totalSumInsuredAMD: 40_000_000,
    annualPremiumAMD: 61_800,
    averageTariffPercent: 0.1545,
    franchisePropertyText: "0.5% (մին․ 20,000 ֏)",
    franchiseGuestDamageText: "30,000 ֏",
    franchiseLiabilityText: "30,000 ֏",
    fullFranchiseSummary: "Գույքային՝ 0.5% (մին․ 20,000 ֏), Հյուրերի վնաս՝ 30,000 ֏, Պատասխանատվություն՝ 30,000 ֏",
    features: [
      "Շինություն՝ 30,000,000 ֏ (սակագին՝ 0.12%)",
      "Շարժական գույք / Կահույք՝ 6,000,000 ֏ (սակագին՝ 0.23%)",
      "Հյուրերի կողմից պատճառված վնաս՝ 2,000,000 ֏ (սակագին՝ 0.35%)",
      "Քաղ․ Պատասխանատվություն (3-րդ անձ)՝ 2,000,000 ֏ (սակագին՝ 0.25%)",
    ],
    recommendedFor: "Օրավարձով տրվող բնակարաններ, Airbnb / Booking հյուրընկալներ",
  },
  premium: {
    id: "premium",
    name: "PREMIUM",
    badge: "Էլիտար Ծածկույթ",
    tagline: "Առավելագույն լիմիտներ բարձրարժեք գույքի և հյուրերի վնասի համար",
    description: "50 մլն ֏ Շինություն, 10 մլն ֏ Կահույք/Տեխնիկա, 4 մլն ֏ Հյուրերի վնաս և 4 մլն ֏ 3-րդ անձանց պատասխանատվություն:",
    isRentalOptimized: true,
    buildingSumInsuredAMD: 50_000_000,
    buildingTariffPercent: 0.11,
    contentsSumInsuredAMD: 10_000_000,
    contentsTariffPercent: 0.22,
    guestDamageSumInsuredAMD: 4_000_000,
    guestDamageTariffPercent: 0.30,
    liabilitySumInsuredAMD: 4_000_000,
    liabilityTariffPercent: 0.23,
    totalSumInsuredAMD: 68_000_000,
    annualPremiumAMD: 98_200,
    averageTariffPercent: 0.1444,
    franchisePropertyText: "0.5% (մին․ 20,000 ֏)",
    franchiseGuestDamageText: "30,000 ֏",
    franchiseLiabilityText: "30,000 ֏",
    fullFranchiseSummary: "Գույքային՝ 0.5% (մին․ 20,000 ֏), Հյուրերի վնաս՝ 30,000 ֏, Պատասխանատվություն՝ 30,000 ֏",
    features: [
      "Շինություն՝ 50,000,000 ֏ (սակագին՝ 0.11%)",
      "Շարժական գույք / Կահույք՝ 10,000,000 ֏ (սակագին՝ 0.22%)",
      "Հյուրերի կողմից պատճառված վնաս՝ 4,000,000 ֏ (սակագին՝ 0.30%)",
      "Քաղ․ Պատասխանատվություն (3-րդ անձ)՝ 4,000,000 ֏ (սակագին՝ 0.23%)",
    ],
    recommendedFor: "Պրեմիում դասի առանձնատներ, դուպլեքսներ և բարձրակարգ վարձակալական տներ",
  },
};

export const SHORT_TERM_RENTAL_QUESTIONS = [
  {
    id: "rental_usage",
    label: "Գույքի շահագործման ձևը",
    options: [
      { value: "owner_occupied", label: "Սեփական բնակություն (մշտական)" },
      { value: "short_term_rental", label: "Օրավարձով / Կարճաժամկետ վարձակալություն (Airbnb, Booking)" },
      { value: "long_term_rental", label: "Երկարաժամկետ վարձակալություն (ամսական)" },
      { value: "commercial_office", label: "Գրասենյակային / Առևտրային գործունեություն" },
    ],
  },
  {
    id: "rental_platform",
    label: "Վարձակալության հարթակներ",
    options: [
      { value: "airbnb_booking", label: "Airbnb / Booking.com / VRBO" },
      { value: "direct_local", label: "Ուղիղ հայտարարություններ (List.am, սոց․ ցանցեր)" },
      { value: "agency_managed", label: "Կառավարող ընկերություն (Property Management)" },
    ],
  },
];
