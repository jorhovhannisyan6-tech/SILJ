export type PropertyType = "apartment" | "house" | "commercial" | "industrial" | "land" | "warehouse";

export interface DistrictInfo {
  id: string;
  nameArm: string;
  regionArm: string;
  basePriceUSDPerSqm: number;
  baseApartmentPricePerSqmUSD: number;
  baseLandPricePerSqmUSD: number;
  isYerevan: boolean;
  subDistricts?: string[];
  popularSubDistricts?: string[];
}

export const USD_TO_AMD_PROPERTY_RATE = 388;

export const PROPERTY_TYPES = [
  { id: "apartment" as PropertyType, nameArm: "Բնակարան", label: "Բնակարան", iconName: "Home" },
  { id: "house" as PropertyType, nameArm: "Անհատական տուն / Առանձնատուն", label: "Անհատական տուն / Առանձնատուն", iconName: "Building" },
  { id: "commercial" as PropertyType, nameArm: "Կոմերցիոն տարածք", label: "Կոմերցիոն տարածք", iconName: "Briefcase" },
  { id: "industrial" as PropertyType, nameArm: "Արտադրական տարածք", label: "Արտադրական տարածք", iconName: "Warehouse" },
  { id: "warehouse" as PropertyType, nameArm: "Պահեստային տարածք", label: "Պահեստային տարածք", iconName: "Warehouse" },
  { id: "land" as PropertyType, nameArm: "Հողատարածք", label: "Հողատարածք", iconName: "MapPin" },
];

export const BUILDING_STRUCTURES = [
  { id: "monolith", nameArm: "Մոնոլիտ (Նորակառույց)", label: "Մոնոլիտ (Նորակառույց)", coefficient: 1.15, multiplier: 1.15 },
  { id: "stone", nameArm: "Քարե (Տուֆ / Ստալինյան)", label: "Քարե (Տուֆ / Ստալինյան)", coefficient: 1.05, multiplier: 1.05 },
  { id: "panel", nameArm: "Պանելային", label: "Պանելային", coefficient: 0.90, multiplier: 0.90 },
  { id: "brick", nameArm: "Աղյուսե", label: "Աղյուսե", coefficient: 1.00, multiplier: 1.00 },
  { id: "other", nameArm: "Այլ / Փայտե", label: "Այլ / Փայտե", coefficient: 0.80, multiplier: 0.80 },
];

export const RENOVATION_CONDITIONS = [
  { id: "euro", nameArm: "Եվրոնորոգված / Պրեմիում", label: "Եվրոնորոգված / Պրեմիում", coefficient: 1.25, multiplier: 1.25 },
  { id: "good", nameArm: "Լավ վիճակ / Մաքուր", label: "Լավ վիճակ / Մաքուր", coefficient: 1.05, multiplier: 1.05 },
  { id: "average", nameArm: "Միջին / Նորմալ վիճակ", label: "Միջին / Նորմալ վիճակ", coefficient: 0.90, multiplier: 0.90 },
  { id: "needs_repair", nameArm: "Վերանորոգման կարիք ունի", label: "Վերանորոգման կարիք ունի", coefficient: 0.75, multiplier: 0.75 },
  { id: "zero", nameArm: "Զրոյական վիճակ", label: "Զրոյական վիճակ", coefficient: 0.85, multiplier: 0.85 },
];

