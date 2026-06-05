---
name: main-guidelines
description: Core guidelines and architecture overview for the SynonymLink project. This skill is loaded first to provide overall context about the codebase structure, technologies, and workflow before specific coding or testing tasks are executed.
version: 1.3.0
---
# Main Guidelines for SynonymLink
This skill serves as the entrypoint and provides a high-level overview of the project:

- **Architecture:** 
  - **Backend:** .NET 8 Web API following Clean Architecture principles (API, Services, Repositories, Models).
  - **Frontend:** React (TypeScript + Vite) with clean Vanilla CSS and i18n localization support.
- **Workflow & Delegation:**
  - For frontend changes, consult the `write-frontend-code` skill.
  - For backend changes, consult the `write-backend-code` skill.
  - For writing new tests, consult the `write-tests` skill.
  - For executing and validating tests, consult the `run-tests` skill.
- **General Rules:**
  - Maintain clean code, use thread-safe data structures on the backend, and avoid TailwindCSS on the frontend unless explicitly requested.
  - Before concluding any coding task, you must run verification checks (frontend `yarn lint`, `yarn test`, and backend `dotnet test`) and resolve any errors immediately.
- **Documentation & README Rules:**
  - For every additional functionality added to the project, the `README.md` file must be updated.
  - The `README.md` file and all other documentation must be written entirely in English.
  - The `README.md` must clearly display:
    - **API URL:** `https://synonym-link-api.onrender.com`
    - **Frontend URL:** `https://synonym-link.vercel.app/`
  - There must be a dedicated section listing and explaining all project functionalities (features), with each explanation limited to a maximum of one sentence.
  - Whenever any API endpoint is added, removed, or modified in the backend, the **API Endpoints Reference** table in the `README.md` must be updated immediately to keep it synchronized.
