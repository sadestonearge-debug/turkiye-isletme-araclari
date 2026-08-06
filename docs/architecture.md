# P0 — AI Core Foundation

## Principle

The AI layer is an orchestrator, not a calculator. All financial mathematics must be deterministic, versioned and testable outside any model provider.

## Flow

1. User text or form input enters the application.
2. AI/rule router selects a registered tool and extracts candidate inputs.
3. Tool Registry validates that the requested tool exists and declares required fields.
4. Calculation Engine validates numeric inputs and computes the result deterministically.
5. A result explanation layer may turn verified results into plain Turkish, but must not alter numeric fields.
6. Audit metadata will record tool/model/prompt versions in later P0 packages.

## Packages

- `packages/shared`: cross-package contracts.
- `packages/calculation-engine`: deterministic formulas and tests.
- `packages/tool-registry`: versioned catalogue of public tools.
- `packages/ai-core`: provider-independent orchestration contract and safe fallback router.

## Security invariants

- Real secrets are never committed.
- `.env.example` contains names only, never credentials.
- AI output is never treated as authoritative financial math.
- Missing inputs must remain missing; they are not guessed.
- Regulated calculators will require explicit source/version metadata before release.

## P0 next steps

- Add package manifests and public exports.
- Add structured input validation.
- Add an OpenAI adapter behind the provider-independent contract.
- Add extraction tests with Turkish user queries.
- Expand registry to the first eight tools.
- Add audit metadata and result hashing.
- Add CI for typecheck and tests.
