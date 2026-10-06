#!/usr/bin/env python3
"""ĐỀ XUẤT gắn bài (lesson) cho câu Toán GĐ1 — KHÔNG sửa dữ liệu, chỉ xuất bảng để rà.

Chạy:  python3 tools/lesson_map.py   → ghi docs/gan-bai-toan-gd1.md + docs/gan-bai-toan-gd1.csv

Căn cứ: MỤC LỤC SGK Toán 3 Kết nối tri thức tập một (bản PDF Nam gửi 25/9) — tên bài + trang.
Chưa đối chiếu nội dung từng trang (bản scan không có lớp chữ), nên mức tin cậy chia 3 loại:
  muc-luc   tên bài trong mục lục nêu đúng kỹ năng của câu (vd "Bảng nhân 4, bảng chia 4" ↔ 4 × 7)
  suy-luan  gắn theo phần bảng mà câu thuộc về / kiến thức cần dùng; cần Codex/Nam rà
  chua-gan  chưa đủ căn cứ (không thấy bài tương ứng trong mục lục tập một, hoặc đang chờ trang sách)
Câu nâng cao (track enrich) KHÔNG gắn bài: chỉ thống kê và điều kiện kiến thức cần trước (prereq).
"""
import csv
import collections
import json
import os
import re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
D = os.path.join(ROOT, 'data-lop3', 'toan')
BOOK = 'kntt-toan3'
TOC = {  # bài: (tên, trang) — mục lục tập một
    1: ('Ôn tập các số đến 1000', 6), 2: ('Ôn tập cộng, trừ trong phạm vi 1000', 9),
    3: ('Tìm thành phần trong phép cộng, phép trừ', 11), 4: ('Ôn tập bảng nhân 2, 5, bảng chia 2, 5', 14),
    5: ('Bảng nhân 3, bảng chia 3', 16), 6: ('Bảng nhân 4, bảng chia 4', 19), 7: ('Ôn tập hình học và đo lường', 21),
    8: ('Luyện tập chung', 24), 9: ('Bảng nhân 6, bảng chia 6', 28), 10: ('Bảng nhân 7, bảng chia 7', 31),
    11: ('Bảng nhân 8, bảng chia 8', 33), 12: ('Bảng nhân 9, bảng chia 9', 36),
    13: ('Tìm thành phần trong phép nhân, phép chia', 39), 14: ('Một phần mấy', 42), 15: ('Luyện tập chung', 46),
}
TABLE_LESSON = {2: 4, 5: 4, 3: 5, 4: 6, 6: 9, 7: 10, 8: 11, 9: 12}
CORE = ['bang-nhan-chia', 'phan-so-don-gian', 'do-luong', 'xem-dong-ho-thoi-gian', 'giai-toan-co-loi-van', 'on-tap-tong-hop']
ENRICH = ['tu-duy-so', 'loi-van-hay', 'tu-duy-logic', 'kieu-kangaroo', 'dem-hinh-gap-khuc', 'day-so-cach-deu', 'so-do-doan-thang']


def src(n):
    t, p = TOC[n]
    return 'Mục lục SGK Toán 3 KNTT tập một: B%d %s (tr.%d)' % (n, t, p)


def load(t):
    return json.load(open(os.path.join(D, t + '.json'), encoding='utf-8'))['topic']['questions']


def section_tables(qs):
    """Kho bảng nhân chia xếp theo phần: mỗi phần là một dãy ≥ 3 câu times-N/divide-N liên tiếp cùng N
    (bỏ qua câu khác kỹ năng xen giữa). Trả (phần của từng câu, các câu bảng "lạc phần" như 9 × 4 trong phần bảng 4)."""
    tab = []
    for q in qs:
        m = re.fullmatch(r'(times|divide)-(\d)', q.get('skill') or '')
        tab.append(int(m.group(2)) if m else None)
    idx = [i for i, n in enumerate(tab) if n is not None]
    main = set()
    k = 0
    while k < len(idx):
        j = k
        while j + 1 < len(idx) and tab[idx[j + 1]] == tab[idx[k]]: j += 1
        if j - k + 1 >= 3: main.update(idx[k:j + 1])
        k = j + 1
    sec, cur, stray = {}, None, set()
    for i, q in enumerate(qs):
        if i in main: cur = tab[i]
        elif tab[i] is not None: stray.add(q['id'])
        sec[q['id']] = cur
    return sec, stray


def nums(text):
    return [int(x) for x in re.findall(r'\d+', text)]


