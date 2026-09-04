export type InsuranceProductType =
  | "property"
  | "mortgage"
  | "casco"
  | "health"
  | "travel"
  | "cargo"
  | "liability"
  | "construction"
  | "accident"
  | "agro"
  | "financial"
  | "aviation"
  | "bundle";

export interface CompanyInfo {
  name: string;
  taxId: string; // ՀՎՀՀ
  activityType: string;
  phone: string;
  email: string;
  contactPerson: string;
  legalAddress: string;
}

export interface ObjectData {
  address: string;
  floors: string;
  buildingMaterial: string;
  constructionYear: string;
  totalArea: string;
  purpose: string;
}

export interface InsuredPropertyItems {
  building: boolean;
  interior: boolean;
  machinery: boolean;
  equipment: boolean;
  stock: boolean;
  signs: boolean;
  glass: boolean;
  details: string;
}

export interface PropertyValues {
  buildingValue: number;
  interiorValue: number;
  machineryValue: number;
  equipmentValue: number;
  stockValue: number;
  glassValue: number;
  signsValue: number;
  currency: "AMD" | "USD";
  valueType: "market" | "book" | "replacement";
}

export interface GoodsInfo {
  avgBalance: number;
  maxBalance: number;
  turnover: number;
  specialItems: string;
  storageMethod: "shelves" | "pallets" | "floor";
}

export interface OperationalConditions {
  facilityType: string;
  isBasement: boolean;
  storageType: string;
  heightAboveFloor: string;
  surroundingsRisk: string;
}

export interface Utilities {
  electrical: "220V" | "380V" | "both";
  electricalCondition: "new" | "satisfactory" | "requires_repair";
  gas: boolean;
  gasBoiler: boolean;
  water: boolean;
  heating: "central" | "individual_gas" | "electric" | "none";
  ventilation: "natural" | "forced_climate" | "industrial";
}

export interface FireProtection {
  alarm: boolean;
  autoExtinguishing: boolean;
  smokeDetectors: boolean;
  extinguishers: boolean;
  hydrants: boolean;
  fireStationDistanceKm: string;
  details: string;
}

export interface SecurityMeasures {
  cctv: boolean;
  burglarAlarm: boolean;
  guards: boolean;
  bars: boolean;
  accessControl: boolean;
  details: string;
}

export interface LossHistory {
  hasLosses: boolean;
  details: string;
  totalLossAmount: number;
}

export interface CoverageRisks {
  fireExplosion: boolean;
  waterDamage: boolean;
  naturalDisasters: boolean;
  burglaryRobbery: boolean;
  vandalism: boolean;
  thirdPartyLiability: boolean;
  businessInterruption: boolean;
  otherRisks: string;
}

export interface AttachedDocuments {
  stateRegistry: boolean;
  ownershipCertificate: boolean;
  leaseAgreement: boolean;
  inventoryList: boolean;
  floorPlan: boolean;
  photos: boolean;
  notes: string;
}

export interface BeneficiaryData {
  isPledged: boolean;
  bankName: string;
  beneficiaryName: string;
  loanAgreementNumber: string;
  pledgeAgreementNumber: string;
  notes: string;
}

export interface PropertyInsuranceFormState {
  company: CompanyInfo;
  objectData: ObjectData;
  insuredProperty: InsuredPropertyItems;
  values: PropertyValues;
  goodsInfo: GoodsInfo;
  operations: OperationalConditions;
  utilities: Utilities;
  fireProtection: FireProtection;
  security: SecurityMeasures;
  lossHistory: LossHistory;
  coverageRisks: CoverageRisks;
  documents: AttachedDocuments;
  beneficiary: BeneficiaryData;
  customTariff?: number;
  customFranchise?: number;
  paymentSchedule?: "single" | "biannual" | "quarterly";
}

// Mortgage Insurance Types
export type MortgagePackageType = "PACKAGE_I" | "PACKAGE_II";

