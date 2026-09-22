import { createServer } from 'http'
import { Hono } from 'hono'
import fs from 'fs'
import path from 'path'

const app = new Hono()

// 讀取 JSON 景點資料
const getSpots = () => {
  try {
    const filePath = path.resolve('spots.json')
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (e) {
    return []
  }
}

app.get('/', (c) => {
  return c.text('Travel Agent Bot is running!')
})

app.post('/webhook', async (c) => {
  try {
    const body = await c.req.json()
    const events = body.events || []

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text
        const replyToken = event.replyToken
        const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN

        let replyText = '收到你的訊息囉！'

        // 簡單的關鍵字觸發
        if (userMessage.includes('景點') || userMessage.includes('推薦')) {
          const spots = getSpots()
          if (spots.length > 0) {
            replyText = '為你推薦以下私房景點：\n' + spots.map(s => `- ${s.name} (${s.tag})\n  ${s.description}`).join('\n\n')
          } else {目前沒有景點資料}
        } else {
          replyText = `你想了解哪裡的旅遊資訊呢？試著輸入「推薦景點」看看吧！`
        }

        // 呼叫 LINE Messaging API 回傳訊息
        await fetch('https://api.line.me/v2/bot/message/reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            replyToken: replyToken,
            messages: [{ type: 'text', text: replyText }]
          })
        })
      }
    }
  } catch (e) {
    console.error('Webhook Error:', e)
  }
  return c.json({ status: 'ok' }, 200)
})

const port = Number(process.env.PORT) || 8080

const server = createServer(async (req, res) => {
  try {
    const url = `http://${req.headers.host || 'localhost'}${req.url}`
    let body = undefined
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks = []
      for await (const chunk of req) {
        chunks.push(chunk)
      }
      body = chunks.length > 0 ? Buffer.concat(chunks) : undefined
    }

    const init = { method: req.method, headers: req.headers, body }
    const response = await app.fetch(new Request(url, init))
    
    res.statusCode = response.status
    response.headers.forEach((value, key) => res.setHeader(key, value))
    res.end(Buffer.from(await response.arrayBuffer()))
  } catch (err) {
    res.statusCode = 500
    res.end('Internal Server Error')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`)
})
