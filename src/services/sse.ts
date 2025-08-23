import type { Response } from "express"
import { findTableByToken } from "./db.js"

const clients: Record<string, Response[]> = {}

export async function registerClient(token: string, res: Response) {
  const table = await findTableByToken(token)
  if (!table) return false

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")

  if (!clients[token]) clients[token] = []
  clients[token].push(res)

  const interval = setInterval(() => res.write(":\n\n"), 30000)

  res.on("close", () => {
    clearInterval(interval)
    clients[token] = (clients[token] || []).filter(c => c !== res)
  })

  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
  return true
}

export function notifyTable(token: string, payload: any) {
  const msg = `data: ${JSON.stringify(payload)}\n\n`
  clients[token]?.forEach(res => res.write(msg))
}
