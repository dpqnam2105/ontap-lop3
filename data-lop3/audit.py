#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tien ich kiem tra du lieu lop 3 theo nguon (source).

Cach dung (chay tu thu muc chua data-lop3):
  python3 audit.py                 # thong ke tat ca: tong cau, theo nguon, theo mon
  python3 audit.py --source ai     # liet ke tat ca cau co source = ai (de soi)
  python3 audit.py --no-source     # liet ke cau CHUA gan nhan source
"""
import json, os, sys, glob

ROOT = 'data-lop3'

def load_all():
    items = []
    for path in glob.glob(os.path.join(ROOT, '*', '*.json')):
        if os.path.basename(path) == 'index.json':
            continue
        try:
            d = json.load(open(path, encoding='utf-8'))
        except Exception:
            continue
        topic = d.get('topic', {})
        for q in topic.get('questions', []):
            items.append((path, topic.get('id', ''), q))
    return items

def main():
    args = sys.argv[1:]
    items = load_all()
    total = len(items)

    if '--source' in args:
        want = args[args.index('--source') + 1]
        hits = [(p, q) for p, _, q in items if q.get('source') == want]
        print(f"Cau co source='{want}': {len(hits)}")
        for p, q in hits:
            print(f"  [{os.path.relpath(p)}] {q.get('id','?')}: {q.get('q','')[:60]}")
        return

    if '--no-source' in args:
        miss = [(p, q) for p, _, q in items if not q.get('source')]
        print(f"Cau CHUA gan source: {len(miss)}")
        for p, q in miss:
            print(f"  [{os.path.relpath(p)}] {q.get('id','?')}: {q.get('q','')[:60]}")
        return

    # thong ke chung
    by_source = {}
    by_subject = {}
    for p, tid, q in items:
        s = q.get('source', '(chua gan)')
        by_source[s] = by_source.get(s, 0) + 1
        subj = os.path.basename(os.path.dirname(p))
        by_subject[subj] = by_subject.get(subj, 0) + 1

    print(f"TONG: {total} cau")
    print("\nTheo nguon:")
    for s, n in sorted(by_source.items()):
        print(f"  {s:12} {n}")
    print("\nTheo mon:")
    for s, n in sorted(by_subject.items()):
        print(f"  {s:18} {n}")

if __name__ == '__main__':
    main()
