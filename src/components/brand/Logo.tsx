import { Link } from "@tanstack/react-router";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="pw-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--leaf)" />
          <stop offset="100%" stopColor="var(--mustard)" />
        </linearGradient>
      </defs>
      <path
        d="M40 8C22 8 10 16 10 30c0 4 1.5 7.5 3.5 10C22 32 30 26 38 23c-6 5-14 10-20 20 12 2 26-5 26-23 0-5-2-9-4-12Z"
        fill="url(#pw-leaf)"
        opacity="0.95"
      />
      <g stroke="var(--forest)" strokeWidth="1.6" fill="none" opacity="0.85">
        <path d="M20 30h6v-6h6" />
        <path d="M24 36v-4h8v-6" />
      </g>
      <g fill="var(--forest)">
        <circle cx="20" cy="30" r="2" />
        <circle cx="32" cy="24" r="2" />
        <circle cx="24" cy="36" r="1.7" />
      </g>
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <LogoMark className="h-9 w-9 transition-transform group-hover:scale-105" />
      <span className="leading-tight">
        <span className="block font-display text-lg font-semibold tracking-tight">
          PackWise <span className="text-gradient-leaf">AI</span>
        </span>
        {!compact && (
          <span className="hidden text-[11px] text-muted-foreground sm:block">
            Right packaging. Longer shelf life. Less food waste.
          </span>
        )}
      </span>
    </Link>
  );
}
