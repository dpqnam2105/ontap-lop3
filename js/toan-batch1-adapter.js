(function () {
'use strict';
/**
 * Adapter nối bộ sinh batch 1 vào kho câu hỏi của app.
 *
 *   augment(subjects, gradeId, opts)                  — nạp kho mẫu cố định (60 + 60 câu)
 *   ensureIds(subjects, ids, opts)                    — dựng bổ sung theo danh sách ID
 *   ensureFromHistory(subjects, wrongHistory, reviewMap, opts)
 *                                                     — dựng lại câu sai / câu đến hạn ôn
 *   idsFromHistory(wrongHistory, reviewMap)           — chỉ gom ID, không đụng kho
 *
 * Gọi TRƯỚC normalizeQuestionBank với kho mẫu. Với câu khôi phục giữa phiên (lúc kho đã
 * chuẩn hóa xong), truyền opts.normalize để áp đúng bước chuẩn hóa như kho thường:
 *     ensureFromHistory(subjects, wrong, review, { normalize: (q) => normalizeQuestion(q) })
 *
 * Mọi hàm idempotent. Trả về:
 *     { added, present, unresolvedIds, topics }
 *   added         — số câu thực sự thêm lần này
 *   present       — số ID yêu cầu nhưng đã có sẵn trong kho
 *   unresolvedIds — ID trông như của batch này nhưng KHÔNG dựng lại được
 *                   (sai phiên bản, ID không chuẩn, tham số ngoài phạm vi, thiếu nhiễu).
 *                   Giao diện: còn phần tử ⇒ không được báo "con không còn câu sai";
 *                   chỉ báo "Một số câu ôn chưa tải được", không hiện lỗi kỹ thuật cho bé.
 */

const isNode = typeof module !== 'undefined' && !!module.exports;
const GEN = isNode ? require('./toan-batch1.js') : window.ToanBatch1;
let ID_LISTS = isNode ? require('../data-lop3/toan/toan-batch1-ids.json') : null;
function configure(lists) {
  if (!lists || lists.version !== GEN.VERSION || !Array.isArray(lists.topics) || lists.topics.length !== 2) throw new Error('Invalid batch 1 manifest');
  const all = lists.topics.flatMap(t => t.ids || []);
  if (all.length !== 120 || new Set(all).size !== 120 || !lists.topics.every(t => typeof t.topicId === 'string' && typeof t.title === 'string' && t.ids.length === 60 && ['chia-co-du', 'day-so-cach-deu'].includes(t.unit)) || !all.every(id => isBatchId(id))) throw new Error('Invalid batch 1 IDs');
  ID_LISTS = lists;
}

const GRADE_ID = 'lop3';
const SUBJECT_ID = 'toan';

/** ID đúng cấu trúc và đúng phiên bản của batch này. */
function isBatchId(id) {
  try { GEN.parseId(id); return true; } catch (e) { return false; }
}

/** ID "trông như" của batch này (kể cả sai phiên bản hay không chuẩn) — để báo chưa tải được. */
function looksLikeBatchId(id) {
  return typeof id === 'string' && /^toan_[a-z0-9-]+_bo-tro-v/.test(id);
}

function safeBuild(id) {
  try { return GEN.generateFromId(id); } catch (e) { return null; }
}

function findSubject(subjects) {
  if (!Array.isArray(subjects)) return null;
  return subjects.find((s) => s && (s.id === SUBJECT_ID || s.subjectId === SUBJECT_ID)) || null;
}

function ensureTopic(subject, meta) {
  if (!Array.isArray(subject.topics)) subject.topics = [];
  let topic = subject.topics.find((t) => t && (t.id === meta.topicId || t.topicId === meta.topicId));
  if (!topic) {
    // giao diện đọc topic.name — bước chuẩn hóa không tự chuyển title → name
    topic = { id: meta.topicId, name: meta.title, title: meta.title, unit: meta.unit, source: GEN.SOURCE, questions: [] };
    subject.topics.push(topic);
  }
  if (!Array.isArray(topic.questions)) topic.questions = [];
  return topic;
}

/** Chủ đề đích theo unit của câu, không theo thứ tự mảng. */
function topicMetaFor(question) {
  return ID_LISTS.topics.find((t) => t.unit === question.unit) || null;
}

const emptyResult = () => ({ added: 0, present: 0, unresolvedIds: [], topics: [] });

/** Kiểm tối thiểu trước khi chèn: đúng ID, có đề, có lựa chọn hợp lệ, đáp án nằm trong mảng. */
function hopLe(q, id) {
  if (!q || typeof q !== 'object') return false;
  if (q.id !== id) return false;
  if (typeof q.q !== 'string' || q.q.trim() === '') return false;
  if (!Array.isArray(q.choices) || q.choices.length < 2) return false;
  if (!q.choices.every((c) => typeof c === 'string' && c.trim() !== '')) return false;
  if (new Set(q.choices).size !== q.choices.length) return false;
  if (!Number.isInteger(q.a) || q.a < 0 || q.a >= q.choices.length) return false;
  return true;
}

function addIds(subject, ids, opts) {
  const res = emptyResult();
  const touched = new Set();
  const normalize = opts && typeof opts.normalize === 'function' ? opts.normalize : null;
  for (const id of ids) {
    if (typeof id !== 'string' || !id) continue;
    if (!isBatchId(id)) {
      if (looksLikeBatchId(id)) res.unresolvedIds.push(id);
      continue;
    }
    const built = safeBuild(id);
    if (!built) { res.unresolvedIds.push(id); continue; }
    const meta = topicMetaFor(built);
    if (!meta) { res.unresolvedIds.push(id); continue; }
    const topic = ensureTopic(subject, meta);
    if (topic.questions.some((q) => q && q.id === id)) { res.present++; continue; }
    let q = built;
    if (normalize) {
      // chuẩn hóa có thể ném lỗi: bắt theo TỪNG ID, không để hỏng cả lượt khôi phục
      try { q = normalize(built); } catch (e) { res.unresolvedIds.push(id); continue; }
    }
    if (!hopLe(q, id)) { res.unresolvedIds.push(id); continue; }
    topic.questions.push(q);
    res.added++;
    touched.add(topic.id);
  }
  res.topics = Array.from(touched);
  return res;
}

/** Nạp kho mẫu cố định cho lớp 3: hai chủ đề, 60 câu mỗi chủ đề. */
function augment(subjects, gradeId, opts) {
  if (gradeId && gradeId !== GRADE_ID) return emptyResult();
  const subject = findSubject(subjects);
  if (!subject) return emptyResult();
  const ids = [];
  for (const meta of ID_LISTS.topics) { ensureTopic(subject, meta); ids.push(...meta.ids); }
  return addIds(subject, ids, opts);
}

/** Dựng các ID còn thiếu (kể cả ID ngoài kho mẫu) và thêm vào đúng chủ đề. */
function ensureIds(subjects, ids, opts) {
  const subject = findSubject(subjects);
  if (!subject || !ids) return emptyResult();
  return addIds(subject, Array.isArray(ids) ? ids : [ids], opts);
}

/**
 * Gom ID từ ĐÚNG hai nguồn của hồ sơ đang chọn — truyền thẳng kết quả của
 * Storage.getWrongHistory() và Storage.getReviewMap(), không truyền cả localStorage.
 * Nhận: mảng chuỗi, mảng object có .id/.qid/.questionId, hoặc object lấy ID làm khoá.
 */
function idsFromHistory(wrongHistory, reviewMap) {
  const out = new Set();
  const nhan = (v) => {
    if (typeof v === 'string') { if (looksLikeBatchId(v)) out.add(v); return; }
    if (v && typeof v === 'object') {
      for (const k of ['id', 'qid', 'questionId'])
        if (looksLikeBatchId(v[k])) out.add(v[k]);
    }
  };
  for (const nguon of [wrongHistory, reviewMap]) {
    if (!nguon) continue;
    if (Array.isArray(nguon)) nguon.forEach(nhan);
    else if (typeof nguon === 'object') {
      for (const k of Object.keys(nguon)) { if (looksLikeBatchId(k)) out.add(k); nhan(nguon[k]); }
    } else nhan(nguon);
  }
  return Array.from(out);
}

function ensureFromHistory(subjects, wrongHistory, reviewMap, opts) {
  return ensureIds(subjects, idsFromHistory(wrongHistory, reviewMap), opts);
}

const exported = {
  augment, ensureIds, ensureFromHistory, idsFromHistory, isBatchId, looksLikeBatchId,
  configure, get ID_LISTS() { return ID_LISTS; }, GRADE_ID, SUBJECT_ID, VERSION: GEN.VERSION
};
if (isNode) module.exports = exported;
else window.ToanBatch1Adapter = exported;

})();
