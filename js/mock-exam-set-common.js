/* 第2回・第3回の独自問題をCBT画面用の形式に整える。 */
window.FE_MOCK_NEW_QUESTION = (field, q, c, a, reasons, extra = {}) => {
  if (!field || !q || c.length !== 4 || reasons.length !== 4 || a < 0 || a > 3 ||
      new Set(c).size !== 4 || reasons.some(reason => !reason)) {
    throw new Error("模試問題の選択肢または解説が不完全です: " + q);
  }
  return { field, q, c, a, reasons, e: reasons[a], ...extra };
};
window.FE_MOCK_FINALIZE_SET = setId => {
  const data = window.FE_MOCK_EXAM;
  if (data.a.length !== 60 || data.b.length !== 20) throw new Error("第" + setId + "回の問題数が不正です。");
  for (const subject of ["a", "b"]) {
    data[subject].forEach((q, i) => {
      const shift = i % q.c.length;
      q.c = q.c.slice(-shift).concat(q.c.slice(0, -shift));
      q.reasons = q.reasons.slice(-shift).concat(q.reasons.slice(0, -shift));
      q.a = (q.a + shift) % q.c.length;
      q.e = q.reasons[q.a];
    });
  }
  window.FE_MOCK_SET_ID = setId;
};
