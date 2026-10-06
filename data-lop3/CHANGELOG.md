# CHANGELOG — Dữ liệu Lớp 3 (Vương Quốc Thỏ)

Ghi lại mỗi lần thêm/sửa câu hỏi. Mới nhất ở trên cùng.

Định dạng mỗi dòng: `ngày — môn / chủ đề — +N câu (ghi chú)`

---

## 2026-10-06 (Claude — bảng nhân chia tự sinh)
- Toán / Bảng nhân, chia (2–9) — +108 câu tự sinh (152 → 260), sinh lúc tải trang từ `js/table-gen.js`, không nằm trong file JSON. Id dạng `toan_gen_<dạng>_<a>x<b>`.
- Toán / ⚡ Luyện bảng nhân chia 2–9 (tự sinh) — chủ đề mới, 552 câu (mul 72, div 72, mfac 72, mdsr 40, mdvd 32, rnext 32, rprev 32, rsplit 56, rsum 32, rswap 56, r10 8, cmp 48 — gồm đủ 8 cặp tích bằng nhau). Tất cả `stage: 1`.
- Đã kiểm tra bằng chương trình: 552 id không trùng, đáp án đúng, không có phương án trùng nhau, vị trí đáp án 128/128/128/120.

## 2026-10-02 (Claude — sửa hình)
- Toán / Đếm hình & đường gấp khúc: q014 dùng hình mới `dem-hinh-luoi-2x2-cn.svg` (ô 130×80, đếm bằng chương trình: 9 hình chữ nhật, 0 hình vuông), bỏ câu "Hình vuông cũng là hình chữ nhật" trong gợi ý. `dem-hinh-dai-3.svg` vẽ lại ô 100×70 (q011, vẫn 6).

## 2026-10-02 (Claude — dạng đề Tiếng Việt còn thiếu)
- Tiếng Việt / Đọc hiểu truyện ngắn — +11 câu (24 → 35): V02 chọn cặp từ điền vào câu nêu ý nghĩa (5 đoạn truyện tự viết); V07 tác giả tả bằng giác quan nào (6 câu: thị giác, thính giác, khứu giác, vị giác, xúc giác).
- Tiếng Việt / Từ, câu, dấu câu (đến bài 12) — +8 câu (47 → 55): V12 từ không cùng nhóm (gia đình, sự vật, hoạt động, đặc điểm, màu sắc, âm thanh, tình cảm, hương vị).
- Tiếng Việt / Câu và dấu câu — +8 câu (16 → 24): V30 "Bạn Mai đặt dấu sai ở chỗ nào?" chọn (1)–(4); chỉ dùng dấu chấm, chấm hỏi, hai chấm (đã học). Đáp án giữ thứ tự (`keepOrder`).
- Tiếng Việt / Chính tả theo nghĩa — +8 câu (25 → 33): V32 câu đố điền âm ch/tr, l/n, s/x, r/gi rồi giải đố.
- `skills.json`: thêm tên 4 dạng mới cho báo cáo kỹ năng.

## 2026-10-01 (Claude — từ phiếu bổ trợ tuần 6–8)
- Toán / Dãy số cách đều — +15 câu (chủ đề mới, GĐ1): số hạng thứ n, đếm số số hạng, dãy Fibonacci, tìm vị trí số.
- Toán / Tư duy với số — +21 câu (55 → 76): viết thành tích 2 thừa số, thay đổi chữ số, tìm thừa số, lập số (có/không lặp chữ số), số lớn/bé nhất theo tổng chữ số, chân chó – mũi, cân thăng bằng.
- Toán / Một phần mấy — +7 câu (24 → 31): phần còn lại (1/5 đàn vịt dưới ao → trên bờ), tìm "là mấy phần".
- Toán / Toán có lời văn hay — +5 câu (39 → 44): chuyển sách giữa 3 ngăn cho bằng nhau.
- Toán / Hình học — +3 câu trung điểm (25 → 28), GĐ2.
- Tiếng Anh / Adjectives & Adverbs — +9 câu (16 → 25): be + tính từ, hành động + trạng từ -ly, sắp xếp câu.
- Phương án nhiễu đều sát đáp án (±1–2) hoặc là lỗi con hay mắc (vd. 27 khi lập số có chữ số 0).

## 2026-10-01 (Claude — đáp án nhiễu sát hơn)
- Toán / Một phần mấy (14), Bảng nhân chia (72), Sơ đồ đoạn thẳng (3): phương án nhiễu đổi thành số sát đáp án (±1–3) thay vì số quá xa dễ loại trừ. Vị trí đáp án đúng giữ nguyên.

## 2026-09-30 (Claude — kiểu Kangaroo)
- Toán / Toán đố vui kiểu Kangaroo — +21 câu (chủ đề mới, GĐ1)

## 2026-09-30 (Claude — sơ đồ đoạn thẳng)
- Toán / Sơ đồ đoạn thẳng (toán có lời văn) — +20 câu (chủ đề mới; GĐ1: 16, GĐ2: 4)

