# 프로젝트 코드 요약

이 문서는 Vue.js (Pinia, Vite) 기반의 근태 관리 애플리케이션 코드베이스에 대한 기능 및 변수 요약입니다.

---

## 1. Vue 컴포넌트

### `src/App.vue`
*   **역할:** 애플리케이션의 최상위 컴포넌트로, 사용자 로그인/로그아웃 처리 및 전역 레이아웃(헤더, 푸터)을 담당합니다.
*   **변수:**
    *   `currentUser` (ref): 현재 로그인된 사용자 이름.
*   **함수:**
    *   `handleUserSelected(username)`: `UserProfile` 컴포넌트에서 사용자 선택 시 호출되어 `currentUser`를 설정하고 `userStore.loadUser`를 호출합니다.
    *   `handleLogout()`: `userStore.logout`을 호출하고 `currentUser`를 초기화합니다.

### `src/views/HomeView.vue`
*   **역할:** 애플리케이션의 메인 페이지로, 근태 관리의 핵심 기능을 담고 있습니다. 달력, 요약 대시보드, 태그별 요약, 실시간 근무 기록 컨트롤, 로그 목록을 포함합니다.
*   **변수:**
    *   `isSettingsModalOpen` (ref): 설정 모달의 열림/닫힘 상태.
    *   `showLiveControls` (ref): 실시간 근무 기록 컨트롤의 표시 여부 (모바일에서 토글).
    *   `selectedLiveTagId` (ref): 실시간 기록할 직장(태그) ID.
    *   `liveStatusMessage` (ref): 현재 근무 상태 메시지 (예: '待機中', '勤務中', '休憩中').
    *   `liveWorkedTime` (ref): 실시간 근무 시간.
    *   `timerInterval`: `setInterval` 타이머 ID.
*   **함수:**
    *   `updateLiveTime()`: 실시간 근무 시간을 업데이트합니다.
    *   `startWork()`: 근무 기록 추적을 시작합니다.
    *   `startRest()`: 휴식을 시작합니다.
    *   `endRest()`: 휴식을 종료합니다.
    *   `endWork()`: 근무 기록 추적을 종료합니다.
*   **컴포넌트:** `AttendanceCalendar`, `SummaryDashboard`, `TagSummary`, `LogList`, `BaseModal`, `SettingsEditor`.

### `src/components/AttendanceCalendar.vue`
*   **역할:** VCalendar 라이브러리를 사용하여 근태 달력을 표시하고, 로그 데이터에 따라 날짜에 마커를 표시합니다. 날짜 클릭 시 로그 편집/조회 모달을 엽니다.
*   **변수:**
    *   `isModalOpen` (ref): 로그 편집/조회 모달의 열림/닫힘 상태.
    *   `selectedDate` (ref): 달력에서 선택된 날짜.
    *   `modalMode` (ref): 모달의 모드 ('viewer' 또는 'editor').
    *   `dailyLogs` (ref): 선택된 날짜의 로그 목록.
    *   `editingLog` (ref): 수정할 특정 로그 데이터.
    *   `indicatorStyle` (ref): 달력 마커 스타일 ('dot' 또는 'bar').
    *   `weekStartDay` (ref): 주의 시작 요일 (1: 일요일, 2: 월요일).
    *   `showCalendarSettings` (ref): 달력 설정 컨트롤 표시 여부.
    *   `isDeleteConfirmOpen` (ref): 로그 삭제 확인 모달의 열림/닫힘 상태.
    *   `logToDelete` (ref): 삭제할 로그 데이터.
    *   `calendarLocale` (computed): VCalendar 로케일 설정.
    *   `attributes` (computed): VCalendar에 표시될 속성 (로그, 급여일 등).
    *   `calendarViewDate` (computed): 현재 달력의 표시 날짜.
*   **함수:**
    *   `handlePageUpdate(pages)`: 달력 페이지 변경 시 `settingsStore.setViewedDate`를 호출합니다.
    *   `handleDayClick(day)`: 달력 날짜 클릭 시 로그 조회/편집 모달을 엽니다.
    *   `onAddNew()`: 새 로그 추가 모드로 전환합니다.
    *   `onEditLog(log)`: 기존 로그 수정 모드로 전환합니다.
    *   `requestDeleteLog(log)`: 로그 삭제 확인 모달을 엽니다.
    *   `confirmDelete()`: 로그를 삭제합니다.
