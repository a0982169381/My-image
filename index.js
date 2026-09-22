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

const port = process.env.PORT || 3000

const server = createServer((req, res) => {
  // 將 Node.js 的 Request 轉換給 Hono 處理
  app.fetch(req, res).catch((err) => {
    console.error(err)
    res.statusCode = 500
    res.end('Internal Server Error')
  })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`)
})
