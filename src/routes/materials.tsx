import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { MATERIALS } from "@/data/materials";
import type { Material, StorageType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/materials")({
  head: () => ({
    meta: [
      { title: "Packaging materials database — PackWise AI" },
      {
        name: "description",
        content:
          "Search and compare 12 food packaging materials by OTR, WVTR, thickness, sealability, strength, MAP suitability, cost and sustainability.",
      },
      { property: "og:title", content: "Packaging materials database — PackWise AI" },
      {
        property: "og:description",
        content: "Barrier properties, cost and sustainability for 12 food packaging materials.",
      },
    ],
  }),
  component: MaterialsPage,
});

type SortKey = "name" | "otr" | "wvtr" | "costPerUnit" | "sustainability" | "strength";

const STORAGE_FILTERS: (StorageType | "All")[] = ["All", "Ambient", "Chilled", "Frozen"];

function MaterialsPage() {
  const [query, setQuery] = useState("");
  const [storage, setStorage] = useState<StorageType | "All">("All");
  const [family, setFamily] = useState("All");
  const [sort, setSort] = useState<SortKey>("name");
  const [asc, setAsc] = useState(true);
  const [active, setActive] = useState<Material | null>(null);

  const families = useMemo(
    () => ["All", ...Array.from(new Set(MATERIALS.map((m) => m.family)))],
    [],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = MATERIALS.filter((m) => {
      const matchesQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.structure.toLowerCase().includes(q) ||
        m.family.toLowerCase().includes(q) ||
        m.notes.toLowerCase().includes(q);
      const matchesStorage = storage === "All" || m.storageTypes.includes(storage);
      const matchesFamily = family === "All" || m.family === family;
      return matchesQuery && matchesStorage && matchesFamily;
    });
    return filtered.sort((a, b) => {
      const va = a[sort];
      const vb = b[sort];
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return asc ? cmp : -cmp;
    });
  }, [query, storage, family, sort, asc]);

  const toggleSort = (key: SortKey) => {
    if (key === sort) setAsc((v) => !v);
    else {
      setSort(key);
      setAsc(true);
    }
  };

  const th = (key: SortKey, label: string) => (
    <TableHead>
      <button
        onClick={() => toggleSort(key)}
        className="inline-flex items-center gap-1 text-left hover:text-foreground"
      >
        {label}
        <ArrowUpDown className="h-3 w-3 opacity-60" />
      </button>
    </TableHead>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">
        Packaging <span className="text-gradient-leaf">materials database</span>
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Barrier, mechanical, cost and sustainability specifications behind every PackWise
        recommendation. Select a row for full details.
      </p>

      <Card className="glass mt-6 rounded-2xl p-4">
        <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr_1fr]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search material, structure or use case"
              className="pl-9"
            />
          </div>
          <Select value={storage} onValueChange={(v) => setStorage(v as StorageType | "All")}>
            <SelectTrigger>
              <SelectValue placeholder="Storage type" />
            </SelectTrigger>
            <SelectContent>
              {STORAGE_FILTERS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "All" ? "All storage types" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={family} onValueChange={setFamily}>
            <SelectTrigger>
              <SelectValue placeholder="Family" />
            </SelectTrigger>
            <SelectContent>
              {families.map((f) => (
                <SelectItem key={f} value={f}>
                  {f === "All" ? "All families" : f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(query || storage !== "All" || family !== "All") && (
          <button
            onClick={() => {
              setQuery("");
              setStorage("All");
              setFamily("All");
            }}
            className="mt-3 inline-flex items-center gap-1 text-xs text-mustard hover:underline"
          >
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}
      </Card>

      <Card className="glass mt-4 overflow-x-auto rounded-2xl">
        {rows.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-display text-lg font-semibold">No materials match your filters</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a broader search term or clear the storage filter.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {th("name", "Material")}
                {th("otr", "OTR (cc/m²·day)")}
                {th("wvtr", "WVTR (g/m²·day)")}
                <TableHead>Thickness (µm)</TableHead>
                <TableHead>Seal</TableHead>
                {th("strength", "Strength")}
                <TableHead>MAP</TableHead>
                {th("costPerUnit", "Cost (₹)")}
                {th("sustainability", "Eco")}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow
                  key={m.id}
                  onClick={() => setActive(m)}
                  className="cursor-pointer transition-colors hover:bg-white/5"
                >
                  <TableCell>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.family}</div>
                  </TableCell>
                  <TableCell className="text-mustard">{m.otr.toLocaleString()}</TableCell>
                  <TableCell className="text-mustard">{m.wvtr}</TableCell>
                  <TableCell>
                    {m.thickness[0]}–{m.thickness[1]}
                  </TableCell>
                  <TableCell>{m.sealability}/5</TableCell>
                  <TableCell>{m.strength}/5</TableCell>
                  <TableCell>
                    <Badge variant={m.mapSuitable ? "default" : "outline"}>
                      {m.mapSuitable ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>₹{m.costPerUnit.toFixed(2)}</TableCell>
                  <TableCell className="text-leaf">{m.sustainability}/10</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">
        Showing {rows.length} of {MATERIALS.length} materials.
      </p>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-xl">{active.name}</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-8">
                <p className="text-sm text-muted-foreground">{active.structure}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Family", active.family],
                    ["OTR", `${active.otr.toLocaleString()} cc/m²·day`],
                    ["WVTR", `${active.wvtr} g/m²·day`],
                    ["Thickness", `${active.thickness[0]}–${active.thickness[1]} µm`],
                    ["Sealability", `${active.sealability}/5`],
                    ["Strength", `${active.strength}/5`],
                    ["MAP suitable", active.mapSuitable ? "Yes" : "No"],
                    ["Breathable", active.breathable ? "Yes" : "No"],
                    ["Cost", `₹${active.costPerUnit.toFixed(2)} / unit`],
                    ["Recyclable", active.recyclable ? "Yes" : "No"],
                    ["Eco score", `${active.sustainability}/10`],
                    ["Low temp", active.lowTempTolerant ? "Tolerant" : "Not rated"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-border/70 bg-white/5 p-3">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</div>
                      <div className="mt-0.5 font-medium">{v}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-mustard">Suitable storage</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {active.storageTypes.map((s) => (
                      <Badge key={s} variant="outline">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-leaf/30 bg-leaf/10 p-3 text-sm">
                  {active.notes}
                </div>
                <Button variant="outline" className="w-full" onClick={() => setActive(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
