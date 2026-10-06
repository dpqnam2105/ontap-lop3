#!/usr/bin/env python3
"""Vòng 10 (2026-10-07): ghi lesson cho lô 1 (93 câu bảng trực tiếp + 3 câu lời văn B2, basis muc-luc) — Codex duyệt.
on-tap q006 (8 × 7) → B10 suy-luan, gợi ý "Đổi thành 7 × 8 rồi dùng bảng nhân 7."; gợi ý ba câu nhân với 10 theo bảng đang học.
Đọc danh sách từ docs/gan-bai-toan-gd1.csv (sinh bởi tools/lesson_map.py). Chạy lại không đổi gì thêm. Giữ id, thứ tự, source.
"""
import json, os, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
D = os.path.join(ROOT, 'data-lop3', 'toan')
DATE = '2026-10-07'
import csv
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

def skill(t, n, old, new, note):
    q = get(t, n)
    if q.get('skill') == new: return
    if q.get('skill') != old: sys.exit('%s.skill đang là %r' % (q['id'], q.get('skill')))
    q['skill'] = new
    q.setdefault('review', []).append({'by': 'claude', 'date': DATE, 'status': 'sua-skill', 'note': note})
    changes.append('%s: skill %s → %s' % (q['id'], old, new))

BN, OT = 'bang-nhan-chia', 'on-tap-tong-hop'
SPECIAL = {'toan_on-tap-tong-hop_q006'}

# 1. Lô 1: 93 câu theo bảng đề xuất (docs/ra-soat-muc-luc-gd1.md mục 1a), basis muc-luc
rows = [r for r in csv.DictReader(open(os.path.join(ROOT, 'docs', 'gan-bai-toan-gd1.csv'), encoding='utf-8'))
        if r['trạng thái'] == 'cho-duyet' or (r['trạng thái'] == 'da-ghi' and r['mức bằng chứng'] == 'muc-luc')]
lo1 = [r for r in rows if r['id'] not in SPECIAL]
if len(lo1) != 93: sys.exit('lô 1 phải 93 câu, đang %d' % len(lo1))
for r in lo1:
    t, n = r['id'][len('toan_'):].rsplit('_', 1)
    if get(t, n).get('lesson'): continue   # đã ghi (CSV sinh lại lấy note từ dữ liệu) → không ghi đè
    no = int(r['bài'].lstrip('B'))
    lesson(t, n, no, 'muc-luc', r['nguồn đối chiếu'].replace('Mục lục SGK Toán 3 KNTT tập một: ', 'Mục lục tập một: ') + ' — ' + r['ghi chú'] + '; tra bảng / một phép tính trực tiếp')

# 2. on-tap q006 (8 × 7) → B10: đổi thành 7 × 8 rồi dùng bảng nhân 7
lesson(OT, 'q006', 10, 'suy-luan', 'đổi 8 × 7 thành 7 × 8 rồi tra bảng nhân 7 (B10); hoạt động đổi chỗ hai thừa số ở B10 tr.32 bài 4a. Không cần chờ bảng 8 (B11)')
hint(OT, 'q006', 'Nhẩm bảng nhân 8 hoặc bảng nhân 7.', 'Đổi thành 7 × 8 rồi dùng bảng nhân 7.', 'gợi ý theo cách giải của B10 (Codex vòng 10)')
skill(OT, 'q006', 'times-table', 'times-7', 'cách giải được hướng dẫn là bảng nhân 7')
skill(OT, 'q008', 'divide', 'divide-8', '72 : 8 là bảng chia 8; khoá divide dành cho chia số nhiều chữ số (GĐ2)')

# 3. Ba câu nhân với 10: gợi ý theo bảng đang học (không đổi đề, đáp án, id)
for n, a in [('q006', 4), ('q037', 6), ('q074', 7)]:
    hint(BN, n, 'Nhân với 10 thì viết thêm chữ số 0.', 'Trong bảng nhân %d, đếm thêm %d đến lần thứ 10.' % (a, a), 'gợi ý dùng bảng đang học (Codex vòng 10)')

for t, d in files.items():
    with open(os.path.join(D, t + '.json'), 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=2); f.write('\n')
print('%d thay đổi' % len(changes))
for c in changes: print(' -', c)
