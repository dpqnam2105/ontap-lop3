#!/usr/bin/env python3
"""Vòng 9 (2026-10-07): ghi lesson theo bằng chứng TRANG SÁCH (SGK Toán 3 KNTT tập một, Nam gửi PDF) — Codex duyệt.

basis: trang-sach = đã xem trang làm căn cứ; note nói rõ trùng đề / cùng dạng / mở rộng dữ kiện.
       suy-luan  = vận dụng điều có trên trang sang trường hợp khác.
       nen       = không gắn bài: kiến thức nền (lớp 2), sách tập một không ôn lại — chỉ ghi lessonRef, KHÔNG có lesson.
Chạy lại không đổi gì thêm. Giữ id, thứ tự, source.
"""
import json, os, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
D = os.path.join(ROOT, 'data-lop3', 'toan')
DATE = '2026-10-07'
files, changes = {}, []

def qs(t):
    if t not in files: files[t] = json.load(open(os.path.join(D, t + '.json'), encoding='utf-8'))
    return files[t]['topic']['questions']

def get(t, n):
    hit = [q for q in qs(t) if q['id'] == 'toan_%s_%s' % (t, n)]
    if len(hit) != 1: sys.exit('không thấy toan_%s_%s' % (t, n))
    return hit[0]

def ref(basis, note):
    return {'basis': basis, 'note': note, 'by': 'claude', 'approvedBy': 'codex', 'date': DATE}

def lesson(t, n, no, basis, note, allow_change=False):
    q = get(t, n)
    L = {'book': 'kntt-toan3', 'vol': 1, 'no': no}
    old = q.get('lesson')
    if old and old != L and not allow_change: sys.exit('%s đã có lesson %r khác B%d' % (q['id'], old, no))
    r = ref(basis, note)
    if old == L and q.get('lessonRef', {}).get('basis') == basis and q['lessonRef'].get('note') == note: return
    q['lesson'] = L
    if q.get('lessonRef') and q['lessonRef'].get('basis') != basis:
        r['upgradedFrom'] = q['lessonRef'].get('basis')
    q['lessonRef'] = r
    changes.append('%s → B%d (%s)' % (q['id'], no, basis))

def nen(t, n, note):
    q = get(t, n)
    if q.get('lesson'): sys.exit('%s đang có lesson' % q['id'])
    r = ref('nen', note)
    if q.get('lessonRef', {}).get('note') == note: return
    q['lessonRef'] = r
    changes.append('%s → không gắn bài (nen)' % q['id'])

def hint(t, n, old, new, note):
    q = get(t, n)
    if q.get('hint') == new: return
    if q.get('hint') != old: sys.exit('%s.hint đang là %r' % (q['id'], q.get('hint')))
    q['hint'] = new
    q.setdefault('review', []).append({'by': 'claude', 'date': DATE, 'status': 'sua-goi-y', 'note': note})
    changes.append('%s: gợi ý — %s' % (q['id'], note))

BN, PS = 'bang-nhan-chia', 'phan-so-don-gian'
T32 = 'B10 tr.32 bài 4a: hoạt động so sánh hai tích đổi chỗ (7 × 2 ? 2 × 7). Không ghi là lần đầu dạy tính chất (tr.18, tr.29 đã có cặp đổi chỗ trong bài tìm phép tính cùng kết quả)'
# 1. Đổi chỗ thừa số
for n, how in [('q008', 'đổi về 4 × 9 (bảng 4)'), ('q039', 'đổi về 6 × 8 (bảng 6)'), ('q076', 'đổi về 7 × 9 (bảng 7)')]:
    lesson(BN, n, 10, 'trang-sach', 'gợi ý ' + how + '. ' + T32)
