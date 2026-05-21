/**
 * Adaptive Learning Engine for ontap-lop3
 * Browser-safe, no external dependency, no API key.
 * Works with question schema: { q, choices, a, hint, difficulty, ... }.
 */

const ENGINE_VERSION = '1.0.0';

const STORAGE_KEY = 'ontap_learning_state_v1';
const SESSION_KEY = 'ontap_session_guard_v1';

const CURRICULUM = {
  grade2_vn_math: {
    toan_so: ['Đọc, viết, so sánh số trong phạm vi 100000', 'Cấu tạo số', 'Dãy số'],
    toan_cong: ['Cộng trong phạm vi 100000', 'Tính nhẩm', 'Tìm thành phần chưa biết'],
    toan_tru: ['Trừ trong phạm vi 100000', 'Bài toán nhiều bước', 'Tìm thành phần chưa biết'],
    toan_nhan: ['Bảng nhân', 'Nhân số có 2-3 chữ số với số có 1 chữ số', 'Tính giá trị biểu thức'],
    toan_chia: ['Bảng chia', 'Chia hết/chia có dư', 'Tìm thành phần chưa biết'],
    toan_dovi: ['Độ dài, khối lượng, thời gian, tiền Việt Nam', 'Đổi đơn vị đơn giản'],
    toan_hinh: ['Điểm, đoạn thẳng, góc, chu vi, diện tích hình chữ nhật/hình vuông'],
    toan_loivan: ['Bài toán có lời văn 1-2 bước', 'Gấp lên/giảm đi', 'So sánh hơn kém'],
    toan_tuyduy: ['Quy luật dãy số', 'Suy luận logic', 'Bài toán năng lực']
  }
};

function loadLearningState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || createEmptyState();
  } catch {
    return createEmptyState();
  }
}

function saveLearningState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createEmptyState() {
  return {
    version: ENGINE_VERSION,
    learners: {},
    analytics: { events: [] }
  };
}

function getLearner(state, learnerId = 'default') {
  if (!state.learners[learnerId]) {
    state.learners[learnerId] = {
      id: learnerId,
      createdAt: Date.now(),
      mastery: {},
      questionStats: {},
      topicStats: {},
      recentQuestionIds: [],
      streak: 0,
      antiCheat: { suspiciousEvents: 0, lastEvents: [] }
    };
  }
  return state.learners[learnerId];
}

