import { createServer } from 'http'
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Travel Agent Bot is running!')
})

app.post('/webhook', async (c) => {
  try {
    const body = await c.req.json()
    console.log('Received LINE webhook:', JSON.stringify(body))
  } catch (e) {
    console.error('Error parsing JSON:', e)
  }
  return c.json({ status: 'ok' }, 200)
})

// 必須完全採用 Railway 指派的 process.env.PORT
const port = Number(process.env.PORT) || 3000

const server = createServer(async (req, res) => {
  const url = `http://${req.headers.host || 'localhost'}${req.url}`
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined

  const init = {
    method: req.method,
    headers: req.headers,
  }
  if (req.method !== 'GET' && req.method !== 'HEAD' && body) {
    init.body = body
  }

  const response = await app.fetch(new Request(url, init))
  
  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  
  const resBody = await response.arrayBuffer()
  res.end(Buffer.from(resBody))
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`)
})
