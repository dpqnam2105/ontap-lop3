#!/usr/bin/env python3
"""Sinh data-lop3/tieng-anh/pilot-spell-fix.json — pilot sửa chính tả (Codex duyệt 30/10/2026).

13 mục luyện (type "spell-fix") → 12 từ đích → câu kiểm tra (trắc nghiệm có sẵn hoặc K1–K3 mới).
Nguồn lỗi tách riêng: that = Thỏ đã viết sai; phieu = lỗi Claude đặt trong bài sửa lỗi phiếu 22/10; tk = nhiễu tự thiết kế.
acceptEdits được TÍNH từ wrong/target (mọi vị trí tạo ra đúng từ đích), không gõ tay.
Phần kiểm độ mơ hồ (từ điển) nằm ở docs/pilot-spell-fix.md — KHÔNG hiện cho bé.
Chạy lại cho ra cùng một file.
"""
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'data-lop3', 'tieng-anh', 'pilot-spell-fix.json')
DATE = '2026-10-30'
SRC = 'claude-pilot-spell-fix-20261030'
REVIEW = 'codex-noi-dung-20261030'

ES = {
    'that': 'Lỗi Thỏ đã viết sai',
    'phieu': 'Lỗi đặt sẵn trong bài sửa lỗi của phiếu luyện (không phải lỗi của bé)',
    'tk': 'Nhiễu tự thiết kế',
}

