// In câu mẫu của bộ sinh B1–B3 để Codex rà: node tools/gen_samples.js > docs/mau-sinh-b1b3.md
const G = require('../js/gen-b1b3.js');
const NAME = {
  doc: 'Đọc số', viet: 'Viết số từ cách đọc', gom: 'Cấu tạo số (gồm … trăm … chục … đơn vị)', tong: 'Viết số thành tổng',
  gop: 'Gộp tổng thành số', dau: 'Điền dấu >, <, =', max: 'Số lớn nhất', min: 'Số bé nhất', xeptang: 'Xếp bé → lớn',
  xepgiam: 'Xếp lớn → bé', sau: 'Số liền sau', truoc: 'Số liền trước', cong: 'Cộng trong 1000', tru: 'Trừ trong 1000',
  timsh: 'Tìm số hạng', timsbt: 'Tìm số bị trừ', timst: 'Tìm số trừ', lv: 'Bài toán một bước (cộng, trừ)'
};
const out = ['# Câu mẫu bộ sinh B1–B3 (tự sinh bởi tools/gen_samples.js, seed cố định "mau-codex-v1")', '',
  'Bộ sinh `js/gen-b1b3.js` **chưa nạp vào web**. Mỗi mẫu 5 câu. Đáp án đúng in **đậm**; sau mỗi nhiễu là tên lỗi sinh ra nó.', ''];
for (const t of Object.keys(G.T)) {
  const T = G.T[t];
  out.push('## ' + NAME[t] + ' — `' + t + '` · skill `' + T.skill + '` · B' + T.lesson, '');
  for (const q of G.pick('mau-codex-v1|' + t, 5, { templates: [t] })) {
    const ex = G.explain(q.id);
    const wrong = q.choices.filter((_, i) => i !== q.a);
    const ch = q.choices.map((c, i) => i === q.a ? '**' + c + '**' : c + (ex.why ? ' _(' + ex.why[wrong.indexOf(c)] + ')_' : '')).join(' · ');
    out.push('- `' + q.id + '` [độ khó ' + q.difficulty + '] ' + q.q + '  ', '  ' + ch + '  ', '  _Gợi ý:_ ' + q.hint);
  }
  out.push('');
}
console.log(out.join('\n'));
