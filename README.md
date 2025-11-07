# Design Fiction · Pathway 2 (Human–Technology System Futures)

In-world, single-page React artefact that stages the tension between governance-by-default, revocable consent, transparency, trust, and system load within a near-future school wellbeing triage flow. Built with Vite + React, Tailwind CSS, Framer Motion, and lucide-react, with print-friendly layouts for A3 research posters.

## Getting Started

```bash
npm install
npm run dev
```

The dev server defaults to `http://localhost:5173/` and supports hot module replacement.

## Available Scripts

- `npm run dev` – start the Vite dev server.
- `npm run build` – create a production bundle in `dist/`.
- `npm run preview` – serve the `dist/` build locally for smoke-testing.

## Deployment

### Netlify
1. Push this repository to your preferred Git platform.
2. In Netlify, create a new site from Git and connect the repository.
3. Set **build command** to `npm run build` and **publish directory** to `dist`.
4. Deploy; Netlify will install dependencies, build, and host the static bundle.

### GitHub Pages
1. Run `npm run build`.
2. Copy the generated `dist/` contents into a branch or folder dedicated to Pages (for example `gh-pages`).
3. Commit and push, then enable GitHub Pages for that branch via repository settings (served from `/`).
4. Because this is a SPA, ensure Pages is configured with the default 404 fallback so client-side routing works (Vite handles this automatically with relative asset paths).

## Accessibility Checklist

- **Semantics & landmarks** – Header, main grid, and footer follow a logical order; additional aria-live regions communicate status changes (routes, consent receipts, withdrawals).
- **Keyboard reachability** – All controls are native elements or `button` components, complete with visible focus styles provided via Tailwind utilities.
- **Reduced motion** – `prefers-reduced-motion` toggles eliminate motion durations and avoid unnecessary animation.
- **Colour reliance** – Neutral palette with indigo accent; differences in state are conveyed with copy, borders, or badges rather than hue alone.
- **Downloadable records** – Consent receipt download includes structured `state` JSON, supporting screen-reader friendly auditing.
- **Print & screen parity** – `@media print` ensures annotations are forced visible, interactive toggles are hidden, and the page fits an A3 portrait sheet.

## Demo Script (suggested flow)

1. Open the site; point out the header toggles, A2 cues button, and default-hidden annotations.
2. Describe the hero storyline about revocable consent, expiring defaults, and the relationship between transparency and trust.
3. Walk through Screen 1: switch routing options, edit the 30-day expiry, and show how “Continue” only unlocks after acknowledging that screening is not diagnosis.
4. Move to Screen 2: reveal “Why this score?”, download the consent receipt, and demonstrate how queue status adapts when choosing Talk now / Book later / Ask anonymously.
5. Proceed to Screen 3: adjust who is notified, set a custom time, withdraw consent, and surface the JSON confirmation.
6. Toggle the annotations switch and the A2 cues button to expose stakeholder tensions and research insights.
7. Finish with the print preview note: A3 portrait, annotations forced on, and interactive elements suppressed for archival artefacts.

## Print Notes

- `@media print` sets `@page` to A3 portrait, collapses the two-column grid, and prevents buttons/toggles from printing.
- Annotation blocks always render in print, even if the on-screen toggle is off, so evidence panels remain legible on posters.
- The footer statement (“Speculation, not prediction.”) is preserved to foreground the speculative nature of the artefact.
