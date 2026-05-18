# PWA Icons

These PNG icons must be generated from `public/favicon.svg` before going to production.

## Required files

| File | Size | Purpose |
|---|---|---|
| `icon-192.png` | 192×192 | Standard any-purpose icon |
| `icon-512.png` | 512×512 | Standard any-purpose icon |
| `icon-maskable-192.png` | 192×192 | Maskable icon (safe-zone inset ~40%) |
| `icon-maskable-512.png` | 512×512 | Maskable icon (safe-zone inset ~40%) |
| `shortcut-workout-96.png` | 96×96 | Shortcut icon for "Start workout" |

## Generation

Use [Squoosh](https://squoosh.app/), [Sharp](https://sharp.pixelplumbing.com/), or the
[PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator) CLI:

```bash
pnpm dlx pwa-asset-generator public/favicon.svg public/icons \
  --icon-only --background "#0A0B0D" --maskable
```

## Production checklist

- [ ] All five PNG files are present in this directory
- [ ] Maskable icons have the lime "R" mark inside the safe zone (inner 80% of canvas)
- [ ] Icons pass the [Maskable.app](https://maskable.app/) preview check
- [ ] `public/manifest.webmanifest` paths match the generated filenames