export interface MortgageInsuranceData {
  packageType: MortgagePackageType;
  borrowerName: string;
  borrowerPassport: string;
  borrowerPhone: string;
  borrowerEmail: string;
  propertyAddress: string;
  bankName: string;
  currency: "AMD" | "USD";
  principalBalance: number;
  annualInterestRate: number;
  loanTermMonthsRemaining: number;
  propertyMarketValue: number;
  lifeInsuranceIncluded: boolean;
  propertyTariff: number;
  lifeTariff: number;
  franchisePercent: number;
  isJointBorrower: boolean;
  jointBorrowerName?: string;
  loanContractNumber: string;
  notes: string;
}

// CASCO Insurance Types (Grounded in knowledge-base/text/Casco.txt.txt & casco calculator 2024 - առանց ՃՈՈ.xlsx)
export type CascoSilHistory = "none" | "1_year" | "2_plus_years";
export type CascoSectionOption = "physical_and_theft" | "physical_only";
export type CascoUsagePurpose = "personal" | "commercial" | "taxi_rental";
export type CascoFranchiseDeductibleType = "unconditional" | "conditional" | "zero";
export type CascoFranchiseBasis = "fixed_amount" | "percent_sum_insured";

export interface CascoInsuranceData {
  clientName: string;
  phone: string;
  email: string;
  vehicleMake: string;
  vehicleModel: string;
  manufactureYear: number;
  marketValue: number;
  currency: "AMD" | "USD";
  coverageType: "comprehensive" | "partial" | "total_loss";
  franchiseType: "zero" | "fixed" | "percent";
  franchiseAmount: number;
  driverMinAge: number;
  driverMinExp: number;
  isUnlimitedDrivers: boolean;
  includeGlassNoPolice: boolean;
  includeTowingAssistance: boolean;
  bankName?: string;
  pledgeBankName?: string;
  isPledged: boolean;
  baseTariff: number;
  discount: number;

  // Exact inputs from the supplied CASCO Excel calculator & Casco.txt.txt
  policyholderType?: "բանկային լիզինգ" | "Իրավաբանական անձ" | "Ֆիզիկական անձ";
  warrantyService?: "ներառել" | "չներառել";
  driverCountOption?: "Անսահմանափակ" | "Սահմանափակ";
  franchiseOption?: "Ֆրանշիզայի կիսում" | "Մինիմալ ֆրանշիզա" | "Ֆրանշիզան անփոփոխ";
  silCascoHistory?: CascoSilHistory;
  bonusMalus?: "չընտրել" | "<=7" | "8-10" | "11-12" | "13-14";
  lossRatio?: "չընտրել" | "Վնասաբերությունը  >=  90% " | "Վնասաբերությունը  < 90% ";
  paymentMethod?: "Միանվագ" | "2 վճարում" | "4 վճարում" | "12 վճարում";
  trafficRules?: "ներառել" | "չներառել";
  theftCoverage?: "ներառել" | "չներառել" | "ներառել միայն մանր դետալները";
  theftExclusionPercent?: number;
  naturalDisasters?: "ներառել" | "չներառել";
  territory?: "Միայն ՀՀ" | "ՀՀ և Վրաստան" | "ՀՀ, Վրաստան և ԱՊՀ երկրներ";
  electricVehicle?: boolean;
  brokerCommissionPercent?: number;
  profitPercent?: number;

  // Casco.txt.txt Business Rules Fields
  // Section A - Physical Damage & Theft Options
  sectionOption?: CascoSectionOption;
  sectionATariffPercent?: number;
  sectionAPremium?: number;
  sectionAFranchiseType?: CascoFranchiseDeductibleType;
  sectionAFranchiseAmount?: number;
  sectionAFranchiseBasis?: CascoFranchiseBasis;
  sectionAFranchisePercentValue?: number;

