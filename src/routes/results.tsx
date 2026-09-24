import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Boxes,
  Download,
  FileSearch,
  Leaf,
  Printer,
  QrCode,
  RefreshCcw,
  ShieldCheck,
  Recycle,
  Wallet,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ScoreRing } from "@/components/common/ScoreRing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { loadAnalysis } from "@/lib/storage";
import type { AnalysisResult, Material, Recommendation } from "@/lib/types";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Packaging recommendation — PackWise AI" },
      {
        name: "description",
        content:
          "Ranked packaging recommendation with specifications, MAP gas composition, shelf-life prediction, cost and sustainability analysis.",
      },
      { property: "og:title", content: "Packaging recommendation — PackWise AI" },
      {
        property: "og:description",
        content: "Your ranked packaging options, specs, shelf-life prediction and QR traceability.",
      },
    ],
  }),
  component: ResultsPage,
});

/* ----------------------------- helpers ----------------------------- */

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--popover-foreground)",
  fontSize: 12,
};

const OPTION_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

/** Pull one criterion's 0-100 score out of a recommendation's breakdown. */
function crit(r: Recommendation, label: string): number {
  return Math.round(r.breakdown.find((b) => b.label === label)?.score ?? 0);
}

function gasPermeability(m: Material): string {
  if (m.breathable) return "High, controlled O₂/CO₂ exchange (breathable)";
  if (m.otr <= 5) return "Very low (high-barrier)";
  if (m.otr <= 200) return "Low";
  if (m.otr <= 2000) return "Moderate";
  return "High";
}

function ratingBar(value: number) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`h-1.5 w-4 rounded-full ${n <= value ? "bg-leaf" : "bg-muted"}`}
          />
        ))}
      </span>
      <span className="text-xs text-muted-foreground">{value}/5</span>
    </span>
  );
}

/* ------------------------------ page ------------------------------ */

