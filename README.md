# Mid-Century Ride

A flipbook-style guide to the mid-century modern houses of New Canaan, CT, visited on a ride hosted by Bill Adamsen and the Ridgefield Bicycle Club.

## What's here

- `index.html`: chooser for the three design directions
- `directions/a-monograph/`: **A · The Monograph**. A cream-paper architecture book, two-page spreads on desktop.
- `directions/b-cue-deck/`: **B · The Cue Deck**. Handlebar cue cards that flip up from a top hinge.
- `directions/c-after-dark/`: **C · After Dark**. Dark, cinematic, photo-led pages.
- `shared/flipbook.js` + `flipbook.css`: the page-turn engine (drag, flick, tap, keys; 3D leaves with lighting).
- `shared/common.js`: photo lookup, drawn fallback houses, and the bicycle mark.
- `data/homes.js`: the 26 houses from the ride's Google Sheet.
- `assets/img/`: photos, `credits.json` (source and license per photo), and the generated `manifest.js`.

## Run it

Everything is static, so you can open `index.html` directly. To test on a phone, serve the folder:

```bash
python3 -m http.server 4173
```

## Photos

Add or replace a photo by dropping it into `assets/img/` and adding an entry to `credits.json`. Then run:

```bash
python3 scripts/build-manifest.py
```

Houses without a photo show a line drawing instead.