## 2026-09-30 (Claude — Bebras đợt 2)
- Toán / Tư duy logic (kiểu Bebras) — +24 câu (46 → 70): robot-lenh, duong-ngan-nhat, xep-lich, hang-doi, quy-luat-lap, can-tim-bi, to-mau, den-nhi-phan. Tất cả `stage: 1`.

## 2026-09-30 (Claude — giai đoạn học Tiếng Anh)
- Tiếng Anh lớp 3: thêm `stage` cho cả 196 câu (đều GĐ1); `tieng-anh/index.json` có thêm `stages` (theo unit NIK3) và `defaultStage`.

## 2026-09-30 (Claude — giai đoạn học Toán)
- Toán lớp 3: thêm trường `stage` (1–5) cho cả 546 câu; `toan/index.json` có thêm `stages` và `defaultStage`. Bỏ `hidden` của hai chủ đề 100 000.

## 2026-09-30 (Claude — Tiếng Anh NIK3 + Global Success)
- Tiếng Anh / NIK3 Unit 1: Places & directions — +22 câu (chủ đề mới)
- Tiếng Anh / NIK3 Unit 2: Dinosaurs & Ancient Egypt — +22 câu (chủ đề mới)
- Tiếng Anh / Adjectives & Adverbs — +16 câu (chủ đề mới)
- Tiếng Anh / Reading: NIK3 Unit 1–2 — +12 câu (chủ đề mới, 3 bài đọc)
- Tiếng Anh / Global Success 3 (tập 1) — +20 câu (chủ đề mới)

## 2026-09-30 (Claude — Toán có hình)
- Toán / Đếm hình & đường gấp khúc (chủ đề mới) — +20 câu: đếm tam giác, tứ giác, hình chữ nhật, hình vuông trong hình ghép (15); đường gấp khúc, đổi ra dm, so sánh hai con đường (5). Số hình đếm bằng chương trình.
- Toán / Tư duy logic (kiểu Bebras) — +16 câu có hình: lưới 3×3 đủ 3 loại hình (4), sơ đồ câu hỏi có/không (4), đếm đường đi theo mũi tên (4), mã hóa ô đen trắng (4). 30 → 46 câu.
- Hình vẽ SVG ở `images/questions/lop3/`.

## 2026-09-24 (Claude audit bộ câu Grok)
- Viết lại toàn bộ câu lớp 3 do Grok tạo (giữ nguyên 112 câu bảng nhân chia có từ trước). Script dựng lại nằm ở `_audit_claude/` (toan.py, tv.py, ta.py, tta.py).
- Toán: bỏ câu quá dễ (đọc số 15, 21...), bỏ số chẵn/lẻ và giây (lớp 4). "Phân số đơn giản" đổi thành "Một phần mấy" đúng phạm vi lớp 3. Thêm số La Mã, trung điểm, hình tròn, diện tích, biểu thức, tiền Việt Nam. Phương án nhiễu lấy từ lỗi hay gặp (quên nhớ, sai hàng, nhầm chu vi/diện tích) thay cho ±1.
- Tiếng Việt: bỏ nhân hóa, điệp từ, danh từ/tính từ, từ ghép, chủ ngữ/vị ngữ (lớp 4-5). Dùng đúng thuật ngữ lớp 3: từ chỉ sự vật/hoạt động/đặc điểm, câu giới thiệu/nêu hoạt động/nêu đặc điểm, so sánh. Chính tả dùng cặp dễ lẫn thật (s/x, ch/tr, l/n, r/d/gi, hỏi/ngã). Đọc hiểu 3 đoạn dài hơn, có câu suy luận.
- Tiếng Anh, Toán Tiếng Anh: bỏ phương án vô nghĩa, gợi ý không còn lộ đáp án. Tên unit Tiếng Anh vẫn chưa theo sách NIK3.
- Vị trí đáp án A/B/C/D chia đều trong từng chủ đề.

## 2026-09-24 (Grok)
- Bổ sung bài lớp 3 cho cả 4 môn. Toán có thêm số đến 100 000, cộng trừ, nhân chia ngoài bảng, bảng nhân chia 8 và 9, phân số, hình học, đo lường, đồng hồ và toán lời văn. Đáp án toán được tính bằng chương trình rồi mới ghi.
- Tiếng Việt, Tiếng Anh và Toán tiếng Anh có bộ câu khởi đầu (chưa gắn một bộ sách cụ thể).
- Đổi tên 3 unit tiếng Anh từ placeholder thành At School, My Family, Daily Activities.

## 2026-06-17
- Dựng sườn thư mục `data-lop3/` cho 4 môn (Toán, Tiếng Việt, Tiếng Anh, Toán Tiếng Anh).
- Tất cả file chủ đề còn rỗng (0 câu). Chủ đề Tiếng Anh đặt tên placeholder, sẽ đổi khi biết bộ sách.
- Chưa có câu hỏi nào — chờ sưu tầm và soạn.
