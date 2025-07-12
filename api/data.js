import { put, list } from '@vercel/blob'

// Vercel의 공식적인 body 파싱 방법을 사용합니다.
async function parseBody(request) {
  try {
    return await request.json()
  } catch (e) {
    return null
  }
}

export default async function handler(request, response) {
  // URL에서 쿼리 파라미터를 가져옵니다.
  const { searchParams } = new URL(request.url, `https://${request.headers.host}`)
  const user = searchParams.get('user')

  if (!user) {
    return response.status(400).json({ error: 'User parameter is required' })
  }

  const filename = `${encodeURIComponent(user)}.json`

  if (request.method === 'POST') {
    try {
      // 1. 요청 본문을 안전하게 파싱합니다.
      const jsonData = await parseBody(request)
      if (jsonData === null) {
        throw new Error('Invalid JSON body')
      }

      // 2. 파싱된 자바스크립트 객체를 다시 문자열로 변환하여 저장합니다.
      const bodyString = JSON.stringify(jsonData, null, 2)

      const blobResult = await put(filename, bodyString, {
        access: 'public',
        contentType: 'application/json',
      })
      return response.status(200).json(blobResult)
    } catch (error) {
      return response.status(500).json({ error: `Failed to save data: ${error.message}` })
    }
  } else {
    // GET 요청
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
