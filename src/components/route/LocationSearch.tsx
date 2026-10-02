import { Loader2, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { type Place, searchPlaces } from "@/lib/geo";

export function LocationSearch({
  value,
  onTextChange,
  onSelect,
  placeholder,
}: {
  value: string;
  onTextChange: (text: string) => void;
  onSelect: (p: Place) => void;
  placeholder?: string;
}) {
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const typed = useRef(false);

  useEffect(() => {
    if (!typed.current) return;
    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setFailed(false);
      try {
        const r = await searchPlaces(q, ctrl.signal);
        setResults(r);
        setOpen(true);
      } catch {
        if (!ctrl.signal.aborted) setFailed(true);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  return (
    <div className="relative">
      <div className="relative">
        <Input
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            typed.current = true;
            onTextChange(e.target.value);
          }}
          onFocus={() => results.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          autoComplete="off"
        />
        {loading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-glass">
          {results.map((r) => (
            <li key={`${r.lat},${r.lon}`}>
              <button
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  typed.current = false;
                  onSelect(r);
                  setOpen(false);
                }}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-leaf" />
                <span className="line-clamp-2">{r.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {failed && (
        <p className="mt-1 text-xs text-mustard">
          Location search is unavailable right now — keep typing manually and enter distance and duration below.
        </p>
      )}
      <p className="mt-1 text-[11px] text-muted-foreground">
        Powered by{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">
          OpenStreetMap
        </a>
      </p>
    </div>
  );
}