*   **컴포넌트:** `BaseModal`, `LogEditor`, `DailyLogViewer`.

### `src/components/SummaryDashboard.vue`
*   **역할:** 주간 및 월간 예상 순수입을 요약하여 표시합니다.
*   **변수:** 없음 (모두 `logStore`의 computed 속성을 사용).
*   **컴포넌트:** 없음.

### `src/components/LogList.vue`
*   **역할:** 모든 근무 기록을 목록 형태로 표시하고, 데이터 내보내기/가져오기 기능을 제공합니다.
*   **변수:**
    *   `fileInput` (ref): 파일 입력 엘리먼트 참조.
*   **함수:**
    *   `handleExport()`: `settingsStore.exportUserData`를 호출하여 데이터를 내보냅니다.
    *   `handleImport()`: `settingsStore.importUserData`를 호출하여 데이터를 가져옵니다.
*   **컴포넌트:** 없음.

### `src/components/BaseModal.vue`
*   **역할:** 재사용 가능한 모달 컴포넌트.
*   **Props:**
    *   `show` (Boolean): 모달 표시 여부.
*   **Emits:**
    *   `close`: 모달 닫기 이벤트.

### `src/components/DailyLogViewer.vue`
*   **역할:** 특정 날짜의 근무 기록을 표시하고, 기록 수정 또는 추가, 삭제 요청 이벤트를 발생시킵니다.
*   **Props:**
    *   `logs` (Array): 해당 날짜의 근무 기록 배열.
*   **Emits:**
    *   `edit-log(log)`: 로그 수정 요청 이벤트.
    *   `add-new`: 새 로그 추가 요청 이벤트.
    *   `request-delete-log(log)`: 로그 삭제 요청 이벤트.

### `src/components/LogEditor.vue`
*   **역할:** 근무 기록을 추가하거나 수정하는 폼을 제공합니다.
*   **Props:**
    *   `date` (Date): 현재 편집 중인 날짜.
    *   `logData` (Object, optional): 수정할 기존 로그 데이터.
*   **Emits:**
    *   `close`: 모달 닫기 이벤트.
*   **변수:**
    *   `startTime` (ref): 근무 시작 시간.
    *   `endTime` (ref): 근무 종료 시간.
    *   `selectedTagId` (ref): 선택된 직장(태그) ID.
    *   `logId` (ref): 현재 편집 중인 로그의 ID.
    *   `restMinutes` (ref): 휴식 시간 (분).
    *   `expenses` (ref): 지출.
    *   `validationError` (ref): 유효성 검사 오류 메시지.
    *   `formattedDate`: 현재 날짜의 YYYY-MM-DD 형식 문자열.
*   **함수:**
    *   `handleSubmit()`: 폼 제출 시 `logStore.saveLog`를 호출하여 로그를 저장합니다.

### `src/components/SettingsEditor.vue`
*   **역할:** 직장(태그)별 시급, 급여일, 마감일, 야간 시간 등의 상세 설정을 관리합니다.
*   **변수:**
    *   `isModalOpen` (ref): 상세 설정 모달의 열림/닫힘 상태.
    *   `editingTag` (ref): 현재 수정 중인 태그 데이터.
    *   `saveMessage` (ref): 저장 성공 메시지.
    *   `newTag` (ref): 새 태그 추가를 위한 데이터 모델.
*   **함수:**
    *   `openEditModal(tag)`: 상세 설정 모달을 열고 `editingTag`를 설정합니다.
    *   `handleUpdateTag()`: `tagStore.updateTag`를 호출하여 태그 설정을 업데이트합니다.
    *   `handleAddTag()`: `tagStore.addTag`를 호출하여 새 태그를 추가합니다.
*   **컴포넌트:** `BaseModal`.

### `src/views/AboutView.vue`
*   **역할:** 간단한 "About" 페이지.
*   **변수:** 없음.
*   **컴포넌트:** 없음.

### `src/views/UserProfile.vue`
*   **역할:** 사용자 로그인/선택 및 새 사용자 추가 기능을 제공합니다. 사용자 목록은 로컬 스토리지에 저장됩니다.
*   **Emits:**
    *   `user-selected(username)`: 사용자 선택 시 부모 컴포넌트에 사용자 이름을 전달합니다.
*   **변수:**
    *   `users` (ref): 로컬 스토리지에서 불러온 사용자 목록.
    *   `newUsername` (ref): 새로 추가할 사용자 이름.
