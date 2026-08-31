import { InsuranceProductType } from "../types";

export type QuoteInput = {
  clientName: string;
  phone: string;
  product: InsuranceProductType;
  currency: "AMD" | "USD" | "EUR";
  insuredAmount: number;
  businessActivity: string;
  objectDescription: string;
  selectedRisks: string[];
  franchisePercent: number;
  previousLosses: boolean;
  customTariff?: number;
  productDetails?: Record<string, any>;
};

export type QuoteCheck = {
  label: string;
  passed: boolean;
  message: string;
};

export type FixedProductRule = {
  product: InsuranceProductType;
  nameArm: string;
  stage2TitleArm: string;
  stage2DescriptionArm: string;
  minInsuredAmount: number;
  maxInsuredAmount?: number;
  minTariff: number;
  maxTariff: number;
  defaultTariff: number;
  defaultFranchise: number;
  requiredRisks: string[];
  availableRisks?: string[];
  excludedActivities: string[];
  requiredDocuments: string[];
  allowedCurrencies?: Array<QuoteInput["currency"]>;
  minFranchisePercent?: number;
  maxFranchisePercent?: number;
  previousLossesAllowed?: boolean;
  manualReviewOnPreviousLosses?: boolean;
  /** Optional additive tariff adjustment per selected risk, in percentage points. */
  riskTariffAdjustments?: Record<string, number>;
};

/**
 * Սա միակ ֆայլն է, որտեղ պահվում են ավտոմատ գնառաջարկի ՖԻՔՍՎԱԾ կանոնները։
 * Երբ ապահովագրական պայմանները հաստատվում են, փոփոխությունները պետք է արվեն
 * այստեղ, իսկ հաշվարկային ալգորիթմը մնա անփոփոխ։
 */
