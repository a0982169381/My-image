import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Travel Agent Bot is running!')
})

app.post('/webhook', async (c) => {
  const body = await c.req.json()
  console.log('Received LINE webhook:', JSON.stringify(body))
  return c.json({ status: 'ok' })
})

const port = process.env.PORT || 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port: Number(port)
})
