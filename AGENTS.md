# AGENTS.md

## Core Rules

* Read minimal context only
* Never scan entire codebase unless explicitly asked
* Prefer surgical edits over full rewrites
* Reuse existing patterns and architecture
* Stop investigation once root cause is identified
* Keep responses concise and implementation-focused
* Avoid duplicate file reads
* Do not explain obvious code
* Preserve existing working logic unless modification is required

---

# Architecture

## Frontend

Preferred stack:

* React
* Next.js
* TypeScript
* Tailwind CSS
* React Query
* Zustand
* React Hook Form
* Zod

Structure:

```txt
src/
 ├── app/
 ├── features/
 ├── shared/
 ├── services/
 ├── hooks/
 └── types/
```

Rules:

* Use feature-first architecture
* Keep components small and reusable
* Separate UI from business logic
* Avoid prop drilling
* Prefer server state libraries over manual fetching

---

## Backend

Preferred stack:

* Node.js
* NestJS / Express
* PostgreSQL
* Prisma
* Redis

Structure:

```txt
src/
 ├── modules/
 ├── infrastructure/
 ├── shared/
 └── main.ts
```

Rules:

* Keep services stateless
* Use modular architecture
* Validate all inputs
* Centralize error handling
* Avoid business logic in controllers

---

# Token Optimization Rules

## Context Usage

* Read only relevant files and line ranges
* Avoid broad repository searches
* Never reload already inspected files unnecessarily
* Prefer targeted investigation over exploratory scanning

## Editing Strategy

* Prefer minimal diffs
* Never rewrite entire files unless necessary
* Modify smallest possible surface area
* Reuse existing utilities and abstractions

## Validation Strategy

* Run focused tests only
* Avoid full builds during iterative changes
* Run lint/build/tests only before final completion

---

# Code Standards

## Naming

Use descriptive names.

Good:

```ts
getUserProfile()
calculateInvoiceTotal()
```

Avoid:

```ts
getData()
doEverything()
```

---

## TypeScript

* Use strict typing
* Avoid `any`
* Prefer interfaces and inferred types
* Share domain types where possible

---

## Components

* Keep components under reasonable size
* Extract reusable logic into hooks/services
* Memoize only when necessary
* Avoid unnecessary re-renders

---

# Performance Rules

Frontend:

* Use lazy loading and route splitting
* Use virtualization for large lists
* Avoid layout thrashing
* Optimize bundle size

Backend:

* Use caching where appropriate
* Avoid synchronous heavy operations
* Optimize database queries
* Prevent N+1 queries

---

# Security Rules

* Never expose secrets
* Never commit environment files
* Sanitize inputs
* Escape outputs
* Use HTTPS
* Implement proper authentication and authorization

---

# Testing

Prioritize:

1. Unit tests
2. Integration tests
3. E2E tests

Test:

* Business logic
* Authentication
* Permissions
* Critical flows
* Edge cases

---

# Git Standards

Commit style:

```txt
feat: add auth flow
fix: resolve payment bug
refactor: simplify API service
```

PR rules:

* Keep PRs small
* Include tests where needed
* Avoid unrelated changes

---

# Anti-Patterns

Avoid:

* Massive components
* God services
* Deep nesting
* Duplicate logic
* Tight coupling
* Premature abstraction
* Global mutable state
* Full-file rewrites
* Unnecessary context scanning

---

# Execution Rules

Before coding:

1. Analyze minimal relevant context
2. Propose focused approach if architecture changes are involved
3. Implement incrementally
4. Validate targeted functionality
5. Avoid unnecessary modifications

Primary goal:

Build maintainable, scalable, and efficient software while minimizing unnecessary token usage and context expansion.
