#!/usr/bin/env python3
"""Số liệu bản đồ nội dung lớp 3 (đếm thẳng từ data-lop3, không nhập tay).

Chạy:  python3 tools/content_map.py            → in bảng số câu (Markdown)
       python3 tools/content_map.py --samples  → in mẫu câu đại diện mỗi môn × giai đoạn × chủ đề

Mẫu câu chọn cố định (theo hash id) để hai lần chạy ra cùng một bộ, Codex soi được đúng những câu này.
"""
import collections
import hashlib
import json
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data-lop3')
SUBJECTS = ['toan', 'tieng-viet', 'tieng-anh', 'toan-tieng-anh']
# Chủ đề "nâng cao / ngoài SGK" của Toán (tự thiết kế, không ứng với bài nào trong sách)
ENRICH = {'toan_tu-duy-so', 'toan_loi-van-hay', 'toan_tu-duy-logic', 'toan_kieu-kangaroo',
          'toan_dem-hinh-gap-khuc', 'toan_day-so-cach-deu', 'toan_so-do-doan-thang'}
SAMPLES_PER_CELL = 3


def load(subject):
    idx = json.load(open(os.path.join(ROOT, subject, 'index.json'), encoding='utf-8'))
    topics = []
    for t in idx['topics']:
        path = os.path.join(ROOT, subject, t['file'])
        qs = json.load(open(path, encoding='utf-8'))['topic']['questions'] if os.path.exists(path) else None
        topics.append((t, qs))
    return idx, topics


def stage_of(q):
    return int(q.get('stage') or 0)


def counts():
    out = []
    for s in SUBJECTS:
        idx, topics = load(s)
        stages = [x['id'] for x in idx.get('stages', [])]
        cols = stages if stages else [0]
        head = ['Chủ đề', 'Loại'] + [('GĐ' + str(c)) if c else 'Có nhãn GĐ (bị bỏ qua)' for c in cols] + ['Chưa gắn GĐ', 'Tổng', 'Thiếu skill', 'Nguồn (source)']
        out.append('\n### ' + idx['name'] + (' — giai đoạn: ' + ', '.join('GĐ%d' % c for c in stages) if stages else ' — CHƯA chia giai đoạn') + '\n')
        out.append('| ' + ' | '.join(head) + ' |')
        out.append('|' + '---|' * len(head))
        total = collections.Counter()
        for t, qs in topics:
            if qs is None:
                out.append('| %s | — | THIẾU FILE %s |' % (t['name'], t['file']))
                continue
            st = collections.Counter(stage_of(q) for q in qs)
            kind = ('nâng cao' if t['id'] in ENRICH else 'theo sách') if s == 'toan' else '—'
            row = [t['name'] + (' ⚠️count %d' % t['count'] if t.get('count') != len(qs) else ''), kind]
            if stages:
                row += [str(st.get(c, 0)) for c in cols]
            else:   # môn chưa chia: đếm số câu đã gắn nhãn stage (app bỏ qua nhãn này)
                row.append(str(len(qs) - st.get(0, 0)))
            unlabeled = st.get(0, 0)
            src = collections.Counter(q.get('source', '(trống)') for q in qs)
            row += [str(unlabeled), str(len(qs)), str(sum(1 for q in qs if not q.get('skill'))),
                    ', '.join('%s %d' % kv for kv in src.most_common())]
            out.append('| ' + ' | '.join(row) + ' |')
            for k, v in st.items():
                total[k] += v
        lab = [str(total.get(c, 0)) for c in cols] if stages else [str(sum(total.values()) - total.get(0, 0))]
        out.append('| **Tổng** | | ' + ' | '.join(lab) + ' | %d | %d | | |' % (total.get(0, 0), sum(total.values())))
    return '\n'.join(out)


def samples():
    out = ['# Mẫu câu đại diện lớp 3 (tự sinh bởi tools/content_map.py --samples)\n',
           'Mỗi ô môn × giai đoạn × chủ đề lấy tối đa %d câu, chọn cố định theo hash id. Đáp án đúng in **đậm**.\n' % SAMPLES_PER_CELL]
    for s in SUBJECTS:
        idx, topics = load(s)
        out.append('\n## ' + idx['name'])
        cells = collections.defaultdict(list)
        for t, qs in topics:
            for q in qs or []:
                cells[(stage_of(q), t['name'])].append(q)
        for (st, tname) in sorted(cells):
            qs = sorted(cells[(st, tname)], key=lambda q: hashlib.md5(q['id'].encode()).hexdigest())[:SAMPLES_PER_CELL]
            out.append('\n### %s · %s (%d câu)' % ('GĐ%d' % st if st else 'chưa gắn GĐ', tname, len(cells[(st, tname)])))
            for q in qs:
                ch = ' / '.join(('**%s**' % c) if i == q.get('a') else str(c) for i, c in enumerate(q.get('choices', [])))
                text = re.sub(r'\s+', ' ', str(q.get('q', '')))
                out.append('- `%s` [độ khó %s, %s] %s — %s' % (q['id'], q.get('difficulty', '?'), q.get('skill', 'không skill'), text, ch))
    return '\n'.join(out)


if __name__ == '__main__':
    print(samples() if '--samples' in sys.argv else counts())