lesson(BN, 'q107', 10, 'trang-sach', 'cùng dạng: chọn hai tích đổi chỗ có cùng kết quả. ' + T32)
lesson(BN, 'q109', 10, 'trang-sach', 'cùng dạng: tích bằng tích đổi chỗ. ' + T32)
hint(BN, 'q038', 'Đổi chỗ hai thừa số, kết quả không đổi.', 'Dùng bảng nhân 3 hoặc đếm thêm 3 sáu lần.', 'có sẵn trong bảng nhân 3, không cần đổi chỗ')
lesson(BN, 'q038', 5, 'trang-sach', 'B5 tr.16: 3 × 6 có trong bảng nhân 3 (cùng dạng)')
hint(BN, 'q075', 'Đổi chỗ hai thừa số, kết quả không đổi.', 'Dùng bảng nhân 5 hoặc đếm thêm 5 bảy lần.', 'có sẵn trong bảng nhân 5, không cần đổi chỗ')
lesson(BN, 'q075', 4, 'trang-sach', 'B4 tr.15: 5 × 7 có trong bảng nhân 5 (cùng dạng)')
# 2. Quan hệ nhân–chia
lesson(BN, 'q058', 9, 'trang-sach', 'B9 tr.29 hoạt động 1c: 6 × 5 → 30 : 6, 30 : 5 (chia cho thừa số kia) — cùng dạng')
lesson(BN, 'q095', 9, 'suy-luan', 'vận dụng quan hệ ở B9 tr.29 bài 1c sang một tích cho sẵn (7 × 9 = 63); không cần tự nhớ bảng 7; không phải câu tương ứng trực tiếp trên trang')
# 3. Tìm thành phần
B8 = 'B8 tr.26 bài 4a có ô trống 4 × ? = 8, 12 : ? = 3, 3 × ? = 18, 25 : ? = 5 (trước B13) — cùng dạng'
hint(BN, 'q018', 'Chia 36 cho 4 để tìm thừa số còn thiếu.', 'Trong bảng nhân 4, 4 nhân với số nào được 36?', 'tìm lại trong bảng đã học, không dùng quy tắc B13')
lesson(BN, 'q018', 8, 'trang-sach', B8 + '; bảng 4 (B6)')
hint(BN, 'q049', 'Chia 42 cho 6 để tìm thừa số còn thiếu.', 'Trong bảng nhân 6, 6 nhân với số nào được 42?', 'tìm lại trong bảng đã học, không dùng quy tắc B13')
lesson(BN, 'q049', 9, 'trang-sach', B8 + '; bảng 6 (B9)')
hint(BN, 'q086', 'Chia 56 cho 7 để tìm thừa số còn thiếu.', 'Trong bảng nhân 7, 7 nhân với số nào được 56?', 'tìm lại trong bảng đã học, không dùng quy tắc B13')
lesson(BN, 'q086', 10, 'trang-sach', B8 + '; bảng 7 (B10)')
hint(BN, 'q052', 'Muốn tìm số chia, lấy số bị chia chia cho thương.', 'Trong bảng nhân 5, 5 nhân với số nào được 30? Thử số đó vào phép chia.', 'không đưa quy tắc tìm số chia (B13) vào trước bài dạy')
lesson(BN, 'q052', 8, 'trang-sach', B8 + '; bảng 5 (B4)')
hint(BN, 'q089', 'Muốn tìm số chia, lấy số bị chia chia cho thương.', 'Trong bảng nhân 5, 5 nhân với số nào được 35? Thử số đó vào phép chia.', 'không đưa quy tắc tìm số chia (B13) vào trước bài dạy')
lesson(BN, 'q089', 8, 'trang-sach', B8 + '; bảng 5 (B4)')
for n in ['q017', 'q050', 'q087']:
    lesson(BN, n, 13, 'trang-sach', 'B13 tr.39: quy tắc tìm thừa số, mẫu ? × 5 = 35, bài ? × 4 = 28 — cùng dạng ? × b = c')
for n in ['q019', 'q051', 'q088']:
    lesson(BN, n, 13, 'trang-sach', 'B13 tr.40–41: quy tắc tìm số bị chia, bài ? : 6 = 7, ? : 4 = 8 — cùng dạng')
