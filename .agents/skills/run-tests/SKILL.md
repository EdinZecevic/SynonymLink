---
name: run-tests
description: Use this skill when executing tests, analyzing test results, running linters, or validating the application build.
version: 1.0.0
---
# Upute za izvršavanje testova i validaciju
- **Izvršavanje backend testova:**
  - Navigiraj u `backend/` ili `SynonymsApp.Tests/` i pokreni:
    ```bash
    dotnet test
    ```
- **Izvršavanje frontend provjera i testova:**
  - Navigiraj u `frontend/` i pokreni:
    - Za testove (ako su definirani): `yarn test` ili `npm run test`
    - Za linter: `yarn lint`
    - Za provjeru produkcijske gradnje (build): `yarn build`
- **Rješavanje grešaka:** U slučaju neuspjelih testova ili grešaka kod builda, analiziraj ispis konzole i ispravi neusklađenosti.
