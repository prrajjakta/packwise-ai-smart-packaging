import { createFileRoute } from "@tanstack/react-router";
import { Boxes, BrainCircuit, Database, Info, Scale, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How PackWise AI works — architecture & tech" },
      {
        name: "description",
        content:
          "Inside PackWise AI: a rule-based engine, image analysis layer, packaging material database and multi-criteria compatibility scoring.",
      },
      { property: "og:title", content: "How PackWise AI works — architecture & tech" },
      {
        property: "og:description",
        content: "Rule-based engine, material database and weighted multi-criteria scoring explained.",
      },
    ],
  }),
  component: AboutPage,
});

const LAYERS = [
  {
    icon: Database,
    title: "Packaging material database",
    text: "12 curated materials with OTR, WVTR, thickness window, sealability, mechanical strength, MAP suitability, cost per unit, recyclability and an eco score. Stored as typed TypeScript records so the engine never guesses a value.",
  },
  {
    icon: Scale,
    title: "Rule-based engine",
    text: "Deterministic domain rules encode packaging science: respiring produce needs breathable film, high-fat foods need an oxygen barrier below 5 cc/m²·day, dry foods need low WVTR, frozen chains need low-temperature-tolerant sealants, and long rough routes need cushioning.",
  },
  {
    icon: BrainCircuit,
    title: "Image analysis layer",
    text: "The wizard's photo step identifies the commodity and reports a confidence score, with a manual override always available. In this prototype the detection is a deterministic lookup, not a trained model.",
  },
  {
    icon: Boxes,
    title: "Multi-criteria compatibility scoring",
    text: "Eight weighted criteria — barrier match (20%), gas/respiration (15%), storage & temperature (14%), shelf-life requirement (14%), transport & fragility (13%), humidity (12%), cost (6%) and sustainability (6%) — combine into a 0–100 match score per material.",
  },
];

const STACK = [
  "React 19 + TypeScript",
  "TanStack Router",
  "Tailwind CSS v4",
  "shadcn/ui",
  "Recharts",
  "lucide-react",
  "localStorage persistence",
  "Client-side QR generation",
];

function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">
        Inside <span className="text-gradient-leaf">PackWise AI</span>
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        A decision-support pipeline that turns food properties, logistics and storage conditions
        into a defensible packaging specification.
      </p>

      <Card className="glass mt-6 flex items-start gap-3 rounded-2xl border-mustard/30 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-mustard" />
        <p className="text-sm">
          <span className="font-semibold text-mustard">Prototype:</span> ML model integration is
          planned. All recommendations shown today come from the deterministic rule-based engine and
          curated material data — no live model inference is performed.
        </p>
      </Card>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        {LAYERS.map((l) => (
          <Card key={l.title} className="glass rounded-2xl p-6">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-earth/30 text-leaf">
              <l.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold">{l.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{l.text}</p>
          </Card>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">Pipeline</h2>
        <Card className="glass mt-4 grid gap-3 rounded-2xl p-6 md:grid-cols-4">
          {[
            "Inputs collected in the wizard",
            "Rule-based engine evaluates all 12 materials",
            "Weighted scores ranked 0–100",
            "Top 3 options + specs, MAP mix and shelf-life curve",
          ].map((step, i) => (
            <div key={step} className="rounded-xl border border-border/70 bg-white/5 p-4">
              <div className="font-display text-2xl font-bold text-gradient-leaf">0{i + 1}</div>
              <p className="mt-1 text-sm text-muted-foreground">{step}</p>
            </div>
          ))}
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">Technology</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {STACK.map((s) => (
            <Badge key={s} variant="outline" className="border-leaf/40 text-leaf">
              {s}
            </Badge>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
          <Users className="h-5 w-5 text-mustard" /> Team
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["Team lead", "ML & data", "Frontend", "Domain research"].map((role) => (
            <Card key={role} className="glass rounded-2xl p-5 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-earth/30 font-display text-lg font-semibold text-mustard">
                ?
              </div>
              <div className="mt-3 font-medium">Team member</div>
              <div className="text-sm text-muted-foreground">{role}</div>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Placeholder cards — replace with your team details before the final pitch.
        </p>
      </section>
    </div>
  );
}
