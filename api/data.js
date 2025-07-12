import { put, list } from '@vercel/blob'

// 요청 본문을 읽어오기 위한 헬퍼 함수
function getBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk.toString()
    })
    request.on('end', () => {
      resolve(body)
    })
    request.on('error', (err) => {
      reject(err)
    })
  })
}

export default async function handler(request, response) {
  const { user } = request.query

  if (!user) {
    return response.status(400).json({ error: 'User parameter is required' })
  }

  const filename = `${encodeURIComponent(user)}.json`

  if (request.method === 'POST') {
    try {
      const bodyString = await getBody(request)

      const blobResult = await put(filename, bodyString, {
        access: 'public',
        contentType: 'application/json',
        allowOverwrite: true,
      })

      return response.status(200).json(blobResult)
    } catch (error) {
      // ✨ 서버에서 발생한 실제 에러 메시지를 응답에 포함시킵니다.
      console.error('--- SAVE ERROR ---', error)
      return response.status(500).json({
        message: 'Failed to save data due to an internal error.',
        // 에러의 상세 내용을 클라이언트에서도 볼 수 있도록 전달
        errorDetails: error.message,
      })
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
      console.error('--- READ ERROR ---', error)
      return response.status(500).json({
        message: 'Failed to read data.',
        errorDetails: error.message,
      })
    }
  }
}
