/* 科目ごとのCBT模試進行状態。日時はミリ秒単位の絶対時刻で保持する。 */
(function (root) {
  "use strict";
  const config = { a: { count: 60, duration: 90 * 60 * 1000 }, b: { count: 20, duration: 100 * 60 * 1000 } };

  function create(subject, now) {
    if (!config[subject] || !Number.isFinite(now)) throw new Error("Invalid session");
    return {
      version: 1,
      subject: subject,
      phase: "active",
      startedAt: now,
      deadline: now + config[subject].duration,
      endedAt: null,
      endReason: null,
      answers: Array(config[subject].count).fill(null),
      flags: Array(config[subject].count).fill(false),
      current: 0
    };
  }
  function valid(s) {
    if (!s || s.version !== 1 || !config[s.subject] || !["active", "done"].includes(s.phase)) return false;
    const count = config[s.subject].count;
    if (!Number.isFinite(s.startedAt) || !Number.isFinite(s.deadline) || s.deadline <= s.startedAt) return false;
    if (!Array.isArray(s.answers) || s.answers.length !== count || !Array.isArray(s.flags) || s.flags.length !== count) return false;
    if (!Number.isInteger(s.current) || s.current < 0 || s.current >= count) return false;
    if (s.answers.some(v => v !== null && (!Number.isInteger(v) || v < 0 || v > 6))) return false;
    if (s.flags.some(v => typeof v !== "boolean")) return false;
    if (s.phase === "done" && !Number.isFinite(s.endedAt)) return false;
    return true;
  }
  function advance(s, now) {
    if (s.phase !== "active" || now < s.deadline) return false;
    s.phase = "done";
    s.endedAt = s.deadline;
    s.endReason = "time";
    return true;
  }
  function submit(s, now) {
    if (advance(s, now) || s.phase !== "active") return false;
    s.phase = "done";
    s.endedAt = now;
    s.endReason = "manual";
    return true;
  }
  function summary(s) {
    return {
      total: config[s.subject].count,
      answered: s.answers.filter(v => v !== null).length,
      unanswered: s.answers.filter(v => v === null).length,
      flagged: s.flags.filter(Boolean).length
    };
  }
  const api = { create: create, valid: valid, advance: advance, submit: submit, summary: summary, config: config };
  root.FE_MOCK_STATE = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
