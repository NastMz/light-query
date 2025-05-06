// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/todos', () => {
    return HttpResponse.json([{ id: 1, title: 'Test' }])
  })
]
