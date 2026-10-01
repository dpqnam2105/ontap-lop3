# CHANGELOG — Dữ liệu Lớp 3 (Vương Quốc Thỏ)

Ghi lại mỗi lần thêm/sửa câu hỏi. Mới nhất ở trên cùng.

Định dạng mỗi dòng: `ngày — môn / chủ đề — +N câu (ghi chú)`

---

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
