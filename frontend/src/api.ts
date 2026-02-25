export type Clue = {
  id: string
  prompt: string
  answer: string
  imageMimeType: string | null
  imageBase64: string | null
  pointValue: number
  rowOrder: number
  isRevealed: boolean
  isAnswered: boolean
}

export type Category = {
  id: string
  name: string
  displayOrder: number
  clues: Clue[]
}

export type Team = {
  id: string
  name: string
  displayOrder: number
  score: number
}

export type Game = {
  id: string
  title: string
  status: 'Draft' | 'InProgress' | 'Finished'
  createdAtUtc: string
  updatedAtUtc: string
  categories: Category[]
  teams: Team[]
}

export type GameListItem = {
  id: string
  title: string
  status: 'Draft' | 'InProgress' | 'Finished'
  createdAtUtc: string
  updatedAtUtc: string
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:80'

const jsonHeaders = { 'Content-Type': 'application/json' }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init)
  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }
  return (await response.json()) as T
}

async function requestNoBody(path: string, init?: RequestInit): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, init)
  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }
}

async function getErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed (${response.status})`
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return fallback
  }

  const payload = (await response.json()) as { message?: string; errors?: Record<string, string[]> }
  if (payload.message) {
    return payload.message
  }

  if (payload.errors) {
    const firstField = Object.keys(payload.errors)[0]
    if (firstField && payload.errors[firstField]?.length) {
      return payload.errors[firstField][0]
    }
  }

  return fallback
}

export function createGame(title: string): Promise<Game> {
  return request<Game>('/api/games', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ title }),
  })
}

export function listGames(): Promise<GameListItem[]> {
  return request<GameListItem[]>('/api/games')
}

export function getGame(gameId: string): Promise<Game> {
  return request<Game>(`/api/games/${gameId}`)
}

export function startGame(gameId: string): Promise<void> {
  return requestNoBody(`/api/games/${gameId}/start`, {
    method: 'POST',
  })
}

export function resetGame(gameId: string): Promise<void> {
  return requestNoBody(`/api/games/${gameId}/reset`, {
    method: 'POST',
  })
}

export function addTeam(gameId: string, name: string): Promise<void> {
  return requestNoBody(`/api/games/${gameId}/teams`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ name }),
  })
}

export function deleteTeam(gameId: string, teamId: string): Promise<void> {
  return requestNoBody(`/api/games/${gameId}/teams/${teamId}`, {
    method: 'DELETE',
  })
}

export function addCategory(
  gameId: string,
  payload: {
    name: string
    displayOrder: number
    clues: {
      prompt: string
      answer: string
      pointValue: number
      rowOrder: number
      imageMimeType?: string | null
      imageBase64?: string | null
    }[]
  },
): Promise<void> {
  return requestNoBody(`/api/games/${gameId}/categories`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  })
}

export function updateCategory(
  gameId: string,
  categoryId: string,
  payload: { name: string; displayOrder: number },
): Promise<void> {
  return requestNoBody(`/api/games/${gameId}/categories/${categoryId}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  })
}

export function deleteCategory(gameId: string, categoryId: string): Promise<void> {
  return requestNoBody(`/api/games/${gameId}/categories/${categoryId}`, {
    method: 'DELETE',
  })
}

export function createScoreEvent(
  gameId: string,
  payload: { teamId: string; clueId: string | null; deltaPoints: number; reason: string },
): Promise<void> {
  return requestNoBody(`/api/games/${gameId}/score-events`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  })
}

export function updateClue(
  gameId: string,
  clueId: string,
  payload: { isRevealed?: boolean; isAnswered?: boolean },
): Promise<void> {
  return requestNoBody(`/api/games/${gameId}/clues/${clueId}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  })
}

export function updateClueContent(
  gameId: string,
  clueId: string,
  payload: {
    prompt: string
    answer: string
    pointValue: number
    rowOrder: number
    imageMimeType?: string | null
    imageBase64?: string | null
  },
): Promise<void> {
  return requestNoBody(`/api/games/${gameId}/clues/${clueId}/content`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  })
}

export function deleteClue(gameId: string, clueId: string): Promise<void> {
  return requestNoBody(`/api/games/${gameId}/clues/${clueId}`, {
    method: 'DELETE',
  })
}
