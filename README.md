# Jeopareddy

A project for creating and playing custom Jeopardy-style games with friends.

## Suggested place to start

Start with an **MVP that runs locally on one machine** and supports:

1. Creating a game board (categories + question values)
2. Entering clues and answers
3. Playing the board in a dedicated "Play Mode"
4. Keeping score for teams/players

This keeps scope tight and lets you validate game flow before adding real-time/mobile features.

## Step 1 - MVP v1 definition (locked scope)

### In scope for v1

1. Create a game
2. Add categories, clues/questions, and point values
3. Start and run a browser-based Play Mode on one screen/device
4. Track team/player scores manually during play

### Out of scope for v1

- Player login and authentication
- Smartphone player clients
- Real-time multiplayer sync
- Timed buzzers/answer submissions
- Production deployment and cloud hosting

### "Done" criteria for v1

- A host can create and save one playable board
- The board can be played end-to-end in Play Mode
- Used clues are visually marked and cannot be selected again
- Scores can be adjusted by the host until a winner is decided

## Step 2 - Initial data model (v1)

Use these five core entities for v1:

### `Game`

- `Id` (UUID/uniqueidentifier, PK)
- `Title` (string, required)
- `Status` (enum: `Draft`, `InProgress`, `Finished`)
- `CreatedAtUtc` (datetime, required)
- `UpdatedAtUtc` (datetime, required)

### `Category`

- `Id` (UUID, PK)
- `GameId` (UUID, FK -> `Game.Id`, required)
- `Name` (string, required)
- `DisplayOrder` (int, required)

### `Clue`

- `Id` (UUID, PK)
- `GameId` (UUID, FK -> `Game.Id`, required)
- `CategoryId` (UUID, FK -> `Category.Id`, required)
- `Prompt` (string, required)
- `Answer` (string, required)
- `PointValue` (int, required)
- `RowOrder` (int, required)
- `IsRevealed` (bool, required, default `false`)
- `IsAnswered` (bool, required, default `false`)

### `Team`

- `Id` (UUID, PK)
- `GameId` (UUID, FK -> `Game.Id`, required)
- `Name` (string, required)
- `DisplayOrder` (int, required)

### `ScoreEvent`

- `Id` (UUID, PK)
- `GameId` (UUID, FK -> `Game.Id`, required)
- `TeamId` (UUID, FK -> `Team.Id`, required)
- `ClueId` (UUID, FK -> `Clue.Id`, nullable for manual adjustments)
- `DeltaPoints` (int, required; positive or negative)
- `Reason` (string, optional)
- `CreatedAtUtc` (datetime, required)

### Relationship summary

- One `Game` has many `Category`, `Clue`, `Team`, and `ScoreEvent` rows.
- One `Category` has many `Clue` rows.
- One `Team` has many `ScoreEvent` rows.
- One `Clue` can be linked by zero or more `ScoreEvent` rows.

### v1 constraints

- Unique category order per game: (`GameId`, `DisplayOrder`)
- Unique clue slot per game board: (`GameId`, `CategoryId`, `RowOrder`)
- Unique team order per game: (`GameId`, `DisplayOrder`)
- `PointValue > 0`

### Derived value

- Team score is derived from `ScoreEvent`:
  - `TeamScore = SUM(DeltaPoints)` grouped by (`GameId`, `TeamId`)

## Step 3 - v1 API contract

Base path: `/api`

### 1) Create game

- `POST /api/games`
- Request body:
```json
{
  "title": "Friday Trivia Night"
}
```
- Response `201 Created`:
```json
{
  "id": "2a59f511-37b8-463d-b3f5-31e8d580f646",
  "title": "Friday Trivia Night",
  "status": "Draft",
  "createdAtUtc": "2026-02-17T18:30:00Z",
  "updatedAtUtc": "2026-02-17T18:30:00Z"
}
```

### 2) Get game (full board + teams + score)

- `GET /api/games/{gameId}`
- Response `200 OK`:
```json
{
  "id": "2a59f511-37b8-463d-b3f5-31e8d580f646",
  "title": "Friday Trivia Night",
  "status": "Draft",
  "categories": [
    {
      "id": "40bd5d17-c722-44cb-9104-60d69f4b8686",
      "name": "Science",
      "displayOrder": 1,
      "clues": [
        {
          "id": "a887b37d-cf0e-429f-baa3-078f1297e431",
          "prompt": "This planet is known as the Red Planet.",
          "answer": "Mars",
          "pointValue": 100,
          "rowOrder": 1,
          "isRevealed": false,
          "isAnswered": false
        }
      ]
    }
  ],
  "teams": [
    {
      "id": "7f546782-6647-4300-91d0-954837d6f4aa",
      "name": "Team A",
      "displayOrder": 1,
      "score": 0
    }
  ]
}
```

### 3) Add category with clues

- `POST /api/games/{gameId}/categories`
- Request body:
```json
{
  "name": "Science",
  "displayOrder": 1,
  "clues": [
    { "prompt": "This planet is known as the Red Planet.", "answer": "Mars", "pointValue": 100, "rowOrder": 1 },
    { "prompt": "Water freezes at this Celsius temperature.", "answer": "0", "pointValue": 200, "rowOrder": 2 }
  ]
}
```
- Response `201 Created`:
```json
{
  "id": "40bd5d17-c722-44cb-9104-60d69f4b8686",
  "gameId": "2a59f511-37b8-463d-b3f5-31e8d580f646",
  "name": "Science",
  "displayOrder": 1
}
```

### 4) Start game (enter play mode)

- `POST /api/games/{gameId}/start`
- Request body: empty
- Response `200 OK`:
```json
{
  "id": "2a59f511-37b8-463d-b3f5-31e8d580f646",
  "status": "InProgress",
  "updatedAtUtc": "2026-02-17T19:00:00Z"
}
```

### 5) Update score (manual host control)

- `POST /api/games/{gameId}/score-events`
- Request body:
```json
{
  "teamId": "7f546782-6647-4300-91d0-954837d6f4aa",
  "clueId": "a887b37d-cf0e-429f-baa3-078f1297e431",
  "deltaPoints": 100,
  "reason": "Correct answer"
}
```
- Response `201 Created`:
```json
{
  "id": "dc81035c-b4d8-4487-91d0-b0ed6cc95dcb",
  "gameId": "2a59f511-37b8-463d-b3f5-31e8d580f646",
  "teamId": "7f546782-6647-4300-91d0-954837d6f4aa",
  "deltaPoints": 100,
  "createdAtUtc": "2026-02-17T19:01:00Z"
}
```

### Common validation and errors

- `400 Bad Request`: invalid payload, missing required fields, invalid enum/value
- `404 Not Found`: unknown `gameId`, `teamId`, `categoryId`, or `clueId`
- `409 Conflict`: duplicate `displayOrder`/`rowOrder` slot in same game

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

Implement the first working backend slice:

1. Scaffold `backend/` as ASP.NET Core Web API
2. Implement routes:
   - `POST /api/games`
   - `GET /api/games/{gameId}`
3. Add EF Core models/migration for `Game`, `Category`, `Clue`, `Team`, `ScoreEvent`

Once this runs locally, scaffold `frontend/` and wire create/get game end-to-end.
