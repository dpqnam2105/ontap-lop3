#!/usr/bin/env python3
"""Áp dụng các sửa đã được Codex đồng ý (docs/ra-soat-nen-lop3.md, vòng 2026-10-06).

Chạy một lần: python3 tools/apply_ra_soat_20261006.py
- Mỗi sửa đều KIỂM TRA giá trị cũ trước khi đổi (sai giá trị cũ → dừng, không ghi gì).
- Chạy lại lần hai: các câu đã sửa được bỏ qua (idempotent).
- Không đổi thứ tự câu trong mảng (tiến độ trong ngày lưu theo vị trí câu).
"""
import json
import os
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
D = os.path.join(ROOT, 'data-lop3')
TODAY = '2026-10-06'
files, changes = {}, []


def topic(path):
    if path not in files:
        files[path] = json.load(open(os.path.join(D, path), encoding='utf-8'))
    return files[path]['topic']['questions']


def q_of(path, qid):
    hit = [q for q in topic(path) if q['id'] == qid]
    if len(hit) != 1:
        sys.exit('Không tìm thấy (hoặc trùng) %s trong %s' % (qid, path))
    return hit[0]


def review(q, status, note):
    r = q.setdefault('review', [])
    if not any(x.get('date') == TODAY and x.get('status') == status for x in r):
        r.append({'by': 'claude', 'date': TODAY, 'status': status, 'note': note})


def set_field(path, qid, field, old, new, status, note):
    q = q_of(path, qid)
    cur = q.get(field)
    if cur == new:
        return
    if cur != old:
        sys.exit('%s.%s đang là %r, không phải %r như dự kiến — dừng.' % (qid, field, cur, old))
    q[field] = new
    review(q, status, note)
    changes.append('%s: %s %r → %r' % (qid, field, old, new))


def set_choice(path, qid, old, new, note):
    q = q_of(path, qid)
    if new in q['choices'] and old not in q['choices']:
        return
    if old not in q['choices']:
        sys.exit('%s không có lựa chọn %r — dừng.' % (qid, old))
    i = q['choices'].index(old)
    if i == q['a']:
        sys.exit('%s: %r là đáp án đúng, không phải nhiễu — dừng.' % (qid, old))
    q['choices'][i] = new
    review(q, 'sua-nhieu', note)
    changes.append('%s: lựa chọn %r → %r' % (qid, old, new))


def set_prereq(path, qid, prereq):
    q = q_of(path, qid)
    if q.get('prereq') == prereq:
        return
    q['prereq'] = prereq
    q['track'] = 'enrich'
    changes.append('%s: track enrich, prereq %s' % (qid, prereq))


# ---------- 1. Toán theo sách ----------
LV = 'toan/giai-toan-co-loi-van.json'
set_field(LV, 'toan_giai-toan-co-loi-van_q001', 'q',
          'Vườn có 248 quả cam, hái thêm 135 quả. Hỏi vườn có tất cả bao nhiêu quả cam?',
          'Buổi sáng hái được 248 quả cam, buổi chiều hái thêm 135 quả cam. Hỏi cả ngày hái được bao nhiêu quả cam?',
          'sua-loi', '"hái thêm" làm vườn ít đi — lời cũ mơ hồ; đáp án giữ 383')
set_field(LV, 'toan_giai-toan-co-loi-van_q001', 'hint',
          'Có thêm vào thì số lượng tăng lên. Chọn phép tính phù hợp.',
          'Gộp số quả hái buổi sáng với số quả hái buổi chiều. Chọn phép tính phù hợp.',
          'sua-loi', 'gợi ý theo lời mới')
for qid in ['toan_giai-toan-co-loi-van_q005', 'toan_giai-toan-co-loi-van_q013']:
    set_field(LV, qid, 'stage', 1, 2, 'doi-nhan', 'bài hai bước (B28) → GĐ2')

PS = 'toan/phan-so-don-gian.json'
for qid in ['toan_phan-so-don-gian_q025', 'toan_phan-so-don-gian_q026']:
    set_field(PS, qid, 'stage', 1, 2, 'doi-nhan', 'tìm 1/n rồi trừ: hai bước (B28) → GĐ2')

