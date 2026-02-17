# Backend Scaffold

This folder contains the ASP.NET Core API backend for Step 4.

## Endpoints implemented

- `POST /api/games`
- `GET /api/games/{gameId}`
- `POST /api/games/{gameId}/categories`
- `POST /api/games/{gameId}/teams`
- `POST /api/games/{gameId}/start`
- `POST /api/games/{gameId}/score-events`
- `PATCH /api/games/{gameId}/clues/{clueId}`
- `GET /health`

## Notes

- Storage is SQLite via EF Core (`appsettings.json` -> `DefaultConnection`).
- The app calls `Database.Migrate()` at startup so local migrations are applied automatically.

## Run locally

1. Install .NET 8 SDK
2. Run:

```powershell
cd backend
dotnet run
```
