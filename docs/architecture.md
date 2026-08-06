# P0 — AI Core Foundation

## Principle

The AI layer is an orchestrator, not a calculator. All financial mathematics must be deterministic, versioned and testable outside any model provider.

## Flow

1. User text or form input enters the application.
2. AI/rule router selects a registered tool and extracts candidate inputs.
3. Tool Registry validates that the requested tool exists and declares required fields.
4. Structured input validation rejects missing, malformed or out-of-range values.
5. Calculation Engine computes the result deterministically.
6. A result explanation layer may turn verified results into plain Turkish, but must not alter numeric fields.
7. Audit metadata can record provider/model/prompt/tool versions and a SHA-256 result hash.

## Packages

- `packages/shared`: cross-package contracts, audit metadata and tool input types.
- `packages/calculation-engine`: deterministic formulas and tests.
- `packages/tool-registry`: versioned catalogue and input validation for public tools.
- `packages/ai-core`: provider-independent orchestration, rule fallback, provider boundary and audit helpers.

## P0 registered tools

1. Profit margin
2. Target-margin sale price
3. Discount profitability
4. Commission-protected sale price
5. Break-even revenue
6. Portion cost
7. Marketplace net profit
8. Machine payback period

## Security invariants

- Real secrets are never committed.
- `.env.example` contains names only, never credentials.
- AI output is never treated as authoritative financial math.
- Missing inputs remain missing; they are not guessed.
- Provider responses are sanitized against the Tool Registry.
- Unknown model-selected tools fall back to the local router.
- Numeric inputs are validated before calculator execution.
- Regulated calculators will require explicit source/version metadata before release.

## Validation

A GitHub Actions workflow is present for dependency install, strict TypeScript typecheck and Vitest execution. Repository writes in the current connector session have not produced an Actions run, and the isolated runtime has no outbound GitHub/DNS access. Runtime CI results therefore remain pending and must not be represented as passed.

## Next P0 closure steps

- Obtain the first real CI run and fix any type/test failure.
- Add a concrete OpenAI Responses API adapter only after API credentials are configured as deployment secrets; keep the provider contract independent.
- Add Turkish structured extraction fixtures and prompt-version tests.
- Add a deterministic dispatcher that maps validated tool inputs to calculator functions.
- Close P0 only after CI passes.