# 4. Đồng hồ, lịch; đo lường nền
T23 = 'B7 tr.23 bài 2a (đồng hồ 3 giờ 30 phút, 6 giờ 15 phút) và bài 4 (đọc giờ) — cùng dạng'
for n in ['q001', 'q002', 'q003']:
    lesson('xem-dong-ho-thoi-gian', n, 7, 'trang-sach', T23)
lesson('on-tap-tong-hop', 'q013', 7, 'trang-sach', T23)
for n in ['q014', 'q015']:
    lesson('xem-dong-ho-thoi-gian', n, 7, 'trang-sach', 'B7 tr.23 bài 2b (ngày 4/10 là thứ Ba → ngày 10/10) — cùng dạng tính thứ trong tuần')
for n in ['q002', 'q003', 'q011', 'q015', 'q016']:
    nen('do-luong', n, 'kiến thức lớp 2 (m, dm, km, cm). Đã xem B7 tr.21–23: không có đổi đơn vị độ dài; cm ở đường gấp khúc không đủ làm căn cứ')
nen('do-luong', 'q017', 'ước lượng cân nặng là kỹ năng lớp 2; B7 tr.22 chỉ có đọc số trên cân — khác kỹ năng')
# 5. Một phần mấy
for n, note in [('q001', 'nhận biết'), ('q002', 'nhận biết'), ('q003', 'nhận biết'), ('q004', 'nhận biết'), ('q005', 'nhận biết'), ('q006', 'nhận biết')]:
    lesson(PS, n, 14, 'trang-sach', 'B14 tr.42 khám phá: chia bánh / hình tròn thành phần bằng nhau, lấy một phần — cùng dạng (web bằng lời, không hình)')
for n in ['q007', 'q008', 'q009', 'q010']:
    lesson(PS, n, 14, 'trang-sach', 'B14 tr.43 bài 2: chọn cách đọc một phần mấy — cùng dạng')
SL = 'B14 tr.45 bài 4: chia 12 quả cam thành 3 phần bằng nhau, 1/3 số quả cam là ? — câu web mở rộng số liệu (dùng bảng chia đến B12) và không có hình'
for n in ['q011', 'q012', 'q013', 'q014', 'q015', 'q016', 'q017', 'q018', 'q019', 'q020', 'q021', 'q022', 'q023', 'q024', 'q027', 'q028', 'q031']:
    lesson(PS, n, 14, 'trang-sach', SL)
lesson('on-tap-tong-hop', 'q009', 14, 'trang-sach', SL)
for n in ['q029', 'q030']:
    lesson(PS, n, 14, 'suy-luan', 'B14 tr.43 bài 3, tr.45 bài 3: nhận ra phần khoanh là 1/4, 1/3 qua hình; câu web chuyển sang suy luận bằng lời (chia toàn bộ thành các nhóm bằng nhau) — khó hơn câu có hình, không trùng dạng nguyên văn')
