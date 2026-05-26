(() => {
  const root = (window.GenIA = window.GenIA || {});

  const extractUrlsFromText = (text) => {
    if (!text) return [];
    return [...new Set((String(text).match(/https?:\/\/[^\s)]+/g) || []))];
  };

  const groupBy = (items, iteratee) => {
    const map = new Map();
    items.forEach((item) => {
      const key = iteratee(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return map;
  };

  const getMostUsedValue = (items, key) => {
    const counts = new Map();
    let winner = "";
    let max = 0;

    items.forEach((item) => {
      const value = item?.[key];
      if (!value) return;
      const next = (counts.get(value) || 0) + 1;
      counts.set(value, next);
      if (next > max) {
        max = next;
        winner = value;
      }
    });

    return winner;
  };

  const formatDateTime = (value) => {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("pt-BR");
  };

  const normalizeText = (value) => String(value || "").trim();

  root.utils = {
    extractUrlsFromText,
    groupBy,
    getMostUsedValue,
    formatDateTime,
    normalizeText,
  };
})();