export const FIXED_QUOTATION_RULES: Record<InsuranceProductType, FixedProductRule> = {
  property: {
    product: "property",
    nameArm: "Գույքի ապահովագրություն",
    stage2TitleArm: "Գույքի տվյալներ",
    stage2DescriptionArm: "Նշեք գույքի տեսակը, գտնվելու վայրը, արժեքը և ապահովագրության համար անհրաժեշտ գույքային մանրամասները։",
    minInsuredAmount: 1,
    minTariff: 0.03,
    maxTariff: 1.17,
    defaultTariff: 0.18,
    defaultFranchise: 0.5,
    requiredRisks: [],
    availableRisks: ["Հրդեհ","Կայծակ","Պայթյուն","Ջրի վնաս","Բնական աղետներ","Գողություն և կողոպուտ","Վանդալիզմ","Երրորդ անձանց պատասխանատվություն","Բիզնեսի ընդհատում"],
    excludedActivities: [],
    requiredDocuments: ["Գույքի սեփականության կամ օգտագործման իրավունքը հաստատող փաստաթուղթ"],
    allowedCurrencies: ["AMD", "USD", "EUR"],
    riskTariffAdjustments: {},
  },
  casco: {
    product: "casco",
    nameArm: "ԿԱՍԿՈ",
    stage2TitleArm: "Ավտոմեքենայի և ԿԱՍԿՈ-ի տվյալներ",
    stage2DescriptionArm: "Նշեք ավտոմեքենայի տվյալները, շուկայական արժեքը, օգտագործման պայմանները և ԿԱՍԿՈ-ի համար անհրաժեշտ տեղեկատվությունը։",
    minInsuredAmount: 1,
    minTariff: 0.61,
    maxTariff: 11.88,
    defaultTariff: 2.4,
    defaultFranchise: 1,
    requiredRisks: [],
    availableRisks: ["Վթար և բախում","Գողություն և առևանգում","Հրդեհ և պայթյուն","Բնական աղետներ","Կոտրված ապակիներ","Վանդալիզմ","Երրորդ անձանց պատասխանատվություն","Տարհանում/օգնություն"],
    excludedActivities: [],
    requiredDocuments: ["Տրանսպորտային միջոցի հաշվառման վկայագիր"],
  },
  health: {
    product: "health",
    nameArm: "Առողջության ապահովագրություն",
    stage2TitleArm: "Առողջության ապահովագրության տվյալներ",
    stage2DescriptionArm: "Նշեք ապահովագրվող անձանց տվյալները, ապահովագրական ծրագիրը, ծածկույթի սահմանաչափերը և ընտրված բժշկական ծառայությունները։",
    minInsuredAmount: 1,
    minTariff: 0.1,
    maxTariff: 36.73,
    defaultTariff: 4,
    defaultFranchise: 0,
    requiredRisks: [],
    availableRisks: ["Ստացիոնար բուժում","Ամբուլատոր բուժում","Շտապ օգնություն","Ախտորոշիչ հետազոտություններ","Դեղորայք","Ատամնաբուժություն","Տեսողություն","Ծննդաբերություն"],
    excludedActivities: [],
    requiredDocuments: ["Ապահովագրվող անձանց տվյալներ"],
  },
  travel: {
    product: "travel",
    nameArm: "Ճանապարհորդության ապահովագրություն",
    stage2TitleArm: "Ճանապարհորդության ապահովագրության տվյալներ",
    stage2DescriptionArm: "Նշեք ճանապարհորդների տվյալները, ուղևորության ուղղությունը, ժամկետները, նպատակը և անհրաժեշտ ճանապարհորդական ծածկույթները։",
    minInsuredAmount: 1,
    minTariff: 0.01,
    maxTariff: 3.07,
    defaultTariff: 0.25,
    defaultFranchise: 0,
    requiredRisks: [],
    availableRisks: ["Բժշկական ծախսեր արտերկրում","Շտապ բժշկական օգնություն","Բեռի կորուստ/ուշացում","Թռիչքի ուշացում/չեղարկում","Պատասխանատվություն երրորդ անձանց հանդեպ","Անհետաձգելի վերադարձ"],
    excludedActivities: [],
    requiredDocuments: ["Անձնագիր", "Ուղևորության ուղղություն և ժամկետներ"],
  },
  cargo: {
    product: "cargo",
    nameArm: "Բեռների ապահովագրություն",
    stage2TitleArm: "Բեռների ապահովագրության տվյալներ",
    stage2DescriptionArm: "Նշեք բեռի տեսակը և արժեքը, փոխադրման եղանակը, երթուղին և ընտրված բեռնային ծածկույթը։",
    minInsuredAmount: 1,
    minTariff: 0.02,
    maxTariff: 0.81,
    defaultTariff: 0.25,
    defaultFranchise: 0.5,
    requiredRisks: [],
    availableRisks: ["Հրդեհ","Վթար/կոտրվածք","Բնական աղետներ","Գողություն","Կողոպուտ","Ջրի վնաս","Բեռի վնասում բեռնման/բեռնաթափման ժամանակ","Ընդհանուր վթար"],
    excludedActivities: [],
    requiredDocuments: ["Բեռի նկարագրություն և արժեք", "Փոխադրման երթուղի"],
  },
  construction: {
    product: "construction",
    nameArm: "Շինմոնտաժային ապահովագրություն",
    stage2TitleArm: "Շինմոնտաժային ապահովագրության տվյալներ",
    stage2DescriptionArm: "Նշեք շինարարական նախագծի տեսակը, պայմանագրային արժեքը, հասցեն, ժամկետը և շինմոնտաժային ռիսկերի պայմանները։",
    minInsuredAmount: 1,
    minTariff: 0.01,
    maxTariff: 9.73,
    defaultTariff: 1,
    defaultFranchise: 1,
    requiredRisks: [],
    availableRisks: ["Հրդեհ","Կայծակ","Պայթյուն","Բնական աղետներ","Ջրի վնաս","Գողություն","Շինարարական պատահական վնաս","Երրորդ անձանց պատասխանատվություն"],
    excludedActivities: [],
    requiredDocuments: ["Շինարարական պայմանագիր / նախահաշիվ"],
  },
  liability: {
    product: "liability",
    nameArm: "Պատասխանատվության ապահովագրություն",
    stage2TitleArm: "Պատասխանատվության ապահովագրության տվյալներ",
    stage2DescriptionArm: "Նշեք գործունեության բնույթը, պատասխանատվության տեսակը, շրջանառությունը, աշխատակիցների քանակը և պահանջվող պատասխանատվության սահմանաչափերը։",
    minInsuredAmount: 1,
    minTariff: 0.02,
    maxTariff: 1.4,
    defaultTariff: 0.5,
    defaultFranchise: 0.5,
    requiredRisks: [],
    availableRisks: ["Երրորդ անձանց մարմնական վնաս","Երրորդ անձանց գույքային վնաս","Ապրանքի պատասխանատվություն","Գործատուի պատասխանատվություն","Մասնագիտական պատասխանատվություն","Շրջակա միջավայրի վնաս"],
    excludedActivities: [],
    requiredDocuments: ["Գործունեության նկարագրություն"],
  },
  accident: {
    product: "accident",
    nameArm: "Դժբախտ պատահարների ապահովագրություն",
    stage2TitleArm: "Դժբախտ պատահարների ապահովագրության տվյալներ",
    stage2DescriptionArm: "Նշեք ապահովագրվող անձանց քանակը, գործունեությունը, ապահովագրական գումարները և ընտրված դժբախտ պատահարի ծածկույթները։",
    minInsuredAmount: 1,
    minTariff: 0.1,
    maxTariff: 10,
    defaultTariff: 1,
    defaultFranchise: 0,
    requiredRisks: [],
    availableRisks: ["Մահ դժբախտ պատահարի հետևանքով","Մշտական հաշմանդամություն","Ժամանակավոր անաշխատունակություն","Բժշկական ծախսեր"],
    excludedActivities: [],
    requiredDocuments: ["Ապահովագրվող անձանց տվյալներ"],
  },
  agro: {
    product: "agro",
    nameArm: "Ագրոապահովագրություն",
    stage2TitleArm: "Ագրոապահովագրության տվյալներ",
    stage2DescriptionArm: "Նշեք հողատարածքի և մշակաբույսի տվյալները, մակերեսը, բերքի արժեքը, տեղանքը և գյուղատնտեսական ռիսկերը։",
    minInsuredAmount: 1,
    minTariff: 0.1,
    maxTariff: 20,
    defaultTariff: 2,
    defaultFranchise: 10,
    requiredRisks: [],
    availableRisks: ["Կարկտահարություն","Ցրտահարություն","Երաշտ","Հեղեղ","Փոթորիկ","Հրդեհ","Բուսական հիվանդություններ"],
    excludedActivities: [],
    requiredDocuments: ["Մշակաբույսի և հողատարածքի տվյալներ"],
  },
  financial: {
    product: "financial",
    nameArm: "Ֆինանսական ռիսկերի ապահովագրություն",
    stage2TitleArm: "Ֆինանսական ռիսկերի ապահովագրության տվյալներ",
    stage2DescriptionArm: "Նշեք ֆինանսական պարտավորության տեսակը, կողմերին, գումարը, ժամկետը և ապահովագրվող ֆինանսական ռիսկերը։",
    minInsuredAmount: 1,
    minTariff: 0.1,
    maxTariff: 10,
    defaultTariff: 1,
    defaultFranchise: 1,
    requiredRisks: [],
    availableRisks: ["Վարկային ռիսկ","Ֆինանսական կորուստ","Երաշխիքային պարտավորություն","Խարդախություն"],
    excludedActivities: [],
    requiredDocuments: ["Ֆինանսական պարտավորության վերաբերյալ փաստաթղթեր"],
  },
  mortgage: {
    product: "mortgage",
    nameArm: "Հիփոթեքային վարկառուների ապահովագրություն",
    stage2TitleArm: "Հիփոթեքային ապահովագրության տվյալներ",
    stage2DescriptionArm: "Նշեք վարկառուի, վարկի, վարկատուի և գրավադրված գույքի տվյալները, ինչպես նաև պահանջվող ապահովագրական ծածկույթը։",
    minInsuredAmount: 1,
    minTariff: 0.01,
    maxTariff: 10,
    defaultTariff: 0.18,
    defaultFranchise: 0,
    requiredRisks: [],
    availableRisks: ["Գույքի վնաս","Մահ","Աշխատունակության կորուստ","Բնական աղետներ","Հրդեհ"],
    excludedActivities: [],
    requiredDocuments: ["Վարկային պայմանագիր", "Գրավադրված գույքի տվյալներ"],
  },
  aviation: {
    product: "aviation",
    nameArm: "Ավիացիոն ռիսկերի ապահովագրություն",
    stage2TitleArm: "Ավիացիոն ապահովագրության տվյալներ",
    stage2DescriptionArm: "Նշեք օդանավի, սեփականատիրոջ և շահագործողի տվյալները, արժեքը, օգտագործման պայմանները և ավիացիոն ռիսկերը։",
    minInsuredAmount: 1,
    minTariff: 0.01,
    maxTariff: 20,
    defaultTariff: 1,
    defaultFranchise: 1,
    requiredRisks: [],
    availableRisks: ["Օդանավի ֆիզիկական վնաս", "Երրորդ անձանց պատասխանատվություն", "Ավիացիոն հատուկ ռիսկեր"],
    excludedActivities: [],
    requiredDocuments: ["Օդանավի և շահագործման տվյալներ", "Ավիացիոն պայմանագրային փաստաթղթեր"],
  },
  bundle: {
    product: "bundle",
    nameArm: "Կորպորատիվ համալիր փաթեթ",
    stage2TitleArm: "Կորպորատիվ համալիր փաթեթի տվյալներ",
    stage2DescriptionArm: "Նշեք ընկերության գործունեությունը և համալիր փաթեթում ներառվող ապահովագրատեսակները, օբյեկտները, սահմանաչափերը և հիմնական ռիսկերը։",
    minInsuredAmount: 1,
    minTariff: 0.01,
    maxTariff: 20,
    defaultTariff: 1,
    defaultFranchise: 0.5,
    requiredRisks: [],
    availableRisks: ["Գույք","Պատասխանատվություն","Դժբախտ պատահար","Բիզնեսի ընդհատում","Գողություն","Հրդեհ","Ջրի վնաս"],
    excludedActivities: [],
    requiredDocuments: ["Յուրաքանչյուր ներառված ապահովագրատեսակի փաստաթղթեր"],
  },
};