def propose():
    rows = []
    # ---- Bảng nhân, chia ----
    qs = load('bang-nhan-chia')
    sec, stray = section_tables(qs)
    for q in qs:
        if q.get('stage') != 1:
            continue
        sk, sec_t = q.get('skill') or '', sec[q['id']]
        row = dict(id=q['id'], topic='bang-nhan-chia', skill=sk, q=q['q'].replace('\n', ' '))
        m = re.fullmatch(r'(times|divide)-(\d)', sk)
        if m:
            n = int(m.group(2)); L = TABLE_LESSON[n]
            if q['id'] in stray and sec_t and TABLE_LESSON.get(sec_t, 0) < L:
                row.update(lesson=L, conf='suy-luan', source=src(L),
                           note='Câu %s nằm trong phần bảng %d (B%d): nếu sách dùng tính chất đổi chỗ thừa số thì có thể là B%d' % (q['q'].strip(), sec_t, TABLE_LESSON[sec_t], TABLE_LESSON[sec_t]))
            else:
                row.update(lesson=L, conf='muc-luc', source=src(L), note='bảng %d' % n)
        elif sk in ('missing-factor', 'missing-dividend', 'missing-divisor'):
            row.update(lesson=13, conf='muc-luc', source=src(13),
                       note='Tên bài B13 khớp. Lưu ý: câu nằm trong phần bảng %d (B%d) — nếu sách cho tìm số thiếu ngay trong bài bảng thì là B%d' % (sec_t, TABLE_LESSON[sec_t], TABLE_LESSON[sec_t]))
        elif sk in ('skip-count', 'rel-them-bot', 'mul-div-relation', 'compare-quotients', 'word-problem',
                    'cmp-tich', 'table-product-membership', 'common-table-product'):
            # Theo phần bảng chứa câu (số nhóm trong lời văn không phải bảng cần dùng: "4 bánh × 8 xe" dùng bảng 4)
            if sk == 'word-problem' and q['id'] >= 'toan_bang-nhan-chia_q149':
                # 4 câu cuối kho không nằm trong phần bảng nào: theo số chia / số trong "mỗi …"
                m = re.search(r'(?:[Mm]ỗi [^,.?]*?|xếp đều vào |chia đều [^,.?]*? cho )(\d)\b', q['q'])
                t = int(m.group(1)) if m else None
                L = TABLE_LESSON.get(t)
                row.update(lesson=L, conf='suy-luan', source=src(L) if L else '', note='lời văn cuối kho, theo bảng %s' % t)
            else:
                L = TABLE_LESSON.get(sec_t)
                note = 'theo phần bảng %d' % sec_t
                if sk in ('table-product-membership', 'common-table-product', 'cmp-tich') or (sk == 'word-problem' and q['id'] == 'toan_bang-nhan-chia_q111'):
                    note += ' (khối câu trộn bảng 4, 6, 7 sau bảng 7 — cần đã học các bảng này; có thể là B15 Luyện tập chung)'
                row.update(lesson=L, conf='suy-luan', source=src(L), note=note)
        else:
            row.update(lesson=None, conf='chua-gan', source='', note='kỹ năng chưa có quy tắc')
        rows.append(row)
    # ---- Một phần mấy ----
    for q in load('phan-so-don-gian'):
        if q.get('stage') != 1:
            continue
        row = dict(id=q['id'], topic='phan-so-don-gian', skill=q.get('skill'), q=q['q'].replace('\n', ' '))
        if q.get('skill') == 'tim-phan':
            row.update(lesson=None, conf='chua-gan', source='', note='"a là mấy phần của b": chờ trang sách (có thể B14 hoặc B39) — Codex yêu cầu không đoán')
        else:
            row.update(lesson=14, conf='muc-luc', source=src(14), note='')
        rows.append(row)
    # ---- Đo lường, đồng hồ ----
    for q in load('do-luong'):
        if q.get('stage') == 1:
            rows.append(dict(id=q['id'], topic='do-luong', skill=q.get('skill'), q=q['q'], lesson=7, conf='suy-luan', source=src(7),
                             note='đơn vị lớp 2 (m, dm, cm, km, kg) — ôn trong B7; chưa xem trang 21–23'))
    for q in load('xem-dong-ho-thoi-gian'):
        if q.get('stage') == 1:
            rows.append(dict(id=q['id'], topic='xem-dong-ho-thoi-gian', skill=q.get('skill'), q=q['q'], lesson=None, conf='chua-gan', source='',
                             note='xem giờ / lịch là kiến thức lớp 2; mục lục tập một không có bài riêng (có thể nằm trong B7) — chờ trang sách'))
    # ---- Giải toán có lời văn, Ôn tập tổng hợp ----
    manual = {
        'toan_giai-toan-co-loi-van_q001': (2, 'muc-luc', 'cộng trong 1000'), 'toan_giai-toan-co-loi-van_q002': (2, 'muc-luc', 'trừ trong 1000'),
        'toan_giai-toan-co-loi-van_q003': (2, 'suy-luan', 'bài "nhiều hơn" hỏi số bé (bẫy đảo chiều), số ≤ 100'),
        'toan_giai-toan-co-loi-van_q004': (2, 'suy-luan', 'bài "ít hơn" hỏi số lớn (bẫy đảo chiều)'),
        'toan_giai-toan-co-loi-van_q011': (2, 'muc-luc', 'trừ trong 1000'),
        'toan_giai-toan-co-loi-van_q012': (10, 'suy-luan', '7 × 6 — bảng nhân 7'), 'toan_giai-toan-co-loi-van_q015': (6, 'suy-luan', '36 : 4 — bảng chia 4'),
        'toan_on-tap-tong-hop_q006': (11, 'muc-luc', '8 × 7 — bảng nhân 8'), 'toan_on-tap-tong-hop_q008': (11, 'muc-luc', '72 : 8 — bảng chia 8'),
        'toan_on-tap-tong-hop_q009': (14, 'muc-luc', 'một phần mấy'),
        'toan_on-tap-tong-hop_q014': (2, 'suy-luan', '"kém" = ít hơn, hỏi số lớn'),
        'toan_on-tap-tong-hop_q013': (None, 'chua-gan', 'xem đồng hồ — như chủ đề đồng hồ'),
    }
    for t in ['giai-toan-co-loi-van', 'on-tap-tong-hop']:
        for q in load(t):
            if q.get('stage') != 1:
                continue
            L, c, note = manual.get(q['id'], (None, 'chua-gan', 'chưa rà'))
            rows.append(dict(id=q['id'], topic=t, skill=q.get('skill'), q=q['q'], lesson=L, conf=c, source=src(L) if L else '', note=note))
    return rows


