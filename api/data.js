import { put, download } from '@vercel/blob'

// Vercel의 권장 방식에 따라, reponse 객체를 사용하지 않고 직접 값을 반환하도록 수정합니다.
export default async function handler(request) {
  // URL 쿼리에서 사용자 이름을 가져옵니다.
  // Vercel 환경에서는 request.query 대신 URL 객체를 사용하는 것이 더 안정적입니다.
  const { searchParams } = new URL(request.url, `https://${request.headers.host}`)
  const user = searchParams.get('user')

  if (!user) {
    return new Response(JSON.stringify({ error: 'User parameter is required' }), { status: 400 })
  }

  const filename = `${user}.json`

  // POST 요청 (데이터 저장) 처리
  if (request.method === 'POST') {
    try {
      // 클라이언트에서 보낸 요청 본문(body)을 Vercel Blob에 바로 저장합니다.
      const blob = await put(filename, request.body, {
        access: 'public',
        contentType: 'application/json',
      })
      // 성공 시, JSON 형태로 응답합니다.
      return new Response(JSON.stringify(blob), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to save data to Blob store' }), {
        status: 500,
      })
    }
  }
  // GET 요청 (데이터 불러오기) 처리
  else {
    try {
      // Vercel Blob에서 파일을 찾아 그 내용을 바로 반환합니다.
      const blob = await download(filename)
      return new Response(blob, { status: 200, headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
      // 파일이 없을 경우 (404 Not Found)
      if (error.status === 404) {
        // 비어있는 기본 데이터 구조를 반환합니다.
        return new Response(JSON.stringify({ logs: [], tags: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      // 그 외의 에러
      return new Response(JSON.stringify({ error: 'Failed to read data from Blob store' }), {
        status: 500,
      })
    }
  }
}
