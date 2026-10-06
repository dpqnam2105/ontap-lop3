#!/usr/bin/env python3
"""Ghi `lesson` cho các nhóm câu Toán GĐ1 ĐÃ ĐƯỢC CODEX DUYỆT (vòng 6, 2026-10-06) + sửa lời đã thống nhất.

Ý nghĩa đã chốt:  lesson = bài SỚM NHẤT mà kiến thức đã học đủ để làm câu này theo cách giải được hướng dẫn
(KHÔNG có nghĩa "câu lấy từ bài đó trong SGK"). `source` gốc của câu giữ nguyên; căn cứ gắn bài ghi riêng trong
`lessonRef` = { basis: muc-luc | suy-luan | trang-sach, note, by, approvedBy, date }.
Chạy lại không đổi gì thêm. Không đổi id, không đổi thứ tự câu. Kiểm tra giá trị cũ trước khi sửa lời.
"""
import json, os, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
D = os.path.join(ROOT, 'data-lop3', 'toan')
DATE = '2026-10-06'
files, changes = {}, []

def qs(t):
    if t not in files: files[t] = json.load(open(os.path.join(D, t + '.json'), encoding='utf-8'))
    return files[t]['topic']['questions']

def get(t, n):
    hit = [q for q in qs(t) if q['id'] == 'toan_%s_%s' % (t, n)]
    if len(hit) != 1: sys.exit('không thấy toan_%s_%s' % (t, n))
    return hit[0]

def set_lesson(t, n, no, basis, note):
    q = get(t, n)
    lesson = {'book': 'kntt-toan3', 'vol': 1, 'no': no}
    ref = {'basis': basis, 'note': note, 'by': 'claude', 'approvedBy': 'codex', 'date': DATE}
    if q.get('lesson') == lesson and q.get('lessonRef', {}).get('basis') == basis: return
    if q.get('lesson') and q['lesson'] != lesson: sys.exit('%s đã có lesson khác %r' % (q['id'], q['lesson']))
    q['lesson'], q['lessonRef'] = lesson, ref
    changes.append('%s → B%d (%s)' % (q['id'], no, basis))

def set_text(t, n, field, old, new, note):
    q = get(t, n)
    if q.get(field) == new: return
    if q.get(field) != old: sys.exit('%s.%s đang là %r' % (q['id'], field, q.get(field)))
    q[field] = new
    q.setdefault('review', []).append({'by': 'claude', 'date': DATE, 'status': 'sua-loi', 'note': note})
    changes.append('%s: %s' % (q['id'], note))

BN = 'bang-nhan-chia'
# ---- Nhóm Codex duyệt (giữ mức bằng chứng suy-luan, chưa đối chiếu trang sách) ----
for n in ['q020', 'q021', 'q022', 'q023', 'q024', 'q025', 'q026', 'q027']:
    set_lesson(BN, n, 6, 'suy-luan', 'phần bảng 4; kiến thức bảng nhân/chia 4')
for n in ['q053', 'q054', 'q055', 'q059', 'q060', 'q061', 'q062', 'q063', 'q064']:
    set_lesson(BN, n, 9, 'suy-luan', 'phần bảng 6; số lượng mỗi nhóm quyết định bảng')
for n in ['q090', 'q091', 'q092', 'q096', 'q097', 'q098', 'q099', 'q100', 'q101']:
    set_lesson(BN, n, 10, 'suy-luan', 'phần bảng 7; số lượng mỗi nhóm quyết định bảng')
set_lesson(BN, 'q149', 11, 'suy-luan', 'mỗi túi 8 cái → bảng nhân 8')
set_lesson(BN, 'q151', 11, 'suy-luan', 'mỗi tuần 8 tiết → bảng nhân 8')
set_lesson(BN, 'q150', 12, 'suy-luan', '81 : 9 → bảng chia 9')
set_lesson(BN, 'q152', 12, 'suy-luan', '72 : 9 → bảng chia 9')
set_lesson('giai-toan-co-loi-van', 'q003', 2, 'suy-luan', 'một bước trừ, bẫy "nhiều hơn" hỏi số bé')
set_lesson('giai-toan-co-loi-van', 'q004', 2, 'suy-luan', 'một bước cộng, bẫy "ít hơn" hỏi số lớn')
set_lesson('on-tap-tong-hop', 'q014', 2, 'suy-luan', '"kém" = ít hơn, hỏi số lớn: một bước cộng')
set_lesson('giai-toan-co-loi-van', 'q012', 10, 'suy-luan', 'mỗi ngày 7 trang × 6 ngày → bảng nhân 7')
set_lesson('giai-toan-co-loi-van', 'q015', 6, 'suy-luan', '36 : 4 → bảng chia 4')
# ---- Khối câu trộn bảng (Codex tách) ----
set_lesson(BN, 'q106', 9, 'suy-luan', 'tìm số có trong cả bảng 4 và bảng 6; không cần bảng 7')
set_lesson(BN, 'q111', 6, 'suy-luan', 'mỗi buổi 4 tiết, 6 buổi → 4 × 6 (số lượng mỗi nhóm quyết định bảng)')
set_lesson(BN, 'q105', 10, 'suy-luan', 'các phương án dùng bảng 4, 5, 6, 7')
set_lesson(BN, 'q108', 10, 'suy-luan', 'phương án 6×7, 7×5, 4×8, 6×6: cần bảng 4, 6, 7')
set_lesson(BN, 'q110', 10, 'suy-luan', 'phương án 6×8, 7×7, 6×9, 7×8: cần bảng 6, 7')
# ---- Sửa lời đã thống nhất ----
set_text(BN, 'q105', 'hint', 'Thử xem 42 chia hết cho những số nào.',
         'Tìm số 42 trong các bảng nhân đã học: bảng nào có một phép nhân bằng 42?', 'gợi ý theo bảng nhân đã học, bỏ "chia hết"')
set_text(BN, 'q106', 'hint', 'Thử từng số xem có chia hết cho cả 4 và 6 không.',
         'Đọc bảng nhân 4 và bảng nhân 6, tìm số có mặt ở cả hai bảng.', 'gợi ý theo bảng nhân đã học, bỏ "chia hết"')
set_text(BN, 'q056', 'hint', 'Làm phép nhân trước, phép cộng sau.', '6 × 9 là 9 nhóm 6. Thêm 1 nhóm 6 nữa thì được mấy nhóm 6?', 'gợi ý theo số nhóm (dạng thêm một nhóm), chờ chốt bài')
set_text(BN, 'q057', 'hint', 'Làm phép nhân trước, phép cộng sau.', '6 × 6 là 6 nhóm 6. Thêm 1 nhóm 6 nữa thì được mấy nhóm 6?', 'gợi ý theo số nhóm (dạng thêm một nhóm), chờ chốt bài')
set_text(BN, 'q093', 'hint', 'Làm phép nhân trước, phép cộng sau.', '7 × 8 là 8 nhóm 7. Thêm 1 nhóm 7 nữa thì được mấy nhóm 7?', 'gợi ý theo số nhóm (dạng thêm một nhóm), chờ chốt bài')
set_text('on-tap-tong-hop', 'q013', 'q', 'Kim giờ chỉ quá số 4 một chút, kim phút chỉ số 6. Đồng hồ chỉ:',
         'Kim giờ nằm giữa số 4 và số 5, kim phút chỉ số 6. Đồng hồ chỉ:', 'kim giờ "quá số 4 một chút" không khớp 4 giờ 30 phút')

for t, d in files.items():
    with open(os.path.join(D, t + '.json'), 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=2); f.write('\n')
print('%d thay đổi' % len(changes))
for c in changes: print(' -', c)