  // Section B - Personal Accident (ԴՊ) for Driver & Passengers (Կետ 4.1.2)
  includeDriverPassengerAccident?: boolean;
  accidentSeatsCount?: number;
  accidentSumPerSeat?: number;
  sectionBTariffPercent?: number;
  sectionBPremium?: number;
  sectionBFranchiseType?: CascoFranchiseDeductibleType;
  sectionBFranchiseAmount?: number;
  sectionBFranchiseBasis?: CascoFranchiseBasis;
  accidentRisks?: {
    death: boolean;
    disability: boolean;
    firstAidExpenses: boolean;
  };

  // Section C - Voluntary Third Party Liability / Կամավոր ԱՊՊԱ (Կետ 4.1.3)
  includeVoluntaryTpl?: boolean;
  voluntaryTplLimit?: number;
  sectionCTariffPercent?: number;
  sectionCPremium?: number;
  sectionCFranchiseType?: CascoFranchiseDeductibleType;
  sectionCFranchiseAmount?: number;
  sectionCFranchiseBasis?: CascoFranchiseBasis;

  // Additional Non-factory Equipment (Կետ 3.1)
  includeAdditionalEquipment?: boolean;
  additionalEquipmentDetails?: string;
  additionalEquipmentValue?: number;
  additionalEquipmentTariffPercent?: number;
  additionalEquipmentPremium?: number;
  additionalEquipmentFranchiseAmount?: number;

  // Franchise / Deductible Specification (Section 7)
  franchiseDeductibleType?: CascoFranchiseDeductibleType;
  franchiseCalculationBasis?: CascoFranchiseBasis;
  franchisePercentValue?: number;
  // Driver Age & Experience Multipliers (Կետ 7.4 & 7.5: 2x if age<21 or exp 1-3y, 3x if exp<1y)
  driverAgeExpMultiplier?: number;
  authorizedDriversList?: string;

  // Vehicle Technical & Registry Identification (Կետ 1.1, 13.1)
  vehicleVin?: string;
  licensePlate?: string;
  registrationDocNumber?: string;
  enginePowerHp?: number;
  engineVolumeCc?: number;
  transmissionType?: "automatic" | "manual";
  fuelType?: "petrol" | "diesel" | "gas" | "electric" | "hybrid";
  vehicleUsagePurpose?: CascoUsagePurpose;

  // Glass & Small Details without Police Act Limit (Կետ 13.4)
  noPoliceGlassAnnualLimit?: number;
  officialDealerRepair?: boolean;
  roadsideAssistanceIncluded?: boolean;
  loanContractNumber?: string;
}

// Health / VMI Insurance Types
export interface HealthInsuranceData {
  clientName: string;
  phone: string;
  email: string;
  groupType: "corporate" | "individual" | "family";
  insuredCount: number;
  planLevel: "standard" | "classic" | "platinum";
  limitPerPerson: number;
  currency: "AMD" | "USD";
  includeDental: boolean;
  includeVision: boolean;
  includeMaternity: boolean;
  includePreventiveCheckup: boolean;
  companyName?: string;
  tariffPerPerson: number;
}

// Travel Insurance Types
export interface TravelInsuranceData {
  travelerName: string;
  phone: string;
  destination: "schengen" | "georgia" | "worldwide" | "cis";
  tripDurationDays: number;
  travelerCount: number;
  travelerAges: string;
  coverageLimit: number; // e.g. 30,000 EUR
  currency: "EUR" | "USD" | "AMD";
  includeBaggage: boolean;
  includeTripCancellation: boolean;
  includeCovid: boolean;
  includeSports: boolean;
}

// Cargo Insurance Types
export interface CargoInsuranceData {
  clientName: string;
  phone: string;
  cargoDescription: string;
  cargoValue: number;
  currency: "AMD" | "USD" | "EUR";
  originCountry: string;
  destinationCountry: string;
  transportMode: "road" | "air" | "sea" | "rail" | "multimodal";
  clauseType: "ICC_A" | "ICC_B" | "ICC_C";
  packagingType: string;
  isFragile: boolean;
  isTemperatureControlled: boolean;
}

