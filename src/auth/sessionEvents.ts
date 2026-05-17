type SessionExpiredHandler = () => void

let sessionExpiredHandler: SessionExpiredHandler | null = null

/** Register once from the auth store initializer to clear client session on hard auth failure. */
export function setSessionExpiredHandler(handler: SessionExpiredHandler | null): void {
  sessionExpiredHandler = handler
}

export function emitSessionExpired(): void {
  sessionExpiredHandler?.()
}
