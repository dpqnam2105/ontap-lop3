#!/usr/bin/env python3
"""Gắn `skill` cho câu Bảng nhân chia chưa có skill — CHỈ khi khớp mẫu chắc chắn.

Chạy:  python3 tools/tag_skills.py          → chỉ báo cáo (không ghi file)
       python3 tools/tag_skills.py --write  → ghi skill cho các câu khớp mẫu

Câu không khớp mẫu nào được in ra để rà tay (không đoán).
Mẫu chắc chắn (đề chỉ có đúng một phép tính trong bảng 2–9):
  a × b = ?        → times-a     (thừa số thứ nhất là bảng, a 2–9, b 1–10, giống các câu đã gắn sẵn)
  c : b = ?        → divide-b    (b 2–9, c = b × k với k 1–10)
  ? × b = c / a × ? = c → missing-factor
  ? : b = c        → missing-dividend
  a : ? = c        → missing-divisor
  Tính: a × b ± a  → rel-them-bot (nhân thêm / bớt một lần — quan hệ bảng nhân, không phải biểu thức)
"""
import json
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
FILE = os.path.join(ROOT, 'data-lop3', 'toan', 'bang-nhan-chia.json')
NUM = r'(\d+)'


def norm(s):
    return re.sub(r'\s+', ' ', s.replace('\n', ' ')).strip()


def classify(text):
    t = norm(text)
    m = re.fullmatch(NUM + r' × ' + NUM + r' = \?', t)
    if m:
        a, b = int(m[1]), int(m[2])
        if 2 <= a <= 9 and 1 <= b <= 10:
            return 'times-%d' % a
        return None
    m = re.fullmatch(NUM + r' : ' + NUM + r' = \?', t)
    if m:
        c, b = int(m[1]), int(m[2])
        if 2 <= b <= 9 and c % b == 0 and 1 <= c // b <= 10:
            return 'divide-%d' % b
        return None
    body = re.sub(r'^Số thích hợp điền vào ô trống: ', '', t)
    if re.fullmatch(r'\? × ' + NUM + ' = ' + NUM, body) or re.fullmatch(NUM + r' × \? = ' + NUM, body):
        return 'missing-factor'
    if re.fullmatch(r'\? : ' + NUM + ' = ' + NUM, body):
        return 'missing-dividend'
    if re.fullmatch(NUM + r' : \? = ' + NUM, body):
        return 'missing-divisor'
    m = re.fullmatch(r'Tính: ' + NUM + r' × ' + NUM + r' ([+-]) ' + NUM + r' = \?', t)
    if m and int(m[1]) == int(m[4]) and 2 <= int(m[1]) <= 9:
        return 'rel-them-bot'
    return None


def main():
    data = json.load(open(FILE, encoding='utf-8'))
    qs = data['topic']['questions']
    tagged, unmatched = [], []
    for q in qs:
        if q.get('skill'):
            continue
        sk = classify(q['q'])
        if sk:
            tagged.append((q['id'], sk))
            if '--write' in sys.argv:
                q['skill'] = sk
        else:
            unmatched.append(q)
    print('Khớp mẫu chắc chắn: %d câu' % len(tagged))
    from collections import Counter
    for k, v in sorted(Counter(s for _, s in tagged).items()):
        print('  %-16s %d' % (k, v))
    print('\nKHÔNG khớp mẫu — rà tay (%d câu):' % len(unmatched))
    for q in unmatched:
        print('- `%s` %s' % (q['id'], norm(q['q'])))
    if '--write' in sys.argv:
        with open(FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write('\n')
        print('\nĐã ghi', FILE)


if __name__ == '__main__':
    main()
