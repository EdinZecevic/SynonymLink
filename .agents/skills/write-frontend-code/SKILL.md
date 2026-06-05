---
name: write-frontend-code
description: Use this skill when writing, modifying, or refactoring frontend code, including React components, TypeScript logic, and CSS styles in the frontend directory.
version: 1.2.0
---
# Frontend Coding Guidelines
- **Technologies:** Use React (TypeScript + Vite).
- **Styling:** Use clean CSS (Vanilla CSS). Avoid TailwindCSS unless explicitly requested. Focus on modern, premium designs (glassmorphism, smooth animations, harmonious colors, responsiveness).
- **API Communication:** Perform API calls through the dedicated API client in the frontend code, which uses the `VITE_API_URL` environment variable.
- **Validation, Linter & Tests:** After writing or modifying frontend code, always run `yarn lint`, `yarn test`, and `yarn build` to ensure there are no syntactic, style, testing, or compilation errors in the code.
- **Language & Comments:** All code comments, documentation, and internal code text must be in English.
- **Localization (i18n):** 
  - If you add any user-facing text (UI text), do not hardcode it in the components. Instead, add it to the appropriate translation JSON file.
  - If there are multiple language JSON files (e.g. en.json, bs.json/hr.json/sr.json), update or add the keys and translations to **all** language files simultaneously to keep translations in sync.