// CAR / EAR Construction Types
export interface ConstructionInsuranceData {
  contractorName: string;
  phone: string;
  projectName: string;
  projectAddress: string;
  contractValue: number;
  currency: "AMD" | "USD";
  durationMonths: number;
  thirdPartyLimit: number;
  surroundingPropertyLimit: number;
  maintenancePeriodMonths: number;
  machineryIncluded: boolean;
}

// Liability Insurance Types
export interface LiabilityInsuranceData {
  insuredName: string;
  phone: string;
  liabilityType: "general_third_party" | "professional" | "carrier_cmr" | "product_liability";
  businessField: string;
  limitOfIndemnity: number;
  currency: "AMD" | "USD";
  annualTurnover: number;
  franchiseAmount: number;
}

// Personal Accident Types
export interface AccidentInsuranceData {
  clientName: string;
  phone: string;
  coverageType: "workplace" | "24_hours";
  numberOfPersons: number;
  sumInsuredPerPerson: number;
  currency: "AMD" | "USD";
  risks: {
    death: boolean;
    disability: boolean;
    temporaryInjury: boolean;
  };
}

// Agro Insurance Types
export interface AgroInsuranceData {
  farmerName: string;
  phone: string;
  region: string;
  cropType: string;
  landAreaHectares: number;
  estimatedHarvestValue: number;
  currency: "AMD";
  perils: {
    hail: boolean;
    springFrost: boolean;
    fire: boolean;
    drought: boolean;
  };
  stateSubsidyPercent: number; // e.g. 50% state subsidy
}

// Proposal Structure
export type QuoteStatus =
  | "draft"
  | "ready"
  | "pending_underwriter"
  | "approved"
  | "sent"
  | "accepted"
  | "rejected"
  | "locked"
  | "policy_issued";

export interface CascoSectionBreakdownItem {
  sectionKey: "section_a" | "section_b" | "section_c" | "additional_equipment";
  sectionName: string;
  sumInsured: number;
  tariff: number;
  premium: number;
  franchise: string;
}

export interface QuotationProposal {
  id: string;
  quotationNumber: string;
  quoteNumber?: string;
  riskScore?: number;
  type: InsuranceProductType;
  productNameArm: string;
  categoryNameArm: string;
  date: string;
  validUntil: string;
  clientName: string;
  contactInfo: string;
  objectDescription: string;
  totalSumInsured: number;
  currency: "AMD" | "USD" | "EUR";
  baseTariff: number;
  discountBonus: number;
  finalTariff: number;
  annualPremium: number;
  franchiseDescription: string;
  franchiseAmount: number;
  paymentTerms: string;
  beneficiaryDetails: string;
  coveredPerilsList: string[];
  propertyBreakdown?: Array<{
    item: string;
    value: number;
    tariff: number;
    premium: number;
  }>;
  cascoBreakdown?: CascoSectionBreakdownItem[];
  mortgageBreakdown?: {
    packageType: MortgagePackageType;
    packageLabel: string;
    principal: number;
    interestTwoYears?: number;
    totalCoveredSum: number;
    propertyPremium: number;
    lifePremium?: number;
    bankName: string;
  };
  productSpecificDetails?: Record<string, any>;
  bundleBreakdown?: Array<{
    productName: string;
    sumInsured: number;
    tariff: number;
    premium: number;
    details: string;
  }>;
  specialConditions: string[];
  aiAnalysisText?: string;
  status?: QuoteStatus;
  version?: number;
  lockedAt?: string;
  rulesVersion?: string;
  calculatorVersion?: string;
  createdAt?: string;
  updatedAt?: string;
  agentName: string;
  agentTitle: string;
  agentPhone: string;
  agentEmail: string;
  clientType?: "individual" | "company";
  calculationBreakdown?: Array<{ label: string; value: number; unit?: string }>;
  underwriting?: { status: "approved" | "manual_review" | "rejected"; reasons: string[] };
  policyNumber?: string;
  underwriterNote?: string;
  issuedAt?: string;
  issuedBy?: string;
  sourceDocuments?: string[];
  sourceVersion?: string;
  lockedBy?: string;
  internalNotes?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
