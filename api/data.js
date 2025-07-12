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
      // ✨ 클라이언트에서 보낸 요청의 body를 그대로 Vercel Blob에 저장합니다.
      // 이 방식이 가장 안정적입니다.
      const blobResult = await put(filename, request, {
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

      // 응답이 비어있는 경우를 대비한 예외 처리
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