BN = 'toan/bang-nhan-chia.json'
set_field(BN, 'toan_bang-nhan-chia_q094', 'stage', 1, 3, 'doi-nhan', 'tính giá trị biểu thức (B38) → GĐ3')
set_field(BN, 'toan_bang-nhan-chia_q094', 'skill', None, 'expression', 'doi-nhan', 'rà tay')
# Bài hai bước tìm thêm khi rà tay danh sách không khớp mẫu
for qid, why in [('toan_bang-nhan-chia_q028', '4 × 6 rồi trừ 4'),
                 ('toan_bang-nhan-chia_q065', '6 × 6 rồi trừ 6'),
                 ('toan_bang-nhan-chia_q112', '42 : 6 rồi trừ 3'),
                 ('toan_bang-nhan-chia_q102', '2 tuần = 14 ngày rồi 14 × 7 (nhân số hai chữ số, B23)')]:
    set_field(BN, qid, 'stage', 1, 2, 'doi-nhan', 'bài hai bước: ' + why + ' → GĐ2')
    set_field(BN, qid, 'skill', None, 'word-2step', 'doi-nhan', 'rà tay')
# Gắn skill rà tay (các câu không khớp mẫu chắc chắn của tools/tag_skills.py)
MANUAL = {
    'skip-count': ['q020', 'q021', 'q053', 'q054', 'q055', 'q090', 'q091', 'q092'],
    'mul-div-relation': ['q022', 'q058', 'q095'],
    'word-problem': ['q024', 'q025', 'q026', 'q027', 'q060', 'q061', 'q062', 'q063', 'q064',
                     'q097', 'q098', 'q099', 'q100', 'q101', 'q111'],
    'cmp-tich': ['q107', 'q108', 'q109', 'q110'],
    # Codex chốt tên (vòng 3): chỉ là nhận biết từ bảng nhân đã học, chưa gọi "bội chung" / "chia hết"
    'compare-quotients': ['q023', 'q059', 'q096'],
    'table-product-membership': ['q105'],
    'common-table-product': ['q106'],
}
for sk, nums in MANUAL.items():
    for n in nums:
        set_field(BN, 'toan_bang-nhan-chia_' + n, 'skill', None, sk, 'them-skill', 'rà tay')

OT = 'toan/on-tap-tong-hop.json'
set_field(OT, 'toan_on-tap-tong-hop_q012', 'stage', 1, 4, 'doi-nhan', '2 km = 2000 m vượt phạm vi 1000 → GĐ4')

DL = 'toan/do-luong.json'
set_choice(DL, 'toan_do-luong_q016', '15 mm', '15 dm', 'mm học ở B30 (GĐ3)')
set_choice(DL, 'toan_do-luong_q017', '28 g', '8 kg', 'g học ở B31 (GĐ3)')

# ---------- 2. Toán nâng cao ----------
SD = 'toan/so-do-doan-thang.json'
old_q1 = [q for q in topic(SD) if q['id'] in ('toan_so-do-doan-thang_q001', 'toan_so-do-doan-thang_q001v2')][0]
if old_q1['id'] == 'toan_so-do-doan-thang_q001':
    assert old_q1['q'].startswith('Lớp 3A có 64 bạn') and old_q1['choices'][old_q1['a']] == '36 bạn nữ'
    old_q1.update({
        'id': 'toan_so-do-doan-thang_q001v2',      # đổi dữ kiện + đáp án → id mới, tiến độ câu cũ không áp sang
        'q': 'Lớp 3A có 34 bạn, trong đó có 16 bạn nam. Nhìn sơ đồ, hỏi lớp 3A có bao nhiêu bạn nữ?',
        'choices': ['16 bạn nữ', '22 bạn nữ', '18 bạn nữ', '50 bạn nữ'],
        'a': 2,
        'image': 'images/questions/lop3/so-do-01-v2.svg',
        'replaces': 'toan_so-do-doan-thang_q001',
    })
    review(old_q1, 'thay-cau', 'lớp 64 bạn không thực tế → 34 bạn; nhiễu: 50 (nhầm phép cộng), 22 (trừ số bé cho số lớn từng hàng), 16 (chép số đã cho)')
    changes.append('toan_so-do-doan-thang_q001 → q001v2 (34 bạn, 16 nam, đáp án 18)')
