---
name: main-guidelines
description: Core guidelines and architecture overview for the SynonymLink project. This skill is loaded first to provide overall context about the codebase structure, technologies, and workflow before specific coding or testing tasks are executed.
version: 1.0.0
---
# Glavne smjernice za SynonymLink
Ova vještina služi kao polazna točka i pruža opći pregled projekta:

- **Arhitektura:** 
  - **Backend:** .NET 8 Web API (Clean Architecture: API, Services, Repositories, Models).
  - **Frontend:** React (TypeScript + Vite) s čistim CSS-om i i18n lokalizacijom.
- **Redoslijed učitavanja i delegacije:**
  - Za izmjene na korisničkom sučelju konzultiraj vještinu `write-frontend-code`.
  - Za izmjene na API-ju i servisu konzultiraj vještinu `write-backend-code`.
  - Za dodavanje novih provjera konzultiraj vještinu `write-tests`.
  - Za validaciju i pokretanje konzultiraj vještinu `run-tests`.
- **Osnovna pravila:**
  - Održavaj čistoću koda, koristi thread-safe strukture na backendu i izbjegavaj TailwindCSS na frontendu.