# (mã, sai, đích, thao tác, chữ cho chọn khi điền, ngữ cảnh, nghĩa, chú nghĩa thêm, nguồn, ghi chú nguồn, checkId, gợi ý, giải thích)
P = [
    ('p01', "didin't", "didn't", 'delete', None, "It was sunny. It ___ rain yesterday.", 'không (phủ định, quá khứ)', [],
     'that', 'Phiếu trường "PAST SIMPLE – Positive and Negative" Thỏ làm 23/10/2026: viết "didin\'t" ở 6 câu',
     'en_nik3-past-didnt_q009', 'did + n\'t: chỉ có một chữ i.', "didn't = did not. Chỉ một chữ i: d-i-d-n-'-t."),
    ('p02', 'smilied', 'smiled', 'delete', None, 'The baby ___ at me yesterday.', 'mỉm cười (smile → quá khứ)', [],
     'that', 'Phiếu trường 23/10/2026: viết "smilied" 2 lần',
     'en_sp_pilot_k01', 'smile tận cùng bằng e → chỉ thêm d.', 'smile + d = smiled. Không có chữ i chen vào.'),
    ('p03', 'dinnner', 'dinner', 'delete', None, "We eat ___ at seven o'clock in the evening.", 'bữa tối', [],
     'that', 'Sách Ms Hoa Junior Explorer 2 U6 — cô chữa "dinnner"',
     'en_mshoa-e2-u6_q012', 'Đếm lại số chữ n.', 'dinner có hai chữ n: d-i-n-n-e-r.'),
    ('p04', 'diner', 'dinner', 'insert', ['n', 'm', 'r'], 'Mom cooked fish for ___ last night.', 'bữa tối', [],
     'that', 'Bài thi giữa kỳ I Tiếng Anh: viết "diner"',
     'en_mshoa-e2-u6_q012', 'Bữa tối viết có hai chữ n.', 'dinner (bữa tối) có hai chữ n: d-i-n-n-e-r.'),
    ('p05', 'broush', 'brush', 'delete', None, 'I ___ my teeth every morning.', 'đánh (răng)', [],
     'that', 'Sách Ms Hoa Junior Explorer 2 U6 — cô chữa "broush"',
     'en_sp_pilot_k02', 'Đọc chậm: /brʌʃ/ — chỉ có một nguyên âm.', 'brush: b-r-u-s-h, không có chữ o.'),
    ('p06', 'luch', 'lunch', 'insert', ['n', 'm', 't'], "We eat ___ at school at twelve o'clock.", 'bữa trưa', [],
     'that', 'Sách Ms Hoa Junior Explorer 2 U6 — cô chữa "luch"',
     'en_mshoa-e2-u6_q011', 'Đọc chậm: lun-ch — nghe thấy âm n.', 'lunch: l-u-n-c-h.'),
    ('p07', 'likeed', 'liked', 'delete', None, 'I ___ the story about dinosaurs yesterday.', 'thích (like → quá khứ)', [],
     'phieu', 'PastSimple-ED-Phieu1 (22/10/2026) Bài 4 sửa lỗi: "likeed"',
     'en_nik3-past-ed_q006', 'like tận cùng bằng e → chỉ thêm d.', 'like + d = liked. "likeed" thừa một chữ e.'),
    ('p08', 'jumpped', 'jumped', 'delete', None, 'The cat ___ onto the table last night.', 'nhảy (jump → quá khứ)',
     [{'text': 'onto the table', 'vi': 'lên trên bàn'}],
     'phieu', 'PastSimple-ED-Phieu1 (22/10/2026) Bài 4 sửa lỗi: "jumpped"',
     'en_nik3-past-ed_q004', 'jump tận cùng bằng hai phụ âm (m, p) → không gấp đôi.', 'jump + ed = jumped, chỉ một chữ p.'),
    ('p09', 'chated', 'chatted', 'insert', ['t', 'd', 'l'], 'We ___ with Grandma on the phone last Sunday.', 'trò chuyện (chat → quá khứ)',
     [{'text': 'on the phone', 'vi': 'qua điện thoại'}],
     'phieu', 'PastSimple-ED-Phieu1 (22/10/2026) Bài 4 sửa lỗi: "chated"',
     'en_nik3-past-ed_q019', 'chat: phụ âm – nguyên âm – phụ âm → gấp đôi chữ cuối.', 'chat → chatted (gấp đôi t rồi thêm ed).'),
    ('p10', 'waveed', 'waved', 'delete', None, 'The children ___ goodbye to their teacher yesterday.', 'vẫy tay (wave → quá khứ)',
     [{'text': 'wave goodbye', 'vi': 'vẫy tay chào tạm biệt'}],
     'tk', 'Nhiễu của câu web en_nik3-past-ed_q008',
     'en_nik3-past-ed_q008', 'wave tận cùng bằng e → chỉ thêm d.', 'wave + d = waved.'),
    ('p11', 'droped', 'dropped', 'insert', ['p', 'd', 't'], 'Ben ___ his ball into the river last week.', 'làm rơi (drop → quá khứ)', [],
     'tk', 'Nhiễu của câu web en_nik3-past-ed_q018',
     'en_nik3-past-ed_q018', 'drop: phụ âm – nguyên âm – phụ âm → gấp đôi chữ cuối.', 'drop → dropped (gấp đôi p rồi thêm ed).'),
    ('p12', 'noded', 'nodded', 'insert', ['d', 't', 'n'], 'Mai ___ when Mom asked, "Are you hungry?"', 'gật đầu (nod → quá khứ)', [],
     'tk', 'Nhiễu của câu web en_nik3-past-ed_q020',
     'en_nik3-past-ed_q020', 'nod: phụ âm – nguyên âm – phụ âm → gấp đôi chữ cuối.', 'nod → nodded (gấp đôi d rồi thêm ed).'),
    ('p13', 'stoped', 'stopped', 'insert', ['p', 't', 'd'], 'The bus ___ at the zoo last Sunday.', 'dừng lại (stop → quá khứ)', [],
     'tk', 'Nhiễu tự thiết kế (Codex chọn 30/10)',
     'en_sp_pilot_k03', 'stop: phụ âm – nguyên âm – phụ âm → gấp đôi chữ cuối.', 'stop → stopped (gấp đôi p rồi thêm ed).'),
]
MSHOA = {'p03', 'p05', 'p06'}   # lỗi lấy từ sách Ms Hoa U6; các mục khác theo NIK3 U3 (Past Simple) / bài thi
TARGET_ID = lambda t: t.replace("'", '')   # didn't → didnt