*   **함수:**
    *   `addUser()`: 새 사용자를 추가하고 로컬 스토리지에 저장합니다.
    *   `selectUser(username)`: 사용자 선택 시 `user-selected` 이벤트를 발생시킵니다.

### `src/components/icons/*.vue`
*   **역할:** 애플리케이션에서 사용되는 SVG 아이콘 컴포넌트들.
*   **변수:** 없음.
*   **컴포넌트:** 없음.

---

## 2. Pinia 스토어

### `src/stores/logStore.js`
*   **역할:** 모든 근무 기록 데이터(`attendanceLogs`)를 관리하고, 실시간 근무 추적, 로그 저장/삭제, 주간/월간 요약 계산 등의 로직을 포함합니다.
*   **상태 (State):**
    *   `attendanceLogs` (ref): 날짜를 키로 하는 객체 형태의 근무 기록 데이터 (예: `{ 'YYYY-MM-DD': [log1, log2, ...] }`).
    *   `currentPage` (ref): 로그 목록의 현재 페이지.
    *   `itemsPerPage` (ref): 페이지당 표시될 로그 수.
    *   `isTracking` (ref): 실시간 근무 추적 중인지 여부.
    *   `trackingStartTime` (ref): 근무 추적 시작 시간.
    *   `isResting` (ref): 휴식 중인지 여부.
    *   `restStartTime` (ref): 휴식 시작 시간.
    *   `accumulatedRestMinutes` (ref): 누적 휴식 시간 (분).
    *   `liveLogId` (ref): 현재 실시간 추적 중인 로그의 ID.
    *   `liveTagId` (ref): 현재 실시간 추적 중인 로그의 직장(태그) ID.
*   **Getter (Computed):**
    *   `paginatedLogs`: 현재 페이지에 해당하는 로그 목록.
    *   `totalPages`: 전체 로그 페이지 수.
    *   `allLogsSorted`: 모든 로그를 `modifiedAt` 기준으로 정렬한 배열.
    *   `weeklyExpenses`: 현재 주의 총 지출.
    *   `monthlyExpenses`: 현재 월의 총 지출.
    *   `netWeeklyWage`: 현재 주의 예상 순수입 (주간 급여 - 주간 지출).
    *   `netMonthlyWage`: 현재 월의 예상 순수입 (월간 급여 - 월간 지출).
    *   `getLogsByDate(dateStr)`: 특정 날짜의 로그 목록을 반환하는 함수.
    *   `monthlyWage`: 현재 월의 총 급여.
    *   `weeklyWage`: 현재 주의 총 급여.
*   **액션 (Actions/Functions):**
    *   `saveStateToLocalStorage()`: 실시간 근무 기록 상태를 로컬 스토리지에 저장합니다.
    *   `loadStateFromLocalStorage()`: 로컬 스토리지에서 실시간 근무 기록 상태를 불러옵니다.
    *   `goToPage(pageNumber)`: 로그 목록 페이지를 변경합니다.
    *   `startTracking(tagId)`: 실시간 근무 추적을 시작합니다.
    *   `startRest()`: 휴식을 시작합니다.
    *   `endRest()`: 휴식을 종료합니다.
    *   `endTracking()`: 실시간 근무 추적을 종료하고 로그를 업데이트합니다.
    *   `deleteLog(logId, date)`: 특정 로그를 삭제합니다.
    *   `saveLog(logData)`: 로그를 저장하거나 업데이트합니다.
    *   `normalizeLogData(logsArray)`: 로그 배열을 날짜별 객체 형태로 변환합니다.
*   **Watchers:**
    *   `isTracking`, `trackingStartTime`, `isResting`, `restStartTime`, `accumulatedRestMinutes` 변경 시 `debouncedSaveState`를 호출하여 로컬 스토리지에 상태를 저장합니다 (200ms 디바운스).

### `src/stores/tagStore.js`
*   **역할:** 직장(태그) 정보와 각 태그별 임금 계산 로직을 관리합니다.
*   **상태 (State):**
    *   `tags` (ref): 직장(태그) 객체 배열. 각 태그는 `id`, `name`, `color`, `baseRate`, `nightRate`, `weekendRate`, `weekendNightRate`, `payday`, `periodStartDay`, `nightStartHour`, `nightEndHour`를 포함합니다.
*   **Getter (Computed):**
    *   `getTagById(tagId)`: ID를 통해 특정 태그를 반환하는 함수.
    *   `tagSummaries`: 각 태그별 예상 급여 및 지출 요약을 계산하여 반환합니다.
