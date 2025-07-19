export const fetchData = async (username) => {
  const response = await fetch(`/api/data?user=${username}`)
  if (!response.ok) {
    throw new Error('Server response was not ok')
  }
  return response.json()
}

export const saveData = async (username, dataToSave) => {
  const response = await fetch(`/api/data?user=${username}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json', // 서버로부터 JSON 응답을 기대한다고 명시
    },
    body: JSON.stringify(dataToSave),
  })

  if (!response.ok) {
    // 서버에서 에러 응답을 보냈을 경우, 그 내용을 파싱하려고 시도
    const errorData = await response.json().catch(() => null) // JSON 파싱 실패 시 null 반환
    console.error('Server error response:', errorData)
    throw new Error(errorData?.message || 'Failed to save data to server')
  }

  try {
    const jsonResponse = await response.json();
    return jsonResponse;
  } catch (error) {
    console.error('Failed to parse JSON response for successful status:', error);
    // response.ok가 true인데 JSON 파싱 실패는 여전히 문제입니다.
    // logStore가 실패로 보고하도록 오류를 다시 throw합니다.
    throw new Error('Server responded successfully but returned invalid JSON.');
  }
}
