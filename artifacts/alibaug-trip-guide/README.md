# Alibaug Trip Guide

An illustrated, mobile-first field guide for two travellers staying at Blue Waves Resort, Varsoli, 27–30 November 2026.

## Run and build

From the workspace root, run `pnpm --filter @workspace/alibaug-trip-guide dev` (the scaffold supplies `PORT` and `BASE_PATH`) or from this folder run `PORT=5000 BASE_PATH=/ pnpm dev`. Production: `PORT=5000 BASE_PATH=/ pnpm build`. Output is `dist/public`.

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds with `BASE_PATH=/<repository-name>/` and deploys the static bundle. For a custom domain or root Pages deployment, set `BASE_PATH=/`. Keep the trailing slash. App navigation uses hash routes, so it does not require a Pages rewrite. GitHub only discovers workflows from the repository-root `.github/workflows/`; move this artifact-local workflow there when promoting the app out of this workspace.

## Editing the guide

All scheduled itinerary content lives in `src/data/itinerary.ts`; place facts and map-search names in `src/data/places.ts`; checklists in `src/data/checklists.ts`; the six supplied source illustrations are referenced from `src/data/assets.ts`. The itinerary includes hard cutoffs and fallback branches as authored. Avoid replacing estimates with assumed live schedules.

`public/graphics/characters/` contains the original supplied PNG illustrations. The optional `scripts/make-transparent.mjs` flood-fills corner-connected backgrounds and emits transparent 1x/2x WebP. To run it, install `sharp` as a development dependency and run `node scripts/make-transparent.mjs`. The original PNG art remains available as the safe fallback.

## Location and maps

No real trip coordinates were supplied. The Journey poster uses only decorative layout positions and the map intentionally shows no invented route markers. Use **Add resort pin** on the resort page to enter a verified address or exact lat,lng; this is stored locally and used for resort navigation. The map’s locate control asks permission and displays your current location on an OpenStreetMap embed. External directions/search links are estimates and should be checked before travel.

## Offline and accessibility

The service worker caches the app shell and same-origin graphics as they are visited; itinerary content is bundled with the app. Progress/theme/pin/checklists are stored in localStorage inside guarded try/catch blocks. The illustrated Journey poster is the graceful no-WebGL/reduced-motion/data-saver experience. All key controls have labels, visible focus, and large touch targets.

## Verify before you travel

- Confirm Thane–Alibaug bus timings, seat availability and departure stand.
- Check the 28 Nov Kolaba tide table and ask locals about crossing safety.
- Confirm the first and last Murud–Janjira boats, life jackets and sea state.
- Verify Mandwa ferry and Alibaug pickup timetable, tickets and the 2:15 PM target.
- Confirm scooty rental, licence/ID policy, two helmets, fuel and return timing.
- Confirm resort check-in, checkout, luggage storage and dinner service.