K = [
    ('k01', 'smiled', '"smile" in the past is:', ['smiled', 'smilied', 'smileed', 'smilled'], 0,
     'smile tận cùng bằng e → chỉ thêm d: smiled.'),
    ('k02', 'brush', 'Choose the correct spelling: ___ your teeth (đánh răng)', ['brush', 'broush', 'brosh', 'bruhs'], 0,
     'brush your teeth = đánh răng. brush: b-r-u-s-h.'),
    ('k03', 'stopped', '"stop" in the past is:', ['stopped', 'stoped', 'stopet', 'stoppd'], 0,
     'stop: phụ âm – nguyên âm – phụ âm → gấp đôi p rồi thêm ed: stopped.'),
]


def edits(wrong, target, op, letters):
    if op == 'delete':
        return [{'op': 'delete', 'index': i} for i in range(len(wrong)) if wrong[:i] + wrong[i + 1:] == target]
    return [{'op': 'insert', 'index': i, 'letter': c} for i in range(len(wrong) + 1) for c in letters
            if wrong[:i] + c + wrong[i:] == target]


def ref(note):
    return {'basis': 'pilot', 'note': note, 'toc': [], 'extraWords': [], 'by': 'claude', 'date': DATE, 'contentReview': REVIEW}


qs = []
for (code, wrong, target, op, letters, ctx, meaning, glosses, es, esnote, check, hint, explain) in P:
    acc = edits(wrong, target, op, letters or [])
    assert acc, code
    q = {
        'id': 'en_sp_pilot_' + code, 'type': 'spell-fix',
        'q': 'Sửa từ viết sai trong câu.',
        'sentence': ctx, 'wrong': wrong, 'target': target, 'op': op,
    }
    if op == 'insert': q['letters'] = letters
    q.update({
        'acceptEdits': acc,
        'meaning': meaning, 'glosses': glosses,
        'targetId': TARGET_ID(target), 'checkId': check,
        'errorSource': es, 'errorSourceNote': esnote,
        'hint': hint, 'explain': explain,
        'skill': 'spelling-fix', 'difficulty': 1, 'book': 'mshoa-explorer2' if code in MSHOA else 'nik3',
        'track': 'core', 'stage': 2, 'source': SRC,
        'ref': ref('Pilot sửa chính tả. Nguồn lỗi: %s — %s.' % (ES[es], esnote)),
    })
    if target == 'dinner': q['variantGroup'] = 'dinner'
    qs.append(q)

for code, target, text, choices, a, explain in K:
    qs.append({
        'id': 'en_sp_pilot_' + code, 'q': text, 'choices': choices, 'a': a,
        'pilotCheck': True, 'noHint': True, 'targetId': TARGET_ID(target),
        'explain': explain, 'skill': 'spelling', 'difficulty': 1, 'book': 'mshoa-explorer2' if code == 'k02' else 'nik3',
        'track': 'core', 'stage': 2, 'source': SRC,
        'ref': ref('Câu kiểm tra độc lập của pilot: đề không chứa từ sai; chỉ dùng trong lượt đo, không hiện gợi ý.'),
    })

targets = []
for p in P:
    tid = TARGET_ID(p[2])
    if tid not in [t['targetId'] for t in targets]:
        targets.append({'targetId': tid, 'word': p[2], 'checkId': p[10],
                        'practiceIds': ['en_sp_pilot_' + x[0] for x in P if TARGET_ID(x[2]) == tid]})

data = {'topic': {
    'id': 'en_pilot-spell-fix', 'icon': '✏️', 'name': '✏️ Thử: Sửa chính tả',
    'pilot': {
        'onlyWith': '?pilot=1',
        'measure': 'Lần 0 trước khi luyện + lần 1 sau 3–5 ngày: làm 12 câu checkId, tắt mọi trợ giúp (không gợi ý, không từ sai từng sửa, không đáp án cũ, không tự đọc từ đúng). Đúng → "đã kiểm tra lại đúng", không phải "thành thạo viết".',
        'onePerSession': ['variantGroup'],
        'errorSources': ES,
        'targets': targets,
    },
    'questions': qs,
}}

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2); f.write('\n')
print('Đã ghi', OUT, '—', len(P), 'mục luyện,', len(targets), 'từ đích,', len(K), 'câu kiểm tra mới')
