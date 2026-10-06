/* 制限時間なし・重複なしのランダム一問練習。 */
(function (root) {
  "use strict";

  function create(count, random = Math.random) {
    if (!Number.isInteger(count) || count < 1) throw new Error("Invalid question count");
    const order = Array.from({ length: count }, (_, i) => i);
    for (let i = count - 1; i > 0; i--) {
      const value = random();
      if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error("Invalid random value");
      const j = Math.floor(value * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return { order, cursor: 0, selected: null, correct: 0, phase: "question" };
  }

  function answer(session, choice, correctChoice) {
    if (session.phase !== "question" || !Number.isInteger(choice) || !Number.isInteger(correctChoice)) return false;
    session.selected = choice;
    session.correct += Number(choice === correctChoice);
    session.phase = "explanation";
    return true;
  }

  function next(session) {
    if (session.phase !== "explanation") return false;
    session.cursor++;
    session.selected = null;
    session.phase = session.cursor === session.order.length ? "done" : "question";
    return true;
  }

  function select(pool, options) {
    const { subject = "all", excludeCalculation = false, bookmarkedOnly = false, bookmarks = new Set() } = options;
    return pool.filter(q => (subject === "all" || q.meta.subject.toLowerCase() === subject)
      && (!excludeCalculation || !q.meta.calculation)
      && (!bookmarkedOnly || bookmarks.has(q.meta.key)));
  }

  const api = { create, answer, next, select };
  root.FE_MOCK_PRACTICE_STATE = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
