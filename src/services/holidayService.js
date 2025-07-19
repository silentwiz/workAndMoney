
import { ref } from 'vue';

const holidays = ref(null);

export const useHolidayService = () => {
  const fetchHolidays = async () => {
    if (holidays.value) {
      return; // 이미 로드된 경우 다시 로드하지 않음
    }
    try {
      const response = await fetch('https://holidays-jp.github.io/api/v1/date.json');
      if (!response.ok) {
        throw new Error('네트워크 응답이 올바르지 않습니다.');
      }
      holidays.value = await response.json();
    } catch (error) {
      console.error('공휴일 데이터를 가져오는 데 실패했습니다:', error);
      holidays.value = {}; // 에러 발생 시 빈 객체로 초기화
    }
  };

  const isHoliday = (date) => {
    if (!holidays.value) {
      console.warn('공휴일 데이터가 아직 로드되지 않았습니다.');
      return null; // 공휴일 데이터가 없으면 null 반환
    }
    const dateString = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
    return holidays.value[dateString] || null; // 공휴일 이름 반환, 없으면 null
  };

  // 앱 시작 시 공휴일 데이터 미리 로드
  fetchHolidays();

  return {
    holidays,
    fetchHolidays,
    isHoliday,
  };
};
