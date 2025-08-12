export const formatCurrency = (value) => {
  if (typeof value !== 'number') {
    return '';
  }
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(value);
};

export const formatLogsForExport = (logs, tags) => {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const tagMap = tags.reduce((acc, tag) => {
    acc[tag.id] = tag.name;
    return acc;
  }, {});

  const groupedByTag = logs.reduce((acc, log) => {
    const tagName = tagMap[log.tagId] || '未分類';
    if (!acc[tagName]) {
      acc[tagName] = [];
    }
    acc[tagName].push(log);
    return acc;
  }, {});

  return Object.entries(groupedByTag)
    .map(([tagName, logs]) => {
      const header = `[職場: ${tagName}]`;
      const logLines = logs
        .map((log) => {
          const startDate = new Date(log.date + 'T' + log.start);
          const month = String(startDate.getMonth() + 1).padStart(2, '0');
          const day = String(startDate.getDate()).padStart(2, '0');
          const dayOfWeek = days[startDate.getDay()];
          return `${month}/${day}（${dayOfWeek}）${log.start} - ${log.end}`;
        })
        .join('\n');
      return `${header}\n${logLines}`;
    })
    .join('\n\n');
};