function ResultsPage() {
  // localStorage only exists in the browser, so load after mount (page is server-rendered first).
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [ready, setReady] = useState(false);
  const [qr, setQr] = useState<string>("");

  useEffect(() => {
    setResult(loadAnalysis());
    setReady(true);
  }, []);

  const best = result?.recommendations[0];

  // QR payload = traceability record for this recommendation.
  useEffect(() => {
    if (!result || !best) return;
    const payload = JSON.stringify({
      batch: result.batchId,
      commodity: result.input.commodityName,
      packaging: best.material.name,
      route: `${result.input.source} to ${result.input.destination}`,
      date: result.createdAt.slice(0, 10),
    });
    QRCode.toDataURL(payload, {
      width: 240,
      margin: 1,
      color: { dark: "#0B3D2E", light: "#F4F7F2" },
    })
      .then(setQr)
      .catch(() => setQr(""));
  }, [result, best]);

  const radarData = useMemo(() => {
    if (!result) return [];
    const recs = result.recommendations;
    const axes: { axis: string; get: (r: Recommendation) => number }[] = [
      { axis: "Protection", get: (r) => crit(r, "Barrier match") },
      { axis: "Cost", get: (r) => crit(r, "Cost efficiency") },
      { axis: "Sustainability", get: (r) => crit(r, "Sustainability") },
      { axis: "Shelf life", get: (r) => crit(r, "Shelf-life requirement") },
      { axis: "Strength", get: (r) => r.material.strength * 20 },
    ];
    return axes.map((a) => {
      const row: Record<string, string | number> = { axis: a.axis };
      recs.forEach((r, i) => {
        row[`opt${i}`] = a.get(r);
      });
      return row;
    });
  }, [result]);

  const shelfData = useMemo(() => {
    if (!result || !best) return [];
    const withPack = best.predictedShelfLife;
    const without = result.baselineShelfLife;
    const horizon = Math.ceil(Math.max(withPack, without, result.input.shelfLifeDays) * 1.15);
    const step = Math.max(1, Math.round(horizon / 14));
    const freshness = (day: number, life: number) => Math.max(0, Math.round(100 - (day / life) * 100));
    const rows: { day: number; without: number; with: number }[] = [];
    for (let d = 0; d <= horizon; d += step) {
      rows.push({ day: d, without: freshness(d, without), with: freshness(d, withPack) });
    }
    return rows;
  }, [result, best]);

  if (!ready) {
    return <div className="mx-auto max-w-7xl px-4 py-24 text-center text-muted-foreground">Loading…</div>;
  }

  if (!result || !best) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <Card className="glass rounded-2xl p-10">
          <FileSearch className="mx-auto h-10 w-10 text-leaf" />
          <h1 className="mt-4 font-display text-2xl font-bold">No analysis yet</h1>
          <p className="mt-2 text-muted-foreground">
            Run the five-step wizard first and your ranked packaging recommendation will appear here.
          </p>
          <Button asChild className="mt-6">
            <Link to="/analyze">Start an analysis</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const { input } = result;
  const m = best.material;
  const [optA, optB, optC] = result.recommendations;
  const options = [optA, optB, optC].filter((r): r is Recommendation => Boolean(r));
  const greener = optC ?? best;

  const costVsProtection = options.map((r) => ({
    name: r.material.shortName,
    protection: crit(r, "Barrier match"),
    costIndex: Math.round((r.material.costPerUnit / 18) * 100),
  }));

  const mapData = result.map
    ? [
        { name: "O₂", value: result.map.o2 },
        { name: "CO₂", value: result.map.co2 },
        { name: "N₂", value: result.map.n2 },
      ]
    : null;
  const MAP_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

  const chips = [
    input.foodType,
    `${input.source} → ${input.destination}`,
    `${input.durationHours} h · ${input.distanceKm} km · ${input.routeCondition}`,
    `${input.storageType} at ${input.temperature}°C`,
    `${input.humidity}% RH`,
    `${input.shelfLifeDays}-day target`,
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            Packaging for <span className="text-gradient-leaf">{input.commodityName}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Batch {result.batchId} · generated {new Date(result.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print / save as PDF
          </Button>
          <Button asChild>
            <Link to="/analyze">
              <RefreshCcw className="mr-2 h-4 w-4" /> New analysis
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <Badge key={c} variant="secondary" className="rounded-full px-3 py-1 font-normal">
            {c}
          </Badge>
        ))}
      </div>

      {/* Hero + specs */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="glass rounded-2xl p-6 lg:col-span-3">
          <div className="flex flex-wrap items-center gap-6">
            <ScoreRing value={best.score} size={132} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-leaf">Recommended packaging</p>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">{m.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{m.structure}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="gap-1 bg-leaf text-leaf-foreground hover:bg-leaf">
                  <ShieldCheck className="h-3 w-3" /> Food safe
                </Badge>
                {m.recyclable && (
                  <Badge className="gap-1 bg-teal text-foreground hover:bg-teal">
                    <Recycle className="h-3 w-3" /> Recyclable
                  </Badge>
                )}
                {m.mapSuitable && <Badge variant="outline">MAP suitable</Badge>}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat icon={<Wallet className="h-4 w-4" />} label="Estimated cost" value={`₹${m.costPerUnit} / unit`} />
            <Stat
              icon={<Boxes className="h-4 w-4" />}
              label="Predicted shelf life"
              value={`~${best.predictedShelfLife} days`}
              hint={`vs ~${result.baselineShelfLife} days unpackaged`}
            />
            <Stat icon={<Leaf className="h-4 w-4" />} label="Eco score" value={`${m.sustainability} / 10`} />
          </div>

          <div className="mt-6">
            <h3 className="font-display text-base font-semibold">Why this was chosen</h3>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {best.reasons.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="glass rounded-2xl p-6 lg:col-span-2">
          <h3 className="font-display text-lg font-semibold">Recommended specifications</h3>
          <dl className="mt-4 divide-y divide-border text-sm">
            <Spec label="Oxygen transmission rate (OTR)" value={`${m.otr.toLocaleString()} cc/m²·day`} />
            <Spec label="Water vapour transmission rate (WVTR)" value={`${m.wvtr} g/m²·day`} />
            <Spec label="Film thickness" value={`${m.thickness[0]}–${m.thickness[1]} µm`} />
            <Spec label="Sealability" value={ratingBar(m.sealability)} />
            <Spec label="Gas permeability" value={gasPermeability(m)} />
            <Spec label="Mechanical strength" value={ratingBar(m.strength)} />
            <Spec label="MAP suitability" value={m.mapSuitable ? "Yes" : "No"} />
          </dl>
        </Card>
      </div>

      {/* MAP + score breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {mapData && (
          <Card className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold">MAP gas composition</h3>
            <p className="text-sm text-muted-foreground">
              Suggested in-pack atmosphere for respiring produce.
            </p>
            <div className="mt-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={mapData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={82} paddingAngle={3} stroke="none">
                    {mapData.map((_, i) => (
                      <Cell key={i} fill={MAP_COLORS[i % MAP_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-sm">
              O₂ {result.map?.o2}% · CO₂ {result.map?.co2}% · N₂ {result.map?.n2}%
            </p>
          </Card>
        )}

        <Card className={`glass rounded-2xl p-6 ${mapData ? "" : "lg:col-span-2"}`}>
          <h3 className="font-display text-lg font-semibold">How the score was built</h3>
          <p className="text-sm text-muted-foreground">Weighted criteria for {m.shortName}.</p>
          <div className="mt-4 space-y-3">
            {best.breakdown.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs">
                  <span>
                    {b.label} <span className="text-muted-foreground">({Math.round(b.weight * 100)}%)</span>
                  </span>
                  <span className="font-medium">{Math.round(b.score)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-leaf to-mustard"
                    style={{ width: `${Math.min(100, Math.max(0, b.score))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Options */}
      <section>
        <h2 className="font-display text-xl font-semibold">Packaging options</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {options.map((r, i) => (
            <Card key={r.material.id} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Option {String.fromCharCode(65 + i)}</Badge>
                <span className="text-sm font-semibold text-leaf">{r.score}/100</span>
              </div>
              <p className="mt-3 text-xs text-mustard">{r.label}</p>
              <h3 className="font-display text-lg font-semibold">{r.material.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{r.material.notes}</p>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Cost</dt>
                  <dd className="font-medium">₹{r.material.costPerUnit}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Shelf life</dt>
                  <dd className="font-medium">~{r.predictedShelfLife} d</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Eco</dt>
                  <dd className="font-medium">{r.material.sustainability}/10</dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      </section>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass rounded-2xl p-6">
          <h3 className="font-display text-lg font-semibold">Options compared</h3>
          <div className="mt-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                {options.map((r, i) => (
                  <Radar
                    key={r.material.id}
                    name={`${String.fromCharCode(65 + i)}: ${r.material.shortName}`}
                    dataKey={`opt${i}`}
                    stroke={OPTION_COLORS[i]}
                    fill={OPTION_COLORS[i]}
                    fillOpacity={0.18}
                  />
                ))}
                <Legend />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass rounded-2xl p-6">
          <h3 className="font-display text-lg font-semibold">Shelf-life prediction</h3>
          <p className="text-sm text-muted-foreground">
            Illustrative freshness curve, scaled from the predicted shelf life of each case.
          </p>
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={shelfData} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="day" type="number" domain={[0, "dataMax"]} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} unit=" d" />
                <YAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} unit="%" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <ReferenceLine x={input.shelfLifeDays} stroke="var(--mustard)" strokeDasharray="4 4" label={{ value: "Target", fill: "var(--mustard)", fontSize: 11 }} />
                <Line type="monotone" dataKey="without" name="Without recommended pack" stroke="var(--destructive)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="with" name={`With ${m.shortName}`} stroke="var(--leaf)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Sustainability & cost + QR */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass rounded-2xl p-6 lg:col-span-2">
          <h3 className="font-display text-lg font-semibold">Sustainability and cost</h3>
          <div className="mt-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costVsProtection} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="protection" name="Protection score" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="costIndex" name="Cost index (lower is cheaper)" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <Leaf className="h-4 w-4 text-leaf" /> Greener alternative
            </p>
            <p className="mt-1 text-muted-foreground">
              {greener.material.id === m.id
                ? `${m.name} is already the most sustainable option for this case (eco score ${m.sustainability}/10, ${m.recyclable ? "recyclable" : "not recyclable"}).`
                : `${greener.material.name} scores ${greener.material.sustainability}/10 on sustainability (${greener.material.recyclable ? "recyclable" : "not recyclable"}) with a predicted shelf life of ~${greener.predictedShelfLife} days.`}
            </p>
          </div>
        </Card>

        <Card className="glass flex flex-col items-center rounded-2xl p-6 text-center">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
            <QrCode className="h-4 w-4 text-leaf" /> QR traceability
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Encodes batch ID, commodity, packaging and date.
          </p>
          {qr ? (
            <img src={qr} alt={`QR code for batch ${result.batchId}`} className="mt-4 h-44 w-44 rounded-xl" />
          ) : (
            <div className="mt-4 h-44 w-44 animate-pulse rounded-xl bg-muted" />
          )}
          <p className="mt-2 text-sm font-medium">{result.batchId}</p>
          {qr && (
            <Button asChild variant="outline" className="mt-3">
              <a href={qr} download={`packwise-${result.batchId}.png`}>
                <Download className="mr-2 h-4 w-4" /> Download QR
              </a>
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}

/* --------------------------- small pieces --------------------------- */

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-1 font-display text-lg font-semibold text-mustard">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
