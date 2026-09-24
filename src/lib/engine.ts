import { MATERIALS } from "@/data/materials";
import type {
  AnalysisInput,
  AnalysisResult,
  Material,
  Recommendation,
  ScoreBreakdown,
} from "./types";

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));

/** Barrier match: oxygen barrier vs. food oxygen sensitivity + fat content. */
function barrierScore(m: Material, i: AnalysisInput): number {
  const demand = i.oxygenSensitivity * 0.7 + Math.min(i.oilFat, 40) / 12; // ~0.7..6.8
  // Lower OTR = better barrier. Map OTR to 0..10 capability.
  const capability =
    m.otr <= 1 ? 10 : m.otr <= 5 ? 9 : m.otr <= 50 ? 7.5 : m.otr <= 200 ? 6 : m.otr <= 2000 ? 4 : 2;
  if (i.foodType === "Fresh produce" && i.respiration >= 15) {
    // respiring produce should NOT get an absolute barrier
    return m.breathable ? 95 : clamp(100 - (10 - capability) * -6, 10, 60);
  }
  const gap = demand - capability;
  return clamp(gap <= 0 ? 92 + Math.min(8, -gap * 3) : 92 - gap * 17);
}

/** Respiration / gas exchange match. */
function respirationScore(m: Material, i: AnalysisInput): number {
  if (i.foodType !== "Fresh produce" || i.respiration < 5) {
    return m.breathable && i.moisture < 20 ? 55 : 85;
  }
  const need = i.respiration; // mg CO2/kg.h
  if (need >= 25) return m.breathable ? (m.cushioning ? 92 : 96) : 28;
  if (need >= 10) return m.breathable ? 90 : m.mapSuitable ? 62 : 45;
  return m.breathable ? 82 : 70;
}

/** Storage + temperature compatibility. */
function storageScore(m: Material, i: AnalysisInput): number {
  let s = m.storageTypes.includes(i.storageType) ? 90 : 35;
  if (i.storageType === "Frozen" || i.temperature <= -5) s += m.lowTempTolerant ? 8 : -45;
  if (i.temperature >= 30 && m.family === "Bioplastic") s -= 20;
  return clamp(s);
}

/** Humidity handling: high RH demands low WVTR unless the food must breathe. */
function humidityScore(m: Material, i: AnalysisInput): number {
  const breathing = i.foodType === "Fresh produce" && i.respiration >= 10;
  if (breathing) return clamp(m.wvtr >= 20 ? 90 : 60);
  const demand = (i.humidity - 40) / 10 + (i.moisture < 15 ? 4 : 0); // dry foods hate moisture ingress
  const capability = m.wvtr <= 0.1 ? 10 : m.wvtr <= 1 ? 9 : m.wvtr <= 6 ? 7 : m.wvtr <= 20 ? 5 : 3;
  const gap = demand - capability;
  return clamp(gap <= 0 ? 90 : 90 - gap * 14);
}

/** Transport duration, route roughness and fragility. */
function transportScore(m: Material, i: AnalysisInput): number {
  const stress =
    i.fragility * 1.4 +
    i.durationHours / 8 +
    (i.routeCondition === "Rural" ? 2.5 : i.routeCondition === "Urban" ? 1.2 : 0.4);
  const capability = m.strength * 1.5 + (m.cushioning ? 4 : 0);
  return clamp(90 - Math.max(0, stress - capability) * 12 + (capability > stress ? 6 : 0));
}

/** Shelf life feasibility. */
function shelfLifeScore(m: Material, i: AnalysisInput): number {
  const predicted = predictShelfLife(m, i);
  if (predicted >= i.shelfLifeDays) return clamp(88 + Math.min(12, predicted - i.shelfLifeDays));
  return clamp(88 - ((i.shelfLifeDays - predicted) / Math.max(1, i.shelfLifeDays)) * 110);
}

function costScore(m: Material): number {
  return clamp(100 - (m.costPerUnit / 18) * 85);
}

function sustainabilityScore(m: Material): number {
  return clamp(m.sustainability * 9 + (m.recyclable ? 10 : 0));
}

export function baselineShelfLife(i: AnalysisInput): number {
  let base =
    i.foodType === "Fresh produce"
      ? Math.max(2, 14 - i.respiration / 4)
      : i.moisture > 50
        ? 6
        : 45;
  if (i.storageType === "Chilled") base *= 2.1;
  if (i.storageType === "Frozen") base *= 6;
  if (i.temperature > 30) base *= 0.7;
  if (i.humidity > 80 && i.moisture < 20) base *= 0.6;
  return Math.max(1, Math.round(base));
}

export function predictShelfLife(m: Material, i: AnalysisInput): number {
  const base = baselineShelfLife(i);
  let factor = 1;
  const breathing = i.foodType === "Fresh produce" && i.respiration >= 10;

  if (breathing) {
    factor *= m.breathable ? 2.1 : 0.75;
    if (m.mapSuitable && m.breathable) factor *= 1.2;
  } else {
    factor *= m.otr <= 1 ? 3.4 : m.otr <= 5 ? 3 : m.otr <= 50 ? 2.3 : m.otr <= 2000 ? 1.5 : 1.15;
    factor *= m.wvtr <= 1 ? 1.35 : m.wvtr <= 6 ? 1.2 : 1;
  }
  if (!m.storageTypes.includes(i.storageType)) factor *= 0.6;
  if (m.sealability >= 4) factor *= 1.1;
  return Math.max(1, Math.round(base * factor));
}

