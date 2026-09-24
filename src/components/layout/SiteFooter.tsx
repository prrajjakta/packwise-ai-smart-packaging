import { Link } from "@tanstack/react-router";

import { LogoMark } from "@/components/brand/Logo";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/70 bg-background/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="font-display text-lg font-semibold">
              PackWise <span className="text-gradient-leaf">AI</span>
            </span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Right packaging. Longer shelf life. Less food waste. A decision-support prototype built
            for Smart India Hackathon.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-mustard">Product</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/analyze" className="hover:text-foreground">
                Recommendation wizard
              </Link>
            </li>
            <li>
              <Link to="/results" className="hover:text-foreground">
                Results dashboard
              </Link>
            </li>
            <li>
              <Link to="/materials" className="hover:text-foreground">
                Materials database
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-mustard">Project</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/about" className="hover:text-foreground">
                Architecture &amp; tech
              </Link>
            </li>
            <li>Prototype — ML model integration planned</li>
            <li>© {new Date().getFullYear()} PackWise AI</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
