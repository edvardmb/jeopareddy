# Jeopareddy

A project for creating and playing custom Jeopardy-style games with friends.

## Suggested place to start

Start with an **MVP that runs locally on one machine** and supports:

1. Creating a game board (categories + question values)
2. Entering clues and answers
3. Playing the board in a dedicated "Play Mode"
4. Keeping score for teams/players

This keeps scope tight and lets you validate game flow before adding real-time/mobile features.

## Recommended first milestone (vertical slice)

Build one complete flow end-to-end:

- **Frontend (React + TypeScript):**
  - Game setup form
  - Board view
  - Play-mode reveal interaction
- **Backend (.NET C# API):**
  - CRUD for `Game`, `Category`, `Clue`
  - Endpoint to mark clues as revealed/answered
- **Database (SQL):**
  - Tables for games, categories, clues, sessions, and scores

If this is complete, you already have something demoable.

## High-level architecture

- `frontend/` — React TypeScript app
- `backend/` — ASP.NET Core Web API
- `database/` — SQL scripts or EF Core migrations
- `docker/` — Dockerfiles and compose setup

## Proposed incremental roadmap

### Phase 1 — Single-host MVP
- Create/administer a Jeopardy game
- Play game in browser on one screen
- Manual score controls

### Phase 2 — Session management
- Create game sessions from saved templates
- Add simple host controls (reset, lock/unlock clue)

### Phase 3 — Multiplayer basics
- Add player/team join flow (web first)
- Real-time updates via SignalR/WebSockets

### Phase 4 — Smartphone buzzing/answers
- Mobile-friendly player view
- Join via room code
- Timed buzzing and answer submission

### Phase 5 — Deployment and operations
- Dockerize frontend/backend/db
- Add local Docker Compose workflow
- Deploy to a cloud VM/app service

## Why this order works

- You get fast feedback on core gameplay first.
- You avoid over-engineering auth/realtime before validating UX.
- You can learn Docker after the app has stable local behavior.

## Immediate next task suggestion

Implement a small design spec and data model:

1. Define core entities (`Game`, `Category`, `Clue`, `Session`, `TeamScore`)
2. Sketch 3 pages:
   - Game Builder
   - Game Board
   - Play Mode
3. Define the first 5 API routes (create game, get game, update clue, start session, update score)

Once that's written, scaffold the actual projects (`frontend` + `backend`) and wire the first create/get game flow.
