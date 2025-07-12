// Vercel 서버리스 함수는 기본적으로 이런 형식을 가집니다.
// request: 들어온 요청 정보, response: 보낼 응답 정보
export default function handler(request, response) {
  // 성공 상태(200)와 함께 JSON 데이터를 응답으로 보냅니다.
  response.status(200).json({
    message: '안녕하세요, 백엔드 서버입니다!',
  })
}
