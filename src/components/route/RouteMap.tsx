import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { Place } from "@/lib/geo";

/* Leaflet is loaded from cdnjs at runtime (browser only) so it never runs during SSR. */
const LEAFLET_VER = "1.9.4";
const CSS = `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET_VER}/leaflet.min.css`;
const JS = `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET_VER}/leaflet.min.js`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletNS = any;
let leafletPromise: Promise<LeafletNS> | null = null;

function loadLeaflet(): Promise<LeafletNS> {
  const w = window as unknown as { L?: LeafletNS };
  if (w.L) return Promise.resolve(w.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CSS;
      document.head.appendChild(link);
    }
    const s = document.createElement("script");
    s.src = JS;
    s.async = true;
    s.onload = () => resolve(w.L);
    s.onerror = () => {
      leafletPromise = null;
      reject(new Error("Leaflet failed to load"));
    };
    document.body.appendChild(s);
  });
  return leafletPromise;
}

function pin(L: LeafletNS, color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:3px solid var(--foreground);box-shadow:0 0 0 4px oklch(0 0 0 / .25)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export function RouteMap({
  source,
  dest,
  coords,
  loading,
  error,
}: {
  source: Place | null;
  dest: Place | null;
  coords: [number, number][] | null;
  loading: boolean;
  error: string | null;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletNS>(null);
  const layer = useRef<LeafletNS>(null);
  const [L, setL] = useState<LeafletNS>(null);
  const [mapErr, setMapErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((lib) => {
        if (cancelled || !el.current) return;
        map.current = lib.map(el.current, { scrollWheelZoom: false }).setView([19, 73.3], 7);
        lib
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          })
          .addTo(map.current);
        layer.current = lib.layerGroup().addTo(map.current);
        setL(lib);
      })
      .catch(() => setMapErr(true));
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!L || !map.current || !layer.current) return;
    layer.current.clearLayers();
    const pts: [number, number][] = [];
    if (source) {
      L.marker([source.lat, source.lon], { icon: pin(L, "var(--leaf)") }).bindTooltip("Source").addTo(layer.current);
      pts.push([source.lat, source.lon]);
    }
    if (dest) {
      L.marker([dest.lat, dest.lon], { icon: pin(L, "var(--mustard)") }).bindTooltip("Destination").addTo(layer.current);
      pts.push([dest.lat, dest.lon]);
    }
    if (coords?.length) {
      const line = L.polyline(coords, { color: getComputedStyle(document.documentElement).getPropertyValue("--leaf").trim() || "#5BBF3A", weight: 4 }).addTo(layer.current);
      map.current.fitBounds(line.getBounds(), { padding: [24, 24] });
    } else if (pts.length) {
      map.current.fitBounds(pts, { padding: [40, 40], maxZoom: 10 });
    }
  }, [L, source, dest, coords]);

  return (
    <div className="relative h-72 overflow-hidden rounded-2xl border border-border shadow-glass">
      <div ref={el} className="h-full w-full bg-surface" />
      {(loading || (!L && !mapErr)) && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-background/40">
          <Loader2 className="h-6 w-6 animate-spin text-leaf" />
        </div>
      )}
      {(error || mapErr) && (
        <div className="absolute inset-x-3 bottom-3 z-[500] rounded-xl border border-border bg-popover/95 px-3 py-2 text-xs">
          {mapErr ? "The map couldn't load." : error} You can keep going — enter distance and duration manually below.
        </div>
      )}
    </div>
  );
}
