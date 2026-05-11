export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const apiUrl = process.env.VITE_QWIXY_API_URL
  const apiKey = process.env.VITE_QWIXY_API_KEY
  if (!apiUrl || !apiKey) return res.status(500).json({ error: 'Server not configured' })

  try {
    const r = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    })

    const text = await r.text()
    if (r.status === 401) {
      return res.status(401).json({
        error: 'Invalid API key configured for Qwixy assistant',
        details: text,
      })
    }

    res.status(r.status).send(text)
  } catch (err) {
    console.error('Error in /api/qwixy:', err)
    res.status(500).json({ error: err.message || String(err) })
  }
}
