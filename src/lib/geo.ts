/**
 * Location search + routing helpers.
 *
 * NOTE: Nominatim (nominatim.openstreetmap.org) and OSRM (router.project-osrm.org)
 * are free PUBLIC DEMO servers meant for light, non-production use — fine for a
 * hackathon demo. A production deployment would need a self-hosted instance or a
 * paid provider such as Mapbox or Google Maps Platform.
 */

export interface Place {
  name: string;
  lat: number;
  lon: number;
}

export interface RouteData {
  distanceKm: number;
  durationHours: number;
  coords: [number, number][]; // [lat, lon]
}

export const DEFAULT_SOURCE: Place = { name: "Mumbai", lat: 19.0760, lon: 72.8777 };
export const DEFAULT_DEST: Place = { name: "Pune", lat: 18.5204, lon: 73.8567 };

async function fetchWithTimeout(url: string, signal?: AbortSignal, ms = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  signal?.addEventListener("abort", () => ctrl.abort());
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function searchPlaces(q: string, signal?: AbortSignal): Promise<Place[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=5`;
  const data = (await fetchWithTimeout(url, signal)) as { display_name: string; lat: string; lon: string }[];
  return data.map((d) => ({ name: d.display_name, lat: Number(d.lat), lon: Number(d.lon) }));
}

export async function fetchRoute(a: Place, b: Place, signal?: AbortSignal): Promise<RouteData> {
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson`;
  const data = (await fetchWithTimeout(url, signal, 10000)) as {
    code: string;
    routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
  };
  const r = data.routes?.[0];
  if (data.code !== "Ok" || !r) throw new Error("No route found");
  return {
    distanceKm: Math.round(r.distance / 1000),
    durationHours: Math.round((r.duration / 3600) * 10) / 10,
    coords: r.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
  };
}
