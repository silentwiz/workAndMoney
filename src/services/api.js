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
    // 성공 응답을 JSON으로 파싱
    return await response.json()
  } catch (error) {
    // JSON 파싱 실패 시 (예: 응답이 비어있거나 다른 형식일 때)
    console.error('Failed to parse JSON response:', error)
    // 성공으로 간주하되, 데이터는 없다고 처리하거나 특정 상황에 맞게 처리
    return { success: true, message: 'Operation successful, no JSON response.' }
  }
}
