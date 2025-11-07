# Design Fiction · Pathway 2 (Human–Technology System Futures)

In-world, single-page React artefact that stages tension between defaults-as-governance, revocable consent, transparency fallacies, and load-aware routing inside a near-future school wellbeing triage flow. Built with Vite, React, Tailwind CSS, Framer Motion, and lucide-react, with A3-ready print styling.

## Getting Started

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173/` with hot module reload.

## Build Stamp & Deploy Targets

The header’s build stamp reads from `import.meta.env.VITE_COMMIT`. Provide it when building for traceability:

```bash
VITE_COMMIT=$(git rev-parse --short HEAD) npm run build
# or on PowerShell
$env:VITE_COMMIT = (git rev-parse --short HEAD); npm run build
```

If omitted, the UI falls back to a time-stamped local marker. Deploy the resulting `dist/` folder to any static host (e.g. Netlify, GitHub Pages); the default scripts are:

- `npm run dev` – start Vite dev server
- `npm run build` – produce the production bundle
- `npm run preview` – serve the built bundle locally

## Keyboard Shortcuts

- `A` – toggle annotations (Stakeholder / HCI / Tension)
- `R` – toggle the Field notes (A2) panel
- `P` – open the print dialog (A3 poster mode)

## Field Notes (A2) Rename

The former “A2 cues” panel is now titled **Field notes (A2)** to keep the artefact in-world. Its link placeholder (`./evidence-pack.pdf`) is safe to replace with the actual evidence pack as needed.

## Accessibility & Interaction Notes

- **Landmarks & live regions** – header → hero → main grid → sidebar → footer, plus aria-live updates for queue status and consent withdrawals.
- **Keyboard reachability** – every interactive element is a native control with the shared `focus-ring` utility.
- **Reduced motion** – `prefers-reduced-motion` collapses motion durations to ~0, including skeleton placeholders and Framer Motion transitions.
- **Colour reliance** – neutral palette + single indigo accent; copy and labels communicate governance state (no red/green severity coding).
- **Consent receipt** – downloadable TXT ticket with route, expiry, acknowledgements, and status stamp (Active/Withdrawn) for auditing.
- **Queue transparency** – skeleton shimmer runs 400–600 ms on route changes, then reveals label, wait range, and a `Last updated 00:18s` ticker.

## Demo Script (suggested flow)

1. Highlight the header’s CareLink brand, build stamp, and the Show annotations / Field notes / Reset controls.
2. Cover the hero narrative and policy banner (Policy X · Student Wellness Data Standard), then flip the **Low-risk demo** button.
3. Screen 1 – explain the default chips, edit the expiry (1–364 days), and show that Continue unlocks only after acknowledging “screening != diagnosis”.
4. Screen 2 – open **Why this score?**, point out the Item cluster / Self-report / Time factor evidence, download the consent receipt, and toggle routes to watch the skeleton shimmer + timer update.
5. Screen 3 – walk through the Who / When / Confirm step bar, pick a custom time outside school hours (warning appears), and toggle Withdraw to surface the 2-second feedback.
6. Toggle annotations (A key works too) to reveal Stakeholder/HCI/Tension copy, then show **Field notes (A2)** with the placeholder evidence link.
7. Open print preview: two-column layout collapses, controls disappear, annotations + legend persist, and the footer still states “Speculation, not prediction.”

## Print Notes (A3 Poster Mode)

- `@media print` forces A3 portrait, stacks the three screens vertically, keeps the policy banner and footer, and reveals all annotation blocks regardless of toggle state.
- Interactive controls (buttons, inputs, toggles) are hidden; legend, policy banners, and textual chips remain.
- The skeleton placeholder collapses to a plain block so queue context stays legible when frozen to paper.

## Changelog (latest sprint)

- Added CareLink brand chrome, build-stamped header (with `VITE_COMMIT` support), and a persistent speculation footer.
- Introduced policy banner, consent default chips, editable expiry chip, and low-risk demo mode.
- Upgraded Screen 2 with evidence bullets, structured consent receipt ticket, queue skeleton shimmer, and ticker.
- Refreshed Screen 3 with the Who→When→Confirm step bar, balanced withdraw affordance, emergency policy note, and off-hours warnings.
- Rebuilt annotations reveal (staggered motion + legend) and renamed the cues panel to Field notes (A2) with an evidence-pack link.
- Hardened print stylesheet (annotations forced on, controls hidden) and documented keyboard shortcuts plus build-stamp instructions.
