# Aschedual Design Tokens

## Palette
- `--color-bg`: `#0B0F0E`
- `--color-fg`: `#E7ECEA`
- `--color-muted`: `#A3B1AB`
- `--color-panel`: `#111715`
- `--color-panel-2`: `#141D1A`
- `--color-border`: `rgba(255,255,255,0.08)`
- `--color-primary`: `#0F6B3A`
- `--color-primary-hover`: `#0B4D2A`
- `--color-primary-highlight`: `#16A34A`
- `--color-seafoam-1`: `#0B2A24`
- `--color-seafoam-2`: `#0D3B33`

## Type scale
- Hero: `text-5xl` desktop, `md:text-7xl`, tight tracking.
- Section heading: `text-3xl`, `md:text-4xl`.
- Body: `text-base` and `text-sm` for supporting copy.

## Spacing rhythm
- Full sections: `py-24`.
- App layout frame: `py-8`.
- Card padding: `p-5` and `p-6`.
- Content max width: `max-w-content` (`1120px`).

## Shape and borders
- Primary control radius: `rounded-xl` (`14px`).
- Card radius: `rounded-2xl` (`18px`).
- Border strength: `1px solid var(--color-border)`.
- Hover border raise: `rgba(255,255,255,0.15)`.

## Motion
- Section entrance: fade + 16px vertical slide, 0.5s ease-out.
- Card hover: subtle lift (`-translate-y-0.5`) and border brighten.
