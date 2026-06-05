---
name: run-tests
description: Use this skill when executing tests, analyzing test results, running linters, or validating the application build.
version: 1.1.0
---
# Test Execution and Validation Guidelines
- **Running Backend Tests:**
  - Navigate to `backend/` or `SynonymsApp.Tests/` and run:
    ```bash
    dotnet test
    ```
- **Running Frontend Checks & Tests:**
  - Navigate to the `frontend/` directory and execute:
    - For running tests: `yarn test`
    - For checking linting issues: `yarn lint`
    - For checking production build validity: `yarn build`
- **Error Resolution:** When a test or build step fails, analyze the console output to pinpoint and resolve code discrepancies immediately.
