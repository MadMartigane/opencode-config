---
name: react-doctor
description: React-focused audit guidelines for diff-based review. Use when auditing React code changes in the rocket-review workflow.
version: 2.0.0
---

# React Doctor Guidelines

Apply these rules only when auditing React code introduced or modified in the diff.

## 1. Review Scope & Mindset

- Audit only changed React code (`.jsx`, `.tsx`, hooks, components, JSX).
- Use these lenses: **Security**, **Correctness**, **Performance**, **Architecture**.
- Severity may be P0, P1, P2, or P3 depending on impact.
- Prefer evidence from the diff over framework-general advice.

## 2. Security

- Flag dangerous HTML injection patterns (`dangerouslySetInnerHTML`) unless clearly sanitized at the same boundary.
- Flag client-side exposure of secrets, tokens, or sensitive configuration inside React components, hooks, or browser bundles.
- Flag unsafe auth/permission assumptions performed only in UI state without server-side validation.

## 3. Correctness

- **Ban `Promise.all` in tests**.
  - Rationale: parallel assertions and setup/teardown create nondeterministic timing and flaky CI/CD behavior.
  - Required fix: execute async test steps deterministically with explicit `await` sequencing.
- Flag stale-closure patterns in hooks and callbacks when changed code captures mutable values without a valid dependency strategy.
- Flag effects that can race, double-fire, or update state after teardown without cleanup or guarding.

## 4. Performance

- **Treat `useEffect` as a necessary evil**.
  - Legitimate only when reacting to **external systems**:
    - browser APIs
    - subscriptions
    - timers / intervals
    - DOM events
    - imperative third-party integrations
  - **Suspicious** when used only to react to **internal state, props, or data derivation**.
  - Required audit action: ask for justification or recommend render-time derivation, event handler logic, memoization, or reducer restructuring instead.
- Flag avoidable `useMemo` / `useCallback` added without a concrete referential-stability or performance cost reason.
- Flag unnecessary state mirroring and effect-driven derived state.

## 5. Architecture

- Prefer pure rendering and local data derivation over lifecycle-style orchestration.
- Flag components mixing data fetching, imperative effects, view logic, and business rules in a single unit.
- Flag custom hooks or components that hide side effects without clear ownership or cleanup boundaries.

## 6. Optional Manual Scanner

If the reviewer explicitly wants an auxiliary automated signal, the following optional manual step may be run:

```bash
npx -y react-doctor@latest . --verbose --diff
```

Treat scanner output as advisory only; final findings must still be validated against the diff.
