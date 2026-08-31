// Auto-extracted from the supplied Excel: "casco calculator 2024 - առանց ՃՈՈ.xlsx".
// Do not change these values unless the underwriting source Excel is updated.
export type CascoParty = "բանկային լիզինգ" | "Իրավաբանական անձ" | "Ֆիզիկական անձ";
export type CascoYearBand = "until2005" | "2006_2010" | "2011_2015" | "2016_2020" | "2021_plus";

export const CASCO_BASE_GROSS_MAX: Record<CascoYearBand, Record<CascoParty, {under7:number; over7:number}>> = {
  "until2005": {
    "բանկային լիզինգ": {
      "under7": 0.013186813186813187,
      "over7": 0.013186813186813187
    },
    "Իրավաբանական անձ": {
      "under7": 0.01631868131868132,
      "over7": 0.014241758241758242
    },
    "Ֆիզիկական անձ": {
      "under7": 0.018131868131868133,
      "over7": 0.015824175824175824
    }
  },
  "2006_2010": {
    "բանկային լիզինգ": {
      "under7": 0.013186813186813187,
      "over7": 0.013186813186813187
    },
    "Իրավաբանական անձ": {
      "under7": 0.01631868131868132,
      "over7": 0.014241758241758242
    },
    "Ֆիզիկական անձ": {
      "under7": 0.018131868131868133,
      "over7": 0.022267393067225427
    }
  },
  "2011_2015": {
    "բանկային լիզինգ": {
      "under7": 0.013186813186813187,
      "over7": 0.013186813186813187
    },
    "Իրավաբանական անձ": {
      "under7": 0.01631868131868132,
      "over7": 0.014241758241758242
    },
    "Ֆիզիկական անձ": {
      "under7": 0.018131868131868133,
      "over7": 0.015824175824175824
    }
  },
  "2016_2020": {
    "բանկային լիզինգ": {
      "under7": 0.013186813186813187,
      "over7": 0.013186813186813187
    },
    "Իրավաբանական անձ": {
      "under7": 0.01631868131868132,
      "over7": 0.014241758241758242
    },
    "Ֆիզիկական անձ": {
      "under7": 0.018131868131868133,
      "over7": 0.015824175824175824
    }
  },
  "2021_plus": {
    "բանկային լիզինգ": {
      "under7": 0.013186813186813187,
      "over7": 0.013186813186813187
    },
    "Իրավաբանական անձ": {
      "under7": 0.01631868131868132,
      "over7": 0.014241758241758242
    },
    "Ֆիզիկական անձ": {
      "under7": 0.018131868131868133,
      "over7": 0.015824175824175824
    }
  }
};

export const CASCO_BONUS_MALUS_ADJUSTMENTS: Record<string, number> = {
  "<=7": -0.002662794378746934,
  "8-10": 0,
  "11-12": 0.0055275334397962665,
  "13-14": 0.010545889076784134
};
export const CASCO_FRANCHISE_ADJUSTMENTS = {
  "share": {
    "under7": 0.00022526622522879122,
    "over7": 0.0016974281768410105
  },
  "minimal": {
    "under7": 0.0004505324504575822,
    "over7": 0.004073827624418436
  }
};
export const CASCO_PAYMENT_FACTORS: Record<string, number> = {"Միանվագ":0,"2 վճարում":0.0009065934065934068,"4 վճարում":0.0018131868131868135,"12 վճարում":0.003626373626373627};
export const CASCO_TRAFFIC_RULE_FACTOR = 0.003626373626373627;
export const CASCO_THEFT_EXCLUDE_MAX = 0.30;
export const CASCO_THEFT_EXCLUDE_SMALL_DETAILS_FACTOR = -0.003626373626373627;
export const CASCO_REGION_FACTORS: Record<string, number> = {"Միայն ՀՀ":0,"ՀՀ և Վրաստան":0.0009065934065934068,"ՀՀ, Վրաստան և ԱՊՀ երկրներ":0.003626373626373627};
export const CASCO_WARRANTY_FACTOR = 0.00543956043956044;
export const CASCO_UNLIMITED_DRIVERS_ADJUSTMENT = 0.003;
export const CASCO_LOSS_RATIO_FACTOR = 0.00271978021978022;
export const CASCO_ELECTRIC_VEHICLE_ADJUSTMENT = -0.001;
export const CASCO_BROKER_COMMISSION = 0.10;
export const CASCO_PROFIT = 0.10;
export const CASCO_MIN_TARIFF: Record<string, Record<string, number>> = {
  "Ֆիզիկական անձ": {under7: 0.0217, over7: 0.0134},
  "բանկային լիզինգ": {under7: 0.0123, over7: 0.0089},
  "Իրավաբանական անձ": {under7: 0.0115, over7: 0.0088},
};

export const CASCO_YEAR_BANDS: Array<{key:CascoYearBand; label:string; min:number; max:number|undefined}> = [
 {key:"until2005",label:"մինչև 2005",min:-Infinity,max:2005},
 {key:"2006_2010",label:"2006-2010",min:2006,max:2010},
 {key:"2011_2015",label:"2011-2015",min:2011,max:2015},
 {key:"2016_2020",label:"2016-2020",min:2016,max:2020},
 {key:"2021_plus",label:"2021-ից բարձր",min:2021,max:undefined},
];
