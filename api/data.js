import { put, list } from '@vercel/blob' // ✨ import 'download' 대신 'list'를 사용

export default async function handler(request) {
  const { searchParams } = new URL(request.url, `https://${request.headers.host}`)
  const user = searchParams.get('user')

  if (!user) {
    return new Response(JSON.stringify({ error: 'User parameter is required' }), { status: 400 })
  }

  const filename = `${user}.json`

  // POST 요청 (데이터 저장)
  if (request.method === 'POST') {
    try {
      const blob = await put(filename, request.body, {
        access: 'public',
        contentType: 'application/json',
        // 'add-random-suffix': false // 필요 시 파일 이름에 무작위 문자열이 붙는 것을 방지
      })
      return new Response(JSON.stringify(blob), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      return new Response(JSON.stringify({ error: `Failed to save data: ${error.message}` }), {
        status: 500,
      })
    }
  }
  // GET 요청 (데이터 불러오기)
  else {
    try {
      // 1. list 함수로 파일 이름에 해당하는 파일을 찾습니다.
      const { blobs } = await list({ prefix: filename, limit: 1 })

      // 2. 파일이 존재하지 않으면, 비어있는 기본 데이터를 반환합니다.
      if (blobs.length === 0) {
        return new Response(JSON.stringify({ logs: [], tags: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // 3. 찾은 파일의 URL로 fetch 요청을 보내 실제 내용을 가져옵니다.
      const fileUrl = blobs[0].url
      const fileResponse = await fetch(fileUrl)
      const data = await fileResponse.json()

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      return new Response(JSON.stringify({ error: `Failed to read data: ${error.message}` }), {
        status: 500,
      })
    }
  }
}
