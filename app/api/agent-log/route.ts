export async function POST(request: Request) {
  try {
    const bodyText = await request.text()
    // Forward whatever the client sent to the local NDJSON ingest server.
    // Do not throw on failures; this endpoint is best-effort for debugging only.
    await fetch("http://127.0.0.1:7243/ingest/87a82cd4-27bc-4a13-a28b-97d7121e94c1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyText,
    }).catch(() => {})
  } catch {
    // ignore
  }

  return new Response(null, { status: 204 })
}



