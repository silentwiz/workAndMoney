import { put, list } from '@vercel/blob'
import compression from 'compression'

// compression 미들웨어를 프로미스 기반으로 사용하기 위한 래퍼
const compress = (req, res) =>
  new Promise((resolve, reject) => {
    compression()(req, res, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })

// 요청 본문을 비동기적으로 읽어오는 더 안정적인 함수
async function getBody(request) {
  const chunks = []
  for await (const chunk of request) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString()
}

async function handler(request, response) {
  const { user } = request.query

  if (!user) {
    return response.status(400).json({ error: 'User parameter is required' })
  }

  const filename = `${encodeURIComponent(user)}.json`

  if (request.method === 'POST') {
    try {
      const bodyString = request.body ? JSON.stringify(request.body) : await getBody(request)

      // 본문이 비어있는 경우 에러 처리
      if (!bodyString) {
        console.error('--- SAVE ERROR ---', 'Request body is empty.')
        return response.status(400).json({
          message: 'Request body is empty.',
        })
      }

      await put(filename, bodyString, {
        access: 'public',
        contentType: 'application/json',
        allowOverwrite: true,
      })

      // ✨ 최종 해결책: 응답 헤더에 Content-Type을 명시적으로 설정합니다.
      response.setHeader('Content-Type', 'application/json')
      return response.status(200).json({ success: true, message: 'Data saved successfully.' })
    } catch (error) {
      // ✨ 아이폰 문제 디버깅을 위한 상세 로깅
      console.error('--- DETAILED SAVE ERROR ---')
      console.error('Timestamp:', new Date().toISOString())
      console.error('User:', user)
      console.error('Request Headers:', JSON.stringify(request.headers, null, 2))
      console.error('Error Object:', error)

      return response.status(500).json({
        message: 'Failed to save data due to an internal server error.',
        errorDetails: error.message,
      })
    }
  } else {
    // GET 요청
    try {
      // 압축 미들웨어 적용
      await compress(request, response)

      const { blobs } = await list({ prefix: filename, limit: 1 })

      if (blobs.length === 0) {
        // 데이터가 없을 때 빈 구조를 반환
        return response.status(200).json({ logs: {}, tags: [] })
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

export default handler
