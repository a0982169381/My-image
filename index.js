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
  return c.json({ status: 'ok' }, 200)
})

const port = process.env.PORT || 3000

serve({
  fetch: app.fetch,
  port: Number(port),
  host: '0.0.0.0'
}, (info) => {
  console.log(`Server is running on http://0.0.0.0:${info.port}`)
})
