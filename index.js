import { createServer } from 'http'
import { Hono } from 'hono'
import fs from 'fs'
import path from 'path'

const app = new Hono()

// 讀取本地 spots.json 景點資料
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
        const geminiKey = process.env.GEMINI_API_KEY

        // 偵錯日誌：印出是否有抓到 Key
        console.log("DEBUG - GEMINI_API_KEY value:", geminiKey ? "已有值 (長度: " + geminiKey.length + ")" : "是空的/undefined");

        let replyText = ''

        // 檢查是否有設定 Gemini Key
        if (geminiKey) {
          const spots = getSpots()
          const prompt = `你是一個專業貼心的旅遊助理。使用者問：「${userMessage}」。\n我們資料庫裡目前的私房景點有：${JSON.stringify(spots)}。\n請根據使用者的提問，給予自然、親切且有幫助的旅遊建議。如果使用者問的是其他地區，請發揮你的知識幫忙解答！`

          // 呼叫 Google Gemini API
          const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }]
              }]
            })
          })
          const geminiData = await geminiRes.json()
          replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '抱歉，我現在有點累，請稍後再試一次！'
        } else {
          replyText = '收到你的訊息囉！(尚未設定 Gemini Key)'
        }

        // 回傳給 LINE
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
