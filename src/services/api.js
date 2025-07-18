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
    },
    body: JSON.stringify(dataToSave),
  })
  if (!response.ok) {
    throw new Error('Failed to save data to server')
  }
  return response.json()
}