const WEIGHTS: { key: string; label: string; weight: number; fn: (m: Material, i: AnalysisInput) => number }[] = [
  { key: "barrier", label: "Barrier match", weight: 0.2, fn: barrierScore },
  { key: "gas", label: "Gas / respiration match", weight: 0.15, fn: respirationScore },
  { key: "storage", label: "Storage & temperature", weight: 0.14, fn: storageScore },
  { key: "humidity", label: "Humidity control", weight: 0.12, fn: humidityScore },
  { key: "transport", label: "Transport & fragility", weight: 0.13, fn: transportScore },
  { key: "shelf", label: "Shelf-life requirement", weight: 0.14, fn: shelfLifeScore },
  { key: "cost", label: "Cost efficiency", weight: 0.06, fn: (m) => costScore(m) },
  { key: "sustainability", label: "Sustainability", weight: 0.06, fn: (m) => sustainabilityScore(m) },
];

function explain(m: Material, i: AnalysisInput, b: ScoreBreakdown[]): string[] {
  const reasons: string[] = [];
  const breathing = i.foodType === "Fresh produce" && i.respiration >= 10;

  if (breathing && m.breathable) {
    reasons.push(
      `${i.commodityName} keeps respiring after harvest (${i.respiration} mg CO₂/kg·h), so ${m.shortName} lets oxygen and CO₂ exchange instead of suffocating the produce.`,
    );
  }
  if (!breathing && i.oxygenSensitivity >= 4) {
    reasons.push(
      `Highly oxidation-prone product, so a low oxygen transmission rate of ${m.otr} cc/m²·day keeps rancidity and colour loss in check.`,
    );
  }
  if (i.oilFat >= 15) {
    reasons.push(
      `With ${i.oilFat}% fat content, fat oxidation is the main spoilage risk — this structure blocks oxygen and light.`,
    );
  }
  if (i.moisture < 15) {
    reasons.push(
      `Dry product at ${i.humidity}% relative humidity: a WVTR of ${m.wvtr} g/m²·day protects crispness and prevents caking.`,
    );
  }
  if (i.moisture >= 60 && !breathing) {
    reasons.push(`High-moisture product, so condensation control and a strong seal matter more than a light weight film.`);
  }
  if (i.storageType === "Frozen") {
    reasons.push(`Frozen chain at ${i.temperature}°C — this material stays flexible and sealable at sub-zero temperatures.`);
  }
  if (i.durationHours >= 12 || i.fragility >= 4) {
    reasons.push(
      m.cushioning
        ? `A ${i.durationHours}h ${i.routeCondition.toLowerCase()} journey with fragile cargo needs the built-in cushioning this option provides.`
        : `Over a ${i.durationHours}h ${i.routeCondition.toLowerCase()} route, the mechanical strength rating of ${m.strength}/5 resists puncture and crush damage.`,
    );
  }
  const shelf = predictShelfLife(m, i);
  reasons.push(
    `Predicted shelf life of about ${shelf} days ${shelf >= i.shelfLifeDays ? "comfortably meets" : "falls short of"} your ${i.shelfLifeDays}-day target.`,
  );
  const best = [...b].sort((x, y) => y.score - x.score)[0]!;
  reasons.push(
    `Strongest criterion: ${best.label.toLowerCase()} (${Math.round(best.score)}/100). Cost lands at ₹${m.costPerUnit}/unit with an eco score of ${m.sustainability}/10.`,
  );
  return reasons.slice(0, 5);
}

export function runEngine(input: AnalysisInput): AnalysisResult {
  const scored = MATERIALS.map((material) => {
    const breakdown: ScoreBreakdown[] = WEIGHTS.map((w) => ({
      label: w.label,
      weight: w.weight,
      score: w.fn(material, input),
    }));
    const score = Math.round(breakdown.reduce((acc, b) => acc + b.score * b.weight, 0));
    return {
      material,
      score,
      breakdown,
      reasons: explain(material, input, breakdown),
      predictedShelfLife: predictShelfLife(material, input),
      label: "",
    } as Recommendation;
  }).sort((a, b) => b.score - a.score);

  const best = scored[0]!;
  const pool = scored.slice(1, 8);
  const cheaper =
    pool.find((r) => r.material.costPerUnit < best.material.costPerUnit && r.score >= best.score - 22) ??
    pool[0]!;
  const greener =
    pool.find(
      (r) =>
        r.material.id !== cheaper.material.id &&
        r.material.sustainability > best.material.sustainability,
    ) ?? pool.find((r) => r.material.id !== cheaper.material.id)!;

  best.label = "Best protection";
  cheaper.label = "Lower cost";
  greener.label = "Most sustainable";

  const isFresh = input.foodType === "Fresh produce";
  const map = isFresh
    ? input.respiration >= 25
      ? { o2: 5, co2: 10, n2: 85 }
      : input.respiration >= 10
        ? { o2: 4, co2: 8, n2: 88 }
        : { o2: 3, co2: 5, n2: 92 }
    : null;

  return {
    batchId: `PW-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    createdAt: new Date().toISOString(),
    input,
    recommendations: [best, cheaper, greener],
    baselineShelfLife: baselineShelfLife(input),
    map,
  };
}
