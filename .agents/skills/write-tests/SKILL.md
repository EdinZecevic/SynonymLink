---
name: write-tests
description: Use this skill when creating, writing, or modifying unit, integration, or system tests for either the frontend (React) or backend (.NET).
version: 1.1.0
---
# Test Writing Guidelines
- **Approach:** Use the AAA (Arrange-Act-Assert) pattern for clean and readable test code.
- **Backend Tests:**
  - Locate them in the `SynonymsApp.Tests` project.
  - Focus on testing service logic (`SynonymService`) and repositories.
  - Use mocks (e.g., substitute implementations or mock frameworks) for external dependencies like the Datamuse API.
- **Frontend Tests:**
  - Write them inside the `frontend` directory, matching the project's test framework setup (e.g., Vitest or Jest if configured).