export const ARMENIAN_REGIONS_AND_DISTRICTS: DistrictInfo[] = [
  {
    id: "kentron",
    nameArm: "Կենտրոն",
    regionArm: "Ք. Երևան",
    basePriceUSDPerSqm: 1450,
    baseApartmentPricePerSqmUSD: 1450,
    baseLandPricePerSqmUSD: 350,
    isYerevan: true,
    subDistricts: ["Կասկադ", "Հանրապետության Հրապարակ", "Հյուսիսային պողոտա"],
    popularSubDistricts: ["Կասկադ", "Հանրապետության Հրապարակ", "Հյուսիսային պողոտա"]
  },
  {
    id: "arabkir",
    nameArm: "Արաբկիր",
    regionArm: "Ք. Երևան",
    basePriceUSDPerSqm: 1120,
    baseApartmentPricePerSqmUSD: 1120,
    baseLandPricePerSqmUSD: 280,
    isYerevan: true,
    subDistricts: ["Կոմիտաս", "Բաղրամյան", "Այգեստան"],
    popularSubDistricts: ["Կոմիտաս", "Բաղրամյան", "Այգեստան"]
  },
  {
    id: "ajapnyak",
    nameArm: "Աջափնյակ",
    regionArm: "Ք. Երևան",
    basePriceUSDPerSqm: 850,
    baseApartmentPricePerSqmUSD: 850,
    baseLandPricePerSqmUSD: 180,
    isYerevan: true,
    subDistricts: ["Ֆանտան", "Բաշինջաղյան", "Անդրանիկի թաղ."],
    popularSubDistricts: ["Ֆանտան", "Բաշինջաղյան"]
  },
  {
    id: "avan",
    nameArm: "Ավան",
    regionArm: "Ք. Երևան",
    basePriceUSDPerSqm: 890,
    baseApartmentPricePerSqmUSD: 890,
    baseLandPricePerSqmUSD: 190,
    isYerevan: true,
    subDistricts: ["Ավան-Առինջ", "Հին Ավան"],
    popularSubDistricts: ["Ավան-Առինջ"]
  },
  {
    id: "davtashen",
    nameArm: "Դավթաշեն",
    regionArm: "Ք. Երևան",
    basePriceUSDPerSqm: 950,
    baseApartmentPricePerSqmUSD: 950,
    baseLandPricePerSqmUSD: 210,
    isYerevan: true,
    subDistricts: ["1-ին թաղ.", "2-րդ թաղ."],
    popularSubDistricts: ["1-ին թաղ.", "2-րդ թաղ."]
  },
  {
    id: "erebuni",
    nameArm: "Էրեբունի",
    regionArm: "Ք. Երևան",
    basePriceUSDPerSqm: 800,
    baseApartmentPricePerSqmUSD: 800,
    baseLandPricePerSqmUSD: 165,
    isYerevan: true,
    subDistricts: ["Էրեբունի զանգված", "Խաղաղ Դոնի", "Արցախի փող.", "Վարդաշեն", "Մուշական"],
    popularSubDistricts: ["Էրեբունի զանգված", "Խաղաղ Դոնի", "Արցախի փող."]
  },
  {
    id: "malatia_sebastia",
    nameArm: "Մալաթիա-Սեբաստիա",
    regionArm: "Ք. Երևան",
    basePriceUSDPerSqm: 820,
    baseApartmentPricePerSqmUSD: 820,
    baseLandPricePerSqmUSD: 170,
    isYerevan: true,
    subDistricts: ["Զորավար Անդրանիկ", "Սեբաստիա"],
    popularSubDistricts: ["Զորավար Անդրանիկ"]
  },
  {
    id: "nork_marash",
    nameArm: "Նորք-Մարաշ",
    regionArm: "Ք. Երևան",
    basePriceUSDPerSqm: 980,
    baseApartmentPricePerSqmUSD: 980,
    baseLandPricePerSqmUSD: 230,
    isYerevan: true,
    subDistricts: ["Կենտրոնական Նորք"],
    popularSubDistricts: ["Կենտրոնական Նորք"]
  },
  {
    id: "nor_nork",
    nameArm: "Նոր Նորք",
    regionArm: "Ք. Երևան",
    basePriceUSDPerSqm: 840,
    baseApartmentPricePerSqmUSD: 840,
    baseLandPricePerSqmUSD: 175,
    isYerevan: true,
    subDistricts: ["1-ին զանգ.", "2-րդ զանգ."],
    popularSubDistricts: ["1-ին զանգ.", "2-րդ զանգ."]
  },
  {
    id: "shengavit",
    nameArm: "Շենգավիթ",
    regionArm: "Ք. Երևան",
    basePriceUSDPerSqm: 830,
    baseApartmentPricePerSqmUSD: 830,
    baseLandPricePerSqmUSD: 170,
    isYerevan: true,
    subDistricts: ["Չարբախ", "Գարեգին Նժդեհ"],
    popularSubDistricts: ["Գարեգին Նժդեհ"]
  },
  {
    id: "kanaker_zeytun",
    nameArm: "Քանաքեռ-Զեյթուն",
    regionArm: "Ք. Երևան",
    basePriceUSDPerSqm: 880,
    baseApartmentPricePerSqmUSD: 880,
    baseLandPricePerSqmUSD: 190,
    isYerevan: true,
    subDistricts: ["Ռუბինյանց", "Ազատության պող."],
    popularSubDistricts: ["Ռუბինյանց"]
  },
  {
    id: "nubarashen",
    nameArm: "Նուբարաշեն",
    regionArm: "Ք. Երևան",
    basePriceUSDPerSqm: 550,
    baseApartmentPricePerSqmUSD: 550,
    baseLandPricePerSqmUSD: 110,
    isYerevan: true,
    subDistricts: ["Կենտրոնական"],
    popularSubDistricts: ["Կենտրոնական"]
  },
  {
    id: "kotayk",
    nameArm: "Կոտայքի մարզ",
    regionArm: "Մարզեր",
    basePriceUSDPerSqm: 720,
    baseApartmentPricePerSqmUSD: 720,
    baseLandPricePerSqmUSD: 120,
    isYerevan: false,
    subDistricts: ["Ծաղկաձոր", "Աբովյան", "Հրազդան"],
    popularSubDistricts: ["Ծաղկաձոր", "Աբովյան"]
  },
  {
    id: "armavir",
    nameArm: "Արմավիրի մարզ",
    regionArm: "Մարզեր",
    basePriceUSDPerSqm: 450,
    baseApartmentPricePerSqmUSD: 450,
    baseLandPricePerSqmUSD: 80,
    isYerevan: false,
    subDistricts: ["Արմավիր", "Վաղարշապատ (Էջմիածին)"],
    popularSubDistricts: ["Վաղարշապատ (Էջմիածին)"]
  },
  {
    id: "ararat",
    nameArm: "Արարատի մարզ",
    regionArm: "Մարզեր",
    basePriceUSDPerSqm: 430,
    baseApartmentPricePerSqmUSD: 430,
    baseLandPricePerSqmUSD: 75,
    isYerevan: false,
    subDistricts: ["Արտաշատ", "Մասիս"],
    popularSubDistricts: ["Արտաշատ"]
  },
  {
    id: "lori",
    nameArm: "Լոռու մարզ",
    regionArm: "Մարզեր",
    basePriceUSDPerSqm: 400,
    baseApartmentPricePerSqmUSD: 400,
    baseLandPricePerSqmUSD: 65,
    isYerevan: false,
    subDistricts: ["Վանաձոր", "Սպիտակ"],
    popularSubDistricts: ["Վանաձոր"]
  },
  {
    id: "shirak",
    nameArm: "Շիրակի մարզ",
    regionArm: "Մարզեր",
    basePriceUSDPerSqm: 390,
    baseApartmentPricePerSqmUSD: 390,
    baseLandPricePerSqmUSD: 60,
    isYerevan: false,
    subDistricts: ["Գյումրի", "Արթիկ"],
    popularSubDistricts: ["Գյումրի"]
  }
];
