import { put, list } from '@vercel/blob'
import fs from 'fs/promises' // fs/promises를 사용하면 더 깔끔합니다.
import path from 'path'

// Node.js 런타임의 표준 형식인 (request, response)를 사용합니다.
export default async function handler(request, response) {
  const { user } = request.query

  if (!user) {
    return response.status(400).json({ error: 'User parameter is required' })
  }

  const filename = `${user}.json`

  // POST 요청 (데이터 저장)
  if (request.method === 'POST') {
    try {
      // Vercel의 body 파서는 JSON을 객체로 변환해주므로, 다시 문자열로 만듭니다.
      const bodyString = JSON.stringify(request.body, null, 2)
      const blob = await put(filename, bodyString, {
        access: 'public',
        contentType: 'application/json',
      })
      return response.status(200).json(blob)
    } catch (error) {
      return response.status(500).json({ error: `Failed to save data: ${error.message}` })
    }
  }
  // GET 요청 (데이터 불러오기)
  else {
    try {
      const { blobs } = await list({ prefix: filename, limit: 1 })

      if (blobs.length === 0) {
        return response.status(200).json({ logs: [], tags: [] })
      }

      const fileUrl = blobs[0].url
      const fileResponse = await fetch(fileUrl)
      const data = await fileResponse.json()

      return response.status(200).json(data)
    } catch (error) {
      return response.status(500).json({ error: `Failed to read data: ${error.message}` })
    }
  }
}
