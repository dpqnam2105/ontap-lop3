# Pilot sửa chính tả (spell-fix) — bảng nội dung v1 (30/10/2026)

Trạng thái: **Codex duyệt 30/10** (13 mục, K1–K3). Dữ liệu: `data-lop3/tieng-anh/pilot-spell-fix.json` (sinh bởi `tools/build_pilot_spell_fix.py`, test `tests/pilot-spell-fix.test.js`) trên nhánh `content/pilot-spell-fix`. Chưa code giao diện. Khung: dot0 rebase lên main trên nhánh tích hợp riêng, chạy sau `?pilot=1`.

## Nguyên tắc
- 13 mục luyện, 12 từ đích. `dinner` có 2 biến thể (thiếu n / thừa n), mỗi lượt chỉ chọn một.
- Mỗi mục đúng 1 thao tác: xóa 1 chữ, hoặc điền 1 chữ (chọn trong 3 chữ cho sẵn).
- Chấm theo từ sau khi sửa (chuẩn hoá: chữ thường, ’ = '). `responseKey` = từ đã chuẩn hoá. Vì vậy xóa chữ n khác trong `dinnner` vẫn là cùng một câu trả lời.
- Câu ngữ cảnh không chứa đúng chính tả của bất kỳ từ đích nào trong 12 từ.
- Nguồn:
  - **thật**: lỗi Thỏ đã viết (có nơi ghi).
  - **phiếu**: lỗi Claude đặt trong bài sửa lỗi của phiếu luyện 22/10, không phải lỗi của bé.
  - **thiết kế**: nhiễu tự thiết kế (đã dùng làm nhiễu ở câu web lô 4).

## Bảng 13 mục luyện → 12 từ đích → câu kiểm tra

| # | Từ sai → đích | Thao tác | Ngữ cảnh (chỗ ___ hiện từ sai để sửa) | Nghĩa | Nguồn | Kiểm độ mơ hồ | Câu kiểm tra |
|---|---|---|---|---|---|---|---|
| 1 | didin't → didn't | xóa | It was sunny. It ___ rain yesterday. | did not: không (quá khứ) | thật — phiếu trường 23/10, 6 lần | 1 cách đúng (xóa i thứ hai); không ra từ khác | có sẵn `en_nik3-past-didnt_q009` |
| 2 | smilied → smiled | xóa | The baby ___ at me yesterday. | smile: mỉm cười | thật — phiếu trường 23/10, 2 lần | 1 cách (xóa i thứ hai); không ra từ khác | **mới** K1 |
| 3a | dinnner → dinner | xóa | We eat ___ at seven o'clock in the evening. | bữa tối | thật — sách Ms Hoa U6, cô chữa | 3 cách (n bất kỳ), đều tính 1 đáp án | có sẵn `en_mshoa-e2-u6_q012` |
| 3b | diner → dinner | điền (n/m/r) | Mom cooked fish for ___ last night. | bữa tối | thật — bài thi giữa kỳ I | "diner" là từ có thật → bắt buộc có ngữ cảnh + nghĩa; với n/m/r không ra từ khác (đã loại s→diners, g→dinger) | như 3a |
| 4 | broush → brush | xóa | I ___ my teeth every morning. | đánh (răng) | thật — sách Ms Hoa U6 | 1 cách; xóa b ra "roush" (tên riêng hiếm, không hợp ngữ cảnh) | **mới** K2 |
| 5 | luch → lunch | điền (n/m/t) | We eat ___ at school at twelve o'clock. | bữa trưa | thật — sách Ms Hoa U6 | không dùng chữ r (ra lurch); với n/m/t không ra từ khác | có sẵn `en_mshoa-e2-u6_q011` |
| 6 | likeed → liked | xóa | I ___ the story about dinosaurs yesterday. | thích | phiếu — phiếu 22/10 Bài 4 | 2 cách (e nào cũng được) | có sẵn `en_nik3-past-ed_q006` |
| 7 | jumpped → jumped | xóa | The cat ___ onto the table last night. | nhảy | phiếu — phiếu 22/10 Bài 4 (cũng là nhiễu ở `en_nik3-past-ed_q004`) | 2 cách (p nào cũng được) | có sẵn `en_nik3-past-ed_q004` |
| 8 | chated → chatted | điền (t/d/l) | We ___ with Grandma on the phone last Sunday. | trò chuyện | phiếu — phiếu 22/10 Bài 4 | không dùng e/n/r (ra cheated, chanted, charted); với t/d/l không ra từ khác | có sẵn `en_nik3-past-ed_q019` |
| 9 | waveed → waved | xóa | The children ___ goodbye to their teacher yesterday. | vẫy tay | thiết kế — nhiễu ở `en_nik3-past-ed_q008` | 2 cách | có sẵn `en_nik3-past-ed_q008` |
| 10 | droped → dropped | điền (p/d/t) | Ben ___ his ball into the river last week. | làm rơi | thiết kế — nhiễu ở `en_nik3-past-ed_q018` | không ra từ khác | có sẵn `en_nik3-past-ed_q018` |
| 11 | noded → nodded | điền (d/t/n) | Mai ___ when Mom asked, "Are you hungry?" | gật đầu | thiết kế — nhiễu ở `en_nik3-past-ed_q020` | "noded" có trong từ điển lớn (thuật ngữ thực vật, rất hiếm); không ra từ khác | có sẵn `en_nik3-past-ed_q020` |
| 12 | stoped → stopped | điền (p/t/d) | The bus ___ at the zoo last Sunday. | dừng lại (từ mới, chú nghĩa) | thiết kế (Codex chọn) | không dùng m/o (ra stomped, stooped); "stoped" là thuật ngữ mỏ rất hiếm | **mới** K3 |

Tổng nguồn: thật 6 mục / 5 từ đích, phiếu 3, thiết kế 4.

Cách kiểm: liệt kê mọi kết quả của 1 lần xóa (hoặc 1 lần điền, với cả 26 chữ và với bộ 3 chữ cho sẵn), dò trong từ điển web2 + gcide và wordfreq (zipf ≥ 2). Script ở `tools/spellfix_ambiguity.py` khi tích hợp.

## 3 câu kiểm tra mới (trắc nghiệm, không cho thấy từ sai trong đề)

- **K1** Which word is spelled correctly? (smile → past): smiled ✓ / smilied / smileed / smilled
  - Lý do cần câu mới: `en_nik3-past-didnt_q012` có chữ "smilied" ngay trong đề nên không độc lập.
- **K2** Choose the correct spelling for "đánh (răng)": brush ✓ / broush / brosh / bruhs
- **K3** Which word is spelled correctly? (stop → past): stopped ✓ / stoped / stopet / stoppd
- Nhiễu của 3 câu đều không phải từ có thật. Riêng "stoped" là thuật ngữ mỏ rất hiếm, chấp nhận được.

Không dùng `en_nik3-past-ed_q027` (cùng câu hỏi với dropped nhưng trộn nhiều từ) và `studied` (không thuộc 12 từ).

## Đo
- **Lần 0** (trước khi luyện): 12 câu kiểm tra, qua nút kiểm tra riêng của pilot.
- **Luyện**: 12 mục (một biến thể dinner).
- **Lần 1**: sau 3–5 ngày, 12 câu kiểm tra lại. Đúng ở lần này ghi "đã kiểm tra lại đúng", chưa gọi là "đã thành thạo viết".
- **Giấy**: bố mẹ đọc cho viết didn't / dinner / smiled (nối với Bài 8 phiếu 28/10).
- **Ghi thêm**: số lần thử và mức trợ giúp mỗi mục luyện.

## Codex duyệt (30/10) — đã áp vào JSON
- Ngữ cảnh giữ nguyên (hiện tại cho thói quen, quá khứ cho việc đã xảy ra). Chú nghĩa thêm: onto the table = lên trên bàn; wave goodbye = vẫy tay chào tạm biệt; on the phone = qua điện thoại (trường `glosses`).
- Giải thích từ hiếm (diner, roush, noded, stoped…) chỉ để trong tài liệu này, không hiện cho bé.
- Nhiều vị trí đúng (`acceptEdits`, tính tự động): dinnner 3 vị trí; likeed, waveed, jumpped 2; diner, chated, droped, noded, stoped 2 khe điền. Tất cả được chấp nhận; đổi vị trí mà từ không đổi → không phải câu trả lời mới (responseKey = từ đã chuẩn hoá).
- Lời dẫn: K1 "smile" in the past is: · K3 "stop" in the past is: · K2 dùng "Choose the correct spelling: ___ your teeth (đánh răng)". Không dùng "spelling for 'đánh răng'" vì đáp án chỉ có một từ brush.
- Hai biến thể dinner cùng `checkId`.
- Lượt đo (lần 0 và lần 1): tắt mọi trợ giúp. Không gợi ý, không hiện từ sai từng sửa hay đáp án lần trước, không tự đọc từ đúng. Không sửa gợi ý của câu gốc trong kho, chỉ áp quy tắc này cho lượt kiểm tra pilot.
