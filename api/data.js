import { put, list } from '@vercel/blob'

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
      // ✨ Vercel의 Node.js 런타임은 request.body를 자동으로 자바스크립트 객체로 파싱해줍니다.
      // 이 객체를 다시 JSON 문자열로 변환하여 Blob에 저장해야 합니다.
      const bodyString = JSON.stringify(request.body, null, 2)

      const blobResult = await put(filename, bodyString, {
        access: 'public',
        contentType: 'application/json',
      })
      return response.status(200).json(blobResult)
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

      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch blob: ${fileResponse.statusText}`)
      }
      const data = await fileResponse.json()

      return response.status(200).json(data)
    } catch (error) {
      return response.status(500).json({ error: `Failed to read data: ${error.message}` })
    }
  }
}
