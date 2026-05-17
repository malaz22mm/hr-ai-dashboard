/** Safe text + JSON parse for API responses (handles HTML error pages from proxies). */
export async function readResponseBodyUnknown(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}
