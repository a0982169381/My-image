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

const port = Number(process.env.PORT) || 8080

const server = createServer(async (req, res) => {
  try {
    const url = `http://${req.headers.host || 'localhost'}${req.url}`
    
    // 只有非 GET/HEAD 請求才讀取 Body，避免 GET 請求卡住
    let body = undefined
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks = []
      for await (const chunk of req) {
        chunks.push(chunk)
      }
      body = chunks.length > 0 ? Buffer.concat(chunks) : undefined
    }

    const init = {
      method: req.method,
      headers: req.headers,
      body: body
    }

    const response = await app.fetch(new Request(url, init))
    
    res.statusCode = response.status
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })
    
    const resBody = await response.arrayBuffer()
    res.end(Buffer.from(resBody))
  } catch (err) {
    console.error('Server error:', err)
    res.statusCode = 500
    res.end('Internal Server Error')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`)
})
