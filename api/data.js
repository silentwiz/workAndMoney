import { put, list } from '@vercel/blob'

// 요청 본문을 읽어오기 위한 헬퍼 함수
function getBody(request) {
  return new Promise((resolve) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk.toString()
    })
    request.on('end', () => {
      resolve(body)
    })
  })
}

export default async function handler(request, response) {
  const { user } = request.query

  if (!user) {
    return response.status(400).json({ error: 'User parameter is required' })
  }

  const filename = `${encodeURIComponent(user)}.json`

  // POST 요청 (데이터 저장)
  if (request.method === 'POST') {
    try {
      // 1. 요청 스트림에서 body를 수동으로 읽어옵니다.
      const bodyString = await getBody(request)

      // 2. 읽어온 body 문자열을 Vercel Blob에 저장합니다.
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
