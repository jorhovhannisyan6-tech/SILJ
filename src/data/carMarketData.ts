export interface CarModelData {
  name: string;
  basePriceUSD2024: number; // Avg price for a 2024 model
  annualDepreciationRate: number; // e.g. 0.08 (8% per year)
  liquidity: "Բարձր" | "Միջին" | "Ցածր";
  category: "sedan" | "suv" | "hatchback" | "electric" | "luxury";
}

export interface CarBrandData {
  make: string;
  popularModels: CarModelData[];
  origin: string;
}

export const POPULAR_ARMENIAN_CAR_BRANDS: CarBrandData[] = [
  {
    make: "Toyota",
    origin: "Ճապոնիա",
    popularModels: [
      { name: "Camry", basePriceUSD2024: 33000, annualDepreciationRate: 0.06, liquidity: "Բարձր", category: "sedan" },
      { name: "RAV4", basePriceUSD2024: 35000, annualDepreciationRate: 0.06, liquidity: "Բարձր", category: "suv" },
      { name: "Corolla", basePriceUSD2024: 23000, annualDepreciationRate: 0.06, liquidity: "Բարձր", category: "sedan" },
      { name: "Land Cruiser Prado", basePriceUSD2024: 72000, annualDepreciationRate: 0.05, liquidity: "Բարձր", category: "suv" },
      { name: "Land Cruiser 300", basePriceUSD2024: 115000, annualDepreciationRate: 0.05, liquidity: "Բարձր", category: "suv" },
      { name: "Highlander", basePriceUSD2024: 48000, annualDepreciationRate: 0.06, liquidity: "Բարձր", category: "suv" },
      { name: "Prius", basePriceUSD2024: 29000, annualDepreciationRate: 0.06, liquidity: "Բարձր", category: "hatchback" },
    ],
  },
  {
    make: "Mercedes-Benz",
    origin: "Գերմանիա",
    popularModels: [
      { name: "E-Class", basePriceUSD2024: 72000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "sedan" },
      { name: "C-Class", basePriceUSD2024: 50000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "sedan" },
      { name: "S-Class", basePriceUSD2024: 135000, annualDepreciationRate: 0.10, liquidity: "Միջին", category: "luxury" },
      { name: "GLE / ML", basePriceUSD2024: 82000, annualDepreciationRate: 0.07, liquidity: "Բարձր", category: "suv" },
      { name: "G-Class (G63)", basePriceUSD2024: 220000, annualDepreciationRate: 0.05, liquidity: "Բարձր", category: "suv" },
      { name: "GLC", basePriceUSD2024: 55000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "suv" },
      { name: "CLA", basePriceUSD2024: 44000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "sedan" },
    ],
  },
  {
    make: "BMW",
    origin: "Գերմանիա",
    popularModels: [
      { name: "5 Series", basePriceUSD2024: 65000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "sedan" },
      { name: "3 Series", basePriceUSD2024: 48000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "sedan" },
      { name: "X5", basePriceUSD2024: 78000, annualDepreciationRate: 0.07, liquidity: "Բարձր", category: "suv" },
      { name: "X6", basePriceUSD2024: 88000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "suv" },
      { name: "7 Series", basePriceUSD2024: 120000, annualDepreciationRate: 0.10, liquidity: "Միջին", category: "luxury" },
      { name: "X3", basePriceUSD2024: 52000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "suv" },
      { name: "X7", basePriceUSD2024: 105000, annualDepreciationRate: 0.07, liquidity: "Բարձր", category: "suv" },
    ],
  },
  {
    make: "Hyundai",
    origin: "Հարավային Կորեա",
    popularModels: [
      { name: "Elantra", basePriceUSD2024: 22000, annualDepreciationRate: 0.07, liquidity: "Բարձր", category: "sedan" },
      { name: "Sonata", basePriceUSD2024: 27000, annualDepreciationRate: 0.07, liquidity: "Բարձր", category: "sedan" },
      { name: "Tucson", basePriceUSD2024: 31000, annualDepreciationRate: 0.06, liquidity: "Բարձր", category: "suv" },
      { name: "Santa Fe", basePriceUSD2024: 38000, annualDepreciationRate: 0.07, liquidity: "Բարձր", category: "suv" },
      { name: "Accent / Solaris", basePriceUSD2024: 17000, annualDepreciationRate: 0.07, liquidity: "Բարձր", category: "sedan" },
      { name: "Palisade", basePriceUSD2024: 46000, annualDepreciationRate: 0.07, liquidity: "Բարձր", category: "suv" },
    ],
  },
  {
    make: "Kia",
    origin: "Հարավային Կորեա",
    popularModels: [
      { name: "Forte / K3", basePriceUSD2024: 21000, annualDepreciationRate: 0.07, liquidity: "Բարձր", category: "sedan" },
      { name: "Optima / K5", basePriceUSD2024: 28000, annualDepreciationRate: 0.07, liquidity: "Բարձր", category: "sedan" },
      { name: "Sportage", basePriceUSD2024: 31000, annualDepreciationRate: 0.06, liquidity: "Բարձր", category: "suv" },
      { name: "Sorento", basePriceUSD2024: 37000, annualDepreciationRate: 0.07, liquidity: "Բարձր", category: "suv" },
      { name: "Rio", basePriceUSD2024: 16500, annualDepreciationRate: 0.07, liquidity: "Բարձր", category: "sedan" },
    ],
  },
  {
    make: "Lexus",
    origin: "Ճապոնիա",
    popularModels: [
      { name: "RX 350 / 450h", basePriceUSD2024: 62000, annualDepreciationRate: 0.05, liquidity: "Բարձր", category: "suv" },
      { name: "GX 460 / 550", basePriceUSD2024: 75000, annualDepreciationRate: 0.05, liquidity: "Բարձր", category: "suv" },
      { name: "LX 570 / 600", basePriceUSD2024: 130000, annualDepreciationRate: 0.05, liquidity: "Բարձր", category: "suv" },
      { name: "ES 350", basePriceUSD2024: 46000, annualDepreciationRate: 0.06, liquidity: "Բարձր", category: "sedan" },
      { name: "NX 200 / 300", basePriceUSD2024: 44000, annualDepreciationRate: 0.06, liquidity: "Բարձր", category: "suv" },
    ],
  },
  {
    make: "Tesla",
    origin: "ԱՄՆ",
    popularModels: [
      { name: "Model 3", basePriceUSD2024: 39000, annualDepreciationRate: 0.09, liquidity: "Բարձր", category: "electric" },
      { name: "Model Y", basePriceUSD2024: 46000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "electric" },
      { name: "Model S", basePriceUSD2024: 82000, annualDepreciationRate: 0.10, liquidity: "Միջին", category: "electric" },
      { name: "Model X", basePriceUSD2024: 92000, annualDepreciationRate: 0.10, liquidity: "Միջին", category: "electric" },
    ],
  },
  {
    make: "Nissan",
    origin: "Ճապոնիա",
    popularModels: [
      { name: "Rogue / X-Trail", basePriceUSD2024: 29000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "suv" },
      { name: "Altima", basePriceUSD2024: 25000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "sedan" },
      { name: "Tiida / Versa", basePriceUSD2024: 16000, annualDepreciationRate: 0.07, liquidity: "Բարձր", category: "hatchback" },
      { name: "Teana", basePriceUSD2024: 24000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "sedan" },
    ],
  },
  {
    make: "BYD",
    origin: "Չինաստան",
    popularModels: [
      { name: "Song Plus EV / DM-i", basePriceUSD2024: 29000, annualDepreciationRate: 0.09, liquidity: "Բարձր", category: "electric" },
      { name: "Han EV", basePriceUSD2024: 39000, annualDepreciationRate: 0.10, liquidity: "Միջին", category: "electric" },
      { name: "Yuan Plus / Atto 3", basePriceUSD2024: 24000, annualDepreciationRate: 0.09, liquidity: "Բարձր", category: "electric" },
    ],
  },
  {
    make: "Volkswagen",
    origin: "Գերմանիա",
    popularModels: [
      { name: "ID.4 / ID.6", basePriceUSD2024: 33000, annualDepreciationRate: 0.09, liquidity: "Բարձր", category: "electric" },
      { name: "Passat / Jetta", basePriceUSD2024: 25000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "sedan" },
      { name: "Tiguan", basePriceUSD2024: 32000, annualDepreciationRate: 0.07, liquidity: "Բարձր", category: "suv" },
      { name: "Touareg", basePriceUSD2024: 68000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "suv" },
      { name: "Golf", basePriceUSD2024: 26000, annualDepreciationRate: 0.07, liquidity: "Բարձր", category: "hatchback" },
    ],
  },
  {
    make: "Chevrolet",
    origin: "ԱՄՆ",
    popularModels: [
      { name: "Cruze", basePriceUSD2024: 16500, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "sedan" },
      { name: "Malibu", basePriceUSD2024: 23000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "sedan" },
      { name: "Equinox", basePriceUSD2024: 26000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "suv" },
      { name: "Tahoe", basePriceUSD2024: 75000, annualDepreciationRate: 0.07, liquidity: "Բարձր", category: "suv" },
    ],
  },
  {
    make: "Opel",
    origin: "Գերմանիա",
    popularModels: [
      { name: "Astra", basePriceUSD2024: 22000, annualDepreciationRate: 0.07, liquidity: "Բարձր", category: "hatchback" },
      { name: "Zafira", basePriceUSD2024: 24000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "sedan" },
      { name: "Insignia", basePriceUSD2024: 28000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "sedan" },
      { name: "Vectra", basePriceUSD2024: 18000, annualDepreciationRate: 0.06, liquidity: "Բարձր", category: "sedan" },
    ],
  },
  {
    make: "Audi",
    origin: "Գերմանիա",
    popularModels: [
      { name: "A6", basePriceUSD2024: 62000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "sedan" },
      { name: "A4", basePriceUSD2024: 45000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "sedan" },
      { name: "Q7", basePriceUSD2024: 72000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "suv" },
      { name: "Q5", basePriceUSD2024: 52000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "suv" },
      { name: "Q8", basePriceUSD2024: 92000, annualDepreciationRate: 0.08, liquidity: "Բարձր", category: "suv" },
    ],
  },
  {
    make: "Honda",
    origin: "Ճապոնիա",
    popularModels: [
      { name: "CR-V", basePriceUSD2024: 34000, annualDepreciationRate: 0.06, liquidity: "Բարձր", category: "suv" },
      { name: "Civic", basePriceUSD2024: 25000, annualDepreciationRate: 0.06, liquidity: "Բարձր", category: "sedan" },
      { name: "Accord", basePriceUSD2024: 29000, annualDepreciationRate: 0.06, liquidity: "Բարձր", category: "sedan" },
      { name: "HR-V", basePriceUSD2024: 26000, annualDepreciationRate: 0.06, liquidity: "Բարձր", category: "suv" },
    ],
  },
  {
    make: "Porsche",
    origin: "Գերմանիա",
    popularModels: [
      { name: "Cayenne", basePriceUSD2024: 98000, annualDepreciationRate: 0.07, liquidity: "Բարձր", category: "luxury" },
      { name: "Macan", basePriceUSD2024: 68000, annualDepreciationRate: 0.07, liquidity: "Բարձր", category: "suv" },
      { name: "Panamera", basePriceUSD2024: 110000, annualDepreciationRate: 0.09, liquidity: "Միջին", category: "luxury" },
      { name: "911", basePriceUSD2024: 145000, annualDepreciationRate: 0.05, liquidity: "Բարձր", category: "luxury" },
    ],
  },
  {
    make: "LADA / VAZ",
    origin: "Ռուսաստան",
    popularModels: [
      { name: "Niva Legend / Travel", basePriceUSD2024: 13500, annualDepreciationRate: 0.05, liquidity: "Բարձր", category: "suv" },
      { name: "Granta", basePriceUSD2024: 10500, annualDepreciationRate: 0.06, liquidity: "Բարձր", category: "sedan" },
      { name: "Vesta", basePriceUSD2024: 14000, annualDepreciationRate: 0.06, liquidity: "Բարձր", category: "sedan" },
      { name: "2107 / Samara", basePriceUSD2024: 4500, annualDepreciationRate: 0.03, liquidity: "Բարձր", category: "sedan" },
    ],
  },
];

export const USD_TO_AMD_CAR_RATE = 388.5;

