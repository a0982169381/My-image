import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Travel Agent Bot is running!')
})

app.post('/webhook', async (c) => {
  const body = await c.req.json()
  console.log('Received LINE webhook:', JSON.stringify(body))
  return c.json({ status: 'ok' })
})

export default app