*   **액션 (Actions/Functions):**
    *   `addTag(tagData)`: 새 태그를 추가합니다.
    *   `updateTag(updatedTag)`: 기존 태그 정보를 업데이트합니다.
    *   `calculateWage(dateStr, start, end, tagId, restMinutes)`: 주어진 근무 시간과 태그 정보에 따라 임금을 계산합니다 (시간 구간별 계산 로직 적용).

### `src/stores/userStore.js`
*   **역할:** 현재 사용자 정보, 로그인/로그아웃, 서버 데이터 로드/저장 (모의 API 사용)을 관리합니다.
*   **상태 (State):**
    *   `currentUser` (ref): 현재 로그인된 사용자 이름.
    *   `isLoading` (ref): 데이터 로딩 중인지 여부.
*   **액션 (Actions/Functions):**
    *   `saveDataToServer()`: 현재 로그 및 태그 데이터를 서버에 저장합니다 (모의 API).
    *   `logout()`: 현재 사용자를 로그아웃하고 관련 데이터를 초기화합니다.
    *   `loadUser(username)`: 특정 사용자의 데이터를 서버에서 로드합니다 (모의 API).
*   **Watchers:**
    *   `attendanceLogs`, `tags`, `currentUser` 변경 시 `debouncedSave`를 호출하여 서버에 데이터를 저장합니다 (2000ms 디바운스).

### `src/stores/settingsStore.js`
*   **역할:** 애플리케이션의 전반적인 설정(예: 달력 표시 날짜) 및 사용자 데이터 가져오기/내보내기 기능을 관리합니다.
*   **상태 (State):**
    *   `viewedDate` (ref): 달력에서 현재 보고 있는 날짜.
*   **액션 (Actions/Functions):**
    *   `setViewedDate(date)`: 달력의 표시 날짜를 설정합니다.
    *   `importUserData(jsonData)`: JSON 데이터를 파싱하여 사용자 로그 및 태그 데이터를 가져옵니다.
    *   `exportUserData()`: 현재 사용자 로그 및 태그 데이터를 JSON 파일로 내보냅니다.

### `src/stores/attendance.js`
*   **역할:** 비어 있는 파일. 모든 로직이 다른 스토어로 이동되었습니다.

---

## 3. 유틸리티 및 서비스

### `src/utils/formatters.js`
*   **함수:**
    *   `formatCurrency(value)`: 숫자를 일본 엔화 형식으로 포맷합니다 (예: ¥1,234).

### `src/utils/helpers.js`
*   **함수:**
    *   `debounce(fn, delay)`: 함수 호출을 지정된 지연 시간 동안 디바운싱하는 헬퍼 함수.

### `src/router/index.js`
*   **역할:** Vue Router 설정을 정의합니다。
*   **경로:**
    *   `/` (home): `HomeView` 컴포넌트.
    *   `/about` (about): `AboutView` 컴포넌트 (지연 로드).

### `src/services/api.js`
*   **역할:** 실제 백엔드 API 호출을 시뮬레이션하는 모의 API 서비스. 로컬 스토리지를 사용하여 데이터를 저장하고 로드합니다.
*   **변수:**
    *   `MOCK_API_DELAY`: 모의 API 호출 지연 시간.
*   **함수:**
    *   `loadUserDataFromLocalStorage(username)`: 로컬 스토리지에서 사용자 데이터를 로드합니다.
    *   `saveUserDataToLocalStorage(username, data)`: 로컬 스토리지에 사용자 데이터를 저장합니다.
    *   `fetchData(username)`: 사용자 데이터를 비동기적으로 가져옵니다.
    *   `saveData(username, data)`: 사용자 데이터를 비동기적으로 저장합니다.
    *   `getUsers()`: 로컬 스토리지에서 사용자 목록을 가져옵니다.
    *   `addUser(username)`: 새 사용자를 사용자 목록에 추가합니다.

---

## 4. 기타 파일

### `src/main.js`
*   **역할:** Vue 애플리케이션의 진입점. Pinia, Vue Router, VCalendar를 설정하고 `App.vue`를 마운트합니다.

### `src/assets/main.css`, `src/assets/base.css`
*   **역할:** 전역 및 기본 스타일을 정의합니다. 폰트, 색상 팔레트, 반응형 미디어 쿼리 등을 포함합니다.

---