# 6. Nâng bằng chứng câu đã ghi (dẫn đúng từng dạng)
up = [
    ('q024', 6, 'B6 tr.19 bài 3: "Mỗi ô tô con có 4 bánh xe. Hỏi 8 ô tô…" — trùng đề'),
    ('q022', 6, 'B6 tr.20 khám phá: 4 × 6 = 24 → 24 : 4 = 6 — trùng'),
    ('q020', 6, 'B6 tr.19 bài 2: nêu các số còn thiếu (dãy đếm thêm 4, đếm lùi) — cùng dạng'),
    ('q021', 6, 'B6 tr.19 bài 2b: dãy đếm lùi 4 — cùng dạng'),
    ('q023', 6, 'B6 tr.20 hoạt động 2: toa tàu nào có kết quả lớn nhất (8:4, 16:4, 40:4, 24:4) — cùng dạng'),
    ('q025', 6, 'B6 tr.19 bài 3: mỗi … có 4, hỏi n … — cùng dạng'),
    ('q026', 6, 'B6 tr.20 luyện tập 2: lời văn chia cho 4 — cùng dạng (sách là chia theo nhóm, câu web là chia đều)'),
    ('q027', 6, 'B6 tr.20 luyện tập 2: lời văn chia cho 4 — cùng dạng (sách là chia theo nhóm, câu web là chia đều)'),
    ('q053', 9, 'B9 tr.29 luyện tập 1a: dãy đếm thêm 6 — cùng dạng'),
    ('q054', 9, 'B9 tr.29 luyện tập 1b: dãy đếm lùi 6 — cùng dạng'),
    ('q055', 9, 'B9 tr.29 luyện tập 1a: dãy đếm thêm 6 — cùng dạng'),
    ('q056', 9, 'B9 tr.28: "Thêm 6 vào kết quả của 6 × 2 ta được kết quả của 6 × 3" — cùng dạng thêm một nhóm'),
    ('q057', 9, 'B9 tr.28: "Thêm 6 vào kết quả của 6 × 2…" — cùng dạng thêm một nhóm'),
    ('q060', 9, 'B9 tr.30 bài 4: mỗi hộp có ? bút, 4 hộp → ? × ? — cùng dạng'),
    ('q061', 9, 'B9 tr.28 khám phá / tr.30 bài 4: mỗi … có 6 — cùng dạng'),
    ('q062', 9, 'B9 tr.28 khám phá: mỗi con bọ rùa có 6 chấm, 4 con — cùng dạng'),
    ('q063', 9, 'B9 tr.30 bài 5: thanh gỗ 60 cm cưa thành 6 đoạn bằng nhau — cùng dạng chia đều cho 6'),
    ('q090', 10, 'B10 tr.32 luyện tập 1a: dãy đếm thêm 7 — cùng dạng'),
    ('q091', 10, 'B10 tr.32 luyện tập 1b: dãy đếm lùi 7 — cùng dạng'),
    ('q092', 10, 'B10 tr.32 luyện tập 1a: dãy đếm thêm 7 — cùng dạng'),
    ('q093', 10, 'B10 tr.31: "Thêm 7 vào kết quả của 7 × 2…" — cùng dạng thêm một nhóm'),
    ('q096', 10, 'B10 tr.32 luyện tập 4b: so sánh thương 42 : 7 ? 42 : 6, 56 : 7 ? 49 : 7 — cùng dạng so sánh thương'),
    ('q097', 10, 'B10 tr.32 hoạt động 3: "Mỗi tuần lễ có 7 ngày… 4 tuần lễ" — cùng dạng'),
    ('q098', 10, 'B10 tr.31 khám phá: mỗi đội có 7 bạn, 2 đội — cùng dạng'),
    ('q099', 10, 'B10 tr.31 khám phá: mỗi đội có 7 bạn — cùng dạng'),
    ('q100', 10, 'B10 tr.32 luyện tập 3: 42 cái cốc xếp đều vào 7 hộp — cùng dạng'),
    ('q101', 10, 'B10 tr.32 luyện tập 3: 42 cái cốc xếp đều vào 7 hộp — cùng dạng'),
    ('q149', 11, 'B11 tr.34 hoạt động 2: mỗi hộp bút có 8 chiếc — cùng dạng'),
    ('q151', 11, 'B11 tr.34 hoạt động 2: mỗi … có 8, hỏi n … — cùng dạng'),
    ('q150', 12, 'B12 tr.37 luyện tập 4: chia đều 45 l vào 9 can — cùng dạng chia đều cho 9'),
]
for n, L, note in up:
    lesson(BN, n, L, 'trang-sach', note, allow_change=False)
lesson('giai-toan-co-loi-van', 'q012', 10, 'trang-sach', 'B10 tr.31 khám phá: mỗi đội 7 bạn × số đội — cùng dạng (mỗi ngày 7 trang × 6 ngày)')
lesson('giai-toan-co-loi-van', 'q015', 6, 'trang-sach', 'B6 tr.20 luyện tập 2: 24 bánh, mỗi hộp 4 → mấy hộp — cùng dạng chia theo nhóm')

for t, d in files.items():
    with open(os.path.join(D, t + '.json'), 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=2); f.write('\n')
print('%d thay đổi' % len(changes))
for c in changes: print(' -', c)
