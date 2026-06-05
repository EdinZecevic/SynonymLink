---
name: write-tests
description: Use this skill when creating, writing, or modifying unit, integration, or system tests for either the frontend (React) or backend (.NET).
version: 1.0.0
---
# Upute za pisanje testova
- **Pristup:** Koristi AAA (Arrange-Act-Assert) uzorak za pisanje jasnih i čitljivih testova.
- **Backend testovi:**
  - Pišu se u projektu `SynonymsApp.Tests`.
  - Fokusiraj se na testiranje servisne logike (`SynonymService`) i repozitorija.
  - Koristi mock-ove (npr. zamjenske implementacije ili mock biblioteke) za vanjske ovisnosti poput Datamuse API-ja.
- **Frontend testovi:**
  - Pišu se unutar `frontend` direktorija prateći konfiguraciju projekta (npr. Vitest ili Jest ako su postavljeni).