function stableQuestionId(subjectId, topicId, question, index = 0) {
  const raw = `${subjectId}|${topicId}|${question.q}|${index}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  return `${topicId}_${Math.abs(hash)}`;
}

function normalizeQuestionBank(db) {
  const copy = (typeof structuredClone === 'function') ? structuredClone(db) : JSON.parse(JSON.stringify(db));
  for (const subject of copy.subjects || []) {
    for (const topic of subject.topics || []) {
      const curriculumTags = CURRICULUM.grade2_vn_math[topic.id] || [];
      topic.curriculum = {
        grade: subject.id === 'toan' ? 2 : null,
        framework: subject.id === 'toan' ? 'VN-Grade2-Competency' : 'General-Primary',
        tags: curriculumTags
      };
      topic.questions = (topic.questions || []).map((q, idx) => ({
        id: q.id || stableQuestionId(subject.id, topic.id, q, idx),
        skill: q.skill || inferSkill(topic.id, q.q),
        difficulty: normalizeDifficulty(q.difficulty, q.q),
        adaptive: q.adaptive || {
          targetAccuracy: 0.75,
          estimatedSeconds: estimateSeconds(q),
          reviewIntervalDays: 1
        },
        ...q
      }));
    }
  }
  copy.engine = { recommended: ENGINE_VERSION, supports: ['adaptive', 'spaced-repetition', 'mastery', 'analytics', 'anti-cheat', 'generated-questions'] };
  return copy;
}

function normalizeDifficulty(d, text = '') {
  let v = Number(d || 1);
  if (/tìm số|□|biết rằng|lớn nhất|bé nhất|nhiều bước|suy luận|vì sao/i.test(text)) v = Math.max(v, 3);
  if (/\+|\-|×|÷/.test(text) && text.length > 45) v = Math.max(v, 2);
  return Math.min(5, Math.max(1, v));
}

function inferSkill(topicId, text = '') {
  if (/so sánh|lớn hơn|bé hơn|>|<|=/.test(text)) return 'compare';
  if (/liền trước|liền sau|dãy|viết tiếp/.test(text)) return 'sequence';
  if (/□|\? =|= \?/.test(text)) return 'unknown-number';
  if (/chu vi|diện tích|hình/.test(text)) return 'geometry';
  if (/cm|km|kg|g|giờ|phút|đồng/.test(text)) return 'measurement';
  if (/tất cả|còn lại|hơn|kém|mỗi|bao nhiêu/.test(text)) return 'word-problem';
  return topicId.replace(/^toan_/, 'math-');
}

function estimateSeconds(q) {
  const len = (q.q || '').length;
  const d = Number(q.difficulty || 1);
  return Math.min(120, 12 + d * 10 + Math.floor(len / 8));
}

function selectNextQuestion({ db, learnerId = 'default', subjectId = 'toan', topicId = null, count = 1 }) {
  const state = loadLearningState();
  const learner = getLearner(state, learnerId);
  const pool = flattenQuestions(db, subjectId, topicId).filter(item => !learner.recentQuestionIds.includes(item.id));
  const now = Date.now();
  const scored = pool.map(item => ({ item, score: scoreQuestion(item, learner, now) }));
  scored.sort((a, b) => b.score - a.score);
  const selected = diversify(scored.map(x => x.item), count);
  saveLearningState(state);
  return count === 1 ? selected[0] : selected;
}

function flattenQuestions(db, subjectId, topicId) {
  const out = [];
  for (const subject of db.subjects || []) {
    if (subjectId && subject.id !== subjectId) continue;
    for (const topic of subject.topics || []) {
      if (topicId && topic.id !== topicId) continue;
      (topic.questions || []).forEach((q, idx) => out.push({ ...q, subjectId: subject.id, topicId: topic.id, id: q.id || stableQuestionId(subject.id, topic.id, q, idx) }));
    }
  }
  return out;
}

function scoreQuestion(item, learner, now) {
  const qStat = learner.questionStats[item.id] || {};
  const tStat = learner.topicStats[item.topicId] || { accuracy: 0.5, attempts: 0 };
  const mastery = learner.mastery[item.topicId] || 0;
  const dueBonus = !qStat.nextReviewAt || qStat.nextReviewAt <= now ? 2 : -2;
  const weaknessBonus = (1 - tStat.accuracy) * 2.5;
  const targetDifficulty = mastery < 0.35 ? 1 : mastery < 0.7 ? 2 : 3;
  const difficultyFit = 1.5 - Math.abs((item.difficulty || 1) - targetDifficulty) * 0.45;
  const novelty = qStat.attempts ? -0.35 * qStat.attempts : 0.8;
  return dueBonus + weaknessBonus + difficultyFit + novelty + Math.random() * 0.25;
}

function diversify(items, count) {
  const picked = [];
  const usedSkills = new Set();
  for (const item of items) {
    if (picked.length >= count) break;
    if (!usedSkills.has(item.skill) || picked.length > count / 2) {
      picked.push(item);
      usedSkills.add(item.skill);
    }
  }
  return picked;
}

function recordAnswer({ learnerId = 'default', question, selectedIndex, startedAt, usedHint = false, visibilityChanges = 0 }) {
  const state = loadLearningState();
  const learner = getLearner(state, learnerId);
  const now = Date.now();
  const elapsedMs = Math.max(0, now - (startedAt || now));
  const correct = selectedIndex === question.a;
  const cheat = detectSuspicion({ question, elapsedMs, usedHint, visibilityChanges, selectedIndex });

  updateQuestionStats(learner, question, correct, elapsedMs, usedHint, now);
  updateTopicStats(learner, question.topicId, correct, elapsedMs);
  updateMastery(learner, question.topicId, correct, question.difficulty || 1, usedHint, cheat.suspicious);
  updateRecent(learner, question.id);
  updateAntiCheat(learner, cheat, now);

  state.analytics.events.push({
    type: 'answer', at: now, learnerId, questionId: question.id, topicId: question.topicId,
    correct, selectedIndex, elapsedMs, usedHint, suspicious: cheat.suspicious, reasons: cheat.reasons
  });
  state.analytics.events = state.analytics.events.slice(-1000);
  saveLearningState(state);
  return { correct, cheat, mastery: learner.mastery[question.topicId], nextReviewAt: learner.questionStats[question.id].nextReviewAt };
}

function updateQuestionStats(learner, question, correct, elapsedMs, usedHint, now) {
  const stat = learner.questionStats[question.id] || { attempts: 0, correct: 0, wrong: 0, ease: 2.3, intervalDays: 0 };
  stat.attempts++;
  stat.correct += correct ? 1 : 0;
  stat.wrong += correct ? 0 : 1;
  stat.lastElapsedMs = elapsedMs;
  stat.lastAnsweredAt = now;
  const quality = correct ? (usedHint ? 3 : 4) : 1;
  stat.ease = Math.max(1.3, stat.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  stat.intervalDays = !correct ? 0.04 : stat.intervalDays <= 0.05 ? 1 : Math.round(stat.intervalDays * stat.ease);
  stat.nextReviewAt = now + stat.intervalDays * 24 * 60 * 60 * 1000;
  learner.questionStats[question.id] = stat;
}

function updateTopicStats(learner, topicId, correct, elapsedMs) {
  const s = learner.topicStats[topicId] || { attempts: 0, correct: 0, accuracy: 0.5, avgMs: 0 };
  s.attempts++;
  s.correct += correct ? 1 : 0;
  s.accuracy = s.correct / s.attempts;
  s.avgMs = s.avgMs ? Math.round(s.avgMs * 0.8 + elapsedMs * 0.2) : elapsedMs;
  learner.topicStats[topicId] = s;
}

function updateMastery(learner, topicId, correct, difficulty, usedHint, suspicious) {
  const old = learner.mastery[topicId] ?? 0.25;
  const gain = correct ? 0.035 * difficulty * (usedHint ? 0.55 : 1) * (suspicious ? 0.25 : 1) : -0.045;
  learner.mastery[topicId] = Math.max(0, Math.min(1, old + gain));
}

function updateRecent(learner, questionId) {
  learner.recentQuestionIds.unshift(questionId);
  learner.recentQuestionIds = [...new Set(learner.recentQuestionIds)].slice(0, 40);
}

function detectSuspicion({ question, elapsedMs, usedHint, visibilityChanges = 0, selectedIndex }) {
  const reasons = [];
  if (elapsedMs < 700 && !usedHint) reasons.push('answer-too-fast');
  if (visibilityChanges >= 2) reasons.push('tab-switching');
  if (selectedIndex == null || selectedIndex < 0) reasons.push('invalid-answer');
  if ((question?.difficulty || 1) >= 3 && elapsedMs < 1200) reasons.push('hard-question-too-fast');
  return { suspicious: reasons.length > 0, reasons };
}

function updateAntiCheat(learner, cheat, now) {
  if (cheat.suspicious) learner.antiCheat.suspiciousEvents++;
  learner.antiCheat.lastEvents.unshift({ at: now, ...cheat });
  learner.antiCheat.lastEvents = learner.antiCheat.lastEvents.slice(0, 30);
}

function getAnalyticsSummary(learnerId = 'default') {
  const state = loadLearningState();
  const learner = getLearner(state, learnerId);
  const topics = Object.entries(learner.topicStats).map(([topicId, s]) => ({
    topicId, attempts: s.attempts, accuracy: Math.round(s.accuracy * 100), avgSeconds: Math.round((s.avgMs || 0) / 1000), mastery: Math.round((learner.mastery[topicId] || 0) * 100)
  })).sort((a, b) => a.mastery - b.mastery);
  return {
    learnerId,
    totalAttempts: topics.reduce((n, t) => n + t.attempts, 0),
    weakestTopics: topics.slice(0, 3),
    strongestTopics: [...topics].sort((a, b) => b.mastery - a.mastery).slice(0, 3),
    suspiciousEvents: learner.antiCheat.suspiciousEvents,
    topics
  };
}

function generateQuestion({ topicId, difficulty = 1, seed = Date.now() }) {
  const rnd = mulberry32(seed);
  if (topicId === 'toan_cong') return generateAddition(difficulty, rnd);
  if (topicId === 'toan_tru') return generateSubtraction(difficulty, rnd);
  if (topicId === 'toan_nhan') return generateMultiplication(difficulty, rnd);
  if (topicId === 'toan_chia') return generateDivision(difficulty, rnd);
  if (topicId === 'toan_so') return generatePlaceValue(difficulty, rnd);
  return generateAddition(difficulty, rnd);
}

function withChoices(answer, distractors, q, hint, difficulty, skill) {
  const choices = [...new Set([answer, ...distractors].map(String))].slice(0, 4);
  while (choices.length < 4) choices.push(String(Number(answer) + choices.length + 1));
  shuffle(choices);
  return { id: `gen_${Date.now()}_${Math.floor(Math.random() * 99999)}`, q, choices, a: choices.indexOf(String(answer)), hint, difficulty, skill, generated: true };
}

function generateAddition(d, rnd) {
  const max = d <= 1 ? 99 : d === 2 ? 500 : 999;
  const a = randInt(rnd, 10, max), b = randInt(rnd, 10, max);
  const ans = a + b;
  return withChoices(ans, [ans + 1, ans - 1, ans + 10, ans - 10], `${a} + ${b} = ?`, 'Cộng theo từng hàng: đơn vị, chục, rồi trăm.', d, 'addition');
}

function generateSubtraction(d, rnd) {
  const a = randInt(rnd, d <= 1 ? 30 : 100, d <= 1 ? 99 : 999);
  const b = randInt(rnd, 10, a - 1);
  const ans = a - b;
  return withChoices(ans, [ans + 1, ans - 1, ans + 10, Math.max(0, ans - 10)], `${a} - ${b} = ?`, 'Trừ theo từng hàng, nhớ kiểm tra bước mượn nếu cần.', d, 'subtraction');
}

function generateMultiplication(d, rnd) {
  const a = randInt(rnd, 2, d <= 1 ? 5 : 9);
  const b = randInt(rnd, 2, d <= 2 ? 10 : 99);
  const ans = a * b;
  return withChoices(ans, [ans + a, ans - a, ans + b, ans - b], `${a} × ${b} = ?`, 'Có thể tách một thừa số thành chục và đơn vị để nhân.', d, 'multiplication');
}

function generateDivision(d, rnd) {
  const divisor = randInt(rnd, 2, d <= 1 ? 5 : 9);
  const quotient = randInt(rnd, 2, d <= 2 ? 10 : 30);
  const dividend = divisor * quotient;
  return withChoices(quotient, [quotient + 1, quotient - 1, quotient + divisor, Math.max(1, quotient - divisor)], `${dividend} ÷ ${divisor} = ?`, 'Tìm số nhân với số chia để được số bị chia.', d, 'division');
}

function generatePlaceValue(d, rnd) {
  const n = randInt(rnd, 100, d <= 2 ? 999 : 9999);
  const digits = String(n).split('').map(Number);
  const pos = randInt(rnd, 0, digits.length - 1);
  const names = ['nghìn', 'trăm', 'chục', 'đơn vị'].slice(-digits.length);
  const ans = digits[pos];
  return withChoices(ans, [digits[(pos + 1) % digits.length], (ans + 1) % 10, Math.max(0, ans - 1)], `Số ${n} có chữ số hàng ${names[pos]} là?`, 'Xác định vị trí của chữ số trước khi chọn đáp án.', d, 'place-value');
}

function randInt(rnd, min, max) { return Math.floor(rnd() * (max - min + 1)) + min; }
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } }
function mulberry32(a) { return function() { let t = a += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function installSessionGuard(onChange) {
  let visibilityChanges = 0;
  const startedAt = Date.now();
  const handler = () => {
    if (document.hidden) visibilityChanges++;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ startedAt, visibilityChanges }));
    onChange?.({ startedAt, visibilityChanges });
  };
  document.addEventListener('visibilitychange', handler);
  return {
    get: () => ({ startedAt, visibilityChanges }),
    cleanup: () => document.removeEventListener('visibilitychange', handler)
  };
}


// Browser global export for non-module websites
window.LearningEngine = {
  ENGINE_VERSION,
  CURRICULUM,
  loadLearningState,
  saveLearningState,
  createEmptyState,
  getLearner,
  stableQuestionId,
  normalizeQuestionBank,
  selectNextQuestion,
  recordAnswer,
  detectSuspicion,
  getAnalyticsSummary,
  generateQuestion,
  installSessionGuard
};
