---
name: react-doctor
description: Run after making React changes to catch issues early. Use when reviewing code, finishing a feature, or fixing bugs in a React project.
version: 1.0.0
---

# React Doctor

Execute this skill to validate React codebase health.

## 1. Execute Scanner

Run the diagnostic tool to generate a 0-100 score and actionable diagnostics:

```bash
npx -y react-doctor@latest . --verbose --diff
```

## 2. Process Results

Address the output sequentially by category:

- **Security**: Fix identified vulnerabilities.
- **Correctness**: Resolve runtime and logic errors.
- **Performance**: Optimize identified bottlenecks.
- **Architecture**: Refactor structural anti-patterns.

## 3. Verify Improvements

Re-run the scanner. Confirm all targeted issues are resolved and the overall score has increased.
