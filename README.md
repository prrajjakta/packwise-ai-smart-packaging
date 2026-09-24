# PackWise AI: Smart Packaging

Build a polished, demo-ready web app called "PackWise AI": an AI-powered intelligent food packaging recommendation platform. It is a decision-support tool for farmers, food startups, small manufacturers and researchers who lack technical knowledge about barrier properties, permeability and food-packaging compatibility. This is a hackathon prototype (Smart India Hackathon), so it must look professional, work end-to-end with realistic mock data, and be easy to demo in 3 minutes.

## Design system (strict)

- 60% dominant: Deep Forest Green (#0B3D2E) and Tech Teal (#0F766E) as page background, hero sections and branding.

- 30% supporting: Vibrant Leaf Green (#5BBF3A) and Mustard Yellow (#E3A82B) for logo, sub-headings, text highlights, badges and key numbers.

- 10% accent: Earth Brown (#8B5E3C) for buttons, borders and subtle icons.

- Text: off-white (#F4F7F2) on dark backgrounds. Cards use slightly lighter green glass surfaces (rounded-2xl, soft shadow, subtle border).

- Font: Inter or Poppins. Icons: lucide-react. Smooth, subtle animations only (fade/slide-in, animated progress steps). Fully responsive, mobile-first.

- Logo: a simple leaf + brain/circuit mark next to the text "PackWise AI". Tagline: "Right packaging. Longer shelf life. Less food waste."

## Pages / routes

1. Landing page (/): hero with headline, tagline, CTA "Get Packaging Recommendation". A 6-step "How it works" strip: Upload Food Photo → Identify Commodity → Source → Destination → Environment & Storage → AI Engine → Packaging Options → Final Recommendation. Below it: problem statement (moisture absorption, oxidation, microbial spoilage, nutrient loss), 3 impact stats, and a footer.

2. Recommendation wizard (/analyze): a multi-step form with a progress stepper, described below.

3. Results (/results): the recommendation dashboard, described below.

4. Materials Database (/materials): searchable, filterable table of packaging materials.

5. About / Tech (/about): the architecture (rule-based engine + ML analysis + material database + multi-criteria scoring) and the team-placeholder section.

## Wizard steps (/analyze)

Step 1 - Upload Food Photo: drag-and-drop or camera capture. After upload, show a "Analyzing image..." animation and a detected commodity card with a confidence % (simulate detection with a lookup; also add a manual dropdown override with 12+ commodities such as Apple, Tomato, Spinach/Leafy greens, Banana, Milk, Bread, Fresh meat, Rice, Pulses/Soybean, Spices, Potato chips, Frozen peas, Cooking oil).

Step 2 - Commodity Properties (auto-filled from the commodity, editable): food type (Fresh produce / Processed / Packaged), moisture content %, oil/fat content %, pH, respiration rate (mg CO2/kg·h, shown only for fresh produce), physical fragility, oxygen sensitivity.

Step 3 - Source → Destination: two city inputs (default Mumbai → Pune), a simple illustrative map graphic with a dashed route line and a truck icon, transport duration (hours), route condition (Highway / Urban / Rural), and distance (km).

Step 4 - Environment & Storage: temperature (°C slider), relative humidity (% slider), storage type (Ambient / Chilled / Frozen as selectable cards), and required shelf life (days).

Step 5 - Review & Generate: summary of all inputs and a "Run PackWise AI" button that plays a 3-second animated pipeline: Rule-Based Engine → ML Analysis → Packaging Material Database → Multi-Criteria Compatibility Scoring.

## Recommendation logic (client-side, deterministic, realistic)

Implement a rule-based scoring engine in TypeScript (no backend needed). Include a material database of at least 12 materials: LDPE, HDPE, PET, BOPP, metalized PET, aluminum foil laminate, PLA biodegradable film, paper-based/kraft laminate, micro-perforated breathable film, EVOH multilayer, ventilated corrugated box with cushioning, PP tray with lidding film. Each has: OTR (cc/m²·day), WVTR (g/m²·day), typical thickness range (microns), sealability rating, mechanical strength rating, MAP suitability, cost per unit (₹), recyclability, sustainability score (0-10), and suitable storage types.

Scoring is multi-criteria and weighted: barrier match to food sensitivity, respiration/gas match for fresh produce, storage and temperature compatibility, humidity, transport duration and fragility, shelf-life requirement, cost, sustainability. Return the top 3 ranked options with a match score (0-100) and a plain-language "why this was chosen" explanation.

Sensible rules to encode, e.g.: high-respiration fresh produce → micro-perforated/breathable film or ventilated box, with MAP; high oil/fat foods → high oxygen barrier (metalized or foil laminate); high moisture-sensitive dry foods → low WVTR; frozen → low-temp-tolerant sealable films; long transport + fragile → protective cushioning.

## Results dashboard (/results)

- Top section: detected commodity + input summary chips.

- "Recommended Packaging" hero card: material name, structure (e.g. multilayer layers), score ring, estimated cost ₹/unit, suitable shelf life range, and badges (Food Safe, Recyclable).

- Recommended Specifications panel: OTR, WVTR, film thickness, sealability, gas permeability, mechanical strength, MAP suitability (yes/no).

- For fresh produce: MAP gas composition recommendation (e.g. O2 3-5%, CO2 5-10%, balance N2) with a small donut chart.

- Options comparison: Option A (Best Protection), Option B (Lower Cost), Option C (Sustainable) as 3 cards, plus a radar chart (recharts) comparing protection, cost, sustainability, shelf life, strength.

- Shelf-life prediction: a line chart comparing predicted shelf life with vs. without the recommended packaging.

- Sustainability & cost panel: eco score, recyclability, cost-vs-protection bar chart, and a "greener alternative" suggestion.

- QR traceability: generate a QR code for this recommendation (batch ID, commodity, packaging, date) with a "Download report" button.

- Actions: "Download PDF report", "Compare options", "Start new analysis".

## Materials Database (/materials)

Searchable, filterable, sortable table with the specs above, and a detail drawer for each material.

## Technical constraints

- React + TypeScript + Tailwind + shadcn/ui + recharts + react-router.

- All data and logic in local TypeScript files (/data and /lib), cleanly separated from UI. No authentication. Persist the last analysis in localStorage so results survive a refresh.

- Validate all form inputs and show friendly errors. Include loading, empty and error states.

- Keep the code modular with reusable components.

- Add a small "Prototype: ML model integration planned" note on the About page; do not claim real ML inference in the UI.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9cbef474-eba0-4e8b-9fef-f83a6f3ed117).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
