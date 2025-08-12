export const formatCurrency = (value) => {
  if (typeof value !== 'number') {
    return '';
  }
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(value);
};

export const formatLogsForExport = (logs) => {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return logs
    .map((log) => {
      const startDate = new Date(log.date + 'T' + log.start);
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      const dayOfWeek = days[startDate.getDay()];
      return `${month}/${day}（${dayOfWeek}）${log.start} - ${log.end}`;
    })
    .join('\n');
};