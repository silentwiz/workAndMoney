import fs from 'fs/promises'
import path from 'path'

export default async function handler(request, response) {
  // 1. 요청 주소에서 사용자 이름 가져오기 (예: /api/data?user=sawa)
  const { user } = request.query

  if (!user) {
    return response.status(400).json({ error: 'User parameter is required' })
  }
  // 2. 데이터 파일 경로 설정
  const filePath = path.join(process.cwd(), 'api', '_data', `${user}.json`)

  // ✨ 요청 방식(method)에 따라 다른 작업 수행
  if (request.method === 'POST') {
    // --- 데이터 저장 로직 ---
    try {
      // 1. 요청 본문(body)에 담겨온 새로운 데이터를 가져옵니다.
      const newData = request.body
      // 2. JSON 파일에 새로운 데이터를 덮어씁니다.
      await fs.writeFile(filePath, JSON.stringify(newData, null, 2))
      // 3. 성공 응답을 보냅니다.
      response.status(200).json({ message: 'Data saved successfully' })
    } catch (error) {
      response.status(500).json({ error: 'Failed to save data' })
    }
  } else {
    // --- 기존의 데이터 읽기 로직 ---
    try {
      // 3. 파일 읽기 시도
      const fileContent = await fs.readFile(filePath, 'utf8')
      const data = JSON.parse(fileContent)
      // 4. 성공 시, 파일 내용을 응답으로 보냄
      response.status(200).json(data)
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 5. 파일이 없으면 (새 사용자), 기본 데이터 구조를 보냄
        response.status(200).json({ logs: [], tags: [] })
      } else {
        // 그 외의 서버 에러
        response.status(500).json({ error: 'Failed to read data' })
      }
    }
  }
}
