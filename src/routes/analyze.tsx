import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Cpu,
  Database,
  Loader2,
  Scale,
  Sparkles,
  Truck,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { COMMODITIES, detectCommodity, getCommodity } from "@/data/commodities";
import { runEngine } from "@/lib/engine";
import { saveAnalysis } from "@/lib/storage";
import type {
  AnalysisInput,
  Commodity,
  FoodType,
  Rating,
  RouteCondition,
  StorageType,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Run a packaging analysis — PackWise AI" },
      {
        name: "description",
        content:
          "Five guided steps: upload a food photo, confirm commodity properties, set the route, define storage conditions and generate a ranked packaging recommendation.",
      },
      { property: "og:title", content: "Run a packaging analysis — PackWise AI" },
      {
        property: "og:description",
        content: "Guided wizard that turns food, route and storage inputs into a packaging spec.",
      },
    ],
  }),
  component: AnalyzePage,
});

const STEP_TITLES = [
  "Food photo",
  "Commodity properties",
  "Source → destination",
  "Environment & storage",
  "Review & generate",
];

const PIPELINE = [
  { icon: Scale, label: "Rule-based engine" },
  { icon: Cpu, label: "ML analysis layer" },
  { icon: Database, label: "Material database" },
  { icon: Sparkles, label: "Multi-criteria scoring" },
];

type Draft = Omit<AnalysisInput, "commodityName">;

const defaultsFrom = (c: Commodity): Draft => ({
  commodityId: c.id,
  confidence: 0,
  foodType: c.foodType,
  moisture: c.moisture,
  oilFat: c.oilFat,
  ph: c.ph,
  respiration: c.respiration,
  fragility: c.fragility,
  oxygenSensitivity: c.oxygenSensitivity,
  source: "Mumbai",
  destination: "Pune",
  distanceKm: 150,
  durationHours: 5,
  routeCondition: "Highway",
  temperature: 8,
  humidity: 70,
  storageType: "Chilled",
  shelfLifeDays: 10,
});

function AnalyzePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => defaultsFrom(COMMODITIES[0]!));
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState<{ name: string; confidence: number } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [pipelineStage, setPipelineStage] = useState(-1);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const commodity = getCommodity(draft.commodityId)!;
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const applyCommodity = useCallback((id: string, confidence: number) => {
    const c = getCommodity(id);
    if (!c) return;
    setDraft((d) => ({
      ...d,
      ...defaultsFrom(c),
      source: d.source,
      destination: d.destination,
      distanceKm: d.distanceKm,
      durationHours: d.durationHours,
      routeCondition: d.routeCondition,
      temperature: d.temperature,
      humidity: d.humidity,
      storageType: d.storageType,
      shelfLifeDays: d.shelfLifeDays,
      confidence,
    }));
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please choose an image file (JPG or PNG).");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error("Image is larger than 8 MB. Try a smaller photo.");
        return;
      }
      const url = URL.createObjectURL(file);
      setPreview(url);
      setDetecting(true);
      setDetected(null);
      window.setTimeout(() => {
        const { commodity: c, confidence } = detectCommodity(file.name);
        applyCommodity(c.id, confidence);
        setDetected({ name: c.name, confidence });
        setDetecting(false);
        toast.success(`Detected ${c.name} (${confidence}% confidence)`);
      }, 1800);
    },
    [applyCommodity],
  );

  const validate = (index: number) => {
    const e: Record<string, string> = {};
    if (index === 1) {
      if (draft.moisture < 0 || draft.moisture > 100) e.moisture = "Moisture must be 0–100%.";
      if (draft.oilFat < 0 || draft.oilFat > 100) e.oilFat = "Oil/fat must be 0–100%.";
      if (draft.ph < 1 || draft.ph > 14) e.ph = "pH must be between 1 and 14.";
      if (draft.foodType === "Fresh produce" && (draft.respiration < 0 || draft.respiration > 300))
        e.respiration = "Respiration rate must be 0–300 mg CO₂/kg·h.";
    }
    if (index === 2) {
      if (!draft.source.trim()) e.source = "Enter a source city.";
      if (!draft.destination.trim()) e.destination = "Enter a destination city.";
      if (draft.distanceKm <= 0 || draft.distanceKm > 5000) e.distanceKm = "Distance must be 1–5000 km.";
      if (draft.durationHours <= 0 || draft.durationHours > 720)
        e.durationHours = "Duration must be 1–720 hours.";
    }
    if (index === 3) {
      if (draft.shelfLifeDays <= 0 || draft.shelfLifeDays > 720)
        e.shelfLifeDays = "Required shelf life must be 1–720 days.";
    }
    setErrors(e);
    if (Object.keys(e).length) toast.error("Please fix the highlighted fields.");
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate(step)) return;
    setStep((s) => Math.min(4, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const run = () => {
    setRunning(true);
    setPipelineStage(0);
    const timers = PIPELINE.map((_, i) =>
      window.setTimeout(() => setPipelineStage(i), i * 750),
    );
    const done = window.setTimeout(() => {
      try {
        const result = runEngine({ ...draft, commodityName: commodity.name });
        saveAnalysis(result);
        navigate({ to: "/results" });
      } catch {
        setRunning(false);
        toast.error("The engine could not complete. Please review your inputs and retry.");
      }
    }, 3100);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  };

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  if (running) return <PipelineOverlay stage={pipelineStage} />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">
        Packaging <span className="text-gradient-leaf">recommendation wizard</span>
      </h1>
      <p className="mt-2 text-muted-foreground">
        Step {step + 1} of 5 — {STEP_TITLES[step]}
      </p>

      <Stepper step={step} />

      <Card className="glass mt-6 rounded-2xl p-6 animate-fade" key={step}>
        {step === 0 && (
          <div className="space-y-6">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              className="grid place-items-center rounded-2xl border-2 border-dashed border-earth/60 bg-white/5 p-10 text-center transition-colors hover:border-leaf/60"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Uploaded food"
                  className="max-h-48 rounded-xl object-cover shadow-lg"
                />
              ) : (
                <Upload className="h-10 w-10 text-leaf" />
              )}
              <p className="mt-4 font-medium">Drag &amp; drop a food photo</p>
              <p className="text-sm text-muted-foreground">JPG or PNG up to 8 MB</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={() => fileRef.current?.click()}>
                  Choose file
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => cameraRef.current?.click()}>
                  <Camera className="h-4 w-4" /> Use camera
                </Button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>

            {detecting && (
              <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white/5 p-4">
                <Loader2 className="h-5 w-5 animate-spin text-leaf" />
                <div>
                  <p className="font-medium">Analyzing image…</p>
                  <p className="text-sm text-muted-foreground">
                    Matching visual features against the commodity library.
                  </p>
                </div>
              </div>
            )}

            {detected && !detecting && (
              <Card className="animate-rise rounded-2xl border-leaf/40 bg-leaf/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{commodity.emoji}</span>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-mustard">
                        Detected commodity
                      </p>
                      <p className="font-display text-lg font-semibold">{detected.name}</p>
                    </div>
                  </div>
                  <Badge className="shrink-0">{detected.confidence}% confidence</Badge>
                </div>
              </Card>
            )}

            <div>
              <Label>Commodity (manual override)</Label>
              <Select
                value={draft.commodityId}
                onValueChange={(v) => {
                  applyCommodity(v, 100);
                  setDetected({ name: getCommodity(v)!.name, confidence: 100 });
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMODITIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground">
                No photo handy? Pick the commodity directly and continue.
              </p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2 flex items-center gap-3 rounded-2xl border border-border/70 bg-white/5 p-4">
              <span className="text-2xl">{commodity.emoji}</span>
              <div>
                <p className="font-display font-semibold">{commodity.name}</p>
                <p className="text-sm text-muted-foreground">
                  Values pre-filled from the reference library — edit anything that differs.
                </p>
              </div>
            </div>
            <Field label="Food type">
              <Select value={draft.foodType} onValueChange={(v) => set("foodType", v as FoodType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["Fresh produce", "Processed", "Packaged"] as FoodType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <NumField
              label="Moisture content (%)"
              value={draft.moisture}
              onChange={(v) => set("moisture", v)}
              error={errors.moisture}
            />
            <NumField
              label="Oil / fat content (%)"
              value={draft.oilFat}
              onChange={(v) => set("oilFat", v)}
              error={errors.oilFat}
            />
            <NumField
              label="pH"
              step={0.1}
              value={draft.ph}
              onChange={(v) => set("ph", v)}
              error={errors.ph}
            />
            {draft.foodType === "Fresh produce" && (
              <NumField
                label="Respiration rate (mg CO₂/kg·h)"
                value={draft.respiration}
                onChange={(v) => set("respiration", v)}
                error={errors.respiration}
              />
            )}
            <RatingField
              label="Physical fragility"
              value={draft.fragility}
              onChange={(v) => set("fragility", v)}
            />
            <RatingField
              label="Oxygen sensitivity"
              value={draft.oxygenSensitivity}
              onChange={(v) => set("oxygenSensitivity", v)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Source city" error={errors.source}>
              <Input value={draft.source} onChange={(e) => set("source", e.target.value)} />
            </Field>
            <Field label="Destination city" error={errors.destination}>
              <Input
                value={draft.destination}
                onChange={(e) => set("destination", e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <RouteGraphic from={draft.source} to={draft.destination} km={draft.distanceKm} />
            </div>
            <NumField
              label="Distance (km)"
              value={draft.distanceKm}
              onChange={(v) => set("distanceKm", v)}
              error={errors.distanceKm}
            />
            <NumField
              label="Transport duration (hours)"
              value={draft.durationHours}
              onChange={(v) => set("durationHours", v)}
              error={errors.durationHours}
            />
            <Field label="Route condition">
              <Select
                value={draft.routeCondition}
                onValueChange={(v) => set("routeCondition", v as RouteCondition)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["Highway", "Urban", "Rural"] as RouteCondition[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <Label>Temperature: <span className="text-mustard">{draft.temperature} °C</span></Label>
              <Slider
                className="mt-3"
                min={-25}
                max={45}
                step={1}
                value={[draft.temperature]}
                onValueChange={([v]) => set("temperature", v ?? 0)}
              />
            </div>
            <div>
              <Label>
                Relative humidity: <span className="text-mustard">{draft.humidity} %</span>
              </Label>
              <Slider
                className="mt-3"
                min={10}
                max={100}
                step={1}
                value={[draft.humidity]}
                onValueChange={([v]) => set("humidity", v ?? 0)}
              />
            </div>
            <div>
              <Label>Storage type</Label>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ["Ambient", "No active cooling, 20–35 °C"],
                    ["Chilled", "Cold chain, 0–8 °C"],
                    ["Frozen", "Deep freeze, below −15 °C"],
                  ] as [StorageType, string][]
                ).map(([type, desc]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => set("storageType", type)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-all",
                      draft.storageType === type
                        ? "border-leaf bg-leaf/15 shadow-glow"
                        : "border-border/70 bg-white/5 hover:border-leaf/50",
                    )}
                  >
                    <div className="font-display font-semibold">{type}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <NumField
              label="Required shelf life (days)"
              value={draft.shelfLifeDays}
              onChange={(v) => set("shelfLifeDays", v)}
              error={errors.shelfLifeDays}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Commodity", `${commodity.emoji} ${commodity.name}`],
                ["Food type", draft.foodType],
                ["Moisture", `${draft.moisture}%`],
                ["Oil / fat", `${draft.oilFat}%`],
                ["pH", `${draft.ph}`],
                ...(draft.foodType === "Fresh produce"
                  ? [["Respiration", `${draft.respiration} mg CO₂/kg·h`] as [string, string]]
                  : []),
                ["Fragility", `${draft.fragility}/5`],
                ["O₂ sensitivity", `${draft.oxygenSensitivity}/5`],
                ["Route", `${draft.source} → ${draft.destination}`],
                ["Distance", `${draft.distanceKm} km`],
                ["Duration", `${draft.durationHours} h`],
                ["Road", draft.routeCondition],
                ["Temperature", `${draft.temperature} °C`],
                ["Humidity", `${draft.humidity}%`],
                ["Storage", draft.storageType],
                ["Target shelf life", `${draft.shelfLifeDays} days`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border/70 bg-white/5 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</div>
                  <div className="mt-0.5 font-medium">{v}</div>
                </div>
              ))}
            </div>
            <Button size="lg" className="w-full gap-2" onClick={run}>
              <Sparkles className="h-4 w-4" /> Run PackWise AI
            </Button>
          </div>
        )}
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={back} disabled={step === 0} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {step < 4 && (
          <Button onClick={next} className="gap-2">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="mt-6 flex items-center gap-2">
      {STEP_TITLES.map((title, i) => (
        <div key={title} className="flex flex-1 items-center gap-2">
          <div
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-all",
              i < step && "border-leaf bg-leaf text-leaf-foreground",
              i === step && "border-leaf bg-leaf/20 text-leaf shadow-glow",
              i > step && "border-border/70 bg-white/5 text-muted-foreground",
            )}
          >
            {i < step ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          {i < STEP_TITLES.length - 1 && (
            <div className="h-0.5 flex-1 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-leaf transition-all duration-500"
                style={{ width: i < step ? "100%" : "0%" }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  error,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  error?: string;
  step?: number;
}) {
  return (
    <Field label={label} error={error}>
      <Input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
        aria-invalid={!!error}
      />
    </Field>
  );
}

function RatingField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Rating;
  onChange: (v: Rating) => void;
}) {
  return (
    <Field label={`${label}: ${value}/5`}>
      <div className="flex gap-2">
        {([1, 2, 3, 4, 5] as Rating[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            className={cn(
              "h-9 flex-1 rounded-xl border text-sm font-medium transition-all",
              value >= r
                ? "border-leaf bg-leaf/20 text-leaf"
                : "border-border/70 bg-white/5 text-muted-foreground hover:border-leaf/50",
            )}
          >
            {r}
          </button>
        ))}
      </div>
    </Field>
  );
}

function RouteGraphic({ from, to, km }: { from: string; to: string; km: number }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-white/5 p-5">
      <svg viewBox="0 0 400 90" className="w-full">
        <path
          d="M30 60 C 120 10, 280 100, 370 40"
          fill="none"
          stroke="var(--mustard)"
          strokeWidth="2.5"
          strokeDasharray="8 8"
          style={{ animation: "pw-dash 6s linear infinite" }}
        />
        <circle cx="30" cy="60" r="7" fill="var(--leaf)" />
        <circle cx="370" cy="40" r="7" fill="var(--mustard)" />
        <text x="20" y="84" fill="currentColor" fontSize="12" opacity="0.85">
          {from || "Source"}
        </text>
        <text x="330" y="22" fill="currentColor" fontSize="12" opacity="0.85">
          {to || "Destination"}
        </text>
      </svg>
      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Truck className="h-4 w-4 text-leaf" /> Illustrative route · approx. {km || 0} km
      </div>
    </div>
  );
}

function PipelineOverlay({ stage }: { stage: number }) {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-2xl place-items-center px-4">
      <Card className="glass w-full rounded-2xl p-8 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-leaf" />
        <h2 className="mt-4 font-display text-2xl font-semibold">Running PackWise AI</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Evaluating 12 materials across 8 weighted criteria.
        </p>
        <div className="mt-8 space-y-3 text-left">
          {PIPELINE.map((p, i) => (
            <div
              key={p.label}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition-all duration-500",
                i <= stage
                  ? "border-leaf/50 bg-leaf/10 opacity-100"
                  : "border-border/70 bg-white/5 opacity-50",
              )}
            >
              <p.icon className={cn("h-5 w-5", i <= stage ? "text-leaf" : "text-muted-foreground")} />
              <span className="flex-1 text-sm font-medium">{p.label}</span>
              {i < stage ? (
                <Check className="h-4 w-4 text-leaf" />
              ) : i === stage ? (
                <Loader2 className="h-4 w-4 animate-spin text-mustard" />
              ) : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
