export type StorageType = "Ambient" | "Chilled" | "Frozen";
export type FoodType = "Fresh produce" | "Processed" | "Packaged";
export type RouteCondition = "Highway" | "Urban" | "Rural";
export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Material {
  id: string;
  name: string;
  shortName: string;
  structure: string;
  family: string;
  otr: number; // cc/m2.day
  wvtr: number; // g/m2.day
  thickness: [number, number]; // microns
  sealability: Rating;
  strength: Rating;
  mapSuitable: boolean;
  breathable: boolean;
  costPerUnit: number; // INR
  recyclable: boolean;
  sustainability: number; // 0-10
  storageTypes: StorageType[];
  lowTempTolerant: boolean;
  cushioning: boolean;
  notes: string;
}

export interface Commodity {
  id: string;
  name: string;
  foodType: FoodType;
  moisture: number;
  oilFat: number;
  ph: number;
  respiration: number; // mg CO2/kg.h
  fragility: Rating;
  oxygenSensitivity: Rating;
  emoji: string;
}

export interface AnalysisInput {
  commodityId: string;
  commodityName: string;
  confidence: number;
  imageName?: string;
  foodType: FoodType;
  moisture: number;
  oilFat: number;
  ph: number;
  respiration: number;
  fragility: Rating;
  oxygenSensitivity: Rating;
  source: string;
  destination: string;
  distanceKm: number;
  durationHours: number;
  routeCondition: RouteCondition;
  temperature: number;
  humidity: number;
  storageType: StorageType;
  shelfLifeDays: number;
}

export interface ScoreBreakdown {
  label: string;
  score: number; // 0-100
  weight: number;
}

export interface Recommendation {
  material: Material;
  score: number;
  breakdown: ScoreBreakdown[];
  reasons: string[];
  predictedShelfLife: number;
  label: string;
}

export interface AnalysisResult {
  batchId: string;
  createdAt: string;
  input: AnalysisInput;
  recommendations: Recommendation[];
  baselineShelfLife: number;
  map: { o2: number; co2: number; n2: number } | null;
}
