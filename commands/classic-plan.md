---
name: classic-plan
description: Build implementation plan using architect in Classic mode (complete, specification-ready)
---

$1

Délègue la création du plan d'implémentation à l'agent `architect` via l'outil `task`.

### Instructions de délégation à l'agent `architect` (en anglais) :

**Role**: Act as a Senior Software Architect.

**Context**: [Verbatim the user request]

**Mode**: CLASSIC

**Constraints**:
- Produce a Complete Implementation Plan
- Provide unambiguous specifications using code examples, interfaces, or strict functional specs
- Leave ZERO implementation details to the coder agent's discretion
- Define atomic tasks with explicit dependencies and execution order (PARALLEL vs SEQUENTIAL)

**Format**:
- Follow the "Implementation Plan" template from your system instructions
- Include exact file paths, function signatures, and type definitions where applicable
- Output Structure (MUST follow exactly):
  - Executive Summary
  - Task Breakdown (T1, T2, T3... with Execution mode, Files, Specification)
  - Dependencies Summary (table format)
  - Validation Checklist

**Self-Verification**: Before finalizing, verify each task specification by asking:
"Could a mid-level engineer implement this without clarification?"
If any task fails this test, rewrite it with more precision.
