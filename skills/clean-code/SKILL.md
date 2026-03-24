---
name: clean-code
description: Clean code principles for producing readable and maintainable code.
version: 2.0.0
---

# Clean Code Principles

Apply these principles strictly to all code generation and modification tasks. Prioritize readability, maintainability, and simplicity.

## 1. Mindset & Process

- **First-Pass Quality**: Generate polished, production-ready code immediately. Do not defer cleanup.
- **Reasoning Refinement**: Use reasoning steps to draft and iteratively refine code before outputting the final result.
- **Boy Scout Rule**: When modifying existing code, improve its readability and structure without altering business logic.
- **Strict Scoping (YAGNI/KISS)**: Implement only what is explicitly required. Avoid speculative generalization and over-engineering.

## 2. Naming

- **Self-Documenting**: Use descriptive, intention-revealing names that explain *what* and *why* (e.g., `calculate_total_price` instead of `calc`).
- **Explicit over Implicit**: Ban single-letter variables (except standard loop indices) and cryptic abbreviations.
- **Contextual Consistency**: Adhere strictly to the project's existing naming conventions and domain terminology.

## 3. Functions & Control Flow

- **Single Responsibility**: Functions and classes must do exactly one thing and have one reason to change. Keep them small and focused.
- **Guard Clauses**: Use early returns to handle edge cases and errors upfront. Ban deep `if/else` nesting.
- **Command-Query Separation**: Functions must either mutate state (Command) or return data (Query)—never both.
- **Pure by Default**: Avoid side effects. Functions should rely only on their inputs and not alter external state.

## 4. Data & State

- **Immutability**: Treat data structures as read-only. Return new copies instead of mutating existing objects or arrays.
- **Law of Demeter**: Ban deep property chaining (e.g., `user.profile.settings.getTheme()`). Pass only the specific data required.
- **Behavior vs. Data**: Strictly separate objects that encapsulate business logic from simple Data Transfer Objects (DTOs).

## 5. Error Handling

- **Fail Fast**: Plan error handling upfront. Throw descriptive exceptions immediately instead of returning error codes or `null`.
- **Context-Rich Errors**: Include actionable context in error messages (e.g., `ValueError("Invalid age: expected > 0, got -5")`).
- **Boundary Wrapping**: Wrap third-party library exceptions in domain-specific custom errors to prevent external leakage.

## 6. Architecture & Dependencies

- **DRY (Don't Repeat Yourself)**: Consolidate duplicated logic into reusable, single-purpose helpers.
- **Open-Closed Principle**: Design modules to be easily extensible without modifying existing source code.
- **Dependency Injection**: Pass dependencies (services, configs) as parameters rather than hardcoding instantiations.
- **External Isolation**: Isolate third-party APIs and libraries behind dedicated wrapper functions or adapter classes.
