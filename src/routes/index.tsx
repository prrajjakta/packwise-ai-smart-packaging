import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  Camera,
  Cpu,
  Droplets,
  Flame,
  Leaf,
  MapPin,
  Microscope,
  ScanSearch,
  Sparkles,
  Thermometer,
  TrendingDown,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PackWise AI — Intelligent food packaging recommendations" },
      {
        name: "description",
        content:
          "PackWise AI recommends the right food packaging material from commodity, route, environment and shelf-life inputs. Right packaging. Longer shelf life. Less food waste.",
      },
      { property: "og:title", content: "PackWise AI — Intelligent food packaging recommendations" },
      {
        property: "og:description",
        content:
          "AI-assisted packaging decision support for farmers, food startups and small manufacturers.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  { icon: Camera, title: "Upload food photo", text: "Drag in a photo or snap one on your phone." },
  { icon: ScanSearch, title: "Identify commodity", text: "Detected with a confidence score you can override." },
  { icon: MapPin, title: "Source → destination", text: "Route, distance and transit duration." },
  { icon: Thermometer, title: "Environment & storage", text: "Temperature, humidity and storage chain." },
  { icon: Cpu, title: "AI engine", text: "Rule-based scoring across 8 weighted criteria." },
  { icon: Boxes, title: "Final recommendation", text: "Top 3 options with specs and reasoning." },
];

const PROBLEMS = [
  { icon: Droplets, title: "Moisture absorption", text: "Wrong WVTR turns crisp products soggy and cakes powders within days." },
  { icon: Flame, title: "Oxidation", text: "Oily and fatty foods go rancid when oxygen barrier is insufficient." },
  { icon: Microscope, title: "Microbial spoilage", text: "Poor sealing and wrong gas mix accelerate bacterial and fungal growth." },
  { icon: TrendingDown, title: "Nutrient loss", text: "Light and oxygen exposure degrade vitamins during long transit." },
];

const STATS = [
  { value: "₹92,000 cr", label: "Annual food wasted in India's supply chain" },
  { value: "30–40%", label: "Fresh produce lost between farm and market" },
  { value: "2.4×", label: "Shelf-life gain seen with correct barrier packaging" },
];

function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="animate-rise">
            <Badge className="mb-5 gap-1.5 bg-white/10 text-mustard hover:bg-white/10">
              <Sparkles className="h-3.5 w-3.5" /> Smart India Hackathon prototype
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
              The right packaging for every food,{" "}
              <span className="text-gradient-leaf">decided in 60 seconds.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Right packaging. Longer shelf life. Less food waste. PackWise AI turns commodity
              properties, transport route and storage conditions into a ranked packaging
              recommendation — no materials-science background required.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/analyze">
                  Get packaging recommendation <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/materials">Browse materials database</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              12 packaging materials · 14 commodities · 8 weighted scoring criteria
            </p>
          </div>

          <Card className="glass animate-rise rounded-2xl p-6 [animation-delay:120ms]">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Sample output
              </span>
              <Badge variant="outline" className="border-leaf/40 text-leaf">
                94 / 100
              </Badge>
            </div>
            <h3 className="mt-3 font-display text-xl font-semibold">Micro-perforated breathable film</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Spinach · Mumbai → Pune · 6 h · Chilled at 6 °C
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {[
                ["OTR", "12,000 cc/m²·day"],
                ["WVTR", "45 g/m²·day"],
                ["Thickness", "25–50 µm"],
                ["Cost", "₹2.20 / unit"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border/70 bg-white/5 p-3">
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 font-medium text-mustard">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-leaf/30 bg-leaf/10 p-3 text-sm">
              <Leaf className="h-4 w-4 shrink-0 text-leaf" />
              <span>Shelf life extended from 4 → 9 days with MAP at O₂ 5% / CO₂ 10%.</span>
            </div>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">How it works</h2>
        <p className="mt-2 text-muted-foreground">Six guided steps from a photo to a shippable spec sheet.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, idx) => (
            <Card key={s.title} className="glass rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-earth/30 text-leaf">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold tracking-widest text-mustard">
                    STEP {idx + 1}
                  </span>
                  <h3 className="font-display text-base font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">
          Why the wrong pack <span className="text-gradient-leaf">destroys food</span>
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((p) => (
            <Card key={p.title} className="glass rounded-2xl p-5">
              <p.icon className="h-6 w-6 text-mustard" />
              <h3 className="mt-3 font-display text-base font-semibold">{p.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{p.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="glass grid gap-6 rounded-2xl p-8 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="font-display text-3xl font-bold text-gradient-leaf">{s.value}</div>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <Card className="glass flex flex-col items-center gap-4 rounded-2xl p-10 text-center">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Ready to package smarter?
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Run one analysis and get ranked options with specs, cost, shelf-life prediction and a QR
            traceability tag.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link to="/analyze">
              Start an analysis <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </section>
    </div>
  );
}