for n in ['q008', 'q009', 'q010']:
    set_field(SD, 'toan_so-do-doan-thang_' + n, 'stage', 1, 2, 'doi-nhan', 'sơ đồ hai bước (B28) → GĐ2')
# Kiến thức cần trước cho các dạng nâng cao (cùng từ điển skill trong data-lop3/skills.json)
PRE = [
    (SD, 'toan_so-do-doan-thang_q017', ['sub-1000', 'divide']),     # (50 − 10) : 2 → 40 : 2 ngoài bảng chia
    (SD, 'toan_so-do-doan-thang_q018', ['sub-1000', 'divide']),     # (90 − 16) : 2 → 74 : 2 ngoài bảng chia
    ('toan/day-so-cach-deu.json', 'toan_day-so-cach-deu_q006', ['sequence-1000', 'sub-1000', 'divide-2']),
    ('toan/day-so-cach-deu.json', 'toan_day-so-cach-deu_q007', ['sequence-1000', 'sub-1000', 'divide-3']),
    ('toan/day-so-cach-deu.json', 'toan_day-so-cach-deu_q008', ['sequence-1000', 'sub-1000', 'divide']),  # 57 : 3
    ('toan/day-so-cach-deu.json', 'toan_day-so-cach-deu_q009', ['sequence-1000', 'sub-1000', 'divide-2']),
    ('toan/day-so-cach-deu.json', 'toan_day-so-cach-deu_q010', ['sequence-1000', 'sub-1000', 'divide-3']),
    ('toan/day-so-cach-deu.json', 'toan_day-so-cach-deu_q011', ['sequence-1000', 'sub-1000', 'divide-5']),
    ('toan/day-so-cach-deu.json', 'toan_day-so-cach-deu_q012', ['sequence-1000', 'sub-1000', 'divide-2']),
    ('toan/tu-duy-so.json', 'toan_tu-duy-so_q044', ['add-1000', 'sub-1000']),
    ('toan/tu-duy-so.json', 'toan_tu-duy-so_q045', ['add-1000', 'find-minuend']),
    ('toan/tu-duy-so.json', 'toan_tu-duy-so_q046', ['sub-1000', 'divide-4']),
    ('toan/tu-duy-so.json', 'toan_tu-duy-so_q047', ['add-1000', 'times-6']),
    ('toan/tu-duy-so.json', 'toan_tu-duy-so_q048', ['sub-1000', 'divide-5']),
    ('toan/kieu-kangaroo.json', 'toan_kieu-kangaroo_q003', ['divide-4', 'add-1000']),   # trồng cây hai đầu
    ('toan/kieu-kangaroo.json', 'toan_kieu-kangaroo_q018', ['add-1000', 'sub-1000']),   # ốc sên
    ('toan/tu-duy-logic.json', 'toan_tu-duy-logic_q054', ['add-1000', 'duration']),
    ('toan/tu-duy-logic.json', 'toan_tu-duy-logic_q055', ['add-1000', 'duration']),
    ('toan/tu-duy-logic.json', 'toan_tu-duy-logic_q056', ['add-1000', 'clock', 'duration']),
]
for path, qid, pre in PRE:
    set_prereq(path, qid, pre)

# ---------- 3. Tiếng Anh ----------
set_choice('tieng-anh/adj-adv.json', 'en_adj-adv_q005', 'better', 'nicely',
           '"a better swimmer" cũng đúng ngữ pháp → hai đáp án đúng; thay bằng trạng từ sai rõ ràng')

# ---------- ghi ----------
for path, data in files.items():
    with open(os.path.join(D, path), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
print('%d thay đổi' % len(changes))
for c in changes:
    print(' -', c)
