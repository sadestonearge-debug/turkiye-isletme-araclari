# P4C — Contextual Field Updates

Status: draft validation package.

## Scope
- Update one explicit field on the latest verified calculator context using compact Turkish follow-up commands.
- Preserve all other verified numeric inputs exactly.
- Never derive, infer, average, or invent values.
- Keep P4B terse routing behavior intact for ambiguous commands such as `fiyat 180`.

## Supported smoke commands
- `kargoyu 60 yap`
- `reklam 30 TL olsun`
- `satış fiyatını 220 yap`
- `maliyet 140 oldu`
- `komisyonu %18'e düşür`

## Validation
Run:
- `npm run typecheck`
- `npm test`
- `npm run build`

Expected test count: 55.
All 8 tool pages must remain SSG.
