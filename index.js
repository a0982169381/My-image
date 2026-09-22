import { Hono } from 'hono'
import { serve } from '@hono/node-server'

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
  // 確保無論如何都回傳 200 OK 讓 LINE 通過驗證
  return c.json({ status: 'ok' }, 200)
})

const port = process.env.PORT || 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port: Number(port)
})
