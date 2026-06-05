---
name: write-backend-code
description: Use this skill when writing, modifying, or refactoring C# / .NET 8 Web API backend code, including Controllers, Services, Repositories, and Models.
version: 1.0.0
---
# Upute za pisanje backend koda
- **Arhitektura:** Prati Clean Architecture principe (odvajanje na Controller, Service, Repository i Model slojeve).
- **Sigurnost niti (Thread-safety):** Budući da se koristi in-memory repozitorij (`InMemorySynonymRepository`), sve operacije nad podacima moraju biti thread-safe (koristi npr. `ConcurrentDictionary` i thread-safe operacije).
- **Biznis logika:** Sve kalkulacije (poput BFS pretrage za tranzitivne sinonime i grupiranje komponenti za graf) trebaju se nalaziti isključivo u servisnom sloju (`SynonymService`).
- **Sučelja:** Uvijek programiraj prema sučeljima (npr. `ISynonymRepository` i `ISynonymService`) radi lakšeg testiranja i buduće zamjene pohrane.
