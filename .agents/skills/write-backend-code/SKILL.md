---
name: write-backend-code
description: Use this skill when writing, modifying, or refactoring C# / .NET 8 Web API backend code, including Controllers, Services, Repositories, and Models.
version: 1.1.0
---
# Backend Coding Guidelines
- **Architecture:** Follow Clean Architecture principles (separating into Controller, Service, Repository, and Model layers).
- **Thread-safety:** Since an in-memory repository (`InMemorySynonymRepository`) is used, all data operations must be thread-safe (use `ConcurrentDictionary` and thread-safe operations).
- **Business Logic:** All calculations (such as BFS traversal for transitive synonyms and connected component grouping for the graph) must reside exclusively in the service layer (`SynonymService`).
- **Interfaces:** Always program against interfaces (e.g. `ISynonymRepository` and `ISynonymService`) to facilitate testing and potential future storage replacements.