def enrich_stats():
    out = []
    for t in ENRICH:
        qs = [q for q in load(t) if q.get('stage') == 1]
        out.append((t, len(qs), sum(1 for q in qs if q.get('prereq')), sum(1 for q in qs if q.get('image'))))
    return out


# Câu Codex yêu cầu chờ — vòng 9 đã chốt hết (xem docs/doi-chieu-sgk-toan3-t1.md mục 6)
PENDING = {}


def status(r, data_q):
    if data_q.get('lesson'):
        return 'da-ghi'
    if (data_q.get('lessonRef') or {}).get('basis') == 'nen':
        return 'nen'                # Codex chốt: kiến thức nền lớp 2, không gắn bài
    if r['id'] in PENDING:
        return 'cho-quyet'
    if r['conf'] == 'chua-gan':
        return 'chua-gan'
    if r['conf'] == 'muc-luc':
        return 'cho-duyet'          # khớp tên bài nhưng chưa duyệt phạm vi nội dung bài (đặc biệt B13, B14)
    return 'cho-duyet'


def main():
    rows = propose()
    allq = {}
    for t in CORE:
        for q in load(t):
            allq[q['id']] = q
    for r in rows:
        dq = allq[r['id']]
        r['status'] = status(r, dq)
        if r['status'] == 'da-ghi':
            r['lesson'] = dq['lesson']['no']; r['conf'] = dq['lessonRef']['basis']; r['note'] = dq['lessonRef']['note']
        elif r['status'] == 'nen':
            r['lesson'] = None; r['conf'] = 'nen'; r['note'] = dq['lessonRef']['note']
        if r['id'] in PENDING:
            r['note'] = PENDING[r['id']]
    md = os.path.join(ROOT, 'docs', 'gan-bai-toan-gd1.md')
    cv = os.path.join(ROOT, 'docs', 'gan-bai-toan-gd1.csv')
    with open(cv, 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f, lineterminator='\n')
        w.writerow(['id', 'chủ đề', 'kỹ năng', 'bài', 'trạng thái', 'mức bằng chứng', 'nguồn đối chiếu', 'ghi chú', 'đề'])
        for r in rows:
            w.writerow([r['id'], r['topic'], r['skill'], ('B%d' % r['lesson']) if r['lesson'] else '', r['status'], r['conf'], r['source'], r['note'], r['q']])
    conf = collections.Counter(r['conf'] for r in rows)
    by_l = collections.Counter(r['lesson'] for r in rows if r['lesson'])
    st = collections.Counter(r['status'] for r in rows)
    o = ['# Gắn bài cho câu Toán GĐ1', '',
         '**Ý nghĩa đã chốt**: `lesson` = bài SỚM NHẤT mà kiến thức đã học đủ để làm câu theo cách giải được hướng dẫn — '
         'không có nghĩa "câu lấy từ bài đó trong SGK". `source` gốc giữ nguyên; căn cứ ghi trong `lessonRef.basis` (muc-luc / suy-luan / trang-sach / nen).', '',
         '## Trạng thái', '', '| Trạng thái | Số câu | Nghĩa |', '|---|---|---|',
         '| da-ghi | %d | đã ghi `lesson` + `lessonRef` vào dữ liệu (nhóm Codex duyệt) |' % st.get('da-ghi', 0),
         '| cho-quyet | %d | Codex yêu cầu chờ: cách giải trong gợi ý chưa khớp bài, hoặc cần xác nhận |' % st.get('cho-quyet', 0),
         '| nen | %d | Codex chốt không gắn bài: kiến thức nền lớp 2 (đổi độ dài, ước lượng kg) — có `lessonRef.basis = nen`, không có `lesson` |' % st.get('nen', 0),
         '| cho-duyet | %d | lô 1 (bảng nhân/chia trực tiếp, cộng trừ B2) — đề xuất muc-luc, chờ Codex duyệt |' % st.get('cho-duyet', 0),
         '| chua-gan | %d | chưa đủ căn cứ |' % st.get('chua-gan', 0), '',
         '## Chờ quyết', '', '| id | đề | ghi chú |', '|---|---|---|'] + [
         '| `%s` | %s | %s |' % (r['id'].replace('toan_', ''), r['q'][:60], r['note']) for r in rows if r['status'] == 'cho-quyet'] + ['',
         '---', '', '# Đề xuất ban đầu (vòng 5) — giữ để đối chiếu', '',
         '_Sinh bởi `python3 tools/lesson_map.py`. Bảng đầy đủ: `docs/gan-bai-toan-gd1.csv` (id → bài → kỹ năng → nguồn → ghi chú)._', '',
         '**Căn cứ**: mục lục SGK Toán 3 KNTT tập một (tên bài + trang). Chưa đối chiếu nội dung từng trang (bản scan không có lớp chữ). '
         'Vì vậy chỉ có hai mức: `muc-luc` (tên bài nêu đúng kỹ năng) và `suy-luan` (theo phần bảng / kiến thức cần — cần rà). '
         'Câu chưa đủ căn cứ để `chua-gan`.', '',
         '## Tổng hợp (câu core GĐ1: %d)' % len(rows), '',
         '| Mức | Số câu |', '|---|---|'] + ['| %s | %d |' % (k, conf.get(k, 0)) for k in ['muc-luc', 'suy-luan', 'chua-gan']] + ['',
         '| Bài | Tên | Số câu đề xuất |', '|---|---|---|'] + ['| B%d | %s | %d |' % (l, TOC[l][0], by_l[l]) for l in sorted(by_l)] + ['']
    o += ['## Câu phân vân (`suy-luan`) — nhờ Codex/Nam rà', '', '| id | đề | bài đề xuất | lý do |', '|---|---|---|---|']
    o += ['| `%s` | %s | B%s | %s |' % (r['id'].replace('toan_', ''), r['q'][:70], r['lesson'], r['note']) for r in rows if r['conf'] == 'suy-luan']
    o += ['', '## Chưa gắn (`chua-gan`)', '', '| id | đề | lý do |', '|---|---|---|']
    o += ['| `%s` | %s | %s |' % (r['id'].replace('toan_', ''), r['q'][:70], r['note']) for r in rows if r['conf'] == 'chua-gan']
    o += ['', '## Gắn theo tên bài (`muc-luc`) — tóm tắt theo kỹ năng', '', '| Kỹ năng | Bài | Số câu |', '|---|---|---|']
    agg = collections.Counter((r['skill'], r['lesson']) for r in rows if r['conf'] == 'muc-luc')
    o += ['| %s | B%d | %d |' % (k[0], k[1], v) for k, v in sorted(agg.items(), key=lambda kv: (kv[0][1], kv[0][0]))]
    o += ['', '## Câu nâng cao GĐ1 (track enrich) — KHÔNG gắn bài', '', '| Chủ đề | Số câu GĐ1 | Đã có prereq | Có hình |', '|---|---|---|---|']
    o += ['| %s | %d | %d | %d |' % x for x in enrich_stats()]
    o += ['', 'Đề xuất: mọi câu nâng cao mang `track: enrich`; `prereq` bổ sung dần theo từng dạng (đã có 19 câu). '
          'Không ép vào một bài SGK chỉ vì cùng phép tính.', '']
    open(md, 'w', encoding='utf-8').write('\n'.join(o))
    print('Đã ghi', md, 'và', cv, '—', dict(conf))


if __name__ == '__main__':
    main()
